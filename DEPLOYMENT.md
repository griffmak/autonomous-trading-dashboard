# Deployment Guide

This guide walks you through deploying your own instance of the Autonomous Trading Dashboard from the public repo to Vercel.

Two steps below are easy to miss and will leave you with a broken deployment if skipped:

- **Step 5 — Disable Vercel Deployment Protection.** New Vercel projects wrap every route in an SSO wall by default, which returns HTTP 401 to the public — including to you.
- **Step 6 — Enable Supabase Row-Level Security.** The anon key ships in the browser bundle, so without RLS your database is publicly readable and writable.

Read both before you start.

---

## 1. Prerequisites

- **A Supabase project** with the `signals` and `trades` tables already created. These tables are owned by the [Autonomous Trading System](https://github.com/griffmak/autonomous-trading-dashboard) project — see its wiki page for the canonical table schemas. This dashboard only reads from them.
- **An Alpaca paper-trading account** with an API key ID and secret (https://alpaca.markets → Paper Trading → API keys).
- **A GitHub account.**
- **A Vercel account** (the free Hobby tier is sufficient).

---

## 2. Fork / Clone and Push to GitHub

Fork the repo on GitHub, or clone and push to your own repo:

```bash
git clone https://github.com/griffmak/autonomous-trading-dashboard.git
cd autonomous-trading-dashboard
git remote set-url origin https://github.com/<you>/autonomous-trading-dashboard.git
git push -u origin main
```

---

## 3. Connect to Vercel

1. In the Vercel dashboard, click **Add New → Project**.
2. Import your GitHub repo.
3. Vercel auto-detects the framework as **Next.js** (the committed `vercel.json` already sets `framework`, build, dev, and install commands). Leave the defaults.
4. **Don't deploy yet** — add the environment variables first (next step), otherwise the build will fail env validation.

---

## 4. Set the 6 Environment Variables (Production)

Add all six in **Project Settings → Environment Variables**, scoped to **Production** (add Preview/Development too if you want those environments to work):

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | your Supabase anon key |
| `DASHBOARD_PASSWORD_SECRET` | a strong password you choose |
| `ALPACA_API_KEY` | your Alpaca API key ID |
| `ALPACA_SECRET_KEY` | your Alpaca API secret |
| `ALPACA_BASE_URL` | `https://paper-api.alpaca.markets/v2` |

**Tip — no trailing newlines.** Header-based keys (Alpaca, Supabase) break if a stray newline is appended. The Vercel web UI is safe. On the CLI, use `printf` (not `echo`, which appends `\n`):

```bash
printf '%s' "$VALUE" | vercel env add ALPACA_SECRET_KEY production
```

**Redeploy after any env change.** Adding or editing an environment variable does **not** take effect until you trigger a new deployment.

---

## 5. ⚠️ Disable Vercel Deployment Protection (Required)

New Vercel projects enable **Vercel Authentication** (Deployment Protection) by default. This wraps **every** route — including the app's own login page — in a Vercel SSO wall and returns **HTTP 401** to the public. The result: nobody, not even you, can reach the app.

This app already has its own password gate, so the Vercel SSO wall is redundant and must be turned off:

- **Via the dashboard:** Project Settings → **Deployment Protection** → set **Vercel Authentication** to **Disabled**.
- **Via the REST API:**

  ```bash
  curl -X PATCH "https://api.vercel.com/v9/projects/{projectId}" \
    -H "Authorization: Bearer $VERCEL_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"ssoProtection": null}'
  ```

After this, the app's password gate (`DASHBOARD_PASSWORD_SECRET`) is your access control.

---

## 6. 🔒 Enable Supabase Row-Level Security (Required)

This step is not optional, and here's the honest reason why.

The two `NEXT_PUBLIC_*` Supabase values are inlined into the browser bundle. That means **the anon key is publicly extractable** from any deployed instance — anyone can open dev tools and pull it. The password gate only protects the **UI**; it does nothing to protect the **database**. If RLS is disabled on `signals` and `trades`, anyone with the (public) anon key can read, edit, or delete your trading data directly, completely bypassing the password gate.

You **must** enable RLS on both tables.

### The nuance: keep your writer working

The dashboard **reads** with the anon role. The Autonomous Trading System **writes** to the same tables. Enabling RLS blocks all access by default — including the writer — unless you account for both roles:

- **Writer (trading system):** must use a Supabase **secret / service-role key**, which bypasses RLS entirely. **Confirm your trading system uses a service-role key BEFORE you enable RLS, or its writes will start failing silently.**
- **Dashboard (this app):** the anon role gets a **read-only** `SELECT` policy. (Most secure alternative: move all dashboard reads server-side behind the password gate and deny the anon role entirely — but that's a code change beyond this guide.)

### Example SQL

```sql
-- Enable RLS (blocks everything until policies are added)
ALTER TABLE signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE trades  ENABLE ROW LEVEL SECURITY;

-- Allow the dashboard's anon role to READ only
CREATE POLICY "anon read" ON signals
  FOR SELECT TO anon USING (true);

CREATE POLICY "anon read" ON trades
  FOR SELECT TO anon USING (true);
```

The anon role now has read-only access; no INSERT/UPDATE/DELETE policy means those are denied. The service-role writer bypasses RLS and keeps writing.

> ⚠️ **Order matters.** Confirm the writer uses a service-role key first. If you enable RLS while the writer is still using the anon key, all trade writes will break.

---

## 7. Verify the Deployment

After deploying, confirm the access model is behaving:

```bash
# Root should serve the login HTML (HTTP 200)
curl -s -o /dev/null -w "root: HTTP %{http_code}\n" https://<your-app>.vercel.app/

# A protected route should 307-redirect to / when unauthenticated
curl -s -o /dev/null -w "overview: HTTP %{http_code} -> %{redirect_url}\n" \
  https://<your-app>.vercel.app/overview
```

Expected:

- `root: HTTP 200` — the login page renders.
- `overview: HTTP 307 -> https://<your-app>.vercel.app/` — protected route redirects to login.

Then open the app in a browser, log in with your `DASHBOARD_PASSWORD_SECRET`, and confirm the **Overview** page renders with metric cards, open positions, and recent signals.

> If the root curl returns **401** instead of 200, Deployment Protection is still on — go back to Step 5.

---

## 8. Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| **Login succeeds but bounces back to `/` (redirect loop)** | The `dashboard_auth` cookie isn't being set, or the password doesn't match the deployed secret | Confirm `DASHBOARD_PASSWORD_SECRET` is set in Production with no trailing newline, and that you redeployed after setting it |
| **Positions page shows "Live prices unavailable" / Alpaca 401** | Bad Alpaca keys, or wrong base URL (paper vs. live mismatch) | Re-check `ALPACA_API_KEY` / `ALPACA_SECRET_KEY`; confirm `ALPACA_BASE_URL` is `https://paper-api.alpaca.markets/v2` for paper accounts. Open positions still render with `—` placeholders while prices are unavailable |
| **Tables don't update in real time** | Supabase realtime not connecting (anon key wrong, or RLS read policy missing) | The 5-minute polling backup still refreshes data, so the app keeps working. To fix realtime, verify the anon key and that the `anon read` SELECT policy exists on both tables |
| **Every route returns HTTP 401 (SSO wall)** | Vercel Deployment Protection is still enabled | Disable Vercel Authentication — see Step 5 |
| **Build fails on env validation** | A required env var is missing | All six variables from Step 4 must be present in the environment being built |
