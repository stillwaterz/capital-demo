export type Instrument = {
  symbol: string;
  name: string;
  sector: string;
  lastPriceNgwee: number;
  changePercent: number;
  prices30d: number[];
};

function makePriceSeries(baseNgwee: number, volatility: number): number[] {
  const series: number[] = [];
  let price = baseNgwee;
  for (let i = 0; i < 30; i++) {
    price = Math.round(price * (1 + (Math.random() - 0.5) * volatility));
    series.push(Math.max(price, 1));
  }
  return series;
}

export const INSTRUMENTS: Instrument[] = [
  { symbol: "ZAMBEEF",  name: "Zambeef Products",                   sector: "Consumer Staples", lastPriceNgwee: 390,   changePercent: 2.89,   prices30d: makePriceSeries(370, 0.04) },
  { symbol: "SCBL",     name: "Stanchart Zambia",                   sector: "Banking",          lastPriceNgwee: 5200,  changePercent: -0.38,  prices30d: makePriceSeries(5250, 0.025) },
  { symbol: "ATEL",     name: "Airtel Networks Zambia",             sector: "Telecoms",         lastPriceNgwee: 2850,  changePercent: 1.25,   prices30d: makePriceSeries(2790, 0.03) },
  { symbol: "CEC",      name: "Copperbelt Energy",                  sector: "Energy",           lastPriceNgwee: 14500, changePercent: -1.02,  prices30d: makePriceSeries(14700, 0.03) },
  { symbol: "ZANACO",   name: "Zambia National Commercial Bank",    sector: "Banking",          lastPriceNgwee: 680,   changePercent: 0.0,    prices30d: makePriceSeries(680, 0.02) },
  { symbol: "BAT",      name: "BAT Zambia",                         sector: "Consumer Goods",   lastPriceNgwee: 22500, changePercent: 0.44,   prices30d: makePriceSeries(22300, 0.02) },
  { symbol: "CHILANGA", name: "Chilanga Cement",                    sector: "Materials",        lastPriceNgwee: 7800,  changePercent: -0.64,  prices30d: makePriceSeries(7850, 0.035) },
  { symbol: "PUMA",     name: "Puma Energy Zambia",                 sector: "Energy",           lastPriceNgwee: 4100,  changePercent: 1.73,   prices30d: makePriceSeries(4000, 0.04) },
  { symbol: "LAFARGE",  name: "Lafarge Zambia",                     sector: "Materials",        lastPriceNgwee: 6500,  changePercent: -0.77,  prices30d: makePriceSeries(6600, 0.03) },
  { symbol: "ZSUG",     name: "Zambia Sugar",                       sector: "Consumer Staples", lastPriceNgwee: 12000, changePercent: 0.83,   prices30d: makePriceSeries(11900, 0.03) },
  { symbol: "PRIMA",    name: "Prima Reinsurance",                  sector: "Insurance",        lastPriceNgwee: 850,   changePercent: 0.0,    prices30d: makePriceSeries(850, 0.015) },
  { symbol: "PRZM",     name: "Prudential Zambia",                  sector: "Insurance",        lastPriceNgwee: 1100,  changePercent: 0.91,   prices30d: makePriceSeries(1080, 0.02) },
  { symbol: "ZNCO",     name: "Zain Zambia (formerly Celtel)",      sector: "Telecoms",         lastPriceNgwee: 3400,  changePercent: -0.29,  prices30d: makePriceSeries(3410, 0.025) },
  { symbol: "FMBZ",     name: "First Merchant Bank Zambia",         sector: "Banking",          lastPriceNgwee: 1650,  changePercent: 1.23,   prices30d: makePriceSeries(1630, 0.03) },
  { symbol: "ZCCM",     name: "ZCCM Investments Holdings",          sector: "Mining",           lastPriceNgwee: 87000, changePercent: 2.11,   prices30d: makePriceSeries(85000, 0.04) },
  { symbol: "LSML",     name: "Lusaka Stock Exchange Ltd",          sector: "Financials",       lastPriceNgwee: 2200,  changePercent: 0.45,   prices30d: makePriceSeries(2190, 0.02) },
  { symbol: "NATBREW",  name: "National Breweries",                 sector: "Consumer Goods",   lastPriceNgwee: 3700,  changePercent: -0.54,  prices30d: makePriceSeries(3720, 0.03) },
  { symbol: "REAL",     name: "Real Estate Investments",            sector: "Real Estate",      lastPriceNgwee: 4500,  changePercent: 0.22,   prices30d: makePriceSeries(4490, 0.02) },
  { symbol: "SFC",      name: "Savenda Finance Corporation",        sector: "Financials",       lastPriceNgwee: 920,   changePercent: -0.11,  prices30d: makePriceSeries(921, 0.015) },
  { symbol: "MWANA",    name: "Mwana Africa Zambia",                sector: "Mining",           lastPriceNgwee: 1800,  changePercent: 3.45,   prices30d: makePriceSeries(1740, 0.05) },
];

export function getInstrument(symbol: string): Instrument | undefined {
  return INSTRUMENTS.find((i) => i.symbol === symbol);
}
