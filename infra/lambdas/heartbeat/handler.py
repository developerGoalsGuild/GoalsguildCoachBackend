import json
import os
import time
from datetime import datetime, timezone

import boto3

from _jwt import decode_and_verify_jwt, encode_jwt
from _security import assert_secure_secrets

dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table(os.environ["TABLE_NAME"])


def handler(event, _context):
    try:
        assert_secure_secrets()
    except RuntimeError:
        return {"statusCode": 500, "body": json.dumps({"ok": False, "reason": "server_misconfigured"})}

    body = json.loads(event.get("body") or "{}")
    token = body.get("session_token") or ""
    payload = decode_and_verify_jwt(token)
    if not payload:
        return {"statusCode": 401, "body": json.dumps({"ok": False, "reason": "invalid_token"})}
    license_key = payload.get("sub")
    if not license_key:
        return {"statusCode": 401, "body": json.dumps({"ok": False, "reason": "missing_sub"})}
    machine_id = payload.get("machine_id", "")
    prompt_key = payload.get("prompt_key", "")

    item = table.get_item(Key={"PK": f"LICENSE#{license_key}", "SK": "META"}).get("Item")
    if not item or not item.get("active", False):
        return {"statusCode": 200, "body": json.dumps({"ok": True, "revoked": True})}
    if machine_id and item.get("machine_id") and item.get("machine_id") != machine_id:
        return {"statusCode": 200, "body": json.dumps({"ok": True, "revoked": True})}

    now = datetime.now(timezone.utc).isoformat()
    table.update_item(
        Key={"PK": f"LICENSE#{license_key}", "SK": "META"},
        UpdateExpression="SET last_heartbeat = :h",
        ExpressionAttributeValues={":h": now},
    )
    refreshed = encode_jwt(
        {
            "sub": license_key,
            "machine_id": machine_id,
            "prompt_key": prompt_key,
            "iat": int(time.time()),
            "exp": int(time.time()) + 3600 * 4,
        }
    )
    return {"statusCode": 200, "body": json.dumps({"ok": True, "refreshed_token": refreshed})}
