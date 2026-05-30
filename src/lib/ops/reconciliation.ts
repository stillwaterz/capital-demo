/**
 * Reconciliation engine.
 *
 * Three reconciliations: cash (settlement bank and mobile money statement
 * versus ledger), position (CSD register versus internal stock records) and
 * float (rail statements versus treasury float). Each produces a small set of
 * breaks with plausible causes, tied to the live settlement fails so the demo
 * stays coherent. Pure selectors over the ledger, trades and treasury. Money is
 * integer ngwee; position values are in units.
 */

import type {
  BreakStatus,
  IsoDate,
  IsoTimestamp,
  Ngwee,
  ReconBreak,
  ReconType,
} from "./types";
import { accountBalanceNgwee } from "./ledger";
import { listFailedTrades, listSettledTrades } from "./trades";
import { listFloatAccounts } from "./treasury";

const TENANT_ID = "capital-demo";

function makeBreak(input: {
  id: string;
  type: ReconType;
  label: string;
  internalValue: number;
  externalValue: number;
  status: BreakStatus;
  cause: string;
  detectedAt: IsoTimestamp;
}): ReconBreak {
  return {
    id: input.id,
    tenantId: TENANT_ID,
    type: input.type,
    label: input.label,
    internalValue: input.internalValue,
    externalValue: input.externalValue,
    differenceValue: input.internalValue - input.externalValue,
    status: input.status,
    cause: input.cause,
    detectedAt: input.detectedAt,
    resolvedAt: null,
  };
}

// ---------------------------------------------------------------------------
// Cash reconciliation
// ---------------------------------------------------------------------------

export type CashRecon = {
  /** Ledger settlement-bank balance, in ngwee. */
  internalNgwee: Ngwee;
  /** Settlement bank statement balance, in ngwee. */
  externalNgwee: Ngwee;
  breaks: ReconBreak[];
};

/**
 * Cash recon. The settlement bank ties to the ledger; the breaks come from
 * settlement fails where the client cash leg did not arrive.
 */
export function cashRecon(currentDate: IsoDate): CashRecon {
  const internalNgwee = accountBalanceNgwee("SETTLEMENT", currentDate);
  const breaks: ReconBreak[] = [];

  for (const trade of listFailedTrades(currentDate)) {
    const isCash = (trade.failReason ?? "").toLowerCase().includes("cash");
    if (!isCash) continue;
    breaks.push(
      makeBreak({
        id: `BRK-CASH-${trade.id}`,
        type: "CASH",
        label: `${trade.clientName} cash short on ${trade.symbol} settlement`,
        internalValue: trade.netNgwee,
        externalValue: 0,
        status: "OPEN",
        cause: "Client deposit not received before the settlement cut-off",
        detectedAt: `${trade.settlementDate}T11:10:00.000Z`,
      })
    );
  }

  // The bank statement equals the ledger plus any cash that failed to move.
  const externalNgwee =
    internalNgwee + breaks.reduce((s, b) => s + b.differenceValue, 0);

  return { internalNgwee, externalNgwee, breaks };
}

// ---------------------------------------------------------------------------
// Position reconciliation
// ---------------------------------------------------------------------------

export type PositionReconRow = {
  symbol: string;
  /** Internal stock-record units. */
  internalUnits: number;
  /** CSD register units. */
  externalUnits: number;
  matched: boolean;
};

export type PositionRecon = {
  rows: PositionReconRow[];
  breaks: ReconBreak[];
};

/** Net settled position units per symbol from the blotter. */
function internalPositions(currentDate: IsoDate): Map<string, number> {
  const positions = new Map<string, number>();
  for (const trade of listSettledTrades(currentDate)) {
    const delta = trade.side === "BUY" ? trade.quantity : -trade.quantity;
    positions.set(trade.symbol, (positions.get(trade.symbol) ?? 0) + delta);
  }
  return positions;
}

/**
 * Position recon. Settled positions match the CSD; an unconfirmed-position fail
 * shows as a short delivery the CSD has not booked.
 */
