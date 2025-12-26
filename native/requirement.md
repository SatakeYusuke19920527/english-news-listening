# requirements.md

AI News Listening (Expo React Native)

## 1. Overview

AI 関連のニュースを取得し、ユーザーの英語レベル（CEFR: A1〜C2）に合わせて英文を生成・表示し、英語音声で読み上げるモバイルアプリを作成する。

## 2. Goals

- AI 関連ニュースを「読む + 聴く」で英語学習できる体験を提供する
- ユーザーごとに英語レベルを保存し、記事表示を最適化する
- ニュース記事と生成英文を DB に保存し、いつでも再取得できるようにする
- シンプルな 2 画面（Home / Setting）で迷わず使える UI にする

## 3. Non-Goals (Out of Scope)

- 学習履歴の詳細分析（学習時間、正答率など）
- 単語帳・クイズ・復習機能
- 記事のオフライン再生
- 多言語対応（日本語 UI など）

## 4. Target Users

- AI トレンドを追いながら英語学習したい社会人/学生
- スキマ時間に学習したいモバイルユーザー

## 5. User Stories

- ユーザーは AI ニュースの一覧を見て、興味のある記事を開ける
- ユーザーは記事を英語で読み、音声で聴ける
- ユーザーは設定画面で自分の英語レベル（A1〜C2）を選べる
- ユーザーはログインして、自分の設定が保持される
- ユーザーは過去に取得済みの記事と英文をいつでも再表示できる

## 6. Screens / Navigation

### 6.1 Bottom Tab Navigation

- 画面最下部にメニューバーを設置
  - Home
  - Setting

### 6.2 Home (Main)

- 直近 1 週間（7 日間）の AI 関連ニュース一覧を表示
- 各ニュースをタップすると詳細画面へ遷移

#### Home -> News Detail

- 個別ページで英文を表示
- 英文はユーザー設定の英語レベルに合わせて生成される
- 生成された英文を英語音声で読み上げできる

### 6.3 Setting

- ログイン後に利用可能（未ログインの場合はログイン導線を表示）
- ユーザーのアイコンと名前を表示
- 英語レベル選択（A1, A2, B1, B2, C1, C2）
- 変更した英語レベルは DB に保存され、以後の英文生成に反映される

## 7. Functional Requirements

### 7.1 Authentication

- Clerk を利用してログイン/ログアウトを提供する
- ログイン状態に応じて Setting 画面の表示内容を切り替える

### 7.2 News Fetching (Azure Functions)

- Azure Functions のニュース API から取得して Home に一覧表示する
- Home に表示するニュースの対象期間は直近 7 日間とする

### 7.3 News Update / Storage / Retrieval (Cosmos DB)

- 一度検索して取得したニュース記事は Cosmos DB に保存する
- 保存済みの記事は、後からいつでも取得して表示できる
- ニュースの更新は日時ベースで行い、更新頻度は **24 時間おき** とする
  - 更新処理では、新規記事の取得と DB への保存を行う
  - Home 表示は直近 7 日間の範囲にフィルタして表示する
- 直近 7 日間の判定は原則 publishedAt を用い、取得できない場合は fetchedAt で代替する

### 7.4 Level-based English Generation

- 記事詳細を開いたとき、ユーザーの CEFR レベルに合わせて本文を表示する
- 表示は CosmosDB に保存済みの `content_a1..c2` を利用する

### 7.5 Generated English Storage (Cosmos DB)

- 生成した英文は Cosmos DB に保存する
- 同一記事に対して、ユーザーのレベルごとの生成結果を保存し再利用できるようにする
  - 例: 記事 A の B1 版英文 / 記事 A の C1 版英文
- 既に保存済みの「記事 × レベル」の英文があれば、原則それを取得して表示する（再生成を避ける）

### 7.6 Text-to-Speech (TTS)

- 記事詳細画面で、生成英文を英語で読み上げる
- 再生/停止の基本操作を提供する

### 7.7 User Profile / Settings Persistence

- ユーザーごとに英語レベルを保存する
- Setting で変更したレベルは即時保存される

## 8. Data Requirements (Cosmos DB)

### 8.1 User Settings

- userId (Clerk のユーザー ID) を主キーとして保存
- fields:
  - userId: string
  - level: "A1" | "A2" | "B1" | "B2" | "C1" | "C2"
  - createdAt: string (ISO)
  - updatedAt: string (ISO)

### 8.2 News Articles

- 取得したニュース記事を保存する
- fields (example):
  - id: string (articleId / hash)
  - type: "article" (optional)
  - dayKey: string (YYYY-MM-DD, JST, optional)
  - url: string
  - title: string
  - source: string (optional)
  - publishedAt: string (ISO, 可能なら)
  - fetchedAt: string (ISO)
  - content: string (base summary)
  - content_a1: string
  - content_a2: string
  - content_b1: string
  - content_b2: string
  - content_c1: string
  - content_c2: string
  - raw: object (optional, Tavily 原文)
  - createdAt: string (ISO)
  - updatedAt: string (ISO)
- 一覧表示は直近 7 日間の publishedAt / fetchedAt を基準にフィルタする
- 詳細は `data_model.md` の `articles` 定義に従う

### 8.3 Generated English by Level

- 記事 × レベルごとの生成英文を保存する
- fields (example):
  - id: string (articleId#level など)
  - articleId: string
  - level: "A1" | "A2" | "B1" | "B2" | "C1" | "C2"
  - generatedText: string
  - createdAt: string (ISO)
  - updatedAt: string (ISO)

## 9. Tech Stack

- App: Expo + React Native + TypeScript
- UI: Tailwind CSS（React Native 用: NativeWind 等の採用を想定）
- Auth: Clerk
- DB: Azure Cosmos DB
- News Search: Tavily

## 10. Non-Functional Requirements

- 起動から一覧表示までの体感を軽くする（過度なローディングを避ける）
- API キーはクライアントに直置きせず、サーバーサイド（API）で保護する
- 例外時（ニュース取得失敗、生成失敗）はリトライ導線とエラーメッセージを表示する

## 11. Open Questions / Decisions Needed

- （決定）更新頻度: **24 時間おき**
- （決定）Tavily 取得件数上限: **10 件/日**
- 7 日間フィルタは publishedAt を優先し、無い場合は fetchedAt で代替
- TTS は端末内蔵でまず実装し、将来クラウド TTS に切り替えるか
