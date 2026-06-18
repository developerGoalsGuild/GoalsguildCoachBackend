import json
import os
import uuid
from datetime import datetime, timezone

import boto3

from _security import require_origin_secret


def _error(status_code: int, message: str) -> dict:
    return {
        "statusCode": status_code,
        "headers": {"content-type": "application/json"},
        "body": json.dumps({"error": message}),
    }


def _release_key_metadata(key: str) -> tuple[str, str]:
    parts = key.split("/", 2)
    platform = parts[0] if len(parts) >= 1 and parts[0] else "unknown"
    version = parts[1] if len(parts) >= 2 and parts[1] else ""
    return platform, version


def _coarse_user_agent(raw: str) -> str:
    if not raw:
        return "unknown"
    raw = raw[:512]
    lowered = raw.lower()
    if "windows" in lowered:
        return "windows"
    if "mac os x" in lowered or "macintosh" in lowered:
        return "mac"
    if "linux" in lowered:
        return "linux"
    if "android" in lowered:
        return "android"
    if "iphone" in lowered or "ipad" in lowered or "ios" in lowered:
        return "ios"
    return "other"


def _record_download_event(
    table_name: str,
    *,
    release_key: str,
    app_version: str,
    platform: str,
    user_agent: str,
    request_context: dict,
) -> None:
    if not table_name:
        return
    try:
        now = datetime.now(timezone.utc)
        date_bucket = now.strftime("%Y-%m-%d")
        request_id = (
            (request_context.get("requestId") if isinstance(request_context, dict) else None)
            or uuid.uuid4().hex
        )
        ttl_days_raw = (os.environ.get("DOWNLOAD_EVENT_TTL_DAYS") or "").strip()
        try:
            ttl_days = int(ttl_days_raw) if ttl_days_raw else 0
        except ValueError:
            ttl_days = 0
        item = {
            "PK": f"DOWNLOAD#{date_bucket}",
            "SK": f"REQUEST#{now.isoformat()}#{request_id}",
            "event_type": "download",
            "created_at": now.isoformat(),
            "date_bucket": date_bucket,
            "release_key": release_key,
            "app_version": app_version or "",
            "platform": platform or "unknown",
            "user_agent_class": _coarse_user_agent(user_agent),
            "request_id": request_id,
        }
        if ttl_days > 0:
            item["ttl"] = int(now.timestamp()) + ttl_days * 86400

        boto3.resource("dynamodb").Table(table_name).put_item(Item=item)
    except Exception as exc:
        print(f"Error recording download event: {exc}")


def handler(event, _context):
    allowed, response = require_origin_secret(event)
    if not allowed:
        return response

    query = event.get("queryStringParameters") or {}
    platform = (query.get("platform") or query.get("os") or "").strip().lower()
    arch = (query.get("arch") or "").strip().lower()

    content_type = "application/x-apple-diskimage"
    if platform in {"windows", "win"} or arch in {"windows", "win"}:
        key_env = "WINDOWS_RELEASE_KEY"
        content_type = "application/octet-stream"
    elif arch in {"x86_64", "intel", "x64", "x86"}:
        key_env = "MAC_X86_64_RELEASE_KEY"
    else:
        key_env = "MAC_ARM64_RELEASE_KEY"

    bucket = os.environ.get("RELEASE_BUCKET", "").strip()
    key = os.environ.get(key_env, "").strip()
    if not key and key_env == "MAC_ARM64_RELEASE_KEY":
        key = os.environ.get("MAC_RELEASE_KEY", "").strip()
    bucket_region = os.environ.get("RELEASE_BUCKET_REGION", "us-east-1").strip()
    expires_in = int(os.environ.get("DOWNLOAD_URL_EXPIRES", "900"))
    table_name = (os.environ.get("TABLE_NAME") or "").strip()

    if not bucket or not key:
        return _error(500, "download_not_configured")

    filename = key.rsplit("/", 1)[-1]
    s3 = boto3.client("s3", region_name=bucket_region)
    try:
        url = s3.generate_presigned_url(
            "get_object",
            Params={
                "Bucket": bucket,
                "Key": key,
                "ResponseContentDisposition": f'attachment; filename="{filename}"',
                "ResponseContentType": content_type,
            },
            ExpiresIn=expires_in,
        )
    except Exception as exc:
        print(f"Error generating presigned download URL: {exc}")
        return _error(500, "download_unavailable")

    headers = event.get("headers") or {}
    user_agent = headers.get("user-agent") or headers.get("User-Agent") or ""
    platform, app_version = _release_key_metadata(key)
    request_context = event.get("requestContext") or {}
    _record_download_event(
        table_name,
        release_key=key,
        app_version=app_version,
        platform=platform,
        user_agent=user_agent,
        request_context=request_context if isinstance(request_context, dict) else {},
    )

    return {
        "statusCode": 302,
        "headers": {
            "Location": url,
            "Cache-Control": "no-store",
        },
    }
