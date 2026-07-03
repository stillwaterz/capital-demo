/**
 * Trade blotter and lifecycle engine.
 *
 * A deterministic seed blotter of equity and government-securities trades plus
 * a pure lifecycle function that derives each trade's state from the current
 * business date. Advancing the clock moves trades NEW -> EXECUTED -> CONFIRMED
 * -> CLEARING -> SETTLED, or to FAILED for the seeded fails.
 *
 * Everything here is a pure function of (seed, currentDate) so the whole console
 * recomputes when the business clock advances. Money is integer ngwee.
 */

import type {
  AssetClass,
  IsoDate,
  IsoTimestamp,
  Ngwee,
  Side,
  Trade,
  TradeState,
} from "./types";
import { isSettlementDue, nextSettlementDate } from "./clock";

const TENANT_ID = "capital-demo";

/** Commission schedule, expressed in basis points of gross consideration. */
export const EQUITY_BROKERAGE_BPS = 150; // 1.50% commission (BUILD_SPEC section 5)
export const EQUITY_LEVY_BPS = 20; // 0.20% combined LuSE and SEC levy
export const GOVT_BROKERAGE_BPS = 25; // 0.25% on T-bills and bonds
/** Flat CSD settlement fee per equity trade, in ngwee (ZMW 5.00). */
export const CSD_FEE_NGWEE: Ngwee = 500;
/** Withholding tax rate on dividend and coupon income, in basis points. */
export const WHT_BPS = 1500; // 15%

/** Apply a basis-points rate to a ngwee amount, rounded to whole ngwee. */
export function ngweeBps(amountNgwee: Ngwee, bps: number): Ngwee {
  return Math.round((amountNgwee * bps) / 10_000);
}

export type TradeFeeBreakdown = {
  brokerageNgwee: Ngwee;
  levyNgwee: Ngwee;
  csdNgwee: Ngwee;
  totalNgwee: Ngwee;
};

/** Pure fee calculation for a single trade, by asset class. */
export function computeTradeFees(
  grossNgwee: Ngwee,
  assetClass: AssetClass
): TradeFeeBreakdown {
  if (assetClass === "EQUITY") {
    const brokerageNgwee = ngweeBps(grossNgwee, EQUITY_BROKERAGE_BPS);
    const levyNgwee = ngweeBps(grossNgwee, EQUITY_LEVY_BPS);
    const csdNgwee = CSD_FEE_NGWEE;
    return {
      brokerageNgwee,
      levyNgwee,
      csdNgwee,
      totalNgwee: brokerageNgwee + levyNgwee + csdNgwee,
    };
  }
  const brokerageNgwee = ngweeBps(grossNgwee, GOVT_BROKERAGE_BPS);
  return {
    brokerageNgwee,
    levyNgwee: 0,
    csdNgwee: 0,
    totalNgwee: brokerageNgwee,
  };
}

/** How quickly a trade clears before settlement, used to spread the board. */
type ClearTrack = "FAST" | "MID" | "SLOW";

/** Deterministic settlement-fail flavours used by the seed blotter. */
export type FailMode = "SHORT_CASH" | "UNCONFIRMED_POSITION";

const FAIL_REASONS: Record<FailMode, string> = {
  SHORT_CASH: "Client cash short of net consideration at settlement",
  UNCONFIRMED_POSITION: "CSD position not confirmed by counterparty",
};

type TradeSeed = {
  id: string;
  clientId: string;
  clientName: string;
  symbol: string;
  assetClass: AssetClass;
  side: Side;
  quantity: number;
  priceNgwee: Ngwee;
  counterparty: string;
  clientRef: string;
  tradeDate: IsoDate;
  /** Pre-settlement clearing speed, spreads trades across the lifecycle board. */
  track: ClearTrack;
  /** When set, the trade fails at settlement instead of settling. */
  failMode: FailMode | null;
};

/**
 * Deterministic seed blotter anchored around the demo clock (2026-05-29).
 *
 * The 2026-05-28 batch is already due on the start date so the board opens with
 * settled trades and one fail. The 2026-05-29 batch settles after one "Advance
 * to T+1", and the 2026-06-01 trade starts NEW to populate the first lane.
 */
