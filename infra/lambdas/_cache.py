import base64
import hashlib
import hmac
import json
import os


def _b64url(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode("ascii")


def sign_cache_payload(payload: dict) -> str:
    secret = os.environ.get("CACHE_VALIDATION_SECRET", "dev-cache-secret")
    raw = json.dumps(payload, separators=(",", ":"), sort_keys=True).encode("utf-8")
    sig = hmac.new(secret.encode("utf-8"), raw, hashlib.sha256).digest()
    return json.dumps({"payload": _b64url(raw), "sig": _b64url(sig)})
