const ZMW_FORMATTER = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Takes integer ngwee, returns e.g. "ZMW 1,558,400.00" */
export function formatZMW(ngwee: number): string {
  return `ZMW ${ZMW_FORMATTER.format(ngwee / 100)}`;
}

/** Takes a ZMW decimal value (already divided), returns e.g. "ZMW 3.90" */
export function formatZMWFloat(zmw: number): string {
  return `ZMW ${ZMW_FORMATTER.format(zmw)}`;
}
