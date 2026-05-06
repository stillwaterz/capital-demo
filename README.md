# MarketLink Demo

AI-powered access to LuSE equities and GRZ government securities for Zambian investors.

## Stack

- Next.js 16, TypeScript, Tailwind v4, shadcn/ui
- Anthropic claude-sonnet-4-6 for AI research and briefings
- Mock data (no Supabase in demo mode)

## Running locally

```bash
pnpm install
cp .env.example .env.local   # add your ANTHROPIC_API_KEY
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Features

- LuSE equity prices and 30-day charts
- GRZ T-bill auction bids with auto-roll toggle
- AI daily briefing (streams on dashboard load)
- Market Pulse: ALSI, USD/ZMW, copper price, BoZ rate, top movers
- Smart suggestion card with AI rationale
- "Why did it move?" per-counter AI explainer
- Demo login with personalised greeting
