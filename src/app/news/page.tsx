import { NewsFeed } from "@/components/news-feed";
import { NEWS_ITEMS } from "@/lib/mock/news";

export default function NewsPage() {
  return (
    <div className="space-y-5">
      <section>
        <h1 className="text-2xl font-bold tracking-tight">News intelligence</h1>
        <p className="text-sm text-muted-foreground mt-1">
          LuSE announcements, BoZ statements, ZRA notices and company updates -
          summarised by AI.
        </p>
      </section>
      <NewsFeed items={NEWS_ITEMS} />
    </div>
  );
}
