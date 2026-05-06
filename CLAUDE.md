# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Read this file at the start of every session. It contains the rules of the road for this codebase.

Also read **BUILD_SPEC.md** (product requirements and tech stack) and **TASKS.md** (Track A demo tasks and Track B sprint plan) at the start of each session.

## Project mission

A Pranary-built, Pangaea-licensed, AI-native consumer brokerage for Zambian retail and diaspora investors. Trades LuSE equities and GRZ government securities (T-bills and bonds). AI is the primary surface (research, news intelligence, conversational explainer). All payment rails native. Multi-tenant from day one.

Working brand placeholder: **Capital** (final name pending).

## Architecture rules

- **Monorepo** with Turborepo, pnpm workspaces. Apps in `apps/`, shared code in `packages/`.
- **Multi-tenant from day one**. Every base table has `tenant_id`. RLS denies cross-tenant reads.
- **Three deployments, one codebase**. Demo, MVP and Production are environment configs and feature flags, never separate branches or repos.
- **Currency in integer ngwee** (smallest unit of ZMW). Never store currency as float. Format at display only.
- **TIMESTAMPTZ** for all dates and times, UTC stored, render in user timezone.
- **Supabase RLS from day one**. No table is created without an RLS policy.
- **DPA Zambia 2021 native**. Data residency in Zambia. Consent recorded. Deletion respected.
- **AI proposes, rules engine disposes**. Every AI action goes through a deterministic guardrail layer (compliance, position limits, KYC tier, sanctions, cash availability) before any order touches the broker adapter.

## Code conventions

- TypeScript strict mode, no `any`, no `unknown` without narrowing.
- Named exports only. No default exports for components.
- Server Components by default, `"use client"` only when needed.
- Tailwind via shadcn/ui. No custom CSS files except for global tokens.
- No inline styles. No magic numbers (named constants).
- Functions short. If a function is over 40 lines, split it.
- Tests live next to source as `*.test.ts`. Vitest for unit, Playwright for e2e.
- Money: `import { Money } from "@capital/core/money"`. Never multiply Money values directly.

## Writing conventions (UI copy and docs)

- No em dashes or en dashes. Use a regular hyphen only.
- No Oxford commas. Write "A, B, C and D" not "A, B, C, and D".
- Avoid the words "genuinely", "honestly", "straightforward".
- Plain English. Zambian retail audience reads at a Year 9 level. Diaspora reads at any level. Default to clear over clever.
- WHT and dividend tax language follows Zambian tax convention, not South African or US.

## Package layout

```
packages/
  core/         Domain types, Money, instruments, orders, portfolio
  ai/           Anthropic clients, agents, prompts, guardrails
  trading/      Order routing, execution adapters (Pangaea, mock, future)
  securities/   Equity, bond, T-bill, CIS instrument types
  kyc/          Tiered KYC engine, identity, sanctions, AML hooks
  compliance/   Audit log, transaction monitoring, regulatory reports
  payments/     Mobile money, EFT, RTGS, FX, float
  news/         SENS-equivalent ingestion and AI summarisation
  research/      Per-instrument research generation
  ui/           shadcn-based design system, theme tokens per tenant
  messaging/    WhatsApp, push, in-app
  i18n/         English, Bemba, Nyanja
  db/           Supabase schema, migrations, RLS policies
  config/       Environment and feature flags
  testing/      Mocks, fixtures, factories
```

## Where things live

- New domain type: `packages/core/src/[domain]`
- New UI component: `packages/ui/src/components`
- New AI agent: `packages/ai/src/agents`
- New broker adapter: `packages/trading/src/adapters`
- New screen: `apps/web/app/[route]` or `apps/mobile/app/[route]`
- New migration: `packages/db/migrations`

## What never to do

- Never commit `.env` or any secret. Use `.env.example` only.
- Never use `localStorage` or `sessionStorage` in client code (use Zustand or server state).
- Never make a Money calculation in floating point.
- Never bypass RLS by using the service role key in user-facing code paths.
- Never let AI submit an order without passing the guardrail layer.
- Never hardcode a tenant ID. Resolve via session.
- Never use `any` to silence a TypeScript error. Fix the type.
- Never change a database schema without a migration file.
- Never add a feature without a feature flag if it is not yet GA.

## Build and test commands

```
pnpm install                Install workspace deps
pnpm dev                    Run web app locally
pnpm dev:mobile             Run Expo locally
pnpm build                  Build all packages and apps
pnpm test                   Run unit tests
pnpm test:e2e               Run Playwright suite
pnpm lint                   ESLint across workspace
pnpm typecheck              tsc --noEmit across workspace
pnpm db:migrate             Apply Supabase migrations
pnpm db:reset               Reset local Supabase
```

## AI models

- Reasoning and vision tasks: `claude-sonnet-4-6`
- Routing and fast tasks: `claude-haiku-4-5-20251001`

Never substitute a different model string without updating this file.

## Demo mode

The demo skips the monorepo and runs as a single Next.js app at the root. Mock data lives in `src/lib/mock/`. AI calls go directly from `app/api/ai/route.ts` to Anthropic. No Supabase, no auth, no broker adapter. Demo conventions in `TASKS.md` Track A.
