"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { type MergedNewsItem } from "@/lib/data/merged-news";
import { type NewsItem } from "@/lib/mock/news";
import { formatDateZM } from "@/lib/format";

type Filter = "All" | "LuSE" | "BoZ" | "ZRA" | "Companies" | "Macro";

const FILTERS: Filter[] = ["All", "LuSE", "BoZ", "ZRA", "Companies", "Macro"];

function matchesFilter(item: MergedNewsItem, filter: Filter): boolean {
  if (filter === "All") return true;
  if (!item.isLive) {
    const cat = (item as NewsItem).category;
    if (filter === "BoZ") return cat === "BoZ";
    if (filter === "ZRA") return cat === "ZRA";
    if (filter === "LuSE") return cat === "LuSE";
    if (filter === "Companies") return cat === "Company";
    if (filter === "Macro") return cat === "Market";
  }
  return true;
}

export function NewsPageClient({ items, mockItems }: { items: MergedNewsItem[]; mockItems: NewsItem[] }) {
  const [filter, setFilter] = useState<Filter>("All");

  const liveItems = items.filter((i) => i.isLive);
  const mockMerged: MergedNewsItem[] = mockItems.map((i) => ({ ...i, isLive: false as const }));
  const allItems: MergedNewsItem[] = liveItems.length >= 3
    ? liveItems
    : [...liveItems, ...mockMerged];

  const filtered = allItems.filter((i) => matchesFilter(i, filter));

  return (
    <div className="space-y-4">
      {/* Filter chips */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`shrink-0 text-xs px-3 py-1.5 rounded-full border transition-colors ${
              filter === f
                ? "bg-brand-ink text-brand-cream border-brand-ink"
                : "border-border text-muted-foreground hover:border-brand-ink/40"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {liveItems.length > 0 && (
        <div className="flex items-center gap-1.5 text-xs text-brand-green">
          <span className="w-1.5 h-1.5 rounded-full bg-brand-green animate-pulse" />
          {liveItems.length} live articles from Lusaka Times
        </div>
      )}

      <div className="space-y-3">
        {filtered.map((item) => (
          <Card key={item.id} className="border border-brand-ink/10">
            <CardContent className="py-4 px-5">
              <div className="flex items-start gap-2 mb-2">
                {item.isLive ? (
                  <Badge className="text-xs shrink-0 bg-brand-green/10 text-brand-green border-brand-green/20">
                    Lusaka Times
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-xs shrink-0">
                    {(item as NewsItem).category}
                  </Badge>
                )}
                <p className="text-xs text-muted-foreground">
                  {formatDateZM(item.isLive ? item.publishedAt : (item as NewsItem).timestamp)}
                </p>
                {!item.isLive && (
                  <span className="ml-auto text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full shrink-0">
                    Demo
                  </span>
                )}
              </div>
              <p className="text-base font-medium mb-1">{item.headline}</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {item.isLive ? item.summary : (item as NewsItem).summary}
              </p>
              {item.isLive && item.url && (
                <Link
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-brand-green hover:underline mt-2 inline-block"
                >
                  Read full article
                </Link>
              )}
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && (
          <p className="text-sm text-muted-foreground py-6 text-center">No articles match this filter.</p>
        )}
      </div>
    </div>
  );
}
