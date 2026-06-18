import os
import json


def insecure_defaults_allowed() -> bool:
    return str(os.environ.get("ALLOW_INSECURE_DEFAULTS", "0")).strip().lower() in {"1", "true", "yes"}


def secrets_are_secure() -> bool:
    jwt_secret = os.environ.get("JWT_SECRET", "")
    cache_secret = os.environ.get("CACHE_VALIDATION_SECRET", "")
    bad = {
        "",
        "dev-jwt-secret",
        "dev-cache-secret",
        "changeme",
        "default",
    }
    return jwt_secret not in bad and cache_secret not in bad


def assert_secure_secrets() -> None:
    if insecure_defaults_allowed():
        return
    if not secrets_are_secure():
        raise RuntimeError("Insecure license secrets configured.")


def require_origin_secret(event: dict) -> tuple[bool, dict | None]:
    if insecure_defaults_allowed():
        return True, None
    expected = os.environ.get("ORIGIN_SECRET", "").strip()
    if not expected:
        return True, None
    headers = event.get("headers") or {}
    provided = (headers.get("x-origin-secret") or headers.get("X-Origin-Secret") or "").strip()
    if provided != expected:
        return False, {"statusCode": 403, "body": json.dumps({"error": "forbidden"})}
    return True, None
