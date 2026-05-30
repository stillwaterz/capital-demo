# Operations demo walkthrough

This guide walks through the MarketLink demo end to end: customer app, back office and AI governance.

## URLs

- Customer app: `/home`
- Operations console: `/ops`
- Deployed demo: Vercel (see repo README)

## 1. Customer front of house

1. Open `/home` and sign in with the demo login.
2. Go to **Stocks**, open a counter and place a **Buy** or **Sell** order.
3. After confirmation, switch to **Operations** using the header toggle.
4. Open **Settlement** and find your trade with an **App** badge on the lifecycle board.
5. Visit **Profile** and use **Fund wallet** to simulate an Airtel Money deposit.
6. Open **Bills** and toggle **Auto-roll on maturity** on the 91 day holding.

## 2. Back office spine

1. On `/ops`, the **Control Tower** shows settlement, recon, treasury, compliance and approval counts.
2. Click **Advance to T+1** in the header (or on Settlement).
3. Watch trades move through EXECUTED to SETTLED (or FAILED for seeded demo fails).
4. Open **Ledger** for double-entry journal and trial balance.
5. Open **Reconciliation** for cash, position and float breaks.
6. Open **Treasury** for float across Airtel, MTN, FNB, Zanaco, Stanbic and settlement.
7. Open **Corporate actions** for dividends, coupons, maturities and auto-roll events.
8. Open **Fees and tax** for brokerage runs and 15% WHT remittance register.

## 3. Supervision

1. **Compliance**: AML alerts, sanctions and PEP hits, STR cases.
2. **KYC ops**: Tier 0 to 2 onboarding queue and upgrade requests.
3. **Risk**: concentration limits and kill switch state.
4. **Reporting**: SEC, BoZ, FIC and LuSE submission register.

## 4. AI and governance

Principle: **AI proposes, rules engine disposes.**

1. Open the **Ops copilot** in the header.
2. Use a quick chip such as "Investigate settlement fails" or ask about a break.
3. Click **Send to approvals** on a proposed action.
4. Open **Approvals**: review guardrail result, approve or reject as checker.
5. Use **Ask AI** inline on settlement fails and recon breaks.

## 5. Demo narrative baked in

- **Kafue Traders Ltd** ATEL buy fails at T+1 (short cash).
- **CHIL** sell fails (unconfirmed CSD position).
- Structuring alert and sanctions hit in compliance.
- Treasury flags a pre-settlement float shortfall before the next batch.

## Reset

Use **Reset clock** in the ops header to return to the demo start date (29 May 2026). Clear browser local storage to reset customer orders and wallet.
