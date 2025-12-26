from __future__ import annotations

import os

from openai import AzureOpenAI  # type: ignore


def _require_env(key: str) -> str:
    value = os.environ.get(key)
    if not value:
        raise RuntimeError(f"Missing required env var: {key}")
    return value


def get_client() -> AzureOpenAI:
    endpoint = _require_env("AZURE_OPENAI_ENDPOINT").rstrip("/")
    api_key = _require_env("AZURE_OPENAI_API_KEY")
    api_version = os.environ.get("AZURE_OPENAI_API_VERSION", "2024-06-01")
    return AzureOpenAI(
        azure_endpoint=endpoint,
        api_key=api_key,
        api_version=api_version,
    )
