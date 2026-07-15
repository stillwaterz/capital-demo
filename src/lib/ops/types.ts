/**
 * Shared back-office domain types for the operations console.
 *
 * Conventions enforced across every ops engine:
 * - All money is integer ngwee (the smallest unit of ZMW). Never a float.
 * - All dates and times are ISO 8601 strings (UTC stored, rendered in user tz).
 * - Enums are expressed as string literal unions, never TypeScript enums.
 *
 * Downstream workers import the types they need from this file and add their
 * own engine modules. They should not edit this file.
 */

// ---------------------------------------------------------------------------
// Primitives
// ---------------------------------------------------------------------------

/** Integer amount in ngwee (1 ZMW = 100 ngwee). */
export type Ngwee = number;

/** ISO 8601 timestamp string, for example "2026-05-30T09:00:00.000Z". */
export type IsoTimestamp = string;

/** ISO calendar date string, for example "2026-05-30". */
export type IsoDate = string;

// ---------------------------------------------------------------------------
// Trades and settlement
// ---------------------------------------------------------------------------

export type AssetClass = "EQUITY" | "BOND";

export type Side = "BUY" | "SELL";

export type TradeState =
  | "NEW"
  | "EXECUTED"
  | "CONFIRMED"
  | "CLEARING"
  | "SETTLED"
  | "FAILED";

export type Trade = {
  id: string;
  tenantId: string;
  clientId: string;
  clientName: string;
  symbol: string;
  assetClass: AssetClass;
  side: Side;
  quantity: number;
  /** Price per unit in ngwee. */
  priceNgwee: Ngwee;
  /** quantity * price, in ngwee. */
  grossNgwee: Ngwee;
  /** Total fees applied to the trade, in ngwee. */
  feesNgwee: Ngwee;
  /** Net consideration after fees, in ngwee. */
  netNgwee: Ngwee;
  state: TradeState;
  counterparty: string;
  tradeDate: IsoDate;
  settlementDate: IsoDate;
  executedAt: IsoTimestamp | null;
  settledAt: IsoTimestamp | null;
  /** Populated when state is FAILED. */
  failReason: string | null;
};

export type SettlementStatus = "PENDING" | "SETTLED" | "PARTIAL" | "FAILED";

export type SettlementBatch = {
  id: string;
  tenantId: string;
  settlementDate: IsoDate;
  tradeIds: string[];
  status: SettlementStatus;
  /** Net cash to move on the cash leg, in ngwee. */
  netCashNgwee: Ngwee;
  /** Net position units to move on the security leg. */
  netPositionUnits: number;
  createdAt: IsoTimestamp;
  settledAt: IsoTimestamp | null;
};

// ---------------------------------------------------------------------------
// Chart of accounts and double-entry ledger
// ---------------------------------------------------------------------------

export type AccountId =
  | "CLIENT_CASH"
  | "HOUSE_CASH"
  | "SETTLEMENT"
  | "CSD_POSITION"
  | "FEES_INCOME"
  | "WHT_PAYABLE"
  | "SUSPENSE"
  | "BROKERAGE_RECEIVABLE";

export type NormalBalance = "DEBIT" | "CREDIT";

export type AccountType = "ASSET" | "LIABILITY" | "EQUITY" | "INCOME" | "EXPENSE";

export type Account = {
  id: AccountId;
  name: string;
  type: AccountType;
  normalBalance: NormalBalance;
  /** True for client-money accounts that must stay segregated from house money. */
  isClientMoney: boolean;
};

export type JournalLine = {
  accountId: AccountId;
  /** Debit amount in ngwee. Exactly one of debit or credit is non-zero. */
  debitNgwee: Ngwee;
  /** Credit amount in ngwee. Exactly one of debit or credit is non-zero. */
  creditNgwee: Ngwee;
  /** Optional client sub-ledger reference for segregation views. */
  clientId?: string;
};

export type JournalEntry = {
  id: string;
  tenantId: string;
  date: IsoDate;
  postedAt: IsoTimestamp;
  /** Plain English description of the economic event. */
  memo: string;
  /** Source event reference, for example a trade id or corporate action id. */
  sourceRef: string | null;
  lines: JournalLine[];
};

