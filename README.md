# Autonomous Trading Dashboard

> A password-gated Next.js dashboard for monitoring an autonomous paper-trading system — live signals, open positions with real-time prices, closed-trade history, and cumulative P&L.

**Live URL:** https://autonomous-trading-dashboard.vercel.app (password-gated, single-user)

This dashboard is the read-only front end for the [Autonomous Trading System](https://github.com/griffmak/autonomous-trading-dashboard) — a separate project that generates trade signals, executes trades on Alpaca, and writes them to Supabase. This app reads that data and renders it; it never places trades.

---

## Features

Five pages, each behind the password gate:

- **Overview** — 4 metric cards plus open positions and recent signals at a glance.
- **Signals** — full table of generated buy/sell/hold signals with confidence and rationale.
- **Positions** — open positions from Supabase merged with live current prices and unrealized P&L from Alpaca.
- **History** — closed trades with entry/exit and realized P&L.
- **Performance** — a cumulative P&L line chart plus 5 summary metric cards.

---

## Tech Stack

- **Next.js 16** — App Router (React Server Components + client islands)
- **React 19**
- **Tailwind CSS v4**
- **TypeScript**
- **Supabase JS client** — browser-side reads of the `signals` and `trades` tables using the anon key
- **Alpaca** — live position prices via a server-side `/api/positions` proxy (keys never reach the browser)
- **chart.js + react-chartjs-2** — the Performance P&L chart
- **zod** — environment-variable validation

---

## Local Development

### Prerequisites

- **Node.js 20+** (Next.js 16 requirement)
- A **Supabase project** containing the `signals` and `trades` tables. These tables are owned by the [Autonomous Trading System](https://github.com/griffmak/autonomous-trading-dashboard) project — see its wiki page for the table schemas. This dashboard only reads from them.
- An **Alpaca paper-trading account** with API key + secret (https://alpaca.markets).

### Setup

```bash
npm install
cp .env.example .env.local
# then fill in the 6 variables in .env.local (see table below)
npm run dev
```

The app runs at http://localhost:3000. Open it, enter the password you set in `DASHBOARD_PASSWORD_SECRET`, and you're in.

> `.env.local` is gitignored and holds your real values. Only `.env.example` (placeholders) is committed.

---

## Environment Variables

All six are required. The two `NEXT_PUBLIC_*` values are inlined into the browser bundle; the rest stay server-side only.

| Variable | Purpose | Exposure |
|----------|---------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL for reading `signals` + `trades` | Client (in browser bundle) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key for browser-side reads | Client (in browser bundle) |
| `DASHBOARD_PASSWORD_SECRET` | The plaintext password that gates the dashboard | Server only |
| `ALPACA_API_KEY` | Alpaca API key ID for live position prices | Server only |
| `ALPACA_SECRET_KEY` | Alpaca API secret | Server only |
| `ALPACA_BASE_URL` | Alpaca REST base URL (defaults to `https://paper-api.alpaca.markets/v2`) | Server only |

> Because the two `NEXT_PUBLIC_*` Supabase values ship in the browser bundle, the anon key is publicly extractable from any deployed instance. You **must** enable Supabase Row-Level Security on the `signals` and `trades` tables before exposing this app publicly — see [DEPLOYMENT.md](DEPLOYMENT.md) for the required hardening steps.

---

## Architecture

**Auth model.** A single-user password gate. `middleware.ts` (at the project root) checks for the `dashboard_auth` httpOnly cookie and redirects unauthenticated requests for any HTML page back to `/`. `POST /api/auth` validates the submitted password against `DASHBOARD_PASSWORD_SECRET` and sets a 7-day httpOnly cookie; `DELETE /api/auth` clears it (logout). API routes self-check the cookie. The cookie value is a static literal — an accepted trade-off for the single-user threat model. The UI gate is *not* a substitute for database access control; that's what RLS is for (see DEPLOYMENT.md).

**Server-side Alpaca proxy.** Alpaca keys never reach the browser. The Positions page calls `GET /api/positions`, which runs server-side, fetches live positions from Alpaca (5-second timeout, `cache: 'no-store'`), and returns only the data — upstream error bodies are logged server-side, never forwarded. The Alpaca client uses an `import 'server-only'` guard so it can never be accidentally bundled into client code.

**Supabase realtime + polling backup.** Tables subscribe to Supabase `postgres_changes` for instant updates, layered on top of an initial fetch. A 5-minute polling re-fetch runs as a resilience backup in case a realtime event is missed. The Positions page additionally polls Alpaca every 10 seconds for fresh live prices (Alpaca has no realtime channel).

---

## Deploying Your Own Instance

See **[DEPLOYMENT.md](DEPLOYMENT.md)** for a full step-by-step guide, including the two gotchas that will bite you: Vercel Deployment Protection (which must be disabled) and required Supabase RLS hardening.
