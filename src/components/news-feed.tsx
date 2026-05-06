"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { type NewsItem, type NewsCategory } from "@/lib/mock/news";

const CATEGORIES: Array<NewsCategory | "All"> = [
  "All",
  "LuSE",
  "BoZ",
  "ZRA",
  "Company",
  "Market",
];

type Props = { items: NewsItem[] };

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-ZM", {
    day: "numeric",
    month: "short",
  });
}

export function NewsFeed({ items }: Props) {
  const [active, setActive] = useState<NewsCategory | "All">("All");

  const filtered =
    active === "All" ? items : items.filter((i) => i.category === active);

  return (
    <div className="space-y-4">
      {/* Filter chips */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActive(cat)}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
              active === cat
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border text-muted-foreground hover:text-foreground hover:border-foreground"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Items */}
      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center">
          No news in this category.
        </p>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => (
            <Card key={item.id}>
              <CardContent className="py-3 px-4">
                <div className="flex items-start gap-2 mb-1.5">
                  <Badge variant="outline" className="text-xs shrink-0">
                    {item.category}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {item.source}
                  </span>
                  <span className="text-xs text-muted-foreground ml-auto shrink-0">
                    {formatDate(item.timestamp)}
                  </span>
                </div>
                <p className="text-sm font-medium mb-1">{item.headline}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {item.summary}
                </p>
                {item.relatedSymbols.length > 0 && (
                  <div className="flex gap-1 mt-2">
                    {item.relatedSymbols.map((s) => (
                      <Badge key={s} variant="secondary" className="text-xs">
                        {s}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
