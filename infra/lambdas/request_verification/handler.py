import json
import os
import secrets
from datetime import datetime, timedelta, timezone

import boto3
from _security import require_origin_secret

dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table(os.environ["TABLE_NAME"])
ses_region = (os.environ.get("SES_REGION") or "").strip()
ses = boto3.client("ses", region_name=ses_region or None)


def handler(event, _context):
    allowed, response = require_origin_secret(event)
    if not allowed:
        return response

    body = json.loads(event.get("body") or "{}")
    email = (body.get("email") or "").strip().lower()
    callback_url = (body.get("callback_url") or "").strip()
    if not email:
        return {"statusCode": 400, "body": json.dumps({"error": "missing email"})}

    token = secrets.token_urlsafe(24)
    ttl = int((datetime.now(timezone.utc) + timedelta(days=1)).timestamp())
    table.put_item(
        Item={
            "PK": f"VERIFY#{token}",
            "SK": "META",
            "email": email,
            "verified": False,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "ttl": ttl,
        }
    )
    verification_url = f"{callback_url}?token={token}" if callback_url else ""
    source_email = os.environ.get("SOURCE_EMAIL", "").strip()
    if source_email and verification_url:
        try:
            ses.send_email(
                Source=source_email,
                Destination={"ToAddresses": [email]},
                Message={
                    "Subject": {"Data": "Verify your GoalsGuild Coach trial"},
                    "Body": {
                        "Text": {
                            "Data": (
                                "Confirm your trial request by opening this link:\n\n"
                                f"{verification_url}\n\n"
                                "If you did not request this, ignore this email."
                            )
                        }
                    },
                },
            )
        except Exception as e:
            print(f"Failed to send verification email: {e}")
    return {"statusCode": 200, "body": json.dumps({"ok": True, "token": token, "verification_url": verification_url})}
