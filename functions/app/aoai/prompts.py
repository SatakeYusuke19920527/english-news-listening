from __future__ import annotations


def summary_prompt(content: str) -> tuple[str, str]:
    system = (
        "You are a helpful assistant. Return plain text only. "
        "Do not use markdown, bullet symbols, or prefixed phrases."
    )
    user = (
        "Summarize the following news content in 3-5 concise sentences. "
        "Return only the rewritten text.\n\n"
        f"{content}"
    )
    return system, user


def cefr_prompt(level: str, content: str) -> tuple[str, str]:
    system = (
        "You are a helpful assistant. Return plain text only. "
        "Do not use markdown, bullet symbols, or prefixed phrases."
    )
    user = (
        f"Rewrite the following content for CEFR {level} learners. "
        "Keep facts accurate, use level-appropriate vocabulary and grammar, "
        "and keep it concise. Return only the rewritten text.\n\n"
        f"{content}"
    )
    return system, user
