import axios from 'axios';
import { CosmosNewsItem } from '../types/type';

const NEWS_API_URL = process.env.EXPO_PUBLIC_NEWS_API_URL;

function getNewsApiUrl() {
  if (!NEWS_API_URL) {
    throw new Error('EXPO_PUBLIC_NEWS_API_URL is not set');
  }

  return NEWS_API_URL;
}

export async function fetchNewsList(): Promise<CosmosNewsItem[]> {
  const response = await axios.get(getNewsApiUrl(), {
    headers: { 'Content-Type': 'application/json' },
    timeout: 15000,
  });
  const raw = response.data as unknown;
  const parsed = typeof raw === 'string' ? (JSON.parse(raw) as unknown) : raw;
  const data = parsed as
    | CosmosNewsItem[]
    | { items?: CosmosNewsItem[]; data?: CosmosNewsItem[] };
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.items)) return data.items;
  if (data && Array.isArray(data.data)) return data.data;
  return [];
}

export async function fetchNewsDetail(
  articleId: string
): Promise<CosmosNewsItem | null> {
  const items = await fetchNewsList();

  return items.find((item) => item.id === articleId) ?? null;
}

export function pickContentByLevel(item: CosmosNewsItem, level: string) {
  const key = `content_${level.toLowerCase()}` as keyof CosmosNewsItem;
  return item[key] ?? item.content;
}
