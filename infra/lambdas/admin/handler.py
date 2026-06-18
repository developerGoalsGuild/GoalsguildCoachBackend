import json
import os

import boto3
from boto3.dynamodb.conditions import Key

dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table(os.environ["TABLE_NAME"])


def handler(event, _context):
    expected_secret = os.environ.get("ADMIN_API_SECRET", "").strip()
    headers = event.get("headers") or {}
    provided_secret = (headers.get("x-admin-secret") or headers.get("X-Admin-Secret") or "").strip()
    if expected_secret and provided_secret != expected_secret:
        return {"statusCode": 401, "body": json.dumps({"error": "unauthorized"})}

    query = event.get("queryStringParameters") or {}
    license_key = (query.get("license_key") or "").strip()
    payment_intent = (query.get("payment_intent") or "").strip()
    if license_key:
        res = table.get_item(Key={"PK": f"LICENSE#{license_key}", "SK": "META"})
        return {"statusCode": 200, "body": json.dumps({"item": res.get("Item")})}
    if payment_intent:
        res = table.query(
            IndexName="GSI3",
            KeyConditionExpression=Key("stripe_payment_intent").eq(payment_intent),
            Limit=1,
        )
        items = res.get("Items", [])
        return {"statusCode": 200, "body": json.dumps({"item": items[0] if items else None})}

    # Simple fallback scan for admin debugging.
    res = table.scan(Limit=100)
    return {"statusCode": 200, "body": json.dumps({"items": res.get("Items", [])})}
