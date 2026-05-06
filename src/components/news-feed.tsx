"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { type NewsItem, type NewsCategory } from "@/lib/mock/news";
import { formatDateZM } from "@/lib/format";

const CATEGORIES: Array<NewsCategory | "All"> = [
  "All", "LuSE", "BoZ", "ZRA", "Company", "Market",
];

const CATEGORY_COLOURS: Record<NewsCategory | "All", string> = {
  All:     "border-border text-muted-foreground",
  LuSE:    "border-brand-green/50 text-brand-green bg-brand-green/5",
  BoZ:     "border-blue-400/50 text-blue-700 bg-blue-50",
  ZRA:     "border-orange-400/50 text-orange-700 bg-orange-50",
  Company: "border-purple-400/50 text-purple-700 bg-purple-50",
  Market:  "border-slate-400/50 text-slate-600 bg-slate-50",
};

const MATERIALITY_KEYWORDS = ["confirms", "declares", "announces", "holds", "reports", "signs"];

function isMaterial(headline: string): boolean {
  return MATERIALITY_KEYWORDS.some((k) => headline.toLowerCase().includes(k));
}

type Props = { items: NewsItem[]; portfolioSymbols?: string[] };

export function NewsFeed({ items, portfolioSymbols = ["ZAMBEEF", "SCBL", "ATEL"] }: Props) {
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
                ? "bg-brand-green text-brand-cream border-brand-green"
                : "border-border text-muted-foreground hover:text-foreground hover:border-foreground"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-sm text-muted-foreground">No news in this category.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => {
            const material = isMaterial(item.headline);
            const relevant = item.relatedSymbols.some((s) => portfolioSymbols.includes(s));
            return (
              <Card key={item.id} className="border border-brand-ink/10">
                <CardContent className="py-3 px-4">
                  <div className="flex items-start gap-2 mb-1.5">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium border ${CATEGORY_COLOURS[item.category]}`}
                    >
                      {item.category}
                    </span>
                    <span className="text-xs text-muted-foreground">{item.source}</span>
                    <div className="ml-auto flex items-center gap-2 shrink-0">
                      <span className={`w-1.5 h-1.5 rounded-full ${material ? "bg-brand-copper" : "bg-muted-foreground/40"}`} title={material ? "Material" : "Routine"} />
                      <span className="text-xs text-muted-foreground">
                        {formatDateZM(item.timestamp)}
                      </span>
                    </div>
                  </div>
                  <p className="text-base font-medium mb-1">{item.headline}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {item.summary}
                  </p>
                  {relevant && (
                    <p className="text-sm text-brand-green mt-2 font-medium">
                      This may affect your portfolio
                    </p>
                  )}
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
            );
          })}
        </div>
      )}
    </div>
  );
}
