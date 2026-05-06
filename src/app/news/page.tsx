import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { NewsFeed } from "@/components/news-feed";
import { NEWS_ITEMS } from "@/lib/mock/news";
import { getMergedNews } from "@/lib/data/merged-news";
import { formatDateZM } from "@/lib/format";

export const revalidate = 1800;

export default async function NewsPage() {
  const mergedItems = await getMergedNews(20);
  const liveItems = mergedItems.filter((i) => i.isLive);
  const mockFallbackItems = mergedItems.filter((i) => !i.isLive);

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-3xl font-bold tracking-tight font-display">News</h1>
        <p className="text-base text-muted-foreground mt-1">
          LuSE announcements, BoZ statements, ZRA notices and company updates -
          summarised by AI.
        </p>
      </section>

      {liveItems.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
              Latest from Lusaka Times
            </h2>
            <span className="flex items-center gap-1 text-xs text-brand-green">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-green animate-pulse" />
              Live
            </span>
          </div>
          <div className="space-y-3">
            {liveItems.map((item) => {
              if (!item.isLive) return null;
              return (
                <Card key={item.id} className="border border-brand-ink/10">
                  <CardContent className="py-4 px-5">
                    <div className="flex items-start gap-2 mb-2">
                      <Badge className="text-xs shrink-0 bg-brand-green/10 text-brand-green border-brand-green/20">
                        Lusaka Times
                      </Badge>
                      <p className="text-xs text-muted-foreground">
                        {formatDateZM(item.publishedAt)}
                      </p>
                    </div>
                    <p className="text-base font-medium mb-1">{item.headline}</p>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-2">
                      {item.summary}
                    </p>
                    {item.url && (
                      <Link
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-brand-green hover:underline"
                      >
                        Read full article
                      </Link>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">
          Market intelligence (demo data)
        </h2>
        <NewsFeed items={NEWS_ITEMS} />
      </section>
    </div>
  );
}
