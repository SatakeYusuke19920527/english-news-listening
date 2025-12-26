# Data Model

AI News Listening – Data Model (Azure Cosmos DB)

## 0. Purpose

This document defines the data model for Azure Cosmos DB (containers, partition keys, schema, and query patterns).
AI agents must not change this document without following the Change Protocol in `agent_rules.md`.

## 1. Database Overview

- Database: `ai_news_listening` (example)
- Containers:
  1. `users` (user settings)
  2. `articles` (news articles)
  3. `generated_texts` (generated English per article x level)
  4. `system` (operational data)

Design principles:
- Home reads the last 7 days most frequently.
- Updates run every 24 hours, fetch limit is 10/day.
- Generated text is cached per article x level to avoid regeneration.
- Do not store secrets (API keys, etc.) in DB.

## 2. Partitioning Strategy

Partition keys are critical for performance and cost.

### 2.1 `users`

- Partition key: `/userId` (same as `/id`, but `/userId` is used here)
- Rationale: access patterns are per user

### 2.2 `articles`

- Partition key: `/dayKey`
- `dayKey` format: `YYYY-MM-DD` (JST)
- Rationale:
  - Home reads only 7 partitions (last 7 days)
  - Daily updates land in one partition

### 2.3 `generated_texts`

- Partition key: `/articleId`
- Rationale:
  - Detail reads are per article
  - Multiple levels for one article stay together

### 2.4 `system`

- Partition key: `/type`
- Rationale: small operational datasets grouped by type

## 3. Container Definitions

### 3.1 Container: `users`

Purpose
- Store user CEFR level settings.

Partition Key
- `/userId`

Item Schema

```json
{
  "id": "user_xxx",
  "userId": "user_xxx",
  "type": "user",
  "level": "B1",
  "createdAt": "2025-12-23T00:00:00.000Z",
  "updatedAt": "2025-12-23T12:00:00.000Z"
}
```

Constraints
- `level` must be one of: `A1 | A2 | B1 | B2 | C1 | C2`.
- `id` equals `userId` (one document per user).

Indexing
- Default indexing is sufficient.

### 3.2 Container: `articles`

Purpose
- Store news fetched from Tavily.

Partition Key
- `/dayKey` (JST, `YYYY-MM-DD`)

Item Schema

```json
{
  "id": "art_3f2a9c...",
  "type": "article",
  "dayKey": "2025-12-23",
  "url": "https://example.com/...",
  "title": "OpenAI releases a new model for ...",
  "source": "The Verge",
  "publishedAt": "2025-12-22T01:23:00.000Z",
  "fetchedAt": "2025-12-23T00:00:10.000Z",
  "summary": "A short summary from Tavily...",
  "raw": {
    "tavily": "optional raw response"
  },
  "createdAt": "2025-12-23T00:00:10.000Z",
  "updatedAt": "2025-12-23T00:00:10.000Z"
}
```

ID Generation
- `articleId` is hash(url) (e.g. sha256 -> base64url or hex).
- `id` format recommendation: `art_<hash>`.
- Prevent URL duplicates via upsert by URL (query then update).

Notes
- `dayKey` uses `publishedAt` (JST) if present, else `fetchedAt`.
- Home reads only the latest 7 `dayKey` values.

Indexing
- Default indexing is sufficient.
- If URL duplicate checks are frequent, compute `id` from URL on the server and upsert by `id`.

### 3.3 Container: `generated_texts`

Purpose
- Cache generated English per (articleId, level) for Detail.

Partition Key
- `/articleId`

Item Schema

```json
{
  "id": "art_3f2a9c...#B1",
  "type": "generated_text",
  "articleId": "art_3f2a9c...",
  "level": "B1",
  "generatedText": "The article explains how ...",
  "promptVersion": "v1.0",
  "createdAt": "2025-12-23T00:10:00.000Z",
  "updatedAt": "2025-12-23T00:10:00.000Z"
}
```

Constraints
- `id` must be `${articleId}#${level}`.
- `level` must be one of: `A1 | A2 | B1 | B2 | C1 | C2`.
- `promptVersion` aligns with `prompt_design.md` (e.g. `v1.0`).

Notes
- Always reuse cached text if it exists.
- If prompt versions change, regeneration policy needs separate design (MVP: no regeneration).

### 3.4 Container: `system`

Purpose
- Operational metadata for jobs (24h updates).

Partition Key
- `/type`

Item Schema (job state)

```json
{
  "id": "news_update_state",
  "type": "job_state",
  "jobName": "news_update",
  "lastRunAt": "2025-12-23T00:00:05.000Z",
  "lastRunDateJst": "2025-12-23",
  "status": "success",
  "saved": 10,
  "skippedDuplicates": 2,
  "error": null,
  "updatedAt": "2025-12-23T00:00:05.000Z"
}
```

## 4. Query Patterns (Read/Write)

### 4.1 Home List (last 7 days)

Input
- `todayJst`

Compute
- `dayKeys = [todayJst ... todayJst-6]`

Query (per dayKey)

```sql
SELECT c.id, c.title, c.source, c.url, c.publishedAt, c.fetchedAt
FROM c
WHERE c.type = "article"
```

Merge & sort by `publishedAt DESC` (fallback `fetchedAt DESC`).

Note: avoid cross-partition queries by reading 7 partitions explicitly.

### 4.2 Article Detail

Read by `articleId`.

Issue
- `dayKey` is required for point reads.

Recommended (MVP)
- When fetching list, include `dayKey` and keep it client-side for detail calls, or
- Resolve `articleId -> dayKey` on the server (costly query).

Contract suggestion
- `GET /api/news/:articleId` resolves `articleId` on the server.

### 4.3 Generated Text (articleId x level)

- Partition key: `articleId`
- Read by `id = ${articleId}#${level}`.

### 4.4 Update Job (daily)

Upsert into `articles` for computed `dayKey`.

Upsert updates:
- `title`, `summary`, `source` (if changed)
- `fetchedAt`, `updatedAt`
- Preserve `publishedAt` if missing in new data

### 4.5 User Settings

- Read by `id = userId`, `pk = userId`
- Upsert on level changes

## 5. Data Retention

- MVP keeps all articles.
- Home displays only the last 7 days.

Future
- Consider TTL for articles older than 90 days.

## 6. Consistency & Concurrency

- `users` / `generated_texts` are single-document updates.
- ID design avoids duplication (`url hash`, `${articleId}#${level}`).
- Avoid concurrent generation by server-side locking (MVP may use optimistic upsert).

## 7. Security

- PII is minimal (userId, level).
- Do not store Tavily/LLM API keys in DB.
- Save raw responses only if necessary (watch storage cost).

## 8. Invariants (Do Not Change)

- Update frequency: every 24 hours.
- Tavily fetch limit: 10/day.
- Home shows only last 7 days.
- Generated text cached per article x level.
- CEFR rules follow `prompt_design.md`.
