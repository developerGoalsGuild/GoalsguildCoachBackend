import os
import time

import _jwt


def test_encode_decode_roundtrip(monkeypatch):
    monkeypatch.setenv("JWT_SECRET", "test-secret")
    token = _jwt.encode_jwt({"sub": "user@example.com", "exp": int(time.time()) + 3600})
    payload = _jwt.decode_and_verify_jwt(token)
    assert payload is not None
    assert payload["sub"] == "user@example.com"


def test_rejects_expired_token(monkeypatch):
    monkeypatch.setenv("JWT_SECRET", "test-secret")
    token = _jwt.encode_jwt({"sub": "user@example.com", "exp": int(time.time()) - 10})
    assert _jwt.decode_and_verify_jwt(token) is None


def test_rejects_tampered_token(monkeypatch):
    monkeypatch.setenv("JWT_SECRET", "test-secret")
    token = _jwt.encode_jwt({"sub": "user@example.com", "exp": int(time.time()) + 3600})
    parts = token.split(".")
    parts[1] = parts[1][:-1] + ("a" if parts[1][-1] != "a" else "b")
    assert _jwt.decode_and_verify_jwt(".".join(parts)) is None
