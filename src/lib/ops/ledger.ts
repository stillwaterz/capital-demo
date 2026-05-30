/**
 * Double-entry ledger engine.
 *
 * Generates balanced journal entries from settled trades and processed
 * corporate actions on top of an opening client-money position. Proves debits
 * equal credits with a trial balance, exposes a client-money segregation view
 * and a per-client cash sub-ledger. Every entry balances by construction and
 * money is integer ngwee.
 */

import type {
  AccountId,
  IsoDate,
  IsoTimestamp,
  JournalEntry,
  JournalLine,
  Ngwee,
  NormalBalance,
  TrialBalanceRow,
} from "./types";
import { ACCOUNT_IDS, ACCOUNTS, getAccount } from "./accounts";
import { listSettledTrades, listClients } from "./trades";
import { listProcessedActions } from "./corporate-actions";

const TENANT_ID = "capital-demo";
const OPENING_DATE: IsoDate = "2026-05-27";

/** Opening client cash deposits, in ngwee, that fund the blotter. */
const CLIENT_OPENING_NGWEE: Record<string, Ngwee> = {
  C001: 50_000_000,
  C002: 30_000_000,
  C003: 40_000_000,
  C004: 8_000_000,
  C005: 25_000_000,
};

function debit(
  accountId: AccountId,
  amountNgwee: Ngwee,
  clientId?: string
): JournalLine {
  return { accountId, debitNgwee: amountNgwee, creditNgwee: 0, clientId };
}

function credit(
  accountId: AccountId,
  amountNgwee: Ngwee,
  clientId?: string
): JournalLine {
  return { accountId, debitNgwee: 0, creditNgwee: amountNgwee, clientId };
}

/** Opening balances: client deposits sit in the segregated settlement bank. */
function openingEntry(): JournalEntry {
  const clients = listClients();
  const lines: JournalLine[] = [];
  let total = 0;
  for (const { clientId } of clients) {
    const amount = CLIENT_OPENING_NGWEE[clientId] ?? 0;
    if (amount === 0) continue;
    lines.push(credit("CLIENT_CASH", amount, clientId));
    total += amount;
  }
  lines.unshift(debit("SETTLEMENT", total));
  return {
    id: "JE-OPENING",
    tenantId: TENANT_ID,
    date: OPENING_DATE,
    postedAt: `${OPENING_DATE}T06:00:00.000Z`,
    memo: "Opening client cash deposits held in segregated settlement bank",
    sourceRef: null,
    lines,
  };
}

/** One balanced entry per settled trade, covering the cash and fee legs. */
function tradeEntries(currentDate: IsoDate): JournalEntry[] {
  return listSettledTrades(currentDate).map((trade) => {
    const postedAt: IsoTimestamp =
      trade.settledAt ?? `${trade.settlementDate}T11:00:00.000Z`;
    const lines: JournalLine[] =
      trade.side === "BUY"
        ? [
            debit("CLIENT_CASH", trade.netNgwee, trade.clientId),
            credit("SETTLEMENT", trade.grossNgwee),
            credit("FEES_INCOME", trade.feesNgwee),
          ]
        : [
            debit("SETTLEMENT", trade.grossNgwee),
            credit("CLIENT_CASH", trade.netNgwee, trade.clientId),
            credit("FEES_INCOME", trade.feesNgwee),
          ];
    return {
      id: `JE-${trade.id}`,
      tenantId: TENANT_ID,
      date: trade.settlementDate,
      postedAt,
      memo: `Settled ${trade.side} ${trade.quantity.toLocaleString("en-US")} ${trade.symbol} (${trade.id})`,
      sourceRef: trade.id,
      lines,
    };
  });
}

