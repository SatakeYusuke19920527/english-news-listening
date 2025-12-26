from __future__ import annotations

from typing import Any

from app.tavily.client import TavilyClient


def search_openai_news(max_results: int = 5) -> list[dict[str, Any]]:
    client = TavilyClient()
    data = client.search(
        query="OpenAI news",
        max_results=max_results,
        search_depth="advanced",
        include_answer=False,
        include_domains=["openai.com"],
        time_range="month",
    )
    return data.get("results", [])


def search_ai_news(query: str = "AI news", max_results: int = 5) -> list[dict[str, Any]]:
    client = TavilyClient()
    data = client.search(
        query=query,
        max_results=max_results,
        search_depth="advanced",
        include_answer=False,
        time_range="week",
    )
    return data.get("results", [])
