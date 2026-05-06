export type Bond = {
  isin: string;
  label: string;
  tenorYears: 2 | 3 | 5 | 7 | 10 | 15;
  couponPercent: number;
  ytmPercent: number;
  maturityDate: string;
};

export const BONDS: Bond[] = [
  {
    isin: "ZM0000000021",
    label: "GRZ 2-Year Bond",
    tenorYears: 2,
    couponPercent: 14.00,
    ytmPercent: 14.85,
    maturityDate: "2028-03-15",
  },
  {
    isin: "ZM0000000022",
    label: "GRZ 3-Year Bond",
    tenorYears: 3,
    couponPercent: 14.50,
    ytmPercent: 15.20,
    maturityDate: "2029-03-15",
  },
  {
    isin: "ZM0000000023",
    label: "GRZ 5-Year Bond",
    tenorYears: 5,
    couponPercent: 15.00,
    ytmPercent: 15.75,
    maturityDate: "2031-03-15",
  },
  {
    isin: "ZM0000000024",
    label: "GRZ 7-Year Bond",
    tenorYears: 7,
    couponPercent: 15.50,
    ytmPercent: 16.10,
    maturityDate: "2033-03-15",
  },
  {
    isin: "ZM0000000025",
    label: "GRZ 10-Year Bond",
    tenorYears: 10,
    couponPercent: 16.00,
    ytmPercent: 16.45,
    maturityDate: "2036-03-15",
  },
  {
    isin: "ZM0000000026",
    label: "GRZ 15-Year Bond",
    tenorYears: 15,
    couponPercent: 16.50,
    ytmPercent: 16.80,
    maturityDate: "2041-03-15",
  },
];