/** One balanced entry per processed corporate action. */
function corporateActionEntries(currentDate: IsoDate): JournalEntry[] {
  return listProcessedActions(currentDate).map((action) => {
    const postedAt: IsoTimestamp = `${action.payDate}T07:30:00.000Z`;
    let lines: JournalLine[];
    if (action.type === "AUTO_ROLL") {
      // Maturity proceeds reinvested into a fresh bill: cash recycles via settlement.
      lines = [
        debit("SETTLEMENT", action.netNgwee),
        credit("CLIENT_CASH", action.netNgwee, action.clientId),
      ];
    } else if (action.whtNgwee > 0) {
      lines = [
        debit("SETTLEMENT", action.grossNgwee),
        credit("CLIENT_CASH", action.netNgwee, action.clientId),
        credit("WHT_PAYABLE", action.whtNgwee),
      ];
    } else {
      lines = [
        debit("SETTLEMENT", action.grossNgwee),
        credit("CLIENT_CASH", action.netNgwee, action.clientId),
      ];
    }
    const label =
      action.type === "AUTO_ROLL"
        ? `${action.symbol} maturity auto-rolled into ${action.rolledIntoSymbol ?? "new bill"}`
        : `${action.symbol} ${action.type.toLowerCase()} for ${action.clientName}`;
    return {
      id: `JE-${action.id}`,
      tenantId: TENANT_ID,
      date: action.payDate,
      postedAt,
      memo: `${label} (${action.id})`,
      sourceRef: action.id,
      lines,
    };
  });
}

/** All journal entries for the business date, oldest first. */
export function generateJournalEntries(currentDate: IsoDate): JournalEntry[] {
  return [
    openingEntry(),
    ...tradeEntries(currentDate),
    ...corporateActionEntries(currentDate),
  ].sort((a, b) => (a.postedAt < b.postedAt ? -1 : 1));
}

/** True when an entry's debits equal its credits to the ngwee. */
export function isBalanced(entry: JournalEntry): boolean {
  const debits = entry.lines.reduce((s, l) => s + l.debitNgwee, 0);
  const credits = entry.lines.reduce((s, l) => s + l.creditNgwee, 0);
  return debits === credits;
}

/** True when every entry in the book balances. */
export function allEntriesBalanced(currentDate: IsoDate): boolean {
  return generateJournalEntries(currentDate).every(isBalanced);
}

type AccountTotals = { debit: Ngwee; credit: Ngwee };

function accountTotals(currentDate: IsoDate): Record<AccountId, AccountTotals> {
  const totals = {} as Record<AccountId, AccountTotals>;
  for (const id of ACCOUNT_IDS) totals[id] = { debit: 0, credit: 0 };
  for (const entry of generateJournalEntries(currentDate)) {
    for (const line of entry.lines) {
      totals[line.accountId].debit += line.debitNgwee;
      totals[line.accountId].credit += line.creditNgwee;
    }
  }
  return totals;
}

/** Net balance of an account, signed to its normal balance. */
function signedBalance(
  normalBalance: NormalBalance,
  totals: AccountTotals
): Ngwee {
  return normalBalance === "DEBIT"
    ? totals.debit - totals.credit
    : totals.credit - totals.debit;
}

/** Balance of a single account for the business date, signed to normal balance. */
export function accountBalanceNgwee(
  accountId: AccountId,
  currentDate: IsoDate
): Ngwee {
  const totals = accountTotals(currentDate)[accountId];
  return signedBalance(getAccount(accountId).normalBalance, totals);
}

/** Trial balance, one row per account, proving the book balances. */
export function trialBalance(currentDate: IsoDate): TrialBalanceRow[] {
  const totals = accountTotals(currentDate);
  return ACCOUNT_IDS.map((id) => {
    const account = ACCOUNTS[id];
    return {
      accountId: id,
      accountName: account.name,
      normalBalance: account.normalBalance,
      totalDebitNgwee: totals[id].debit,
      totalCreditNgwee: totals[id].credit,
      balanceNgwee: signedBalance(account.normalBalance, totals[id]),
    };
  });
}

export type TrialBalanceTotals = {
  totalDebitNgwee: Ngwee;
  totalCreditNgwee: Ngwee;
  balanced: boolean;
};

