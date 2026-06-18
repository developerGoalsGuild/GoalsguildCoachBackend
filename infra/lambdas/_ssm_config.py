import os

import boto3


ssm = boto3.client("ssm")
_cache: dict[str, str] = {}


def get_config_value(param_env_name: str, legacy_env_name: str = "") -> str:
    param_name = (os.environ.get(param_env_name) or "").strip()
    if param_name:
        if param_name not in _cache:
            value = ssm.get_parameter(Name=param_name, WithDecryption=True).get("Parameter", {}).get("Value", "")
            _cache[param_name] = str(value).strip()
        return _cache[param_name]

    if legacy_env_name:
        return (os.environ.get(legacy_env_name) or "").strip()
    return ""
