import json
import os

import boto3
from _security import require_origin_secret

dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table(os.environ["TABLE_NAME"])


def handler(event, _context):
    allowed, response = require_origin_secret(event)
    if not allowed:
        return response

    body = json.loads(event.get("body") or "{}")
    token = (body.get("token") or "").strip()
    if not token:
        return {"statusCode": 400, "body": json.dumps({"error": "missing token"})}

    key = {"PK": f"VERIFY#{token}", "SK": "META"}
    res = table.get_item(Key=key)
    item = res.get("Item")
    if not item:
        return {"statusCode": 404, "body": json.dumps({"error": "invalid token"})}

    table.update_item(
        Key=key,
        UpdateExpression="SET verified = :v",
        ExpressionAttributeValues={":v": True},
    )
    return {"statusCode": 200, "body": json.dumps({"ok": True, "email": item.get('email'), "activation_token": token})}
