export type Instrument = {
  symbol: string;
  name: string;
  sector: string;
  board: "main" | "alt-m";
  description: string;
  lastPriceNgwee: number;
  changePercent: number;
  prices30d: number[];
};

function makePriceSeries(baseNgwee: number, volatility: number, days = 30): number[] {
  const series: number[] = [];
  let price = baseNgwee;
  for (let i = 0; i < days; i++) {
    price = Math.round(price * (1 + (Math.random() - 0.5) * volatility));
    series.push(Math.max(price, 1));
  }
  return series;
}

export const INSTRUMENTS: Instrument[] = [
  {
    symbol: "ATEL",
    name: "Airtel Networks Zambia Plc",
    sector: "Telecommunications",
    board: "main",
    description: "Airtel Networks Zambia is one of the leading mobile network operators in Zambia, providing voice, data and mobile money services nationwide. It is part of the Airtel Africa group listed on the London and Nigerian stock exchanges.",
    lastPriceNgwee: 2850,
    changePercent: 1.25,
    prices30d: makePriceSeries(2790, 0.03),
  },
  {
    symbol: "BATA",
    name: "Bata Shoe Company Zambia",
    sector: "Consumer Goods",
    board: "main",
    description: "Bata Shoe Company has operated in Zambia for decades, manufacturing and retailing footwear through its Lusaka and Limbe factories. It serves both retail consumers and institutional buyers such as schools and the defence sector.",
    lastPriceNgwee: 1850,
    changePercent: -0.54,
    prices30d: makePriceSeries(1870, 0.025),
  },
  {
    symbol: "BATZ",
    name: "British American Tobacco Zambia",
    sector: "Consumer Goods",
    board: "main",
    description: "British American Tobacco Zambia manufactures and distributes tobacco products in Zambia and surrounding markets. It is a subsidiary of the global BAT group and is one of the highest-priced counters on the LuSE main board.",
    lastPriceNgwee: 22500,
    changePercent: 0.44,
    prices30d: makePriceSeries(22300, 0.02),
  },
  {
    symbol: "CEC",
    name: "Copperbelt Energy Corporation Plc",
    sector: "Utilities",
    board: "main",
    description: "Copperbelt Energy Corporation is the primary electricity transmission and distribution company serving the Copperbelt mining sector. It imports and distributes bulk power to mines, smelters and other large industrial consumers.",
    lastPriceNgwee: 14500,
    changePercent: -1.02,
    prices30d: makePriceSeries(14700, 0.03),
  },
  {
    symbol: "CECA",
    name: "CEC Africa Investments Ltd",
    sector: "Energy",
    board: "main",
    description: "CEC Africa Investments is the holding vehicle for CEC's regional expansion beyond Zambia, with interests in power infrastructure across sub-Saharan Africa. It was separately listed to give investors direct access to the regional growth portfolio.",
    lastPriceNgwee: 3200,
    changePercent: 0.63,
    prices30d: makePriceSeries(3180, 0.03),
  },
  {
    symbol: "CHIL",
    name: "Chilanga Cement Plc",
    sector: "Industrials",
    board: "main",
    description: "Chilanga Cement is Zambia's largest cement producer, operating plants in Chilanga and Ndola. It supplies cement to construction, infrastructure and housing projects across Zambia and exports to the region.",
    lastPriceNgwee: 6500,
    changePercent: -0.77,
    prices30d: makePriceSeries(6550, 0.03),
  },
  {
    symbol: "KLPT",
    name: "Klapton Reinsurance Plc",
    sector: "Reinsurance",
    board: "main",
    description: "Klapton Reinsurance joined the LuSE main board via direct listing in March 2026, making it one of the newest counters on the exchange. It provides risk transfer and reinsurance capacity to primary insurers operating in Zambia and the COMESA region.",
    lastPriceNgwee: 1200,
    changePercent: 2.56,
    prices30d: makePriceSeries(1170, 0.04),
  },
  {
    symbol: "MFIN",
    name: "Madison Financial Services",
    sector: "Financials",
    board: "main",
    description: "Madison Financial Services is a Zambian financial holding company with operations in insurance, asset management and financial advisory. It serves both retail and institutional clients through a network of branches and agents.",
    lastPriceNgwee: 950,
    changePercent: 0.0,
    prices30d: makePriceSeries(950, 0.015),
  },
  {
    symbol: "PUMA",
    name: "Puma Energy Zambia Plc",
    sector: "Energy",
    board: "main",
    description: "Puma Energy Zambia operates a national network of service stations and fuel storage and distribution infrastructure. It supplies petroleum products to retail customers, mining companies and government entities.",
    lastPriceNgwee: 4100,
    changePercent: 1.73,
    prices30d: makePriceSeries(4000, 0.04),
  },
  {
    symbol: "REIZ",
    name: "Real Estate Investments Zambia",
    sector: "Real Estate",
    board: "main",
    description: "Real Estate Investments Zambia is Zambia's only listed real estate investment trust, holding a portfolio of commercial properties in Lusaka. It distributes rental income to shareholders on a regular basis.",
    lastPriceNgwee: 4500,
    changePercent: 0.22,
    prices30d: makePriceSeries(4490, 0.02),
  },
  {
    symbol: "SCBL",
    name: "Standard Chartered Bank Zambia Plc",
    sector: "Financials",
    board: "main",
    description: "Standard Chartered Bank Zambia is one of the oldest and largest commercial banks in the country, serving corporate, SME and retail clients. It is a subsidiary of Standard Chartered Plc, listed on the London and Hong Kong stock exchanges.",
    lastPriceNgwee: 5200,
    changePercent: -0.38,
    prices30d: makePriceSeries(5250, 0.025),
  },
  {
    symbol: "ZAMBEEF",
    name: "Zambeef Products Plc",
    sector: "Food and Agriculture",
    board: "main",
    description: "Zambeef Products is one of Zambia's largest agri-business companies, with operations in beef, pork, chicken, dairy, stock feed and cropping. It supplies retail chains, restaurants and institutions across Zambia and the wider region.",
    lastPriceNgwee: 390,
    changePercent: 2.89,
    prices30d: makePriceSeries(370, 0.04),
  },
  {
    symbol: "ZAMEFA",
    name: "Metal Fabricators of Zambia Plc",
    sector: "Industrials",
    board: "main",
    description: "Metal Fabricators of Zambia manufactures copper and copper alloy products including cables, conductors and rods, primarily serving the mining sector and export markets. Its plant in Lusaka processes copper cathode sourced from Zambian smelters.",
    lastPriceNgwee: 2100,
    changePercent: -0.48,
    prices30d: makePriceSeries(2110, 0.03),
  },
  {
    symbol: "ZAFFICO",
    name: "Zambia Forestry and Forest Industries Corporation",
    sector: "Forestry",
    board: "main",
    description: "Zambia Forestry and Forest Industries Corporation manages commercial timber and forest plantations across Zambia, producing timber, poles and paper products. It is partially government-owned and serves both domestic and export markets.",
    lastPriceNgwee: 1650,
    changePercent: 0.61,
    prices30d: makePriceSeries(1640, 0.025),
  },
  {
    symbol: "ZANACO",
    name: "Zambia National Commercial Bank Plc",
    sector: "Financials",
    board: "main",
    description: "Zambia National Commercial Bank is Zambia's largest bank by branch network, with a strong presence in rural and peri-urban areas. It serves individuals, SMEs, government agencies and parastatals, with Rabobank as a strategic shareholder.",
    lastPriceNgwee: 680,
    changePercent: 0.0,
    prices30d: makePriceSeries(680, 0.02),
  },
  {
    symbol: "ZRE",
    name: "Zambia Reinsurance Plc",
    sector: "Reinsurance",
    board: "main",
    description: "Zambia Reinsurance is the national reinsurance company, accepting risk cessions from insurance companies operating in Zambia and the region. It provides treaty and facultative reinsurance across life, non-life and specialty lines.",
    lastPriceNgwee: 850,
    changePercent: -0.12,
    prices30d: makePriceSeries(851, 0.015),
  },
  {
    symbol: "DCZ",
    name: "Dot Com Zambia",
    sector: "Technology",
    board: "alt-m",
    description: "Dot Com Zambia listed on the LuSE Alternative Market (Alt-M) in December 2025, making it Zambia's first publicly listed technology company. It provides digital services, web hosting and e-commerce infrastructure to businesses across Zambia.",
    lastPriceNgwee: 3500,
    changePercent: 4.48,
    prices30d: makePriceSeries(3350, 0.05),
  },
];

export function getInstrument(symbol: string): Instrument | undefined {
  return INSTRUMENTS.find((i) => i.symbol === symbol);
}

export const VERIFIED_SYMBOLS = INSTRUMENTS.map((i) => i.symbol);
export const VERIFIED_NAMES = INSTRUMENTS.map((i) => i.name);
