# Azure Functions Flow

## Timer Trigger (daily)
1. Tavily で OpenAI 関連ニュースを検索する。
2. 取得した記事の `content` を Azure OpenAI で要約する。
3. 同じ記事内容を CEFR レベル（A1〜C2）向けに生成する。
4. 既存データがあればスキップし、無ければ CosmosDB に保存する。

## HTTP Trigger
- `GET /api/news` で CosmosDB のニュース一覧を返す。

## Environment Variables (required)
- `TAVILY_API_KEY`
- `AZURE_OPENAI_ENDPOINT`
- `AZURE_OPENAI_API_KEY`
- `AZURE_OPENAI_API_VERSION`
- `AZURE_OPENAI_DEPLOYMENT`
- `COSMOS_ENDPOINT`
- `COSMOS_KEY`
- `COSMOS_DB_NAME`
- `COSMOS_CONTAINER`
- `COSMOS_PARTITION_KEY`
- `COSMOS_PARTITION_VALUE` (if needed)
