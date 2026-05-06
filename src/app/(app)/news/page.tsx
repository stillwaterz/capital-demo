import { NEWS_ITEMS } from "@/lib/mock/news";
import { getMergedNews } from "@/lib/data/merged-news";
import { NewsPageClient } from "@/components/news-page-client";

export const revalidate = 1800;

export default async function NewsPage() {
  const mergedItems = await getMergedNews(20);

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-3xl font-bold tracking-tight font-display">News intelligence</h1>
        <p className="text-base text-muted-foreground mt-1">
          Capital markets news from Zambian sources, summarised by AI.
        </p>
      </section>
      <NewsPageClient items={mergedItems} mockItems={NEWS_ITEMS} />
    </div>
  );
}