export function positionRecon(currentDate: IsoDate): PositionRecon {
  const internal = internalPositions(currentDate);
  const breaks: ReconBreak[] = [];
  const rows: PositionReconRow[] = [];

  for (const [symbol, internalUnits] of internal.entries()) {
    rows.push({ symbol, internalUnits, externalUnits: internalUnits, matched: true });
  }

  for (const trade of listFailedTrades(currentDate)) {
    const isPosition = (trade.failReason ?? "")
      .toLowerCase()
      .includes("position");
    if (!isPosition) continue;
    const internalUnits = trade.quantity;
    rows.push({
      symbol: trade.symbol,
      internalUnits,
      externalUnits: 0,
      matched: false,
    });
    breaks.push(
      makeBreak({
        id: `BRK-POS-${trade.id}`,
        type: "POSITION",
        label: `${trade.symbol} delivery unconfirmed at CSD`,
        internalValue: internalUnits,
        externalValue: 0,
        status: "INVESTIGATING",
        cause: "Counterparty CSD position not confirmed for the sell leg",
        detectedAt: `${trade.settlementDate}T11:12:00.000Z`,
      })
    );
  }

  return { rows: rows.sort((a, b) => a.symbol.localeCompare(b.symbol)), breaks };
}

// ---------------------------------------------------------------------------
// Float reconciliation
// ---------------------------------------------------------------------------

export type FloatReconRow = {
  rail: string;
  name: string;
  internalNgwee: Ngwee;
  externalNgwee: Ngwee;
  matched: boolean;
};

export type FloatRecon = {
  rows: FloatReconRow[];
  breaks: ReconBreak[];
};

/** Unbooked MoMo fees that knock the MTN float statement out by a few kwacha. */
const MTN_UNBOOKED_FEES_NGWEE: Ngwee = 5_500;

/**
 * Float recon. Rail statements tie to treasury float except MTN MoMo, where
 * transaction fees have not been booked yet.
 */
export function floatRecon(): FloatRecon {
  const rows: FloatReconRow[] = [];
  const breaks: ReconBreak[] = [];

  for (const account of listFloatAccounts()) {
    const isMtn = account.rail === "MTN";
    const externalNgwee = isMtn
      ? account.balanceNgwee - MTN_UNBOOKED_FEES_NGWEE
      : account.balanceNgwee;
    rows.push({
      rail: account.rail,
      name: account.name,
      internalNgwee: account.balanceNgwee,
      externalNgwee,
      matched: !isMtn,
    });
    if (isMtn) {
      breaks.push(
        makeBreak({
          id: "BRK-FLOAT-MTN",
          type: "FLOAT",
          label: "MTN MoMo float versus rail statement",
          internalValue: account.balanceNgwee,
          externalValue: externalNgwee,
          status: "INVESTIGATING",
          cause: "Mobile money transaction fees not yet booked to the ledger",
          detectedAt: "2026-05-29T07:30:00.000Z",
        })
      );
    }
  }

  return { rows, breaks };
}

// ---------------------------------------------------------------------------
// Aggregate
// ---------------------------------------------------------------------------

/** All reconciliation breaks for the business date, across the three types. */
export function listReconBreaks(currentDate: IsoDate): ReconBreak[] {
  return [
    ...cashRecon(currentDate).breaks,
    ...positionRecon(currentDate).breaks,
    ...floatRecon().breaks,
  ];
}

/** Breaks of a single type. */
export function listReconBreaksByType(
  type: ReconType,
  currentDate: IsoDate
): ReconBreak[] {
  return listReconBreaks(currentDate).filter((b) => b.type === type);
}

export type ReconSummary = {
  totalBreaks: number;
  openBreaks: number;
  investigatingBreaks: number;
  cashBreaks: number;
  positionBreaks: number;
  floatBreaks: number;
};

/** Headline reconciliation counters for the control tower. */
export function reconSummary(currentDate: IsoDate): ReconSummary {
  const breaks = listReconBreaks(currentDate);
  return {
    totalBreaks: breaks.length,
    openBreaks: breaks.filter((b) => b.status === "OPEN").length,
    investigatingBreaks: breaks.filter((b) => b.status === "INVESTIGATING").length,
    cashBreaks: breaks.filter((b) => b.type === "CASH").length,
    positionBreaks: breaks.filter((b) => b.type === "POSITION").length,
    floatBreaks: breaks.filter((b) => b.type === "FLOAT").length,
  };
}
