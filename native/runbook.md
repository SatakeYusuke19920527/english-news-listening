# runbook.md

AI News Listening – Operational Runbook

## 0. Purpose

本ドキュメントは、本アプリケーションの**運用時に発生しうる障害・異常系**に対する対応手順（Runbook）を定義する。  
人間および AI Agent は、障害発生時に**推測で対応せず、本 Runbook に従って行動すること**。

---

## 1. General Principles（共通原則）

- 失敗は「静かに無視」してはならない
- ユーザー体験を最優先し、**完全停止よりも部分的成功を優先**
- 外部サービス（Tavily / LLM）の失敗は **自システムの責任として吸収**
- 再試行（Retry）は限定的に行い、無限ループは禁止
- 不明点がある場合は即座にログを出し、人間にエスカレーションする

---

## 2. Logging Rules

### 2.1 必須ログ項目

すべてのエラー・例外で以下を含める：

- timestamp (ISO)
- environment (dev / prod)
- component (api / job / client)
- action (news_update / generate_text / fetch_list 等)
- error_code
- error_message
- related_ids (articleId, userId など)
- stack / raw_error（可能であれば）

### 2.2 ログレベル

- INFO: 正常系の重要イベント（job 開始/終了）
- WARN: リトライ可能な失敗
- ERROR: 処理失敗（ユーザー影響あり）
- FATAL: システム継続不能（原則発生させない）

---

## 3. Tavily 関連障害

### 3.1 ニュース取得失敗（Tavily API Error）

**Symptoms**

- `/api/admin/news/update` が 502 / timeout
- Tavily レスポンスが空 or 不正

**Immediate Action**

1. エラー内容をログ出力
2. 当日のニュース更新を **スキップ**
3. 既存の DB 記事は保持（削除しない）

**User Impact**

- Home は前日までの記事を表示（直近 7 日ルールは維持）

**Retry Policy**

- 同一ジョブ内での自動リトライ：しない
- 次回更新（24 時間後）で再試行

**Escalation**

- 連続 2 日失敗した場合、人間に通知

---

## 4. News Update Job 障害

### 4.1 Update Job 全体失敗

**Symptoms**

- ジョブが途中で例外終了
- system.job_state が更新されない

**Immediate Action**

1. system コンテナに status=failed を記録
2. lastRunAt / error を保存
3. 処理済みの記事はロールバックしない（冪等設計）

**Retry Policy**

- 自動再実行しない
- 次回スケジュールで再実行

---

## 5. Cosmos DB 障害

### 5.1 書き込み失敗（Upsert Error）

**Symptoms**

- articles / generated_texts / users への upsert 失敗

**Immediate Action**

1. エラー内容をログ出力
2. API の場合：
   - クライアントに 500 を返す
3. Job の場合：
   - 当該アイテムをスキップし継続

**Retry Policy**

- API リクエスト単位での自動リトライ：最大 1 回
- Job 内での無限リトライは禁止

---

### 5.2 読み取り失敗

**Symptoms**

- Home 一覧が取得できない
- Detail 表示で記事が見つからない

**Immediate Action**

- Home：
  - 空状態 UI を表示
  - 「現在ニュースを取得できません」のメッセージ
- Detail：
  - 404 or 500 を返す
  - クライアントでエラーメッセージ表示

---

## 6. Generated English（LLM）障害

### 6.1 英文生成失敗（LLM Error）

**Symptoms**

- `/api/news/:articleId/text` が 502
- タイムアウト、トークン超過等

**Immediate Action**

1. エラーをログ出力
2. 既存キャッシュがあればそれを返す
3. キャッシュが無い場合：
   - エラーを返す（空文字は禁止）

**Retry Policy**

- 同一リクエスト内での再生成：最大 1 回
- それ以上は失敗として扱う

**User Impact**

- 英文が表示されない可能性あり
- UI で「現在生成できません」と明示

---

### 6.2 不正な英文生成

**Symptoms**

- レベル逸脱（A1 なのに難しすぎる等）
- 主観・意見が混入

**Immediate Action**

- キャッシュ済みの場合：
  - そのまま表示（MVP では自動修正しない）
- 未キャッシュの場合：
  - prompt_design.md に従い再生成（1 回まで）

**Follow-up**

- prompt_design.md の見直し候補として記録

---

## 7. Authentication / Authorization 障害

### 7.1 Clerk JWT 検証失敗

**Symptoms**

- 401 UNAUTHORIZED が頻発

**Immediate Action**

- クライアントに再ログインを促す
- サーバー側で詳細ログを出力（JWT 内容はマスク）

**Retry Policy**

- 自動リトライしない

---

## 8. Client-side Failures

### 8.1 Home が空になる

**Possible Causes**

- DB 障害
- Update job 未実行
- ネットワーク不良

**UI Behavior**

- スケルトン → 空状態 UI
- 「ニュースを取得できません」表示
- 再読み込みボタンを提供

---

### 8.2 TTS 再生失敗

**Symptoms**

- 音声が再生されない

**Immediate Action**

- エラーをログ出力（client）
- UI 上はテキスト表示を継続

**Fallback**

- 音声なしでの利用を許容

---

## 9. Alerting & Escalation

### 9.1 即時エスカレーション条件

- Update job が 48 時間以上成功していない
- Cosmos DB が継続的に読み書き不可
- 生成英文が全レベルで失敗

### 9.2 通知方法（例）

- Slack / Email / Issue 作成（運用環境に応じて）

---

## 10. AI Agent Specific Rules

- AI Agent は障害時に「勝手な修正」をしてはならない
- 必ず本 Runbook の手順に従う
- Runbook に無いケースは「不明」として人間に報告する

---

## 11. Final Principle

> 障害時に最もやってはいけないことは  
> **「よかれと思って仕様を変えること」**

この Runbook は、  
**安定した運用と、信頼できる AI プロダクトのための最後の防波堤である。**
