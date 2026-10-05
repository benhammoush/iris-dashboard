# Iris

Iris is a Vite market monitor and public-wallet viewer backed only by the Iris Worker API. The browser never contacts chain, pricing, or legacy application providers directly.

## Architecture

`src/api/client.js` is the sole HTTP client. It reads `VITE_API_BASE`, adds request IDs, applies a 10-second timeout, parses Worker response envelopes (`{ data, meta }`), and normalizes failures. `src/api/worker.js` calls the Worker `/v3` routes for assets, per-mint history, wallet summaries, and cursor-paginated wallet transactions.

Worker errors are shown to users. Market, asset catalog, and swap requests use local, non-sensitive emergency display fixtures only when `VITE_ENABLE_FIXTURES=true`; the status line identifies fixture data. Wallet details never use a fixture address: an unconfigured or unknown address is shown as not tracked.

The Home chart defaults to SOL. Its selected mint and range are URL query parameters, while catalog rows open asset detail. Current metrics are labeled as Jupiter, history as CoinGecko, and volume as reviewed-pool swaps. Optional metrics stay hidden if absent. Asset audit metadata is displayed as an indicator only and never as a safety claim. Wallets show priced subtotals and valuation coverage when pricing is partial, and load transaction pages using Worker cursors.

The compact status display shows Worker provenance and freshness only when supplied, with diagnostics for errors.

## Local Development

1. Copy `.env.example` to `.env.local` and set the Worker origin. Do not put credentials in browser environment variables.
2. Run `npm ci`.
3. Run `npm start`.

Use `CI=true npm test -- --watchAll=false` for a non-watch test run and `npm run build` for a production build.

## Vercel

Vercel uses Node 24 (`.nvmrc`) and `vercel.json` to build `dist/`. The SPA fallback explicitly excludes `/api` so it cannot return `index.html` for API requests. This app does not configure an `/api/:path*` proxy because it calls the Worker directly.

In Vercel Project Settings -> Environment Variables, set `VITE_API_BASE` to the public Worker origin for Production, Preview, and Development as needed. Redeploy after changing it because Vite embeds `VITE_*` values at build time. Production without this value renders `CONFIGURATION_ERROR` instead of guessing a Worker hostname. Set `VITE_ENABLE_FIXTURES=true` only for an intentional emergency display-fixture deployment; otherwise leave it unset or `false`. These values are public browser configuration, not secrets.
