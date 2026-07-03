/**
 * Adapter port definitions.
 *
 * Everything above these ports is identical across modes (BUILD_SPEC section 2).
 * The mode flag chooses which set of bindings implements them: mock in demo,
 * real rails in production. Later phase tasks flesh these out. Phase 1 task 1
 * only fixes the shapes and wires the mock bindings.
 *
 * All money is integer ngwee. All timestamps are ISO 8601 strings. Money and
 * order operations carry an idempotency key so a retry runs once.
 */

import type {
  AssetClass,
  IsoDate,
  IsoTimestamp,
  KycTier,
  Ngwee,
  Side,
} from "@/lib/ops/types";

// ---------------------------------------------------------------------------
// MarketData: LuSE prices. Mock reads the seeded instruments.
// ---------------------------------------------------------------------------

export type Quote = {
  symbol: string;
  lastPriceNgwee: Ngwee;
  changePercent: number;
  asOf: IsoTimestamp;
};

export type MarketDataAdapter = {
  /** Latest quote for one symbol, or null when the symbol is unknown. */
  getQuote(symbol: string): Promise<Quote | null>;
  /** Latest quotes for every tradable counter. */
  listQuotes(): Promise<Quote[]>;
  /** Closing prices for the last N sessions, oldest first, in ngwee. */
  getPriceHistory(symbol: string, days: number): Promise<Ngwee[]>;
};

// ---------------------------------------------------------------------------
// Kyc: identity, liveness, AML and PEP. Mock passes everyone at light tier.
// ---------------------------------------------------------------------------

export type IdDocumentType = "nrc" | "passport";

export type KycCheckOutcome = "pass" | "refer" | "fail";

export type KycScreeningResult = {
  outcome: KycCheckOutcome;
  /** Machine-readable reason codes, empty on a clean pass. */
  reasonCodes: string[];
  /** Tier the applicant qualifies for on this result. */
  grantedTier: KycTier;
  /** Provider or stub reference for the audit trail. */
  providerRef: string;
  checkedAt: IsoTimestamp;
};

export type KycApplicant = {
  fullName: string;
  idType: IdDocumentType;
  idNumber: string;
  /** Mobile money number used for MNO identity match. */
  mobileNumber: string;
};

export type KycAdapter = {
  /** Extract, verify identity, run liveness, screen against AML and PEP lists. */
  screen(applicant: KycApplicant): Promise<KycScreeningResult>;
};

// ---------------------------------------------------------------------------
// Payments: deposits and withdrawals. Mock moves money instantly.
// ---------------------------------------------------------------------------

export type PaymentChannel = "momo" | "bank";

export type PaymentStatus = "pending" | "settled" | "failed";

export type PaymentRequest = {
  accountId: string;
  channel: PaymentChannel;
  amountNgwee: Ngwee;
  /** Client-side reference for the payer account, in the client's own name. */
  methodRef: string;
  /** Retrying with the same key never moves money twice. */
  idempotencyKey: string;
};

export type PaymentResult = {
  providerRef: string;
  status: PaymentStatus;
  amountNgwee: Ngwee;
  at: IsoTimestamp;
};

export type PaymentsAdapter = {
  /** Pull funds in from a mobile money or bank rail. */
  deposit(request: PaymentRequest): Promise<PaymentResult>;
  /** Push funds out to a verified payout method in the client's own name. */
  withdraw(request: PaymentRequest): Promise<PaymentResult>;
};

// ---------------------------------------------------------------------------
// Execution: staging into the market. Mock auto-fills after a delay.
// ---------------------------------------------------------------------------

export type ExecutionStatus =
  | "queued"
  | "working"
  | "filled"
  | "rejected"
  | "cancelled";

export type ExecutionRequest = {
  orderId: string;
  symbol: string;
  side: Side;
  quantity: number;
  /** Limit price in ngwee, or null for a market order. */
  limitPriceNgwee: Ngwee | null;
  /** Retrying with the same key never double-fills. */
  idempotencyKey: string;
};

export type ExecutionResult = {
  orderId: string;
  status: ExecutionStatus;
  /** Filled quantity so far, 0 until a fill lands. */
  filledQty: number;
  /** Average fill price in ngwee, or null before any fill. */
  fillPriceNgwee: Ngwee | null;
  /** ATS or stub confirmation reference once released. */
  atsRef: string | null;
  at: IsoTimestamp;
};

export type ExecutionAdapter = {
  /** Stage an order for release. Real path enters the operator queue. */
  submit(request: ExecutionRequest): Promise<ExecutionResult>;
  /** Current execution state for a staged order. */
  getStatus(orderId: string): Promise<ExecutionResult | null>;
  /** Cancel while unfilled. Returns the resulting state. */
  cancel(orderId: string): Promise<ExecutionResult>;
};

// ---------------------------------------------------------------------------
// Settlement: the T+n cycle. Mock settles both legs on the cycle date.
// ---------------------------------------------------------------------------

export type SettlementLegStatus = "pending" | "settled" | "failed";

export type SettlementInstruction = {
  executionId: string;
  accountId: string;
  symbol: string;
  side: Side;
  assetClass: AssetClass;
  quantity: number;
  /** Cash leg amount in ngwee. */
  cashNgwee: Ngwee;
  tradeDate: IsoDate;
};

export type SettlementRecord = {
  executionId: string;
  /** Config-driven cycle length, T+cycleDays. */
  cycleDays: number;
  tradeDate: IsoDate;
  settlementDate: IsoDate;
  cashLegStatus: SettlementLegStatus;
  stockLegStatus: SettlementLegStatus;
};

export type SettlementAdapter = {
  /** Register a filled execution into the settlement cycle. */
  instruct(instruction: SettlementInstruction): Promise<SettlementRecord>;
  /** Current settlement state for an execution. */
  getStatus(executionId: string): Promise<SettlementRecord | null>;
};

// ---------------------------------------------------------------------------
// The full adapter set resolved for a mode.
// ---------------------------------------------------------------------------

export type Adapters = {
  marketData: MarketDataAdapter;
  kyc: KycAdapter;
  payments: PaymentsAdapter;
  execution: ExecutionAdapter;
  settlement: SettlementAdapter;
};
