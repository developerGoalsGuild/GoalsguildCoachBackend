import base64
import hashlib
import hmac
import json
import os
import time


def _b64url(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode("ascii")


def _b64url_decode(data: str) -> bytes:
    padding = "=" * (-len(data) % 4)
    return base64.urlsafe_b64decode((data + padding).encode("ascii"))


def encode_jwt(payload: dict) -> str:
    secret = os.environ.get("JWT_SECRET", "dev-jwt-secret")
    header = {"alg": "HS256", "typ": "JWT"}
    h = _b64url(json.dumps(header, separators=(",", ":")).encode("utf-8"))
    p = _b64url(json.dumps(payload, separators=(",", ":")).encode("utf-8"))
    sig = hmac.new(secret.encode("utf-8"), f"{h}.{p}".encode("ascii"), hashlib.sha256).digest()
    return f"{h}.{p}.{_b64url(sig)}"


def decode_and_verify_jwt(token: str) -> dict | None:
    secret = os.environ.get("JWT_SECRET", "dev-jwt-secret")
    try:
        h, p, s = token.split(".", 2)
    except ValueError:
        return None
    expected = hmac.new(secret.encode("utf-8"), f"{h}.{p}".encode("ascii"), hashlib.sha256).digest()
    if not hmac.compare_digest(_b64url(expected), s):
        return None
    try:
        payload = json.loads(_b64url_decode(p).decode("utf-8"))
    except Exception:
        return None
    exp = int(payload.get("exp", 0) or 0)
    if exp and exp < int(time.time()):
        return None
    return payload
