# prompt_design.md

AI News Listening – English Generation Rules

## 1. Purpose

本ドキュメントは、AI 関連ニュースを **CEFR レベル（A1〜C2）に最適化した英語文章**として生成するための、
プロンプト設計・生成ルールを定義するものである。

目的は以下の 3 点：

- 英語学習者にとって「理解可能だが、学習価値のある」英文を提供する
- レベルごとの難易度ブレを防ぐ
- 再生成・キャッシュ前提でも品質が一貫するようにする

## 2. Input to Generation

生成時に AI へ渡す入力情報は以下とする。

### Required Inputs

- article:
  - title
  - summary or content (from Tavily)
  - source (optional)
- target_level:
  - one of: A1 | A2 | B1 | B2 | C1 | C2

### Optional Inputs

- max_length (if needed)
- keywords (optional, extracted from article)

## 3. Global Generation Rules (All Levels)

すべてのレベルで共通して守るルール。

- 文法的に正しい英語を生成する
- ニュースの**事実関係は歪めない**
- 誇張・主観・意見の付加は禁止
- 箇条書きではなく **自然な文章（paragraph）** で書く
- 見出し・タイトルは生成しない（本文のみ）
- 固有名詞（企業名、プロダクト名、人名）は原則そのまま使う
- 絵文字・記号・過度な強調表現は禁止

## 4. CEFR Level Definitions (Core)

### A1 (Beginner)

**Target User**

- 英語初学者
- 中学初級レベル

**Rules**

- 文は短く、1 文 = 5〜8 語程度
- 現在形のみ使用（過去・未来は原則使わない）
- 難しい接続詞は使わない（and / but のみ可）
- 抽象語を避け、具体語を使う
- 専門用語は使わない or 置き換える

**Example Style**

> This news is about AI.  
> AI helps people work.  
> Many companies use AI today.

---

### A2 (Elementary)

**Target User**

- 基礎的な英文が読める

**Rules**

- 1 文 = 8〜12 語程度
- 現在形 + 過去形まで可
- because / when など基本接続詞 OK
- 専門用語は簡単な説明付きで使用可

---

### B1 (Intermediate)

**Target User**

- 英語ニュースに挑戦したい層

**Rules**

- 1 文 = 12〜18 語程度
- 現在 / 過去 / 未来 / 助動詞を自然に使用
- ニュースの背景説明を簡潔に含める
- 専門用語は使ってよいが、文脈で意味が分かるようにする

---

### B2 (Upper Intermediate)

**Target User**

- 英語で情報収集したい社会人

**Rules**

- 1 文 = 15〜22 語程度
- 複文（that / which / while 等）を使用可
- 因果関係・影響を明示する
- ニュース特有の表現を許可

---

### C1 (Advanced)

**Target User**

- 英語で専門情報を扱える

**Rules**

- 文長の制限なし（自然さ優先）
- 抽象的表現・専門用語を許可
- 論理構造を意識した文章構成
- ニュースの意義・文脈を含める

---

### C2 (Proficient)

**Target User**

- ネイティブレベルで情報理解したい層

**Rules**

- 英語ネイティブ向けニュース要約に近い文体
- 高度な語彙・構文を許可
- 冗長な説明は禁止（簡潔かつ高密度）
- 専門家向けとして書く

---

## 5. Length Guidelines

- A1: 約 60〜80 words
- A2: 約 80〜120 words
- B1: 約 120〜180 words
- B2: 約 150〜220 words
- C1: 約 180〜260 words
- C2: 制限なし（通常 200〜300 words 想定）

※ 内容に応じて ±20%は許容

## 6. Forbidden Patterns

以下は禁止。

- レベルに合わない難語の混入
- 同義語を無駄に並べる冗長表現
- 学習指導的な表現（"You should learn…" 等）
- 質問形式
- 箇条書き
- Markdown 記法

## 7. Prompt Template (Reference)

以下は生成時に使用する **参考プロンプト構造**。