const TRADE_SEEDS: readonly TradeSeed[] = [
  // Batch dated 2026-05-28, settles 2026-05-29 (due at demo start).
  {
    id: "T-101",
    clientId: "C001",
    clientName: "Chanda M.",
    symbol: "ZAMBEEF",
    assetClass: "EQUITY",
    side: "BUY",
    quantity: 10_000,
    priceNgwee: 390,
    counterparty: "Pangaea Securities",
    clientRef: "ORD-24881",
    tradeDate: "2026-05-28",
    track: "FAST",
    failMode: null,
  },
  {
    id: "T-102",
    clientId: "C002",
    clientName: "Mutale B.",
    symbol: "SCBL",
    assetClass: "EQUITY",
    side: "SELL",
    quantity: 2_000,
    priceNgwee: 5_200,
    counterparty: "Stockbrokers Zambia",
    clientRef: "ORD-24882",
    tradeDate: "2026-05-28",
    track: "MID",
    failMode: null,
  },
  {
    id: "T-103",
    clientId: "C004",
    clientName: "Kafue Traders Ltd",
    symbol: "ATEL",
    assetClass: "EQUITY",
    side: "BUY",
    quantity: 5_000,
    priceNgwee: 2_850,
    counterparty: "Madison Asset",
    clientRef: "ORD-24883",
    tradeDate: "2026-05-28",
    track: "FAST",
    failMode: "SHORT_CASH",
  },
  {
    id: "T-104",
    clientId: "C003",
    clientName: "Naomi K.",
    symbol: "GRZ-TB-91",
    assetClass: "TBILL",
    side: "BUY",
    quantity: 1_000,
    priceNgwee: 9_750,
    counterparty: "Bank of Zambia",
    clientRef: "ORD-24884",
    tradeDate: "2026-05-28",
    track: "FAST",
    failMode: null,
  },
  // Batch dated 2026-05-29 (today), settles 2026-06-01 (after one advance).
  {
    id: "T-105",
    clientId: "C001",
    clientName: "Chanda M.",
    symbol: "CEC",
    assetClass: "EQUITY",
    side: "BUY",
    quantity: 500,
    priceNgwee: 14_500,
    counterparty: "Pangaea Securities",
    clientRef: "ORD-24891",
    tradeDate: "2026-05-29",
    track: "FAST",
    failMode: null,
  },
  {
    id: "T-106",
    clientId: "C005",
    clientName: "Temba P.",
    symbol: "ZANACO",
    assetClass: "EQUITY",
    side: "SELL",
    quantity: 20_000,
    priceNgwee: 680,
    counterparty: "SBZ Securities",
    clientRef: "ORD-24892",
    tradeDate: "2026-05-29",
    track: "MID",
    failMode: null,
  },
  {
    id: "T-107",
    clientId: "C002",
    clientName: "Mutale B.",
    symbol: "ZAMBEEF",
    assetClass: "EQUITY",
    side: "BUY",
    quantity: 25_000,
    priceNgwee: 390,
    counterparty: "Intermarket Securities",
    clientRef: "ORD-24893",
    tradeDate: "2026-05-29",
    track: "SLOW",
    failMode: null,
  },
  {
    id: "T-108",
    clientId: "C004",
    clientName: "Kafue Traders Ltd",
    symbol: "CHIL",
    assetClass: "EQUITY",
    side: "SELL",
    quantity: 1_500,
    priceNgwee: 6_500,
    counterparty: "Madison Asset",
    clientRef: "ORD-24894",
    tradeDate: "2026-05-29",
    track: "MID",
    failMode: "UNCONFIRMED_POSITION",
  },
  {
    id: "T-109",
    clientId: "C003",
    clientName: "Naomi K.",
    symbol: "GRZ-TB-364",
    assetClass: "TBILL",
    side: "BUY",
    quantity: 800,
    priceNgwee: 8_700,
    counterparty: "Bank of Zambia",
    clientRef: "ORD-24895",
    tradeDate: "2026-05-29",
    track: "FAST",
    failMode: null,
  },
  {
    id: "T-110",
    clientId: "C001",
    clientName: "Chanda M.",
    symbol: "PUMA",
    assetClass: "EQUITY",
    side: "BUY",
    quantity: 3_000,
    priceNgwee: 4_100,
    counterparty: "Pangaea Securities",
    clientRef: "ORD-24896",
    tradeDate: "2026-05-29",
    track: "MID",
    failMode: null,
  },
  {
    id: "T-111",
    clientId: "C005",
    clientName: "Temba P.",
    symbol: "BATZ",
    assetClass: "EQUITY",
    side: "BUY",
    quantity: 200,
    priceNgwee: 22_500,
    counterparty: "Stockbrokers Zambia",
    clientRef: "ORD-24897",
    tradeDate: "2026-05-29",
    track: "SLOW",
    failMode: null,
  },
  {
    id: "T-112",
    clientId: "C002",
    clientName: "Mutale B.",
    symbol: "GRZ-TB-273",
    assetClass: "TBILL",
    side: "SELL",
    quantity: 500,
    priceNgwee: 9_100,
    counterparty: "Bank of Zambia",
    clientRef: "ORD-24898",
    tradeDate: "2026-05-29",
    track: "FAST",
    failMode: null,
  },
  // Future-dated order, starts NEW and settles after two advances.
  {
    id: "T-113",
    clientId: "C003",
    clientName: "Naomi K.",
    symbol: "SCBL",
    assetClass: "EQUITY",
    side: "BUY",
    quantity: 1_000,
    priceNgwee: 5_200,
    counterparty: "Stockbrokers Zambia",
    clientRef: "ORD-24905",
    tradeDate: "2026-06-01",
    track: "MID",
    failMode: null,
  },
];

