export type NewsCategory = "LuSE" | "BoZ" | "ZRA" | "Company" | "Market";

export type NewsItem = {
  id: string;
  timestamp: string;
  source: string;
  category: NewsCategory;
  headline: string;
  summary: string;
  relatedSymbols: string[];
};

export const NEWS_ITEMS: NewsItem[] = [
  {
    id: "n1",
    timestamp: "2026-05-06T07:30:00Z",
    source: "LuSE Announcement",
    category: "LuSE",
    headline: "Zambeef Products reports 18% rise in half-year revenue",
    summary:
      "Zambeef's half-year results show revenue of ZMW 1.2 billion, up 18% on the same period last year. Growth was driven by the retail division and export beef. Management held the interim dividend at 4 ngwee per share, citing working capital needs for the new Lusaka cold-chain facility due in Q3.",
    relatedSymbols: ["ZAMBEEF"],
  },
  {
    id: "n2",
    timestamp: "2026-05-06T08:00:00Z",
    source: "BoZ MPC Statement",
    category: "BoZ",
    headline: "Bank of Zambia holds policy rate at 13.5% for May 2026",
    summary:
      "The Monetary Policy Committee kept the benchmark rate unchanged at 13.5%. The committee noted that inflation remains within the 6-8% target band and that T-bill yields continue to reflect a tight but stable liquidity environment. The next MPC meeting is scheduled for July 2026.",
    relatedSymbols: [],
  },
  {
    id: "n3",
    timestamp: "2026-05-05T14:15:00Z",
    source: "ZRA Notice",
    category: "ZRA",
    headline: "ZRA reminds listed companies of June 30 WHT filing deadline",
    summary:
      "The Zambia Revenue Authority issued a reminder that all listed companies must file Withholding Tax returns for dividends and interest paid in Q1 2026 by 30 June. Penalties of 20% apply on late filings. Investors with queries on net dividend amounts should contact their broker.",
    relatedSymbols: [],
  },
  {
    id: "n4",
    timestamp: "2026-05-05T11:45:00Z",
    source: "LuSE Announcement",
    category: "LuSE",
    headline: "Copperbelt Energy confirms 364-day offtake agreement with ZESCO",
    summary:
      "CEC signed a one-year power supply agreement with ZESCO covering 150 MW at a fixed tariff. The deal provides revenue certainty through Q2 2027 and removes short-term pricing risk. CEC's share price moved up 3% on the announcement before settling at a 1% gain.",
    relatedSymbols: ["CEC"],
  },
  {
    id: "n5",
    timestamp: "2026-05-05T09:00:00Z",
    source: "LuSE Announcement",
    category: "Company",
    headline: "Stanchart Zambia declares ZMW 0.85 per share interim dividend",
    summary:
      "Standard Chartered Bank Zambia declared an interim dividend of ZMW 0.85 per share, payable to shareholders on record as of 20 May 2026. WHT at 15% will be deducted at source. The payment date is 5 June 2026. The dividend reflects a payout ratio of 42% of H1 earnings.",
    relatedSymbols: ["SCBL"],
  },
  {
    id: "n6",
    timestamp: "2026-05-04T16:30:00Z",
    source: "MoF Gazette",
    category: "Market",
    headline: "MoF announces ZMW 800 million T-bill issuance for May 9 auction",
    summary:
      "The Ministry of Finance confirmed a ZMW 800 million T-bill auction on 9 May 2026 across the 91, 182, 273 and 364-day tenors. Allotment targets are ZMW 150 million for 91-day, ZMW 200 million for 182-day, ZMW 200 million for 273-day and ZMW 250 million for 364-day. Non-competitive bids accepted up to ZMW 5 million per investor.",
    relatedSymbols: [],
  },
  {
    id: "n7",
    timestamp: "2026-05-04T10:00:00Z",
    source: "Company Release",
    category: "Company",
    headline: "Airtel Networks Zambia adds 420,000 subscribers in Q1 2026",
    summary:
      "ATEL reported 420,000 net new subscribers in Q1 2026, bringing total subscribers to 8.3 million. Data revenue grew 31% year on year. Airtel Money transaction volumes rose 48%. Management guided for full-year EBITDA margin of 38-40%, up from 36% in 2025.",
    relatedSymbols: ["ATEL"],
  },
  {
    id: "n8",
    timestamp: "2026-05-03T08:45:00Z",
    source: "LuSE Market Report",
    category: "LuSE",
    headline: "LuSE All Share Index gains 1.2% on strong banking sector turnover",
    summary:
      "The LuSE All Share Index closed at 8,412 points on Friday, up 1.2% for the week. Total turnover was ZMW 14.2 million, driven by Stanchart and Zanaco. Foreign investor participation was 22% of total turnover, up from 17% the previous week. Year-to-date the index is up 9.4%.",
    relatedSymbols: ["SCBL", "ZANACO"],
  },
];

export function newsBySymbol(symbol: string): NewsItem[] {
  return NEWS_ITEMS.filter((n) => n.relatedSymbols.includes(symbol));
}
