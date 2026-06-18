import json
import os
import uuid
from datetime import datetime, timezone

import boto3
from botocore.exceptions import ClientError
from boto3.dynamodb.conditions import Key

dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table(os.environ["TABLE_NAME"])
ses = boto3.client("ses")


def send_license_email(email: str, license_key: str, license_type: str = "full") -> None:
    source_email = os.environ.get("SOURCE_EMAIL", "").strip()
    if not source_email:
        return

    if license_type == "upgrade":
        intro = "Your trial has been upgraded to full access."
    else:
        intro = "Your GoalsGuild Coach purchase is confirmed."

    try:
        ses.send_email(
            Source=source_email,
            Destination={"ToAddresses": [email]},
            Message={
                "Subject": {"Data": "Your GoalsGuild Coach license key"},
                "Body": {
                    "Text": {
                        "Data": (
                            f"{intro}\n\n"
                            f"License key: {license_key}\n\n"
                            "Open GoalsGuild Coach and use this key to activate your license."
                        )
                    }
                },
            },
        )
    except Exception as e:
        print(f"Failed to send license email: {e}")


def handler(event, _context):
    expected_secret = os.environ.get("PROVISION_API_SECRET", "").strip()
    headers = event.get("headers") or {}
    provided_secret = (headers.get("x-license-secret") or headers.get("X-License-Secret") or "").strip()
    if expected_secret and provided_secret != expected_secret:
        return {"statusCode": 401, "body": json.dumps({"error": "unauthorized"})}

    body = json.loads(event.get("body") or "{}")
    email = body.get("email")
    session_id = body.get("stripe_session_id")
    if not email or not session_id:
        return {"statusCode": 400, "body": json.dumps({"error": "missing email or stripe_session_id"})}

    existing_by_email = table.query(
        IndexName="GSI1",
        KeyConditionExpression=Key("email").eq(email),
        Limit=25,
    ).get("Items", [])

    for item in existing_by_email:
        if item.get("stripe_session_id") == session_id:
            key = item.get("PK", "").replace("LICENSE#", "")
            return {"statusCode": 200, "body": json.dumps({"ok": True, "license_key": key, "duplicate": True})}

    for item in existing_by_email:
        if item.get("license_type") == "trial" and item.get("active", False):
            key = item.get("PK", "").replace("LICENSE#", "")
            table.update_item(
                Key={"PK": item["PK"], "SK": "META"},
                UpdateExpression="SET license_type = :lt, expires_at = :ex, stripe_session_id = :ss, stripe_payment_intent = :pi",
                ExpressionAttributeValues={
                    ":lt": "full",
                    ":ex": "",
                    ":ss": session_id,
                    ":pi": body.get("stripe_payment_intent", ""),
                },
            )
            try:
                send_license_email(email, key, "upgrade")
            except Exception as exc:
                print(f"Failed to send upgrade license email: {exc}")
            return {"statusCode": 200, "body": json.dumps({"ok": True, "license_key": key, "upgraded": True})}

    license_key = f"GGC-{uuid.uuid4().hex[:16].upper()}"
    item = {
        "PK": f"LICENSE#{license_key}",
        "SK": "META",
        "email": email,
        "license_type": "full",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "stripe_session_id": session_id,
        "stripe_payment_intent": body.get("stripe_payment_intent", ""),
        "active": True,
    }
    try:
        table.put_item(Item=item, ConditionExpression="attribute_not_exists(PK)")
    except ClientError as exc:
        if exc.response["Error"]["Code"] == "ConditionalCheckFailedException":
            return {"statusCode": 200, "body": json.dumps({"ok": True, "duplicate": True})}
        raise

    try:
        send_license_email(email, license_key, "full")
    except Exception as exc:
        print(f"Failed to send license email: {exc}")

    return {"statusCode": 200, "body": json.dumps({"ok": True, "license_key": license_key})}
