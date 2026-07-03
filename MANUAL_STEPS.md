# Manual steps and follow-ups

What was built across Phase 1 to Phase 4, and the things only you can do or must
decide. The app type-checks, all unit tests pass and `next build` is green in
demo mode on the mock adapters.

## You must do these

1. **Rotate the Anthropic API key.** `.env.local` holds a live `ANTHROPIC_API_KEY`
   that was shared in plaintext during this build. Rotate it. `.env.local` is
   gitignored by Next, so it is not committed, but the key should still be
   replaced.

2. **Apply the migrations to Supabase.** From `capital-demo/`:
   - `supabase link --project-ref rvwnzreiawtgexvcjcgx` then `supabase db push`,
     or paste the files in `supabase/migrations/` into the SQL editor in
     filename order (they are timestamp-ordered).
   - They reference `auth.users`, which Supabase provides. Nothing else external.
   - Verify RLS with `supabase/tests/rls_smoke.sql` (isolation, append-only,
     fail-closed). It was validated locally against Postgres 16 and passes.

3. **Stamp `tenant_id` (and `staff_role` for back office) into the JWT.** Every
   RLS policy reads `app_metadata.tenant_id`, and staff policies read
   `app_metadata.staff_role`. Set these in the user's `app_metadata` at signup,
   via a Supabase Auth hook or the admin API. Without `tenant_id` in the JWT a
   user sees nothing: this is deliberate fail-closed behaviour, not a bug.

4. **Seed `tenants` and `instruments` for production mode.** Insert one row into
   `tenants`, and load `instruments` from the demo list in
   `src/lib/mock/instruments.ts`. Demo mode reads the mock, so this only matters
   once `NEXT_PUBLIC_APP_MODE=production`.

5. **Adding npm packages.** Use `corepack pnpm@10.14.0 add <pkg>` from
   `capital-demo/`. The local `node_modules` is linked from the pnpm v10 store
   and the global pnpm is v11, so a plain `pnpm add` errors. `pnpm install` and
   `pnpm build` work fine.

## You must decide these

6. **Commission rate.** BUILD_SPEC section 5 states 1.5% commission. The existing
   fee engine `src/lib/ops/trades.ts` uses 1.0% brokerage plus 0.2% levy
   (`EQUITY_BROKERAGE_BPS = 100`, `EQUITY_LEVY_BPS = 20`). I reused that engine
   everywhere rather than fork a second fee schedule. If 1.5% is correct, change
   `EQUITY_BROKERAGE_BPS` to 150 in that one file and the whole app follows.

7. **Value-order fee treatment.** In `src/lib/orders/order-math.ts`, a value-mode
   buy treats the amount entered as the share budget and adds fees on top, so the
   all-in can exceed the entered figure. If the amount should be fully inclusive
   of fees, that is a one-function change in `resolveOrder`.

8. **Production adapters throw on purpose.** `getAdapters()` in
   `src/lib/adapters/index.ts` throws when `NEXT_PUBLIC_APP_MODE=production`,
   because no real rail is bound yet. Bind them one at a time (MarketData, Kyc,
   Payments, Execution, Settlement) as the negotiations in BUILD_SPEC section 15
   close. Demo mode is unaffected.

## Auth: one dashboard setting

The signup path is wired: migration `20260703091000_auth_provisioning.sql` adds a
trigger that, on signup, creates the client's `accounts` row under a default
tenant and stamps `tenant_id` into `raw_app_meta_data`. Route handlers live at
`/api/auth/sign-up`, `/api/auth/login`, `/api/auth/logout` (all mode-gated, they
return 400 in demo). Supabase includes `app_metadata` in the JWT, so `tenant_id`
reaches RLS after the first token refresh following signup. If you want it in the
very first token, add a custom access token hook in the Supabase dashboard that
copies `tenant_id` (and `staff_role` for back office) into the claims. Building
the customer login and sign-up screens is the only UI piece left for auth.

## What is built and green

- **Data layer.** 12 migrations, every table from BUILD_SPEC section 3 plus the
  Phase 2 to 4 tables, plus the auth-provisioning trigger. `tenant_id`,
  TIMESTAMPTZ, integer-ngwee `bigint`, RLS on every table, append-only triggers
  on the event streams, unique idempotency keys on money and order tables. RLS
  and the signup trigger proven against real Postgres.
- **Mode flag and five adapters** with mock bindings, resolved by the flag.
- **Wallet** ledger-sourced, deposits and withdrawals through the mock Payments
  adapter with idempotency keys, withdrawals restricted to a verified method.
- **Deterministic engines, each unit-tested** (149 tests total): order maths,
  order state machine and pre-trade checks, block netting and average-price
  allocation, contract-note hash chain with gap detection and inspector bundle,
  onboarding risk and tier, settlement cycle engine, compliance surveillance.
- **Onboarding agent** wiring the mock Kyc adapter to the risk engine.
- **Customer flows.** Two-input order screen (lot snapping, full fees,
  PIN + 2FA, cooling-off countdown). Portfolio with Kwacha value and gain or loss
  in Kwacha and percent, plus an order tracker with honest settlement dates.
  Contract notes page with hash-chain verification and inspector bundle download.
  Watchlist, price alerts, recurring auto-invest and a referral code. Demo PIN is
  1234, any 6-digit 2FA code passes.
- **Ops flows.** Operator queue that nets customer orders into blocks, allocates
  each client at the block average price, releases into the ATS and reconciles
  the fill before it is marked filled. Live AML surveillance panel on the
  compliance page running the same reason-coded rules over the session's own
  wallet and trade activity.

## What remains (deliberately not built)

- Customer login and sign-up screens (the auth backend and provisioning are
  ready; only the two screens are missing).
- Email delivery of contract notes (in-app delivery and inspector export are
  built; wiring an email provider is a production integration).
- Push notifications for price alerts (alerts evaluate in-app already).
- Binding the real production adapters, per BUILD_SPEC section 15 negotiations.
