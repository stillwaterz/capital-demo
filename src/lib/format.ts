const ZMW_FORMATTER = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Integer ngwee → "ZMW 1,558,400.00" */
export function formatZMW(ngwee: number): string {
  return `ZMW ${ZMW_FORMATTER.format(ngwee / 100)}`;
}

/** ZMW decimal already divided → "ZMW 3.90" */
export function formatZMWFloat(zmw: number): string {
  return `ZMW ${ZMW_FORMATTER.format(zmw)}`;
}

/** Percentage with sign → "+10.80%" or "-2.30%" */
export function formatPercent(value: number, decimals = 2): string {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(decimals)}%`;
}

/** Date → "6 May 2026" */
export function formatDateZM(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-ZM", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
