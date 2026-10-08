# Iris

Iris is a Vite market monitor and public-wallet viewer backed only by the Iris Worker API. The browser never contacts chain, pricing, or legacy application providers directly. Visit `/api-docs` for Swagger UI documentation of the Worker API.

For the detailed frontend-to-Worker organigram, request map, cache layers, provider boundaries, and refresh flow, see the Worker repository's [`ARCHITECTURE.md`](https://github.com/benhammoush/iris-worker-api/blob/main/ARCHITECTURE.md).

## Architecture

`src/api/client.js` is the sole HTTP client. It reads `VITE_API_BASE`, adds request IDs, applies a 10-second timeout, parses Worker response envelopes (`{ data, meta }`), and normalizes failures. `src/api/worker.js` calls the Worker `/v3` routes for assets, per-mint Birdeye candles and compatibility history, the DefiLlama dashboard, wallet summaries, and cursor-paginated wallet transactions.

Worker errors are shown to users. Market, asset catalog, and swap requests use local, non-sensitive emergency display fixtures only when `VITE_ENABLE_FIXTURES=true`; the status line identifies fixture data. Wallet details never use a fixture address: an unconfigured or unknown address is shown as not tracked.

Asset detail renders Birdeye USD candlesticks and USD volume for its selected mint and `1H`, `4H`, `1D`, or `7D` range. Current metrics are labeled as Jupiter. Its Helius-branded intelligence panel shows mint-address history and the 20 largest token accounts; mint history is not represented as a complete token-wide transfer ledger and largest accounts are not unique holders. Between the Helius and Jupiter cards, DefiLlama shows aggregate Solana DEX volume and tracked DeFi protocols ranked by Solana TVL; it is not an inventory of all Solana programs. Optional metrics stay hidden if absent. Asset audit metadata is displayed as an indicator only and never as a safety claim. Wallets show priced subtotals and valuation coverage when pricing is partial, and load transaction pages using Worker cursors.

The compact status display shows Worker provenance and freshness only when supplied, with diagnostics for errors.

## Local Development

1. Copy `.env.example` to `.env.local` and set the Worker origin. Do not put credentials in browser environment variables.
2. Run `npm ci`.
3. Run `npm start`.

Use `CI=true npm test -- --watchAll=false` for a non-watch test run and `npm run build` for a production build.

## Testing

`npm test` runs frontend unit and component tests. `npm run test:e2e` runs deterministic browser journeys with Worker requests intercepted by test fixtures.

`npm run test:vertical` runs the built frontend against a real local Wrangler Worker and fresh local KV records. It requires the Worker checkout as a sibling named `Iris-Worker-Api-Public`, or `IRIS_WORKER_ROOT` can point to another checkout. The suite disables provider access in the Worker and fails if the browser calls a provider directly. CI checks out a Worker branch with the same name as the frontend branch; a missing counterpart fails instead of falling back to another environment.

## Vercel

Vercel uses Node 24 (`.nvmrc`) and `vercel.json` to build `dist/`. The SPA fallback explicitly excludes `/api` so it cannot return `index.html` for API requests. This app does not configure an `/api/:path*` proxy because it calls the Worker directly.

In Vercel Project Settings -> Environment Variables, set `VITE_API_BASE` to the public Worker origin for Production, Preview, and Development as needed. Set `VITE_OPENAPI_URL` to the published Worker `openapi.yaml` when production documentation should follow a different branch or release; it otherwise uses the canonical GitHub document. Redeploy after changing either because Vite embeds `VITE_*` values at build time. Production without `VITE_API_BASE` renders `CONFIGURATION_ERROR` on product routes instead of guessing a Worker hostname; `/api-docs` remains available because it loads its own public specification URL. Set `VITE_ENABLE_FIXTURES=true` only for an intentional emergency display-fixture deployment; otherwise leave it unset or `false`. These values are public browser configuration, not secrets.
