# architecture.md

AI News Listening (Expo React Native)

## 1. High-level Architecture

- Client: Expo React Native (TypeScript, Redux Toolkit)
- Auth: Clerk (planned)
- Backend: Azure Functions API (news fetch), optional local server for development
- Data: Azure Cosmos DB
- External: Tavily (news search)
- Generation: LLM（英文生成。実装は Azure OpenAI / OpenAI など差し替え可能）
- TTS: 端末内蔵 TTS（expo-speech 等）を基本とし、将来クラウド TTS に拡張可能

### Key Principles

- API キー（Tavily / LLM）は **クライアントに置かない**（必ずサーバー側）
- ニュース更新は **24 時間おき**（サーバージョブ）
- Home は **直近 7 日間**のみ表示
- Tavily 取得は **10 件/日** 上限
- 英文は「記事 × レベル」でキャッシュし、再生成を避ける

## 2. Component Responsibilities

### 2.1 Mobile App (Expo)

- Clerk でログイン、ユーザー情報表示
- Home:
  - Azure Functions API からニュース一覧を取得して表示
  - 記事タップ → Detail へ遷移
- Detail:
  - 記事本文（レベル別 content_*）を表示
  - 端末内蔵 TTS で読み上げ（再生/停止）
- Setting:
  - ユーザーアイコン/名前表示（Clerk）
  - CEFR レベル選択（A1〜C2）
  - 変更は Redux state に保存（API 連携は今後）
- 通信:
  - ニュース取得は Azure Functions API 経由

### 2.2 Backend API

- 認証:
  - Clerk JWT を検証し、userId を特定（予定）
- ニュース更新:
  - 1 日 1 回（24 時間おき）に Tavily を呼び出し、ニュースを保存
  - 保存済み URL は重複登録しない（upsert）
- ニュース配信:
  - Cosmos DB の記事を配信（content_a1..c2 を含む）
- 英文生成:
  - 記事詳細アクセス時に、(articleId, level) の生成英文を取得
  - 既存があれば返す、無ければ生成 → 保存 → 返す

### 2.3 Cosmos DB

- ユーザー設定（CEFR レベル）
- ニュース記事（取得結果）
- 生成英文（記事 × レベル）

## 3. Data Model (Cosmos DB)

### 3.1 Container: users

- id: userId (Clerk user id)
- partitionKey: /id
- fields:
  - id: string
  - level: "A1" | "A2" | "B1" | "B2" | "C1" | "C2"
  - createdAt: string (ISO)
  - updatedAt: string (ISO)

### 3.2 Container: articles

- id: articleId (hash(url) 推奨)
- partitionKey: /pk (例: "articles")
- fields:
  - id: string
  - pk: "articles"
  - title: string
  - url: string
  - source: string
  - publishedAt?: string (ISO)
  - fetchedAt: string (ISO)
  - summary?: string
  - raw?: object (Tavily レスポンス必要に応じて)
  - createdAt: string (ISO)
  - updatedAt: string (ISO)

### 3.3 Container: generated_texts

- id: `${articleId}#${level}`
- partitionKey: /articleId
- fields:
  - id: string
  - articleId: string
  - level: "A1" | "A2" | "B1" | "B2" | "C1" | "C2"
  - generatedText: string
  - createdAt: string (ISO)
  - updatedAt: string (ISO)

## 4. API Design (Suggested)

Base URL: Azure Functions endpoint

### 4.1 Auth-related

- Client -> Backend:
  - Authorization: `Bearer <Clerk JWT>`
- Backend:
  - JWT 検証し `userId` を取り出す（Clerk）

### 4.2 User Settings

- GET `/api/user/settings`
  - returns: { level }
- PUT `/api/user/settings`
  - body: { level }
  - returns: { level }

### 4.3 News

- GET `/api/news`
  - returns: news array from Cosmos DB (includes content_a1..c2)

### 4.4 Generated English

- GET `/api/news/:articleId/text?level=B1`
  - flow:
    1. generated_texts から (articleId#level) を検索
    2. あれば返す
    3. なければ LLM で生成 → 保存 → 返す
  - returns: { articleId, level, generatedText }

### 4.5 Update Job (Server only)

- POST `/api/admin/news/update` (server-to-server)
  - called by scheduler (24h)
  - runs Tavily query and saves up to 10 articles/day
  - auth: secret header / managed identity 等（クライアントから呼べない）

## 5. Scheduled Update (24h)

### 5.1 Scheduler Options

- Option A: Vercel Cron → Next.js API Route
- Option B: Azure Functions Timer Trigger
- Option C: GitHub Actions schedule + API call (secret)

### 5.2 Update Logic (Pseudo)

1. Determine `today` (JST) window
2. Call Tavily with query like:
   - "AI news OR artificial intelligence OR generative AI OR LLM"
3. Limit results to 10
4. For each result:
   - articleId = hash(url)
   - upsert into articles
   - set fetchedAt=now
   - preserve publishedAt if present
5. Done

## 6. Client Data Flow

### 6.1 App Launch -> Home

1. Client calls Azure Functions news endpoint
2. Backend reads CosmosDB and returns list
3. Home displays list

### 6.2 Detail Open

1. Client reads selected article from list or requests detail by id
2. Client renders content_* based on selected CEFR level
4. Client uses device TTS to speak generatedText

### 6.3 Setting Change

1. Client calls PUT /api/user/settings { level }
2. Backend upserts user record
3. Next time detail opens, new level is used

## 7. UI / Navigation Architecture

- React Navigation Bottom Tabs:
  - HomeStack
    - HomeScreen (list)
    - DetailScreen (generated text + TTS)
  - SettingScreen
- Styling:
  - NativeWind (Tailwind-like) for consistent, modern UI
- States:
  - loading / error / empty states for list + detail

## 8. Security

- Tavily API key, LLM API key はサーバー環境変数で管理
- Clerk JWT をサーバーで検証（クライアント信頼しない）
- Admin update endpoint は secret により保護
- PII は最小限（userId, level のみ）

## 9. Observability (Minimum)

- Update job:
  - 実行時刻、取得件数、失敗理由をログに出す
- API:
  - 主要エンドポイントの成功/失敗をログ

## 10. Performance / Cost Considerations

- 再生成を避けるため、generated_texts を必ずキャッシュ
- Home は直近 7 日間のみ取得でクエリ量を抑制
- Tavily 取得は 10 件/日、更新は 24h でコスト予測しやすい

## 11. Future Extensions (Optional)

- 速度変更、ハイライト、単語タップ辞書
- お気に入り/履歴
- クラウド TTS（高品質音声）
- 記事カテゴリやフィルタ（Research / Product / Funding など）
