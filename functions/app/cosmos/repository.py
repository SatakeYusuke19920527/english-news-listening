from __future__ import annotations

from typing import Any, Iterable

from azure.cosmos import exceptions as cosmos_exceptions # type: ignore

from app.cosmos.client import get_container


def create_item(container_name: str, item: dict[str, Any], partition_key: str | None = None) -> dict[str, Any]:
    container = get_container(container_name)
    try:
        if partition_key is None:
            return container.create_item(body=item)
        return container.create_item(body=item, partition_key=partition_key)
    except TypeError:
        return container.create_item(body=item)


def upsert_item(container_name: str, item: dict[str, Any], partition_key: str | None = None) -> dict[str, Any]:
    container = get_container(container_name)
    try:
        if partition_key is None:
            return container.upsert_item(body=item)
        return container.upsert_item(body=item, partition_key=partition_key)
    except TypeError:
        return container.upsert_item(body=item)


def read_item(container_name: str, item_id: str, partition_key: str) -> dict[str, Any]:
    container = get_container(container_name)
    return container.read_item(item=item_id, partition_key=partition_key)


def replace_item(
    container_name: str,
    item_id: str,
    item: dict[str, Any],
    partition_key: str,
) -> dict[str, Any]:
    container = get_container(container_name)
    return container.replace_item(item=item_id, body=item, partition_key=partition_key)


def delete_item(container_name: str, item_id: str, partition_key: str) -> None:
    container = get_container(container_name)
    container.delete_item(item=item_id, partition_key=partition_key)


def query_items(
    container_name: str,
    query: str,
    parameters: Iterable[dict[str, Any]] | None = None,
    partition_key: str | None = None,
) -> list[dict[str, Any]]:
    container = get_container(container_name)
    items = container.query_items(
        query=query,
        parameters=list(parameters or []),
        enable_cross_partition_query=partition_key is None,
        partition_key=partition_key,
    )
    return list(items)


def safe_read_item(container_name: str, item_id: str, partition_key: str) -> dict[str, Any] | None:
    try:
        return read_item(container_name, item_id, partition_key)
    except cosmos_exceptions.CosmosResourceNotFoundError:
        return None
