from __future__ import annotations

from openai import AzureOpenAI  # type: ignore

from app.aoai.client import get_client


def chat_once(
    deployment: str,
    message: str,
    system_prompt: str = "You are a helpful assistant.",
) -> str:
    client: AzureOpenAI = get_client()
    response = client.chat.completions.create(
        model=deployment,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": message},
        ],
    )
    return response.choices[0].message.content or ""
