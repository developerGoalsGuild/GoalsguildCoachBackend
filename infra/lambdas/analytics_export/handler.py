"""Scheduled exporter that snapshots license and download records into S3.

The exporter is intentionally conservative: it scans the licenses table once,
filters in-memory to LICENSE#*/META and DOWNLOAD#* items, normalizes the
records into stable schemas, and writes newline-delimited JSON files to a
dedicated analytics bucket so Glue/Athena can read them. The Lambda is also
safe to invoke manually for backfills.
"""

from __future__ import annotations

import hashlib
import io
import json
import os
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from typing import Any, Iterable

import boto3

dynamodb = boto3.resource("dynamodb")
s3 = boto3.client("s3")

LICENSE_PREFIX = "LICENSE#"
DOWNLOAD_PREFIX = "DOWNLOAD#"
META_SK = "META"


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _bool(value: Any) -> bool:
    if isinstance(value, bool):
        return value
    if isinstance(value, (int, Decimal)):
        return bool(int(value))
    if isinstance(value, str):
        return value.strip().lower() in {"1", "true", "yes"}
    return False


def _str(value: Any) -> str:
    if value is None:
        return ""
    if isinstance(value, str):
        return value
    if isinstance(value, Decimal):
        return str(int(value)) if value == value.to_integral_value() else str(value)
    return str(value)


def _hash_email(email: str) -> str:
    if not email:
        return ""
    salt = (os.environ.get("ANALYTICS_EMAIL_SALT") or "").strip()
    digest = hashlib.sha256(f"{salt}:{email.lower()}".encode("utf-8")).hexdigest()
    return digest


def _email_field(item: dict, include_raw_email: bool) -> dict:
    raw_email = _str(item.get("email"))
    domain = raw_email.split("@", 1)[1].lower() if "@" in raw_email else ""
    payload = {
        "email_hash": _hash_email(raw_email),
        "email_domain": domain,
    }
    if include_raw_email:
        payload["email"] = raw_email
    return payload


def _parse_iso_datetime(value: str) -> datetime | None:
    if not value:
        return None
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return None


def _time_dimensions(dt: datetime | None) -> dict:
    if not dt:
        return {"created_day": "", "created_week": "", "created_month": ""}
    iso_year, iso_week, _ = dt.isocalendar()
    return {
        "created_day": dt.strftime("%Y-%m-%d"),
        "created_week": f"{iso_year}-W{iso_week:02d}",
        "created_month": dt.strftime("%Y-%m"),
    }


def _normalize_license(item: dict, include_raw_email: bool) -> dict:
    pk = _str(item.get("PK"))
    license_key = pk[len(LICENSE_PREFIX):] if pk.startswith(LICENSE_PREFIX) else pk
    created_at = _str(item.get("created_at"))
    created_at_dt = _parse_iso_datetime(created_at)
    license_type = _str(item.get("license_type")) or "unknown"
    record = {
        "license_key": license_key,
        "license_type": license_type,
        "active": _bool(item.get("active")),
        "created_at": created_at,
        "expires_at": _str(item.get("expires_at")),
        "last_heartbeat": _str(item.get("last_heartbeat")),
        "machine_id_hash": hashlib.sha256(_str(item.get("machine_id")).encode("utf-8")).hexdigest()
        if item.get("machine_id")
        else "",
        "stripe_session_id": _str(item.get("stripe_session_id")),
        "stripe_payment_intent": _str(item.get("stripe_payment_intent")),
        "has_payment": bool(_str(item.get("stripe_payment_intent"))),
        "trial_count": 1 if license_type.lower() == "trial" else 0,
    }
    record.update(_time_dimensions(created_at_dt))
    record.update(_email_field(item, include_raw_email))
    return record