export type TrialBalanceRow = {
  accountId: AccountId;
  accountName: string;
  normalBalance: NormalBalance;
  totalDebitNgwee: Ngwee;
  totalCreditNgwee: Ngwee;
  /** Net balance in ngwee, signed to the account normal balance. */
  balanceNgwee: Ngwee;
};

// ---------------------------------------------------------------------------
// Reconciliation
// ---------------------------------------------------------------------------

export type ReconType = "CASH" | "POSITION" | "FLOAT";

export type BreakStatus = "OPEN" | "INVESTIGATING" | "RESOLVED" | "WRITTEN_OFF";

export type ReconBreak = {
  id: string;
  tenantId: string;
  type: ReconType;
  /** Plain English label of what failed to match. */
  label: string;
  /** Internal/ledger figure in ngwee (or units for POSITION breaks). */
  internalValue: number;
  /** External statement figure in ngwee (or units for POSITION breaks). */
  externalValue: number;
  /** internalValue - externalValue. */
  differenceValue: number;
  status: BreakStatus;
  cause: string | null;
  detectedAt: IsoTimestamp;
  resolvedAt: IsoTimestamp | null;
};

// ---------------------------------------------------------------------------
// Treasury, float and FX
// ---------------------------------------------------------------------------

export type Rail =
  | "AIRTEL"
  | "MTN"
  | "FNB"
  | "ZANACO"
  | "STANBIC"
  | "SETTLEMENT";

export type FloatAccount = {
  id: string;
  tenantId: string;
  rail: Rail;
  name: string;
  balanceNgwee: Ngwee;
  /** Minimum balance to keep available, in ngwee. */
  minBufferNgwee: Ngwee;
  updatedAt: IsoTimestamp;
};

export type FxRate = {
  id: string;
  base: string;
  quote: string;
  /** Units of quote per 1 unit of base, scaled by 1e6 to stay integer. */
  rateMicros: number;
  asOf: IsoTimestamp;
};

// ---------------------------------------------------------------------------
// Corporate actions
// ---------------------------------------------------------------------------

export type CorporateActionType = "DIVIDEND" | "COUPON" | "MATURITY";

export type CorporateActionStatus = "SCHEDULED" | "PROCESSED" | "FAILED";

export type CorporateAction = {
  id: string;
  tenantId: string;
  type: CorporateActionType;
  symbol: string;
  assetClass: AssetClass;
  exDate: IsoDate;
  payDate: IsoDate;
  /** Cash amount per unit held, in ngwee (dividend, coupon, maturity proceeds). */
  perUnitNgwee: Ngwee;
  /** Total cash impact across all holders, in ngwee. */
  totalNgwee: Ngwee;
  status: CorporateActionStatus;
  /** For MATURITY, the new instrument proceeds may roll into, if any. */
  rolledIntoSymbol: string | null;
};

// ---------------------------------------------------------------------------
// Fees and tax
// ---------------------------------------------------------------------------

export type FeeType = "BROKERAGE" | "LEVY" | "CSD" | "WHT";

export type FeeRun = {
  id: string;
  tenantId: string;
  date: IsoDate;
  type: FeeType;
  /** Number of trades or events in the run. */
  itemCount: number;
  /** Total fee captured, in ngwee. */
  totalNgwee: Ngwee;
  postedToLedger: boolean;
};

export type RemittanceStatus = "DUE" | "REMITTED" | "OVERDUE";

export type WhtRemittance = {
  id: string;
  tenantId: string;
  period: string;
  /** Withholding tax collected and payable to ZRA, in ngwee. */
  amountNgwee: Ngwee;
  dueDate: IsoDate;
  status: RemittanceStatus;
  remittedAt: IsoTimestamp | null;
};

// ---------------------------------------------------------------------------
// Compliance, AML and STR
// ---------------------------------------------------------------------------

export type AlertType =
  | "THRESHOLD"
  | "VELOCITY"
  | "STRUCTURING"
  | "SANCTIONS"
  | "PEP";

export type AlertSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type AlertStatus = "OPEN" | "REVIEWING" | "CLEARED" | "ESCALATED";

export type ComplianceAlert = {
  id: string;
  tenantId: string;
  type: AlertType;
  severity: AlertSeverity;
  clientId: string;
  clientName: string;
  /** Plain English description of why the alert fired. */
  description: string;
  /** Amount that triggered the alert, in ngwee, when relevant. */
  amountNgwee: Ngwee | null;
  status: AlertStatus;
  raisedAt: IsoTimestamp;
};

