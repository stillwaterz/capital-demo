/**
 * TypeScript row shapes for the Supabase tables (see supabase/migrations).
 *
 * These mirror the SQL one-for-one. Money columns are integer ngwee. Timestamp
 * columns are ISO strings on the wire. Keep this in step with the migrations;
 * it is the typed contract the app and agents build against.
 */

import type { Ngwee, IsoTimestamp, IsoDate } from "@/lib/ops/types";

export type Uuid = string;

export type KycStatusRow =
  | "PENDING"
  | "IN_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "REFRESH_DUE";
export type KycTierRow = "TIER_0" | "TIER_1" | "TIER_2";

export type AccountRow = {
  id: Uuid;
  tenant_id: Uuid;
  auth_user_id: Uuid;
  full_name: string;
  kyc_status: KycStatusRow;
  tier: KycTierRow;
  csd_account_ref: string | null;
  suitability_profile: Record<string, unknown>;
  created_at: IsoTimestamp;
  updated_at: IsoTimestamp;
};

export type KycDocumentRow = {
  id: Uuid;
  tenant_id: Uuid;
  account_id: Uuid;
  type: "nrc" | "passport" | "proof_of_residence";
  storage_path: string;
  extraction: Record<string, unknown>;
  status: "PENDING" | "EXTRACTED" | "VERIFIED" | "REJECTED";
  created_at: IsoTimestamp;
  updated_at: IsoTimestamp;
};

export type KycCheckRow = {
  id: Uuid;
  tenant_id: Uuid;
  account_id: Uuid;
  channel: "mno" | "liveness" | "aml_pep";
  result: "pass" | "refer" | "fail";
  reason_codes: string[];
  raw_provider_ref: string | null;
  created_at: IsoTimestamp;
};

export type VerifiedPayoutMethodRow = {
  id: Uuid;
  tenant_id: Uuid;
  account_id: Uuid;
  channel: "momo" | "bank";
  account_ref: string;
  account_name: string;
  verified_at: IsoTimestamp | null;
  created_at: IsoTimestamp;
  updated_at: IsoTimestamp;
};

export type WalletRow = {
  id: Uuid;
  tenant_id: Uuid;
  account_id: Uuid;
  balance_ngwee: Ngwee;
  created_at: IsoTimestamp;
  updated_at: IsoTimestamp;
};

export type LedgerEntryType =
  | "deposit"
  | "withdrawal"
  | "trade_debit"
  | "trade_credit"
  | "commission"
  | "fee"
  | "interest";

export type LedgerEntryRow = {
  id: Uuid;
  tenant_id: Uuid;
  account_id: Uuid;
  type: LedgerEntryType;
  amount_ngwee: Ngwee;
  idempotency_key: string;
  related_ref: string | null;
  created_at: IsoTimestamp;
};

export type PaymentStatusRow = "pending" | "settled" | "failed";

export type DepositRow = {
  id: Uuid;
  tenant_id: Uuid;
  account_id: Uuid;
  channel: "momo" | "bank";
  amount_ngwee: Ngwee;
  provider_ref: string | null;
  status: PaymentStatusRow;
  idempotency_key: string;
  created_at: IsoTimestamp;
  updated_at: IsoTimestamp;
};

export type WithdrawalRow = {
  id: Uuid;
  tenant_id: Uuid;
  account_id: Uuid;
  payout_method_id: Uuid;
  amount_ngwee: Ngwee;
  provider_ref: string | null;
  status: PaymentStatusRow;
  idempotency_key: string;
  created_at: IsoTimestamp;
  updated_at: IsoTimestamp;
};

export type InstrumentRow = {
  id: Uuid;
  tenant_id: Uuid;
  symbol: string;
  name: string;
  board_lot: number;
  last_price_ngwee: Ngwee;
  tick_size_ngwee: Ngwee;
  status: "active" | "suspended" | "delisted";
  created_at: IsoTimestamp;
  updated_at: IsoTimestamp;
};

export type OrderStatusRow =
  | "draft"
  | "confirmed"
  | "cooling_off"
  | "queued"
  | "staged"
  | "working"
  | "partially_filled"
  | "filled"
  | "cancelled"
  | "rejected"
  | "expired";

export type OrderRow = {
  id: Uuid;
  tenant_id: Uuid;
  account_id: Uuid;
  instrument_id: Uuid;
  side: "buy" | "sell";
  input_mode: "quantity" | "value";
  requested_qty: number | null;
  requested_value_ngwee: Ngwee | null;
  resolved_qty: number | null;
  order_type: "market" | "limit";
  limit_price_ngwee: Ngwee | null;
  status: OrderStatusRow;
  idempotency_key: string;
  created_at: IsoTimestamp;
  updated_at: IsoTimestamp;
};

export type OrderEventRow = {
  id: Uuid;
  tenant_id: Uuid;
  order_id: Uuid;
  from_status: OrderStatusRow | null;
  to_status: OrderStatusRow;
  reason: string | null;
  actor: string;
  created_at: IsoTimestamp;
};

export type OrderBlockRow = {
  id: Uuid;
  tenant_id: Uuid;
  instrument_id: Uuid;
  side: "buy" | "sell";
  aggregate_qty: number;
  avg_fill_price_ngwee: Ngwee | null;
  status: "open" | "staged" | "working" | "filled" | "cancelled";
  created_at: IsoTimestamp;
  updated_at: IsoTimestamp;
};

export type ExecutionRow = {
  id: Uuid;
  tenant_id: Uuid;
  order_id: Uuid;
  block_id: Uuid | null;
  fill_qty: number;
  fill_price_ngwee: Ngwee;
  ats_ref: string | null;
  created_at: IsoTimestamp;
};

export type ContractNoteRow = {
  id: Uuid;
  tenant_id: Uuid;
  account_id: Uuid;
  order_id: Uuid;
  execution_id: Uuid;
  sequential_number: number;
  payload: Record<string, unknown>;
  hash: string;
  prev_hash: string | null;
  delivered_at: IsoTimestamp | null;
  created_at: IsoTimestamp;
};

export type HoldingRow = {
  id: Uuid;
  tenant_id: Uuid;
  account_id: Uuid;
  instrument_id: Uuid;
  qty: number;
  created_at: IsoTimestamp;
  updated_at: IsoTimestamp;
};

export type SettlementLegStatusRow = "pending" | "settled" | "failed";

export type SettlementRow = {
  id: Uuid;
  tenant_id: Uuid;
  account_id: Uuid;
  execution_id: Uuid;
  cycle_days: number;
  trade_date: IsoDate;
  settlement_date: IsoDate;
  cash_leg_status: SettlementLegStatusRow;
  stock_leg_status: SettlementLegStatusRow;
  status: "pending" | "settled" | "partial" | "failed";
  created_at: IsoTimestamp;
  updated_at: IsoTimestamp;
};

export type ComplianceAlertRow = {
  id: Uuid;
  tenant_id: Uuid;
  account_id: Uuid | null;
  type: "THRESHOLD" | "VELOCITY" | "STRUCTURING" | "SANCTIONS" | "PEP";
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  reason_codes: string[];
  description: string;
  amount_ngwee: Ngwee | null;
  status: "OPEN" | "REVIEWING" | "CLEARED" | "ESCALATED";
  mlro_action: string | null;
  created_at: IsoTimestamp;
  updated_at: IsoTimestamp;
};

export type AuditEventRow = {
  id: Uuid;
  tenant_id: Uuid;
  action: string;
  actor: string;
  actor_role: string | null;
  target_ref: string | null;
  metadata: Record<string, unknown>;
  created_at: IsoTimestamp;
};
