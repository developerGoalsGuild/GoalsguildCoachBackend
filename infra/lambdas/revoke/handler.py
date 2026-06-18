import json
import os

import boto3

dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table(os.environ["TABLE_NAME"])


def handler(event, _context):
    expected_secret = os.environ.get("ADMIN_API_SECRET", "").strip()
    headers = event.get("headers") or {}
    provided_secret = (headers.get("x-admin-secret") or headers.get("X-Admin-Secret") or "").strip()
    if expected_secret and provided_secret != expected_secret:
        return {"statusCode": 401, "body": json.dumps({"error": "unauthorized"})}

    body = json.loads(event.get("body") or "{}")
    license_key = (body.get("license_key") or "").strip()
    if not license_key:
        return {"statusCode": 400, "body": json.dumps({"error": "missing license_key"})}

    key = {"PK": f"LICENSE#{license_key}", "SK": "META"}
    table.update_item(
        Key=key,
        UpdateExpression="SET active = :a",
        ExpressionAttributeValues={":a": False},
    )
    return {"statusCode": 200, "body": json.dumps({"ok": True})}
