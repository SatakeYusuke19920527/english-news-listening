import hashlib
import json
import logging
import os
import re
from datetime import datetime, timezone

import azure.functions as func  # type: ignore

from app.aoai.service import chat_once
from app.aoai.prompts import cefr_prompt, summary_prompt
from app.auth.clerk import get_bearer_token, verify_clerk_jwt
from app.cosmos.repository import create_item, safe_read_item, query_items, upsert_item
from app.tavily.service import search_openai_news

app = func.FunctionApp()

def _normalize_partition_key(pk_field: str) -> str:
    return pk_field.lstrip("/").strip()


def _get_partition_key_value(pk_field: str, item_id: str) -> str:
    if pk_field == "id":
        return item_id
    return os.environ.get("COSMOS_PARTITION_VALUE", "items")


def _clean_plain_text(text: str) -> str:
    cleaned = (text or "").strip()
    cleaned = re.sub(r"^Here is your rewritten text.*?:\s*", "", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r"^Here is.*?:\s*", "", cleaned, flags=re.IGNORECASE)
    cleaned = cleaned.replace("**", "").replace("`", "")
    cleaned = cleaned.replace("\n", " ").replace("\r", " ")
    cleaned = re.sub(r"\s+", " ", cleaned).strip()
    return cleaned



def _require_clerk_user_id(req: func.HttpRequest) -> tuple[str | None, func.HttpResponse | None]:
    token = get_bearer_token(req.headers)
    if not token:
        return None, func.HttpResponse("Unauthorized", status_code=401)
    try:
        payload = verify_clerk_jwt(token)
    except Exception:
        logging.exception("Clerk JWT verification failed")
        return None, func.HttpResponse("Unauthorized", status_code=401)
    user_id = payload.get("sub")
    if not user_id:
        return None, func.HttpResponse("Unauthorized", status_code=401)
    return user_id, None


@app.timer_trigger(schedule="0 0 0 * * *", arg_name="myTimer", run_on_startup=False,
              use_monitor=False) 
def get_news(myTimer: func.TimerRequest) -> None:
    
    if myTimer.past_due:
        logging.info('The timer is past due!')

    container = os.environ.get("COSMOS_CONTAINER", "news_items")
    pk_field = _normalize_partition_key(os.environ.get("COSMOS_PARTITION_KEY", "id"))

    results = search_openai_news(max_results=5)
    logging.info("Tavily results count: %s", len(results))
    now = datetime.now(timezone.utc).isoformat()

    for result in results:
        title = result.get("title", "")
        content = result.get("content", "")
        url = result.get("url", "")
        published_at = result.get("published_date") or result.get("published_at")
        if not (title or content):
            continue

        item_id = hashlib.sha256((url or title or content).encode("utf-8")).hexdigest()
        pk_value = _get_partition_key_value(pk_field, item_id)

        existing = safe_read_item(container, item_id, pk_value)
        if existing:
            logging.info("Skip existing item id=%s title=%s", item_id, title)
            continue

        deployment = os.environ.get("AZURE_OPENAI_DEPLOYMENT", "")
        summary_source = content or title
        summary = summary_source
        if deployment and summary_source:
            try:
                system_prompt, user_prompt = summary_prompt(summary_source)
                summary = chat_once(
                    deployment=deployment,
                    message=user_prompt,
                    system_prompt=system_prompt,
                )
                summary = _clean_plain_text(summary)
            except Exception:
                logging.exception("AOAI summarization failed, using original content")

        level_contents: dict[str, str] = {}
        if deployment and summary_source:
            for level in ("A1", "A2", "B1", "B2", "C1", "C2"):
                try:
                    system_prompt, user_prompt = cefr_prompt(level, summary_source)
                    level_text = chat_once(
                        deployment=deployment,
                        message=user_prompt,
                        system_prompt=system_prompt,
                    )
                    level_text = _clean_plain_text(level_text)
                    level_contents[f"content_{level.lower()}"] = level_text
                except Exception:
                    logging.exception("AOAI CEFR %s generation failed", level)
        else:
            logging.info("AOAI deployment not set; skipping CEFR generation")

        item = {
            "id": item_id,
            "title": title,
            "content": summary,
            "date": published_at,
            "fetchedAt": now,
        }
        item.update(level_contents)
        if pk_field and pk_field != "id":
            item[pk_field] = pk_value
        if url:
            item["url"] = url

        create_item(container, item, partition_key=pk_value)
        logging.info("Saved item id=%s title=%s", item_id, title)


@app.function_name(name="get_news_http")
@app.route(route="news", methods=["GET"], auth_level=func.AuthLevel.ANONYMOUS)
def get_news_http(req: func.HttpRequest) -> func.HttpResponse:
    container = os.environ.get("COSMOS_CONTAINER", "news_items")
    items = query_items(container, "SELECT * FROM c")
    return func.HttpResponse(
        body=json.dumps(items, ensure_ascii=False), # type: ignore
        mimetype="application/json",
        status_code=200,
    )




@app.function_name(name="save_user_news_settings")
@app.route(route="user-news-settings", methods=["POST"], auth_level=func.AuthLevel.ANONYMOUS)
def save_user_news_settings(req: func.HttpRequest) -> func.HttpResponse:
    try:
        payload = req.get_json()
    except ValueError:
        return func.HttpResponse("Invalid JSON", status_code=400)

    user_id = payload.get("userId")
    if not user_id:
        return func.HttpResponse("userId is required", status_code=400)

    container = os.environ.get("COSMOS_USERS_CONTAINER", "users")
    now = datetime.now(timezone.utc).isoformat()
    company_flags = {
        "Google": bool(payload.get("Google", False)),
        "OpenAI": bool(payload.get("OpenAI", False)),
        "Anthropic": bool(payload.get("Anthropic", False)),
        "MistralAI": bool(payload.get("MistralAI", False)),
        "Microsoft": bool(payload.get("Microsoft", False)),
        "AWS": bool(payload.get("AWS", False)),
    }
    item = {
        "id": user_id,
        "userId": user_id,
        "company": company_flags,
        "updatedAt": now,
    }

    upsert_item(container, item, partition_key=user_id)
    return func.HttpResponse(status_code=204)


@app.function_name(name="get_user_news_settings")
@app.route(route="user-news-settings", methods=["GET"], auth_level=func.AuthLevel.ANONYMOUS)
def get_user_news_settings(req: func.HttpRequest) -> func.HttpResponse:
    user_id = req.params.get("userId")
    if not user_id:
        return func.HttpResponse("userId is required", status_code=400)

    container = os.environ.get("COSMOS_USERS_CONTAINER", "users")
    item = safe_read_item(container, user_id, user_id)
    return func.HttpResponse(
        body=json.dumps(item or {}, ensure_ascii=False),
        mimetype="application/json",
        status_code=200,
    )
