/**
 * Corporate actions engine.
 *
 * Dividend runs and bond coupon events. Each action carries its cash impact,
 * withholding tax and net wallet credit so the ledger and the fees register can
 * post from a single source. Money is integer ngwee.
 */

import type {
  CorporateAction,
  CorporateActionStatus,
  CorporateActionType,
  IsoDate,
  Ngwee,
} from "./types";
import { isSettlementDue } from "./clock";
import { ngweeBps, WHT_BPS } from "./trades";

const TENANT_ID = "capital-demo";

type CorporateActionSeed = {
  id: string;
  type: CorporateActionType;
  symbol: string;
  assetClass: CorporateAction["assetClass"];
  clientId: string;
  clientName: string;
  /** Units of the instrument held by the client at the ex date. */
  unitsHeld: number;
  perUnitNgwee: Ngwee;
  exDate: IsoDate;
  payDate: IsoDate;
  /** For MATURITY, the fresh instrument proceeds roll into, if any. */
  rolledIntoSymbol: string | null;
};

/**
 * Deterministic corporate-action calendar anchored on the demo clock.
 *
 * The 2026-05-29 dividend is already processed at start. The 2026-06-01 events
 * (dividend and coupon) process on the first "Advance to T+1", showing wallet
 * credits.
 */
const CA_SEEDS: readonly CorporateActionSeed[] = [
  {
    id: "CA-301",
    type: "DIVIDEND",
    symbol: "ZAMBEEF",
    assetClass: "EQUITY",
    clientId: "C001",
    clientName: "Chanda M.",
    unitsHeld: 10_000,
    perUnitNgwee: 12,
    exDate: "2026-05-27",
    payDate: "2026-05-29",
    rolledIntoSymbol: null,
  },
  {
    id: "CA-302",
    type: "DIVIDEND",
    symbol: "ATEL",
    assetClass: "EQUITY",
    clientId: "C001",
    clientName: "Chanda M.",
    unitsHeld: 30_000,
    perUnitNgwee: 85,
    exDate: "2026-05-29",
    payDate: "2026-06-01",
    rolledIntoSymbol: null,
  },
  {
    id: "CA-303",
    type: "DIVIDEND",
    symbol: "CEC",
    assetClass: "EQUITY",
    clientId: "C001",
    clientName: "Chanda M.",
    unitsHeld: 2_500,
    perUnitNgwee: 150,
    exDate: "2026-06-01",
    payDate: "2026-06-02",
    rolledIntoSymbol: null,
  },
  {
    id: "CA-304",
    type: "COUPON",
    symbol: "GRZ-BOND-3Y",
    assetClass: "BOND",
    clientId: "C003",
    clientName: "Naomi K.",
    unitsHeld: 2_000,
    perUnitNgwee: 65,
    exDate: "2026-05-28",
    payDate: "2026-06-01",
    rolledIntoSymbol: null,
  },
];

/** Withholding tax applies to income events (dividends and coupons) only. */
function whtApplies(type: CorporateActionType): boolean {
  return type === "DIVIDEND" || type === "COUPON";
}

/**
 * A corporate action enriched with the holder, the gross and net cash, and any
 * withholding tax. The base CorporateAction fields stay intact; the extra
 * fields are this module's own composition.
 */
export type CorporateActionView = CorporateAction & {
  clientId: string;
  clientName: string;
  unitsHeld: number;
  /** Gross cash before tax, in ngwee (same as totalNgwee for income events). */
  grossNgwee: Ngwee;
  /** Withholding tax captured for ZRA, in ngwee. */
  whtNgwee: Ngwee;
  /** Net cash credited to the client wallet or reinvested, in ngwee. */
  netNgwee: Ngwee;
  /** True once the pay date has been reached by the business clock. */
  isCashToClient: boolean;
};

function statusFor(
  seed: CorporateActionSeed,
  currentDate: IsoDate
): CorporateActionStatus {
  return isSettlementDue(seed.payDate, currentDate) ? "PROCESSED" : "SCHEDULED";
}

function buildView(
  seed: CorporateActionSeed,
  currentDate: IsoDate
): CorporateActionView {
  const grossNgwee = seed.unitsHeld * seed.perUnitNgwee;
  const whtNgwee = whtApplies(seed.type) ? ngweeBps(grossNgwee, WHT_BPS) : 0;
  const netNgwee = grossNgwee - whtNgwee;
  return {
    id: seed.id,
    tenantId: TENANT_ID,
    type: seed.type,
    symbol: seed.symbol,
    assetClass: seed.assetClass,
    exDate: seed.exDate,
    payDate: seed.payDate,
    perUnitNgwee: seed.perUnitNgwee,
    totalNgwee: grossNgwee,
    status: statusFor(seed, currentDate),
    rolledIntoSymbol: seed.rolledIntoSymbol,
    clientId: seed.clientId,
    clientName: seed.clientName,
    unitsHeld: seed.unitsHeld,
    grossNgwee,
    whtNgwee,
    netNgwee,
    isCashToClient: true,
  };
}

/** The full corporate-action calendar evaluated for a business date. */
export function listCorporateActions(
  currentDate: IsoDate
): CorporateActionView[] {
  return CA_SEEDS.map((seed) => buildView(seed, currentDate)).sort((a, b) =>
    a.payDate < b.payDate ? -1 : 1
  );
}

/** Actions whose pay date has arrived, ready to post to the ledger. */
export function listProcessedActions(
  currentDate: IsoDate
): CorporateActionView[] {
  return listCorporateActions(currentDate).filter(
    (a) => a.status === "PROCESSED"
  );
}

/** Actions still ahead of the clock. */
export function listScheduledActions(
  currentDate: IsoDate
): CorporateActionView[] {
  return listCorporateActions(currentDate).filter(
    (a) => a.status === "SCHEDULED"
  );
}

/** Total withholding tax captured from processed actions, for the WHT register. */
export function totalWhtWithheldNgwee(currentDate: IsoDate): Ngwee {
  return listProcessedActions(currentDate).reduce(
    (sum, a) => sum + a.whtNgwee,
    0
  );
}

export type CorporateActionSummary = {
  scheduledCount: number;
  processedCount: number;
  /** Net cash credited to clients from processed actions, in ngwee. */
  clientCreditsNgwee: Ngwee;
  whtWithheldNgwee: Ngwee;
};

export function corporateActionSummary(
  currentDate: IsoDate
): CorporateActionSummary {
  const processed = listProcessedActions(currentDate);
  return {
    scheduledCount: listScheduledActions(currentDate).length,
    processedCount: processed.length,
    clientCreditsNgwee: processed
      .filter((a) => a.isCashToClient)
      .reduce((sum, a) => sum + a.netNgwee, 0),
    whtWithheldNgwee: processed.reduce((sum, a) => sum + a.whtNgwee, 0),
  };
}
