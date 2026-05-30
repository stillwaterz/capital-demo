/**
 * Chart of accounts for the double-entry ops ledger.
 *
 * Every journal posting hits accounts defined here. Client-money accounts are
 * flagged so the segregation view can prove client funds stay separate from
 * house funds. All balances are integer ngwee.
 */

import type { Account, AccountId } from "./types";

export const ACCOUNTS: Record<AccountId, Account> = {
  CLIENT_CASH: {
    id: "CLIENT_CASH",
    name: "Client cash",
    type: "LIABILITY",
    normalBalance: "CREDIT",
    isClientMoney: true,
  },
  HOUSE_CASH: {
    id: "HOUSE_CASH",
    name: "House cash",
    type: "ASSET",
    normalBalance: "DEBIT",
    isClientMoney: false,
  },
  SETTLEMENT: {
    id: "SETTLEMENT",
    name: "Settlement account",
    type: "ASSET",
    normalBalance: "DEBIT",
    isClientMoney: false,
  },
  CSD_POSITION: {
    id: "CSD_POSITION",
    name: "CSD position",
    type: "ASSET",
    normalBalance: "DEBIT",
    isClientMoney: true,
  },
  FEES_INCOME: {
    id: "FEES_INCOME",
    name: "Fees income",
    type: "INCOME",
    normalBalance: "CREDIT",
    isClientMoney: false,
  },
  WHT_PAYABLE: {
    id: "WHT_PAYABLE",
    name: "WHT payable",
    type: "LIABILITY",
    normalBalance: "CREDIT",
    isClientMoney: false,
  },
  SUSPENSE: {
    id: "SUSPENSE",
    name: "Suspense",
    type: "ASSET",
    normalBalance: "DEBIT",
    isClientMoney: false,
  },
  BROKERAGE_RECEIVABLE: {
    id: "BROKERAGE_RECEIVABLE",
    name: "Brokerage receivable",
    type: "ASSET",
    normalBalance: "DEBIT",
    isClientMoney: false,
  },
};

/** All account ids in display order. */
export const ACCOUNT_IDS: AccountId[] = Object.keys(ACCOUNTS) as AccountId[];

/** Look up a single account record. */
export function getAccount(id: AccountId): Account {
  return ACCOUNTS[id];
}

/** Account ids that hold client money and must stay segregated. */
export const CLIENT_MONEY_ACCOUNTS: AccountId[] = ACCOUNT_IDS.filter(
  (id) => ACCOUNTS[id].isClientMoney
);
