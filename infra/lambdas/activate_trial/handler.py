import json
import os
import uuid
from datetime import datetime, timedelta, timezone

import boto3
from boto3.dynamodb.conditions import Attr, Key

dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table(os.environ["TABLE_NAME"])
ssm = boto3.client("ssm")
DEFAULT_TRIAL_DAYS = 7
_trial_days_cache = None


def _trial_days() -> int:
    global _trial_days_cache
    if _trial_days_cache is not None:
        return _trial_days_cache

    name = (os.environ.get("TRIAL_DAYS_PARAM") or "").strip()
    if not name:
        _trial_days_cache = DEFAULT_TRIAL_DAYS
        return _trial_days_cache

    try:
        value = ssm.get_parameter(Name=name).get("Parameter", {}).get("Value", "")
        parsed = int(str(value).strip())
        _trial_days_cache = parsed if parsed >= 1 else DEFAULT_TRIAL_DAYS
    except Exception:
        _trial_days_cache = DEFAULT_TRIAL_DAYS
    return _trial_days_cache


def handler(event, _context):
    body = json.loads(event.get("body") or "{}")
    email = (body.get("email") or "").strip().lower()
    machine_id = (body.get("machine_id") or "").strip()
    token = (body.get("activation_token") or "").strip()
    if not email or not machine_id or not token:
        return {"statusCode": 400, "body": json.dumps({"error": "missing parameters"})}

    verify = table.get_item(
        Key={"PK": f"VERIFY#{token}", "SK": "META"},
        ConsistentRead=True,
    ).get("Item")
    if not verify or not verify.get("verified"):
        return {
            "statusCode": 403,
            "body": json.dumps(
                {
                    "error": "token not verified",
                    "reason": "Open the verification link from your email first, then try again.",
                }
            ),
        }
    if (verify.get("email") or "").strip().lower() != email:
        return {"statusCode": 403, "body": json.dumps({"error": "email mismatch"})}

    existing_email = table.query(
        IndexName="GSI1",
        KeyConditionExpression=Key("email").eq(email),
        FilterExpression=Attr("PK").begins_with("LICENSE#") & Attr("SK").eq("META"),
    ).get("Items", [])
    if existing_email:
        existing = sorted(existing_email, key=lambda item: item.get("created_at", ""), reverse=True)[0]
        existing_type = (existing.get("license_type") or "").strip().lower()
        existing_active = bool(existing.get("active", False))
        existing_machine_id = (existing.get("machine_id") or "").strip()
        if existing_type == "trial" and existing_active and existing_machine_id == machine_id:
            existing_pk = existing.get("PK", "")
            existing_key = existing_pk.replace("LICENSE#", "", 1) if existing_pk.startswith("LICENSE#") else ""
            if existing_key:
                table.delete_item(Key={"PK": f"VERIFY#{token}", "SK": "META"})
                return {
                    "statusCode": 200,
                    "body": json.dumps(
                        {
                            "ok": True,
                            "license_type": "trial",
                            "license_key": existing_key,
                            "expires_at": existing.get("expires_at", ""),
                        }
                    ),
                }
        return {"statusCode": 409, "body": json.dumps({"error": "email already has a license"})}

    existing_machine = table.query(
        IndexName="GSI2",
        KeyConditionExpression=Key("machine_id").eq(machine_id),
        FilterExpression=Attr("PK").begins_with("LICENSE#") & Attr("SK").eq("META"),
    ).get("Items", [])
    if existing_machine:
        return {"statusCode": 409, "body": json.dumps({"error": "machine already used for trial"})}

    now = datetime.now(timezone.utc)
    expires = datetime.now(timezone.utc) + timedelta(days=_trial_days())
    license_key = f"GGC-TRIAL-{uuid.uuid4().hex[:12].upper()}"
    table.put_item(
        Item={
            "PK": f"LICENSE#{license_key}",
            "SK": "META",
            "email": email,
            "license_type": "trial",
            "created_at": now.isoformat(),
            "expires_at": expires.isoformat(),
            "machine_id": machine_id,
            "active": True,
        }
    )
    table.delete_item(Key={"PK": f"VERIFY#{token}", "SK": "META"})
    return {
        "statusCode": 200,
        "body": json.dumps({"ok": True, "license_type": "trial", "license_key": license_key, "expires_at": expires.isoformat()}),
    }
