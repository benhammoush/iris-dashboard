# Iris

Iris is a Create React App portfolio dashboard backed only by the Iris Worker API. The browser never contacts chain, pricing, or legacy application providers directly.

## Architecture

`src/api/client.js` is the sole HTTP client. It reads `VITE_API_BASE`, adds request IDs, applies a 10-second timeout, parses Worker response envelopes (`{ data, meta }`), and normalizes failures. `src/api/worker.js` calls `/v1/market`, `/v1/assets`, `/v1/assets/:symbol`, `/v1/swaps`, and `/v1/wallets`. The client adapts normalized Worker asset, market-history, price-history, and swap objects for the UI.

Worker errors are shown to users. Market, asset catalog, and swap requests use local, non-sensitive emergency display fixtures only when `REACT_APP_ENABLE_FIXTURES=true`; the status line identifies fixture data. Wallet details never use a fixture address: an unconfigured or unknown address is shown as not tracked.

Live ALEX price data is currently unavailable. Dashboard and asset prices and charts therefore use a fixed market snapshot, with an optional snapshot time supplied by Worker metadata. Blockchain fees, blocks, wallet balances, and activity remain live.

## Local Development

1. Copy `.env.example` to `.env.local` and set the Worker origin. Do not put credentials in browser environment variables.
2. Run `npm ci`.
3. Run `npm start`.

Use `CI=true npm test -- --watchAll=false` for a non-watch test run and `npm run build` for a production build.

## Vercel

Vercel uses Node 20 (`.nvmrc`) and `vercel.json` to build `dist/`. The SPA fallback explicitly excludes `/api` so it cannot return `index.html` for API requests. This app does not configure an `/api/:path*` proxy because it calls the Worker directly.

In Vercel Project Settings -> Environment Variables, set `VITE_API_BASE` to the public Worker origin for Production, Preview, and Development as needed. Redeploy after changing it because Vite embeds `VITE_*` values at build time. Production without this value renders `CONFIGURATION_ERROR` instead of guessing a Worker hostname. Set `VITE_ENABLE_FIXTURES=true` only for an intentional emergency display-fixture deployment; otherwise leave it unset or `false`. These values are public browser configuration, not secrets.
