/**
 * Risk engine: position and concentration limits, an exposure dashboard, and a
 * trading kill-switch state for the operations console.
 *
 * Exposure is derived deterministically from the demo equity portfolio. All
 * money is integer ngwee. Concentration is expressed in basis points
 * (1 percent = 100 bps).
 */

import type {
  AssetClass,
  ExposureRow,
  IsoTimestamp,
  Ngwee,
  RiskLimit,
  RiskLimitType,
} from "./types";
import { DEMO_PORTFOLIO } from "@/lib/mock/portfolio";

const TENANT_ID = "tenant-capital";

const BPS_PER_WHOLE = 10_000;

function buildExposureRows(): ExposureRow[] {
  const equityRows = DEMO_PORTFOLIO.equities.map((holding) => ({
    symbol: holding.instrument.symbol,
    assetClass: "EQUITY" as AssetClass,
    exposureNgwee: holding.sharesHeld * holding.instrument.lastPriceNgwee,
    shareBps: 0,
  }));

  const rows = [...equityRows];
  const total = rows.reduce((sum, row) => sum + row.exposureNgwee, 0);

  return rows
    .map((row) => ({
      ...row,
      shareBps:
        total === 0 ? 0 : Math.round((row.exposureNgwee * BPS_PER_WHOLE) / total),
    }))
    .sort((a, b) => b.exposureNgwee - a.exposureNgwee);
}

/** Per-instrument exposure rows, largest first, with book share in basis points. */
export const EXPOSURE_ROWS: readonly ExposureRow[] = buildExposureRows();

/** Total book exposure across all instruments, in ngwee. */
export function totalBookExposureNgwee(): Ngwee {
  return EXPOSURE_ROWS.reduce((sum, row) => sum + row.exposureNgwee, 0);
}

const TOTAL_BOOK_NGWEE = totalBookExposureNgwee();

const TOP_NAME = EXPOSURE_ROWS[0];

// ---------------------------------------------------------------------------
// Limits
// ---------------------------------------------------------------------------

const SINGLE_NAME_CONCENTRATION_CAP_BPS = 3_000; // 30 percent of the book

/**
 * Position and concentration limits checked against current book values.
 * The single-name concentration limit is intentionally breached for the demo,
 * driven by the oversized top holding.
 */
export const RISK_LIMITS: readonly RiskLimit[] = [
  {
    id: "limit-pos-001",
    tenantId: TENANT_ID,
    type: "POSITION",
    label: `Single name position cap (${TOP_NAME.symbol})`,
    limitValue: 100_000_000, // ZMW 1,000,000
    currentValue: TOP_NAME.exposureNgwee,
    breached: TOP_NAME.exposureNgwee > 100_000_000,
  },
  {
    id: "limit-con-002",
    tenantId: TENANT_ID,
    type: "CONCENTRATION",
    label: `Single name concentration (${TOP_NAME.symbol})`,
    limitValue: SINGLE_NAME_CONCENTRATION_CAP_BPS,
    currentValue: TOP_NAME.shareBps,
    breached: TOP_NAME.shareBps > SINGLE_NAME_CONCENTRATION_CAP_BPS,
  },
  {
    id: "limit-exp-003",
    tenantId: TENANT_ID,
    type: "EXPOSURE",
    label: "Total book exposure",
    limitValue: 200_000_000, // ZMW 2,000,000
    currentValue: TOTAL_BOOK_NGWEE,
    breached: TOTAL_BOOK_NGWEE > 200_000_000,
  },
  {
    id: "limit-var-004",
    tenantId: TENANT_ID,
    type: "VAR",
    label: "1-day 99 percent value at risk",
    limitValue: 8_000_000, // ZMW 80,000
    currentValue: 6_240_000, // ZMW 62,400
    breached: false,
  },
];

export function getRiskLimits(): RiskLimit[] {
  return [...RISK_LIMITS];
}

export function getBreachedLimits(): RiskLimit[] {
  return RISK_LIMITS.filter((limit) => limit.breached);
}

export function getLimitsByType(type: RiskLimitType): RiskLimit[] {
  return RISK_LIMITS.filter((limit) => limit.type === type);
}

// ---------------------------------------------------------------------------
// Kill switch
// ---------------------------------------------------------------------------

export type KillSwitchMode = "LIVE" | "HALTED";

export type KillSwitchScope = "ALL_TRADING" | "EQUITIES";

export type KillSwitchState = {
  /** True when trading is halted by the switch. */
  engaged: boolean;
  mode: KillSwitchMode;
  scope: KillSwitchScope;
  /** Plain English status label for the UI. */
  label: string;
  /** Why the switch is in its current state. */
  reason: string;
  updatedAt: IsoTimestamp;
};

/**
 * Current trading kill-switch state. Live by default in the demo. Flipping it
 * is an operational action that routes through maker-checker approval.
 */
export const TRADING_KILL_SWITCH: KillSwitchState = {
  engaged: false,
  mode: "LIVE",
  scope: "ALL_TRADING",
  label: "Live",
  reason: "All limits within tolerance except single-name concentration, which is contained to one holding.",
  updatedAt: "2026-05-29T05:00:00.000Z",
};

export function getKillSwitch(): KillSwitchState {
  return TRADING_KILL_SWITCH;
}

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

export type RiskSummary = {
  totalLimits: number;
  breachedLimits: number;
  totalBookNgwee: Ngwee;
  topNameSymbol: string;
  topNameShareBps: number;
  killSwitchMode: KillSwitchMode;
};

export function riskSummary(): RiskSummary {
  return {
    totalLimits: RISK_LIMITS.length,
    breachedLimits: getBreachedLimits().length,
    totalBookNgwee: TOTAL_BOOK_NGWEE,
    topNameSymbol: TOP_NAME.symbol,
    topNameShareBps: TOP_NAME.shareBps,
    killSwitchMode: TRADING_KILL_SWITCH.mode,
  };
}

/** Render a basis-points value as a percentage string, for example "54.79%". */
export function formatBps(bps: number): string {
  return `${(bps / 100).toFixed(2)}%`;
}
