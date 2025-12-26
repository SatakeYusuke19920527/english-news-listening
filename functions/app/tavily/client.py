from __future__ import annotations

import os
from typing import Any, Optional

import requests # type: ignore


def _require_env(key: str) -> str:
    value = os.environ.get(key)
    if not value:
        raise RuntimeError(f"Missing required env var: {key}")
    return value


class TavilyClient:
    def __init__(self, api_key: Optional[str] = None, base_url: str | None = None) -> None:
        self._api_key = api_key or _require_env("TAVILY_API_KEY")
        self._base_url = (base_url or os.environ.get("TAVILY_BASE_URL", "https://api.tavily.com")).rstrip("/")

    def search(
        self,
        query: str,
        max_results: int = 5,
        search_depth: str = "basic",
        include_answer: bool = False,
        include_domains: Optional[list[str]] = None,
        time_range: Optional[str] = None,
    ) -> dict[str, Any]:
        payload: dict[str, Any] = {
            "api_key": self._api_key,
            "query": query,
            "search_depth": search_depth,
            "max_results": max_results,
            "include_answer": include_answer,
        }
        if include_domains:
            payload["include_domains"] = include_domains
        if time_range:
            payload["time_range"] = time_range

        response = requests.post(f"{self._base_url}/search", json=payload, timeout=30)
        response.raise_for_status()
        return response.json()
