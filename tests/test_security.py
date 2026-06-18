import _security


def test_secrets_are_secure_rejects_defaults(monkeypatch):
    monkeypatch.delenv("ALLOW_INSECURE_DEFAULTS", raising=False)
    monkeypatch.setenv("JWT_SECRET", "dev-jwt-secret")
    monkeypatch.setenv("CACHE_VALIDATION_SECRET", "real-cache-secret")
    assert _security.secrets_are_secure() is False


def test_assert_secure_secrets_raises(monkeypatch):
    monkeypatch.delenv("ALLOW_INSECURE_DEFAULTS", raising=False)
    monkeypatch.setenv("JWT_SECRET", "changeme")
    monkeypatch.setenv("CACHE_VALIDATION_SECRET", "changeme")
    try:
        _security.assert_secure_secrets()
        raised = False
    except RuntimeError:
        raised = True
    assert raised


def test_require_origin_secret_blocks_missing_header(monkeypatch):
    monkeypatch.delenv("ALLOW_INSECURE_DEFAULTS", raising=False)
    monkeypatch.setenv("ORIGIN_SECRET", "expected")
    ok, response = _security.require_origin_secret({"headers": {}})
    assert ok is False
    assert response is not None
    assert response["statusCode"] == 403
