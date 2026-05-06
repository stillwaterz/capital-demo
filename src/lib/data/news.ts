export type LiveNewsItem = {
  id: string;
  source: "Lusaka Times";
  headline: string;
  summary: string;
  publishedAt: string;
  url: string;
};

const FINANCIAL_KEYWORDS = [
  // Market infrastructure
  "luse", "lusaka securities exchange", "stock exchange", "listed", "listing", "ipo", "direct listing",
  // Regulators
  "bank of zambia", "boz", "zra", "sec zambia", "securities and exchange commission",
  "monetary policy", "mpr", "interest rate", "inflation",
  // Instruments
  "kwacha", "zmw", "treasury bill", "t-bill", "government bond", "dividend", "yield", "auction",
  // Commodities relevant to Zambia
  "copper", "cobalt",
  // Verified LuSE counters
  "airtel networks zambia", "atel",
  "bata shoe", "bata zambia",
  "british american tobacco zambia", "bat zambia", "batz",
  "copperbelt energy", "cec",
  "chilanga cement", "chil",
  "klapton reinsurance", "klpt",
  "madison financial", "mfin",
  "puma energy zambia", "puma",
  "real estate investments zambia", "reiz",
  "standard chartered bank zambia", "stanchart zambia", "scbl",
  "zambeef", "zambeef products",
  "metal fabricators of zambia", "zamefa",
  "zambia forestry", "zaffico",
  "zambia national commercial bank", "zanaco",
  "zambia reinsurance", "zre",
  "dot com zambia", "dcz",
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