def _normalize_download(item: dict) -> dict:
    pk = _str(item.get("PK"))
    date_bucket = _str(item.get("date_bucket")) or (
        pk[len(DOWNLOAD_PREFIX):] if pk.startswith(DOWNLOAD_PREFIX) else ""
    )
    created_at = _str(item.get("created_at"))
    created_at_dt = _parse_iso_datetime(created_at)
    dims = _time_dimensions(created_at_dt)
    created_day = dims["created_day"] or date_bucket
    if not dims["created_week"] and created_day:
        parsed_day = _parse_iso_datetime(f"{created_day}T00:00:00+00:00")
        dims = _time_dimensions(parsed_day)
    return {
        "request_id": _str(item.get("request_id")),
        "created_at": created_at,
        "date_bucket": date_bucket,
        "created_day": created_day,
        "created_week": dims["created_week"],
        "created_month": dims["created_month"],
        "release_key": _str(item.get("release_key")),
        "app_version": _str(item.get("app_version")),
        "platform": _str(item.get("platform")) or "unknown",
        "user_agent_class": _str(item.get("user_agent_class")) or "unknown",
    }


def _scan_table(table_name: str) -> Iterable[dict]:
    table = dynamodb.Table(table_name)
    last_evaluated: dict | None = None
    while True:
        kwargs = {"Limit": 1000}
        if last_evaluated:
            kwargs["ExclusiveStartKey"] = last_evaluated
        page = table.scan(**kwargs)
        for item in page.get("Items", []):
            yield item
        last_evaluated = page.get("LastEvaluatedKey")
        if not last_evaluated:
            break


def _write_jsonl(bucket: str, key: str, records: list[dict]) -> int:
    buffer = io.StringIO()
    for record in records:
        buffer.write(json.dumps(record, ensure_ascii=False, default=str))
        buffer.write("\n")
    body = buffer.getvalue().encode("utf-8")
    s3.put_object(
        Bucket=bucket,
        Key=key,
        Body=body,
        ContentType="application/x-ndjson",
    )
    return len(records)


def handler(event, _context):
    table_name = (os.environ.get("TABLE_NAME") or "").strip()
    bucket = (os.environ.get("ANALYTICS_BUCKET") or "").strip()
    licenses_prefix = (os.environ.get("ANALYTICS_LICENSES_PREFIX") or "licenses").strip("/")
    downloads_prefix = (os.environ.get("ANALYTICS_DOWNLOADS_PREFIX") or "downloads").strip("/")
    include_raw_email = (os.environ.get("ANALYTICS_INCLUDE_EMAIL") or "0").strip().lower() in {"1", "true", "yes"}
    lookback_days_raw = (os.environ.get("ANALYTICS_LOOKBACK_DAYS") or "365").strip()
    try:
        lookback_days = int(lookback_days_raw)
    except ValueError:
        lookback_days = 365

    if not table_name or not bucket:
        return {"ok": False, "reason": "analytics_export_misconfigured"}

    licenses: list[dict] = []
    downloads: list[dict] = []
    cutoff = _now() - timedelta(days=max(lookback_days, 1))

    for item in _scan_table(table_name):
        pk = _str(item.get("PK"))
        sk = _str(item.get("SK"))
        if pk.startswith(LICENSE_PREFIX) and sk == META_SK:
            licenses.append(_normalize_license(item, include_raw_email))
        elif pk.startswith(DOWNLOAD_PREFIX) and sk.startswith("REQUEST#"):
            created_at = _str(item.get("created_at"))
            if created_at:
                try:
                    parsed = datetime.fromisoformat(created_at.replace("Z", "+00:00"))
                    if parsed < cutoff:
                        continue
                except ValueError:
                    pass
            downloads.append(_normalize_download(item))

    snapshot_at = _now()
    snapshot_date = snapshot_at.strftime("%Y-%m-%d")
    snapshot_id = snapshot_at.strftime("%Y%m%dT%H%M%SZ")

    licenses_key = f"{licenses_prefix}/snapshot_date={snapshot_date}/licenses-{snapshot_id}.jsonl"
    downloads_key = f"{downloads_prefix}/snapshot_date={snapshot_date}/downloads-{snapshot_id}.jsonl"

    licenses_count = _write_jsonl(bucket, licenses_key, licenses)
    downloads_count = _write_jsonl(bucket, downloads_key, downloads)

    return {
        "ok": True,
        "licenses_written": licenses_count,
        "downloads_written": downloads_count,
        "licenses_key": licenses_key,
        "downloads_key": downloads_key,
        "snapshot_date": snapshot_date,
    }