/** Pre-settlement lifecycle state implied by a trade's clearing track. */
function preSettlementState(track: ClearTrack): TradeState {
  switch (track) {
    case "FAST":
      return "CLEARING";
    case "MID":
      return "CONFIRMED";
    case "SLOW":
      return "EXECUTED";
  }
}

/** Build a deterministic execution timestamp from the trade date and id. */
function executionTimestamp(seed: TradeSeed): IsoTimestamp {
  const minute = (Number(seed.id.replace("T-", "")) % 50) + 5;
  const mm = String(minute).padStart(2, "0");
  return `${seed.tradeDate}T08:${mm}:00.000Z`;
}

/**
 * Derive the current lifecycle state of a seed trade for a business date.
 * Pure: identical (seed, currentDate) inputs always yield the same state.
 */
export function deriveTradeState(
  seed: TradeSeed,
  currentDate: IsoDate
): TradeState {
  if (currentDate < seed.tradeDate) return "NEW";
  const settlementDate = nextSettlementDate(seed.tradeDate);
  if (isSettlementDue(settlementDate, currentDate)) {
    return seed.failMode ? "FAILED" : "SETTLED";
  }
  return preSettlementState(seed.track);
}

/** Materialise a single Trade record for the given business date. */
function buildTrade(seed: TradeSeed, currentDate: IsoDate): Trade {
  const grossNgwee = seed.quantity * seed.priceNgwee;
  const fees = computeTradeFees(grossNgwee, seed.assetClass);
  const feesNgwee = fees.totalNgwee;
  const netNgwee =
    seed.side === "BUY" ? grossNgwee + feesNgwee : grossNgwee - feesNgwee;
  const settlementDate = nextSettlementDate(seed.tradeDate);
  const state = deriveTradeState(seed, currentDate);
  const executedAt = state === "NEW" ? null : executionTimestamp(seed);
  const settledAt =
    state === "SETTLED" ? `${settlementDate}T11:00:00.000Z` : null;
  const failReason =
    state === "FAILED" && seed.failMode ? FAIL_REASONS[seed.failMode] : null;

  return {
    id: seed.id,
    tenantId: TENANT_ID,
    clientId: seed.clientId,
    clientName: seed.clientName,
    symbol: seed.symbol,
    assetClass: seed.assetClass,
    side: seed.side,
    quantity: seed.quantity,
    priceNgwee: seed.priceNgwee,
    grossNgwee,
    feesNgwee,
    netNgwee,
    state,
    counterparty: seed.counterparty,
    tradeDate: seed.tradeDate,
    settlementDate,
    executedAt,
    settledAt,
    failReason,
  };
}

/** The whole blotter, evaluated for a business date. */
export function listTrades(currentDate: IsoDate): Trade[] {
  return TRADE_SEEDS.map((seed) => buildTrade(seed, currentDate));
}

/** Trades grouped by lifecycle state, in board display order. */
export const TRADE_STATE_ORDER: readonly TradeState[] = [
  "NEW",
  "EXECUTED",
  "CONFIRMED",
  "CLEARING",
  "SETTLED",
  "FAILED",
] as const;

export type TradesByState = Record<TradeState, Trade[]>;

export function groupTradesByState(
  currentDate: IsoDate,
  extraTrades: Trade[] = []
): TradesByState {
  const groups: TradesByState = {
    NEW: [],
    EXECUTED: [],
    CONFIRMED: [],
    CLEARING: [],
    SETTLED: [],
    FAILED: [],
  };
  const all = extraTrades.length
    ? [...listTrades(currentDate), ...extraTrades]
    : listTrades(currentDate);
  for (const trade of all) {
    groups[trade.state].push(trade);
  }
  return groups;
}

/** Trades currently in the FAILED state, for the fail queue. */
export function listFailedTrades(currentDate: IsoDate): Trade[] {
  return listTrades(currentDate).filter((t) => t.state === "FAILED");
}

/** Trades that have reached SETTLED, used by the ledger and fee engines. */
export function listSettledTrades(currentDate: IsoDate): Trade[] {
  return listTrades(currentDate).filter((t) => t.state === "SETTLED");
}

/** Look up a single trade for a business date. */
export function getTrade(id: string, currentDate: IsoDate): Trade | undefined {
  return listTrades(currentDate).find((t) => t.id === id);
}

/** Distinct clients on the blotter, for sub-ledger and KYC cross-reference. */
export function listClients(): { clientId: string; clientName: string }[] {
  const seen = new Map<string, string>();
  for (const seed of TRADE_SEEDS) {
    if (!seen.has(seed.clientId)) seen.set(seed.clientId, seed.clientName);
  }
  return [...seen.entries()].map(([clientId, clientName]) => ({
    clientId,
    clientName,
  }));
}
