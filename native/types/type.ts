export type CefrLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

export type IsoTimestamp = string;

export type ApiErrorResponse = {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
};

export type UserProfile = {
  userId: string;
  displayName: string;
  avatarUrl: string;
};

export type UserSettings = {
  level: CefrLevel;
};

export type UserSettingsUpdateResponse = {
  level: CefrLevel;
  updatedAt: IsoTimestamp;
};

export type ApiNewsListItem = {
  articleId: string;
  title: string;
  source: string;
  url: string;
  publishedAt?: IsoTimestamp;
  fetchedAt: IsoTimestamp;
};

export type ApiNewsListResponse = {
  range: '7d';
  items: ApiNewsListItem[];
};

export type ApiNewsDetail = {
  articleId: string;
  title: string;
  source: string;
  url: string;
  publishedAt?: IsoTimestamp;
  fetchedAt: IsoTimestamp;
  summary?: string;
};

export type GeneratedTextResponse = {
  articleId: string;
  level: CefrLevel;
  generatedText: string;
  cache: {
    hit: boolean;
    createdAt: IsoTimestamp;
    updatedAt: IsoTimestamp;
  };
};

export type CosmosNewsItem = {
  id: string;
  title: string;
  content: string;
  date: string | null;
  fetchedAt: IsoTimestamp;
  content_a1?: string;
  content_a2?: string;
  content_b1?: string;
  content_b2?: string;
  content_c1?: string;
  content_c2?: string;
  url: string;
};


export type AdminNewsUpdateRequest = {
  date: string;
  limit: number;
};

export type AdminNewsUpdateResponse = {
  date: string;
  requestedLimit: number;
  saved: number;
  skippedDuplicates: number;
  startedAt: IsoTimestamp;
  finishedAt: IsoTimestamp;
};

export type UserSettingsItem = {
  id: string;
  userId: string;
  type: 'user';
  level: CefrLevel;
  createdAt: IsoTimestamp;
  updatedAt: IsoTimestamp;
};

export type ArticleItem = {
  id: string;
  type: 'article';
  dayKey: string;
  url: string;
  title: string;
  source: string;
  publishedAt?: IsoTimestamp;
  fetchedAt: IsoTimestamp;
  summary?: string;
  raw?: Record<string, unknown>;
  createdAt: IsoTimestamp;
  updatedAt: IsoTimestamp;
};

export type GeneratedTextItem = {
  id: string;
  type: 'generated_text';
  articleId: string;
  level: CefrLevel;
  generatedText: string;
  promptVersion: string;
  createdAt: IsoTimestamp;
  updatedAt: IsoTimestamp;
};

export type JobStateItem = {
  id: string;
  type: 'job_state';
  jobName: string;
  lastRunAt: IsoTimestamp;
  lastRunDateJst: string;
  status: 'success' | 'failed';
  saved: number;
  skippedDuplicates: number;
  error: string | null;
  updatedAt: IsoTimestamp;
};
