from __future__ import annotations

from typing import Any

from app.tavily.client import TavilyClient

_COMPANY_CONFIG: dict[str, dict[str, Any]] = {
    "Google": {
        "query": "Google AI news",
        "domains": ["ai.googleblog.com", "blog.google", "research.google"],
    },
    "OpenAI": {
        "query": "OpenAI news",
        "domains": ["openai.com"],
    },
    "Anthropic": {
        "query": "Anthropic AI news",
        "domains": ["anthropic.com"],
    },
    "MistralAI": {
        "query": "Mistral AI news",
        "domains": ["mistral.ai"],
    },
    "Microsoft": {
        "query": "Microsoft AI news",
        "domains": ["news.microsoft.com", "azure.microsoft.com", "blogs.microsoft.com"],
    },
    "AWS": {
        "query": "AWS AI news",
        "domains": ["aws.amazon.com"],
    },
}


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


def search_company_news(company: str, max_results: int = 3) -> list[dict[str, Any]]:
    config = _COMPANY_CONFIG.get(company)
    if not config:
        return []
    client = TavilyClient()
    data = client.search(
        query=config["query"],
        max_results=max_results,
        search_depth="advanced",
        include_answer=False,
        include_domains=config["domains"],
        time_range="month",
    )
    return data.get("results", [])
