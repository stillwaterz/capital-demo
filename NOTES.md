# NOTES

Working log for the Capital / MarketLink demo. Newest entries at the top.
This is the demo app (single Next.js app, no Supabase, no real auth, no broker).
Deployed on Vercel from `main`. Live demo: https://capital-demo-five.vercel.app/

## Deployment facts

- Repo: `github.com/stillwaterz/capital-demo`, branch `main`.
- Vercel auto-deploys on every push to `main`.
- No database. No Supabase. No broker adapter. All state is mock data plus
  client-side Zustand stores. AI calls go straight to Anthropic from API routes.
- Secrets: `ANTHROPIC_API_KEY` is read from env in the API routes. Never committed.

---

## Session 2026-05-30

### Done

**Back office access (admin login).**
- Added a login gate over the ops back office. Routes `/ops` and `/ops/*` are
  now protected by `src/middleware.ts`, which checks a session cookie and
  redirects to `/ops-login` when it is missing.
- `/ops-login` is a branded sign in screen. A server action in
  `src/app/ops-login/actions.ts` validates the demo credentials and sets an
  httpOnly cookie. A "Sign out" button in the ops header clears it.
- Demo credentials: **admin / admin**. Defined as named constants in
  `src/lib/ops/auth-constants.ts`.
- Commit `c3eb08d`. This commit also landed the back office console and the
  T-bills work that had been sitting uncommitted from the prior session.

**Bug fix: infinite render loop on /ops (React error #185).**
- The Control Tower crashed in production with "Maximum update depth exceeded".
- Root cause: a Zustand selector in `src/components/ops/control-tower-board.tsx`
  filtered inside the selector, returning a new array reference every render.
  Under Zustand v5 (`useSyncExternalStore`) that re-renders forever.
- Fix: select the stable `proposals` array, then derive the filtered list with
  `useMemo`. Verified against the production build in a real browser, logged in
  with admin/admin, `/ops` loads with zero console errors.
- Commit `157d933`.

### What the back office currently is

- Route group `src/app/(ops)/` with a shared layout (clock control, AI copilot,
  mode switcher, sign out).
- Pages under `/ops`: Control Tower, Settlement, Ledger, Reconciliation,
  Treasury, Corporate Actions, Fees and Tax, Compliance, KYC Ops, Risk,
  Reporting, Approvals.
- Domain logic (mock) in `src/lib/ops/`: accounts, clock, compliance,
  corporate-actions, customer-trades, fees, governance, kyc-queue, ledger,
  reconciliation, reg-reporting, risk, settlement, trades, treasury, types.
- Ops state in Zustand: `ops-clock` (business date, T+1 advance, persisted) and
  `ops-governance` (maker/checker proposals, audit log).
- Ops AI copilot: `src/app/api/ai/ops/route.ts` plus prompts in `src/lib/ai/`.
  Tasks: morning-briefing, settlement-fail, recon-break, str-narrative.
- Walkthrough doc: `docs/OPS_DEMO_WALKTHROUGH.md`.

---

## Still needs to happen

### Security and auth (highest priority before any non-demo use)
- [ ] admin/admin is hardcoded in source in a public repo. Anyone can read it.
      Move to env vars and replace with real credentials.
- [ ] The session cookie value is a fixed token, not a signed session. No
      expiry beyond an 8h maxAge, no rotation, no CSRF protection on the login
      action. Replace with real auth (Supabase Auth or similar).
- [ ] No roles. Maker/checker, admin and read-only all see the same thing.
      Add role based access control (RBAC) so a checker cannot also be the maker.
- [ ] Customer login is still "any 9 digits + any 4 digit PIN" demo auth.

### Platform (the real architecture from CLAUDE.md, not yet built)
- [ ] No Supabase, no Postgres, no RLS. The whole multi-tenant, tenant_id +
      RLS model is not implemented. Everything is mock data and client stores.
- [ ] Money is not yet stored as integer ngwee end to end. Confirm and enforce.
- [ ] No real broker adapter. No guardrail layer ("AI proposes, rules engine
      disposes"). The ops copilot can draft proposals but there is no
      deterministic compliance, position limit, KYC tier, sanctions or cash
      check before anything would touch a broker.
- [ ] Maker/checker governance is client-side Zustand only. Not persisted, not
      audited server-side, lost on refresh of the store. Needs a real store.

### Product / cleanup
- [x] T-bills removed. Equities-only consumer demo: route, store, mock data,
      Bills nav link, ops T-bill trades, auto-roll and related copy cleared.
- [ ] The ops AI copilot calls Anthropic directly with no guardrails or rate
      limiting. Fine for demo, not for anything real.

### Engineering watch-outs
- [ ] Zustand v5 footgun: never filter, map, sort or build an object/array
      inside a store selector. It returns a new reference each render and loops
      (this was the #185 bug). Select the raw value, derive with useMemo or use
      `useShallow`. Audit new selectors for this.
- [ ] No automated tests yet for the ops flows. The repo convention is Vitest
      for unit and Playwright for e2e. Add coverage for settlement, recon and
      the governance flow at least.