export function trialBalanceTotals(currentDate: IsoDate): TrialBalanceTotals {
  const rows = trialBalance(currentDate);
  const totalDebitNgwee = rows.reduce((s, r) => s + r.totalDebitNgwee, 0);
  const totalCreditNgwee = rows.reduce((s, r) => s + r.totalCreditNgwee, 0);
  return {
    totalDebitNgwee,
    totalCreditNgwee,
    balanced: totalDebitNgwee === totalCreditNgwee,
  };
}

export type SegregationView = {
  /** Client money the broker owes clients, in ngwee. */
  clientMoneyNgwee: Ngwee;
  /** Segregated bank assets backing client money, in ngwee. */
  segregatedAssetsNgwee: Ngwee;
  /** Surplus of segregated assets over client money, in ngwee. */
  surplusNgwee: Ngwee;
  /** Coverage of client money by segregated assets, in basis points. */
  coverageBps: number;
  /** True when segregated assets fully cover client money. */
  isSegregated: boolean;
};

/**
 * Client-money segregation view. Client cash is a liability the broker owes
 * clients; it must be fully backed by the segregated settlement bank balance.
 */
export function clientMoneySegregation(currentDate: IsoDate): SegregationView {
  const clientMoneyNgwee = accountBalanceNgwee("CLIENT_CASH", currentDate);
  const segregatedAssetsNgwee = accountBalanceNgwee("SETTLEMENT", currentDate);
  const surplusNgwee = segregatedAssetsNgwee - clientMoneyNgwee;
  const coverageBps =
    clientMoneyNgwee === 0
      ? 0
      : Math.round((segregatedAssetsNgwee / clientMoneyNgwee) * 10_000);
  return {
    clientMoneyNgwee,
    segregatedAssetsNgwee,
    surplusNgwee,
    coverageBps,
    isSegregated: segregatedAssetsNgwee >= clientMoneyNgwee,
  };
}

export type ClientSubLedgerRow = {
  clientId: string;
  clientName: string;
  openingNgwee: Ngwee;
  /** Net cash movement from settled trades and corporate actions, in ngwee. */
  movementNgwee: Ngwee;
  /** Closing cash balance owed to the client, in ngwee. */
  balanceNgwee: Ngwee;
};

/** Per-client cash sub-ledger derived from CLIENT_CASH journal lines. */
export function clientSubLedger(currentDate: IsoDate): ClientSubLedgerRow[] {
  const entries = generateJournalEntries(currentDate);
  return listClients().map(({ clientId, clientName }) => {
    const opening = CLIENT_OPENING_NGWEE[clientId] ?? 0;
    let movement = 0;
    for (const entry of entries) {
      if (entry.id === "JE-OPENING") continue;
      for (const line of entry.lines) {
        if (line.accountId !== "CLIENT_CASH" || line.clientId !== clientId) {
          continue;
        }
        // Client cash is a credit-normal liability: credits raise the balance.
        movement += line.creditNgwee - line.debitNgwee;
      }
    }
    return {
      clientId,
      clientName,
      openingNgwee: opening,
      movementNgwee: movement,
      balanceNgwee: opening + movement,
    };
  });
}

export type LedgerSummary = {
  entryCount: number;
  allBalanced: boolean;
  clientMoneyNgwee: Ngwee;
  feesIncomeNgwee: Ngwee;
  whtPayableNgwee: Ngwee;
};

/** Headline ledger counters for the control tower. */
export function ledgerSummary(currentDate: IsoDate): LedgerSummary {
  return {
    entryCount: generateJournalEntries(currentDate).length,
    allBalanced: allEntriesBalanced(currentDate),
    clientMoneyNgwee: accountBalanceNgwee("CLIENT_CASH", currentDate),
    feesIncomeNgwee: accountBalanceNgwee("FEES_INCOME", currentDate),
    whtPayableNgwee: accountBalanceNgwee("WHT_PAYABLE", currentDate),
  };
}
