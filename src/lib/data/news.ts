export type LiveNewsItem = {
  id: string;
  source: "Lusaka Times";
  headline: string;
  summary: string;
  publishedAt: string;
  url: string;
};

const FINANCIAL_KEYWORDS = [
  "luse",
  "bank of zambia",
  "boz",
  "kwacha",
  "copper",
  "treasury",
  "dividend",
  "ipo",
  "listed",
  "exchange",
  "monetary policy",
];

function isFinanciallyRelevant(text: string): boolean {
  const lower = text.toLowerCase();
  return FINANCIAL_KEYWORDS.some((kw) => lower.includes(kw));
}

export async function fetchZambianNews(): Promise<LiveNewsItem[]> {
  try {
    const Parser = (await import("rss-parser")).default;
    const parser = new Parser({ timeout: 8000 });
    const feed = await parser.parseURL("https://www.lusakatimes.com/feed/");

    const items: LiveNewsItem[] = [];
    for (const item of feed.items ?? []) {
      const headline = item.title ?? "";
      const rawSummary = item.contentSnippet ?? item.content ?? "";
      const summary = rawSummary.replace(/<[^>]+>/g, "").slice(0, 200).trim();
      if (!isFinanciallyRelevant(headline + " " + summary)) continue;
      items.push({
        id: item.guid ?? item.link ?? headline,
        source: "Lusaka Times",
        headline,
        summary: summary || headline,
        publishedAt: item.isoDate ?? item.pubDate ?? new Date().toISOString(),
        url: item.link ?? "",
      });
      if (items.length >= 10) break;
    }
    return items;
  } catch {
    return [];
  }
}
