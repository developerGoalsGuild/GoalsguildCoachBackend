import json
import os
import time
import base64
from datetime import datetime, timezone

import boto3

from _cache import sign_cache_payload
from _jwt import encode_jwt
from _security import assert_secure_secrets

dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table(os.environ["TABLE_NAME"])
s3 = boto3.client("s3")


def _load_master_prompts() -> dict:
    bucket = os.environ.get("PROMPT_BUCKET", "").strip()
    key = os.environ.get("PROMPT_OBJECT_KEY", "prompts.enc").strip()
    if bucket:
        try:
            obj = s3.get_object(Bucket=bucket, Key=key)
            data = json.loads(obj["Body"].read().decode("utf-8"))
            if "prompts" in data:
                return data
            return {"prompts": data}
        except Exception:
            pass
    # Dev fallback
    return {"prompts": {"summary_system_en.txt": "You are GoalsGuild Coach."}}


def _encrypt_bundle(master: dict, prompt_key_raw: bytes) -> str:
    try:
        from cryptography.hazmat.primitives.ciphers.aead import AESGCM
    except Exception:
        # Keep validate endpoint working in stripped-down/local runtimes.
        # Desktop falls back to built-in prompt files when bundle is empty.
        return ""

    nonce = os.urandom(12)
    aad = b"goalsguild:prompt_bundle"
    plaintext = json.dumps(master, ensure_ascii=False).encode("utf-8")
    ciphertext = AESGCM(prompt_key_raw).encrypt(nonce, plaintext, aad)
    return json.dumps(
        {
            "nonce": base64.b64encode(nonce).decode("ascii"),
            "aad": base64.b64encode(aad).decode("ascii"),
            "ciphertext": base64.b64encode(ciphertext).decode("ascii"),
        }
    )


def handler(event, _context):
    try:
        assert_secure_secrets()
    except RuntimeError:
        return {"statusCode": 500, "body": json.dumps({"valid": False, "reason": "server_misconfigured"})}

    body = json.loads(event.get("body") or "{}")
    license_key = body.get("license_key")
    machine_id = body.get("machine_id")
    if not license_key or not machine_id:
        return {"statusCode": 400, "body": json.dumps({"valid": False, "reason": "missing_params"})}

    item = table.get_item(Key={"PK": f"LICENSE#{license_key}", "SK": "META"}).get("Item")
    if not item:
        return {"statusCode": 200, "body": json.dumps({"valid": False, "reason": "not_found"})}
    if not item.get("active", False):
        return {"statusCode": 200, "body": json.dumps({"valid": False, "reason": "revoked"})}

    expires_at = item.get("expires_at")
    if expires_at:
        try:
            expiry = datetime.fromisoformat(expires_at.replace("Z", "+00:00"))
            if datetime.now(timezone.utc) > expiry:
                return {"statusCode": 200, "body": json.dumps({"valid": False, "reason": "expired"})}
        except ValueError:
            pass

    bound = item.get("machine_id")
    if bound and bound != machine_id:
        return {"statusCode": 200, "body": json.dumps({"valid": False, "reason": "machine_mismatch"})}
    if not bound:
        table.update_item(
            Key={"PK": f"LICENSE#{license_key}", "SK": "META"},
            UpdateExpression="SET machine_id = :m, last_heartbeat = :h",
            ExpressionAttributeValues={":m": machine_id, ":h": datetime.now(timezone.utc).isoformat()},
        )

    now_dt = datetime.now(timezone.utc)
    now = now_dt.isoformat()
    table.update_item(
        Key={"PK": f"LICENSE#{license_key}", "SK": "META"},
        UpdateExpression="SET last_heartbeat = :h",
        ExpressionAttributeValues={":h": now},
    )
    prompt_key_raw = os.urandom(32)
    prompt_key = base64.urlsafe_b64encode(prompt_key_raw).decode("utf-8")
    token = encode_jwt(
        {
            "sub": license_key,
            "machine_id": machine_id,
            "prompt_key": prompt_key,
            "iat": int(time.time()),
            "exp": int(time.time()) + 3600 * 4,
        }
    )
    prompt_bundle = _encrypt_bundle(_load_master_prompts(), prompt_key_raw)
    cached_validation = sign_cache_payload(
        {
            "license_key": license_key,
            "machine_id": machine_id,
            "iat": int(time.time()),
            "exp": int(time.time()) + 3600 * 24,
        }
    )
    return {
        "statusCode": 200,
        "body": json.dumps(
            {
                "valid": True,
                "license_type": item.get("license_type", "full"),
                "expires_at": item.get("expires_at", ""),
                "session_token": token,
                "prompt_bundle": prompt_bundle,
                "cached_validation": cached_validation,
            }
        ),
    }
