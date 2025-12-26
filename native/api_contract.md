# API Contract

AI News Listening – Contract between the Expo app and backend API.

## 0. Purpose

This document defines the contract between the mobile app and backend API.
AI agents must not change this contract without following the Change Protocol in `agent_rules.md`.

## 1. Base Rules

### 1.1 Base URL

- `BASE_URL` switches by environment (dev/prod).
- All endpoints are rooted at `/api`.

### 1.2 Authentication

- Use Clerk.
- Client sends: `Authorization: Bearer <ClerkJWT>`.
- Server verifies JWT and identifies `userId`.

### 1.3 Common Response Shape

- Success: per endpoint definition.
- Error: common error format.

```json
{
  "error": {
    "code": "STRING_CODE",
    "message": "Human readable message",
    "details": {
      "any": "optional"
    }
  }
}
```

### 1.4 Timestamps

- ISO 8601 (e.g. `2025-12-23T12:34:56.789Z`).

### 1.5 IDs

- `articleId`: hash(url) is recommended (generated/stored in DB).
- `userId`: Clerk user id.

## 2. Endpoints Summary

### User

- `GET /api/user/me`
- `GET /api/user/settings`
- `PUT /api/user/settings`

### News

- `GET /api/news?range=7d`
- `GET /api/news/:articleId`

### Generated English

- `GET /api/news/:articleId/text?level=B1`

### Admin / Jobs

- `POST /api/admin/news/update` (server-only)

## 3. User Endpoints

### 3.1 `GET /api/user/me`

Purpose
- Returns profile for the signed-in user (for Setting screen).

Auth
- Required.

Response 200

```json
{
  "userId": "user_xxx",
  "displayName": "Yusuke Satake",
  "avatarUrl": "https://...."
}
```

Errors
- 401 UNAUTHORIZED

### 3.2 `GET /api/user/settings`

Purpose
- Returns the user’s English level setting.

Auth
- Required.

Response 200

```json
{
  "level": "B1"
}
```

Errors
- 401 UNAUTHORIZED

### 3.3 `PUT /api/user/settings`

Purpose
- Updates the user’s English level.

Auth
- Required.

Request Body

```json
{
  "level": "B2"
}
```

Validation
- `level` must be one of: `A1 | A2 | B1 | B2 | C1 | C2`.

Response 200

```json
{
  "level": "B2",
  "updatedAt": "2025-12-23T12:34:56.789Z"
}
```

Errors
- 400 INVALID_ARGUMENT (invalid level)
- 401 UNAUTHORIZED

## 4. News Endpoints

### 4.1 `GET /api/news?range=7d`

Purpose
- Returns the last 7 days of AI news for Home.

Auth
- Optional. (MVP recommendation: Required for consistency with user settings.)

Query Parameters
- `range`: fixed to `7d` (may expand later). Defaults to `7d`.

Response 200

```json
{
  "range": "7d",
  "items": [
    {
      "articleId": "art_abc123",
      "title": "OpenAI releases a new model for ...",
      "source": "The Verge",
      "url": "https://example.com/...",
      "publishedAt": "2025-12-22T01:23:00.000Z",
      "fetchedAt": "2025-12-23T00:00:10.000Z"
    }
  ]
}
```

Notes
- Server filters by `publishedAt` first; falls back to `fetchedAt`.

Errors
- 401 UNAUTHORIZED (if auth is required)
- 500 INTERNAL

### 4.2 `GET /api/news/:articleId`

Purpose
- Returns article metadata (title/URL/summary) for Detail screen.

Auth
- Optional. (MVP recommendation: Required.)

Path Params
- `articleId`: string

Response 200

```json
{
  "articleId": "art_abc123",
  "title": "OpenAI releases a new model for ...",
  "source": "The Verge",
  "url": "https://example.com/...",
  "publishedAt": "2025-12-22T01:23:00.000Z",
  "fetchedAt": "2025-12-23T00:00:10.000Z",
  "summary": "A short summary from Tavily..."
}
```

Errors
- 404 NOT_FOUND
- 401 UNAUTHORIZED (if auth is required)
- 500 INTERNAL

## 5. Generated English Endpoint

### 5.1 `GET /api/news/:articleId/text?level=B1`

Purpose
- Returns generated English for (articleId, level).
- Uses cached text if available; otherwise generates, stores, and returns.

Auth
- Required.

Path Params
- `articleId`: string

Query Params
- `level`: `A1 | A2 | B1 | B2 | C1 | C2`
- If omitted, the server may default to the user setting (MVP: explicit).

Response 200

```json
{
  "articleId": "art_abc123",
  "level": "B1",
  "generatedText": "The article explains how ...",
  "cache": {
    "hit": true,
    "createdAt": "2025-12-23T00:10:00.000Z",
    "updatedAt": "2025-12-23T00:10:00.000Z"
  }
}
```

Errors
- 400 INVALID_ARGUMENT (invalid level)
- 401 UNAUTHORIZED
- 404 NOT_FOUND (article not found)
- 502 UPSTREAM_FAILURE (LLM generation failed)
- 500 INTERNAL

## 6. Admin / Job Endpoint

### 6.1 `POST /api/admin/news/update`

Purpose
- News update job (every 24h). Fetches AI news from Tavily and saves up to 10/day.

Auth
- Server-to-server only (not callable by client).
- Example auth:
  - `X-Admin-Secret: <secret>`
  - or Managed Identity / IP allowlist

Request Body

```json
{
  "date": "2025-12-23",
  "limit": 10
}
```

Behavior
- `limit` is capped at 10.
- Upsert by URL; update `updatedAt`/`fetchedAt`.
- Only the last 7 days are shown on Home (older data may be retained).

Response 200

```json
{
  "date": "2025-12-23",
  "requestedLimit": 10,
  "saved": 10,
  "skippedDuplicates": 2,
  "startedAt": "2025-12-23T00:00:00.000Z",
  "finishedAt": "2025-12-23T00:00:05.000Z"
}
```

Errors
- 401 UNAUTHORIZED
- 500 INTERNAL
- 502 UPSTREAM_FAILURE (Tavily failure)

## 7. Status Codes

- 200 OK
- 400 Bad Request (validation)
- 401 Unauthorized
- 404 Not Found
- 500 Internal Server Error
- 502 Upstream Failure (external API/LLM)

## 8. Contract Invariants (Do Not Change)

- News update runs every 24 hours.
- Tavily fetch limit is 10 items/day.
- Home displays only the last 7 days.
- Generated English is cached per article x level to avoid regeneration.
- Generated English must follow `prompt_design.md`.

## 9. Future Extensions (Not in MVP)

- `range=30d` and other periods.
- Article category filters (Research / Product / Funding).
- TTS speed control and highlight.
- Multiple English versions (short/long).
