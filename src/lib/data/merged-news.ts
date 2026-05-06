import { fetchZambianNews, type LiveNewsItem } from "./news";
import { NEWS_ITEMS, type NewsItem } from "@/lib/mock/news";

export type MergedNewsItem =
  | (NewsItem & { isLive: false })
  | (LiveNewsItem & { isLive: true });

export async function getMergedNews(limit = 10): Promise<MergedNewsItem[]> {
  const live = await fetchZambianNews();

  const liveItems: MergedNewsItem[] = live.map((item) => ({
    ...item,
    isLive: true as const,
  }));

  if (liveItems.length >= 3) {
    return liveItems.slice(0, limit);
  }

  const mockItems: MergedNewsItem[] = NEWS_ITEMS.map((item) => ({
    ...item,
    isLive: false as const,
  }));

  return [...liveItems, ...mockItems].slice(0, limit);
}
