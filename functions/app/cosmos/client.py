from __future__ import annotations

import os
from functools import lru_cache

from azure.cosmos import CosmosClient # type: ignore


def _require_env(key: str) -> str:
    value = os.environ.get(key)
    if not value:
        raise RuntimeError(f"Missing required env var: {key}")
    return value


@lru_cache(maxsize=1)
def get_client() -> CosmosClient:
    endpoint = _require_env("COSMOS_ENDPOINT")
    key = _require_env("COSMOS_KEY")
    return CosmosClient(endpoint, credential=key)


def get_database():
    db_name = os.environ.get("COSMOS_DB_NAME", "ai_news")
    return get_client().get_database_client(db_name)


def get_container(container_name: str):
    return get_database().get_container_client(container_name)
