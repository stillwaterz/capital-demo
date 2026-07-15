# BUILD_SPEC.md

The product spec. This is the source of truth for what we are building. Read alongside CLAUDE.md.

## Mission

A clean, AI-native consumer brokerage for Zambian retail and diaspora investors. Built on Pangaea Securities's licence. LuSE equities in one app. AI as the primary surface. All payment rails native.

## Product surfaces (v1)

1. Mobile app (iOS, Android via Expo)
2. Web companion (Next.js 15 App Router)
3. WhatsApp notifications surface (notifications only, no transactions)

## Target customer (v1)

- Zambian urban retail aged 22 to 45, smartphone, salaried or small business, ZMW 1,000 to 50,000 to invest
- Zambian professionals already with Pangaea who want better UX
- Returning diaspora and Zambians abroad transacting in ZMW

## v1 must-do (six capabilities)

### 1. Onboarding and KYC

Three tiers:

- **Tier 0 (Explorer)**: phone OTP. Read-only access to prices, research, watchlists. No wallet.
- **Tier 1 (Light Trader, up to ZMW 10,000 per month)**: NRC plus selfie liveness, mobile money KYC reuse with consent. Auto-approval target under 3 minutes. Trades LuSE equities. Mobile money funding.
- **Tier 2 (Full Investor, up to ZMW 500,000 per month)**: Tier 1 plus ZRA TPIN, proof of address, conversational source of funds and risk profile. Bank funding plus mobile money. Full instrument set except institutional and structured products.

The mobile money KYC reuse is the differentiator. Pull verified identity from Airtel and MTN with explicit user consent.

### 2. Payment rails (all native at launch)

- Airtel Money (in and out)
- MTN MoMo (in and out)
- FNB EFT (in and out)
- Zanaco (in and out)
- Stanbic (in and out)

### 3. LuSE equity trading

- Real-time prices via Pangaea data feed
- Buy and sell with limit and market order types
- Position view, transaction history
- Dividend handling (capture, display, reinvestment toggle)
- Basic price chart (Recharts, in-house, no third-party terminal in v1)

### 4. Government bonds (parked for later)

Short-term government paper is out of scope. Bond primary auctions and secondary market may return in a later release. The ops console may still show bond coupon events for demo narrative.

### 5. AI as the primary surface

Three jobs only:

- **Per-instrument research**, daily auto-generated, plain English, DPA-compliant. Refreshes on news events.
- **News intelligence (SENS-equivalent module)**. Ingests LuSE announcements, BoZ MPC, MoF gazette, ZRA notices, listed company press, major Zambian news. AI normalises, tags, filters per portfolio relevance, summarises.
- **Real-time event explainer**. "Why did Zambeef move 3 percent today" answered live with sources.

AI advises and explains. AI does not auto-trade in v1. The action-capable agent moves to v2.

### 6. WHT display on every transaction

WHT (dividend WHT) is deducted at source by Pangaea. The platform displays accurate net figures on every transaction. Full ZRA-ready year-end statement is v2.

## v1 explicitly parked

Do not build these in v1, regardless of how easy any single one looks:

- Institutional terminal (RBAC, bulk orders, audit reports, regulator submissions)
- USSD and SMS surfaces
- Voice-first onboarding or voice trading
- Chilimba and Chama group accounts
- WhatsApp full transaction surface (notifications only in v1)
- Inheritance, NAPSA top-up, dividend redirection, faith filters, social feed
- Sinda insurance wrapper
- CIS money market wrapper (separate SEC workstream)
- Continental equities expansion
- Action-capable AI agent
- Third-party data terminal integration (TradingView, Koyfin, Refinitiv)

## AI guardrail architecture

Every AI surface respects this layered model:

```
User intent
  -> AI proposal (LLM)
    -> Deterministic guardrail layer
       - Compliance check (KYC tier, sanctions, PEP)
       - Risk check (position limit, concentration, suitability)
       - Cash check (available balance, settlement timing)
       - Market check (open auction, valid lot size, halt status)
    -> If pass: queued action
    -> If fail: block with explanation
```

AI never touches the broker adapter directly. The guardrail layer is the only path.

## Tenant model

- `tenants` table is the root. Pangaea is tenant 1.
- Every domain table has `tenant_id` (NOT NULL).
- RLS policies enforce tenant isolation.
- UI theming layer reads tenant config (logo, colours, copy).
- Broker adapter is selected per tenant.

## Compliance posture

- DPA Zambia 2021 native: Zambian data residency, lawful basis recorded, deletion respected, Section 70 cross-border transfer scoped explicitly.
- FIC Zambia AML and CFT thresholds applied per tier.
- Sanctions screening: OFAC, UN, EU, UK consolidated, refreshed daily.
- PEP screening native.
- Continuous transaction monitoring with anomaly flags routed to Pangaea compliance.

## Tech stack (locked)

- **Frontend**: Next.js 15 App Router, TypeScript, Tailwind, shadcn/ui, Framer Motion
- **Mobile**: Expo (React Native) sharing the design system
- **Backend**: Supabase (Postgres, Auth, Storage, Realtime), pgvector for embeddings
- **AI**: Anthropic Sonnet 4.6 (reasoning, vision), Haiku 4.5 (routing, fast tasks). Model strings `claude-sonnet-4-6` and `claude-haiku-4-5-20251001`.
- **Realtime**: Supabase Realtime, Upstash Redis for hot cache
- **Background jobs**: Inngest
- **Payments**: Lenco or local PSP for mobile money, FNB rails for EFT and RTGS
- **Messaging**: WhatsApp Business via 360dialog
- **Observability**: Sentry, PostHog, OpenTelemetry
- **Deploy**: Vercel for web, EAS for mobile, Cloudflare DNS grey-cloud
- **Charts**: Recharts in-house

## Out-of-scope dependencies (v1)

- TradingView, Koyfin, Refinitiv (revisit at institutional or continental phase)
- Africa's Talking USSD (parked with USSD surface)
- Twilio voice (parked with voice surface)
- BoZ Investor Portal direct API (negotiate later, route via Pangaea for v1)