export type StrStatus = "DRAFT" | "FILED" | "ACKNOWLEDGED";

export type StrCase = {
  id: string;
  tenantId: string;
  clientId: string;
  clientName: string;
  /** Source alert ids that built this case. */
  alertIds: string[];
  /** Narrative drafted for the suspicious transaction report. */
  narrative: string;
  status: StrStatus;
  openedAt: IsoTimestamp;
  filedAt: IsoTimestamp | null;
};

// ---------------------------------------------------------------------------
// KYC operations
// ---------------------------------------------------------------------------

export type KycTier = "TIER_0" | "TIER_1" | "TIER_2";

export type KycStatus =
  | "PENDING"
  | "IN_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "REFRESH_DUE";

export type KycReviewItem = {
  id: string;
  tenantId: string;
  clientId: string;
  clientName: string;
  currentTier: KycTier;
  requestedTier: KycTier;
  status: KycStatus;
  /** Plain English note on what documents or checks are outstanding. */
  note: string;
  submittedAt: IsoTimestamp;
  reviewedAt: IsoTimestamp | null;
};

// ---------------------------------------------------------------------------
// Risk
// ---------------------------------------------------------------------------

export type RiskLimitType = "POSITION" | "CONCENTRATION" | "EXPOSURE" | "VAR";

export type RiskLimit = {
  id: string;
  tenantId: string;
  type: RiskLimitType;
  /** Plain English label, for example "Single name concentration". */
  label: string;
  /** Limit value in ngwee, or basis points for concentration. */
  limitValue: number;
  /** Current value against the limit, same unit as limitValue. */
  currentValue: number;
  breached: boolean;
};

export type ExposureRow = {
  symbol: string;
  assetClass: AssetClass;
  /** Net exposure in ngwee. */
  exposureNgwee: Ngwee;
  /** Share of total book in basis points. */
  shareBps: number;
};

// ---------------------------------------------------------------------------
// Regulatory reporting
// ---------------------------------------------------------------------------

export type RegBody = "SEC" | "BOZ" | "FIC" | "LUSE";

export type ReportStatus = "DRAFT" | "DUE" | "SUBMITTED" | "ACCEPTED" | "OVERDUE";

export type RegReport = {
  id: string;
  tenantId: string;
  body: RegBody;
  /** Plain English name of the return, for example "Monthly capital adequacy". */
  name: string;
  period: string;
  dueDate: IsoDate;
  status: ReportStatus;
  submittedAt: IsoTimestamp | null;
};

// ---------------------------------------------------------------------------
// Governance: maker-checker, proposals, audit
// ---------------------------------------------------------------------------

export type ProposalKind =
  | "SETTLE_FAIL"
  | "RELEASE_BREAK"
  | "FILE_STR"
  | "TIER_UPGRADE"
  | "REMIT_WHT"
  | "FUND_FLOAT"
  | "KILL_SWITCH";

export type ProposalStatus = "PENDING" | "APPROVED" | "REJECTED";

export type Proposal = {
  id: string;
  tenantId: string;
  kind: ProposalKind;
  /** Plain English summary of the proposed action. */
  summary: string;
  /** The subsystem entity this proposal acts on, for example a trade or break id. */
  targetRef: string;
  /** Whether the deterministic guardrail check passed. */
  guardrailPassed: boolean;
  /** Plain English guardrail finding shown to the checker. */
  guardrailNote: string;
  status: ProposalStatus;
  /** AI or staff member who proposed the action. */
  proposedBy: string;
  proposedAt: IsoTimestamp;
  decidedBy: string | null;
  decidedAt: IsoTimestamp | null;
};

export type AuditEvent = {
  id: string;
  tenantId: string;
  /** Plain English action label, for example "Approved settlement fail fix". */
  action: string;
  actor: string;
  actorRole: StaffRole;
  /** Entity the action touched, for example a proposal or trade id. */
  targetRef: string | null;
  at: IsoTimestamp;
};

// ---------------------------------------------------------------------------
// RBAC
// ---------------------------------------------------------------------------

export type StaffRole = "OPS" | "COMPLIANCE" | "TREASURY" | "RISK" | "ADMIN";
