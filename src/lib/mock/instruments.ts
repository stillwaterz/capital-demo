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
  {
    symbol: "ZAMBEEF",
    name: "Zambeef Products",
    sector: "Consumer Staples",
    lastPriceNgwee: 390,
    changePercent: 2.89,
    prices30d: makePriceSeries(370, 0.04),
  },
  {
    symbol: "SCBL",
    name: "Stanchart Zambia",
    sector: "Banking",
    lastPriceNgwee: 5200,
    changePercent: -0.38,
    prices30d: makePriceSeries(5250, 0.025),
  },
  {
    symbol: "ATEL",
    name: "Airtel Networks Zambia",
    sector: "Telecoms",
    lastPriceNgwee: 2850,
    changePercent: 1.25,
    prices30d: makePriceSeries(2790, 0.03),
  },
  {
    symbol: "CEC",
    name: "Copperbelt Energy",
    sector: "Energy",
    lastPriceNgwee: 14500,
    changePercent: -1.02,
    prices30d: makePriceSeries(14700, 0.03),
  },
  {
    symbol: "ZANACO",
    name: "Zambia National Commercial Bank",
    sector: "Banking",
    lastPriceNgwee: 680,
    changePercent: 0.0,
    prices30d: makePriceSeries(680, 0.02),
  },
  {
    symbol: "BAT",
    name: "BAT Zambia",
    sector: "Consumer Goods",
    lastPriceNgwee: 22500,
    changePercent: 0.44,
    prices30d: makePriceSeries(22300, 0.02),
  },
  {
    symbol: "CHILANGA",
    name: "Chilanga Cement",
    sector: "Materials",
    lastPriceNgwee: 7800,
    changePercent: -0.64,
    prices30d: makePriceSeries(7850, 0.035),
  },
  {
    symbol: "PUMA",
    name: "Puma Energy Zambia",
    sector: "Energy",
    lastPriceNgwee: 4100,
    changePercent: 1.73,
    prices30d: makePriceSeries(4000, 0.04),
  },
];

export function formatZMW(ngwee: number): string {
  return `ZMW ${(ngwee / 100).toFixed(2)}`;
}

export function getInstrument(symbol: string): Instrument | undefined {
  return INSTRUMENTS.find((i) => i.symbol === symbol);
}
