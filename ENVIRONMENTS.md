# Iris: localhost, dev, staging, production

Two repositories, two ordinary CI workflows. No release coordinator or extra GitHub tokens. Files are prepared locally; live environments still need configuration.

## Localhost

Run `npm ci` in both repositories. Start the Worker with `npm run dev` (local KV, port 8787) and frontend with `npm start` (localhost:5173). Use `VITE_API_BASE=http://localhost:8787` in the frontend's existing local configuration; do not overwrite local secrets.

`npm run test:vertical` starts a separate seeded, cache-only Worker and frontend preview. Stop other servers on port 8787 first. It does not access remote KV or providers. Normal local Worker mode can use local provider keys and a local authenticated refresh for live data.

## One-time setup

1. **Before merging this transition**, disable Vercel's external Git auto-deployment and resolve queued builds. The checked-in `vercel.json` also disables it, but does not protect historical revisions. Record the current production frontend/Worker SHAs, versions, and deployment IDs.
2. Keep the production Vercel project; create separate dev and staging projects with Node 24, stable URLs, and Git auto-deployment disabled. Each project's Vercel Production target serves that Iris environment—it does not make dev an Iris production deployment.
3. Provision/verify three distinct Worker KV namespaces. Set their actual IDs and corresponding stable frontend CORS origins in the Worker's existing `wrangler.toml`. Dev's existing namespace and frontend origin are now verified (see below); local/E2E placeholders stay local. Verify staging/production bindings before activation. Do not add `remote=true` to local bindings.
4. Configure provider keys and `REFRESH_TOKEN` separately as secrets on each remote Worker. Shared dev has no Cron; staging/production retain hourly Cron. Dev still has on-demand provider caches.
5. Solo-maintainer policy: require PRs and successful CI on `main` (frontend `test-and-build` + `vertical`, Worker `test`), but no mandatory independent PR approval. Review your own diff before merging; block force pushes and deletion. Create GitHub environments `dev`, `staging`, `production` in **both** repositories. Production requires your explicit approval where supported, with **prevent self-review off** so you are not locked out; restrict deployment branches to protected `main` and disable approval bypass where supported. Secure the existing frontend `Production` environment rather than assuming a second independent gate. If your GitHub plan cannot enforce approval, keep production disabled and resolve that policy first.

Configure these in each GitHub environment, not as shared production repository secrets:

| Repository | Variables | Secrets |
| --- | --- | --- |
| Frontend | `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`, `VITE_API_BASE`, `VITE_OPENAPI_URL` | `VERCEL_TOKEN` |
| Worker | `CLOUDFLARE_ACCOUNT_ID`, `IRIS_WORKER_ORIGIN` | `CLOUDFLARE_API_TOKEN`, `IRIS_REFRESH_TOKEN` |

Use the corresponding environment's project/API URLs. API origins must be HTTPS with no path/trailing slash. `VITE_OPENAPI_URL` should pin the compatible Worker SHA's public `openapi.yaml`, not a moving branch. `IRIS_REFRESH_TOKEN` must match that Worker's `REFRESH_TOKEN`. Tokens need only their provider's deployment permissions; no cross-repository dispatch or administration-read token is needed.

Set frontend repository variable `IRIS_WORKER_SHA` to the exact compatible Worker commit used by vertical CI. Update it deliberately for coordinated changes, and keep it at the staging-tested Worker SHA when testing/promoting the frontend. A missing pin fails CI; no matching-branch guessing.

Leave environment variable `DEPLOY_ENABLED` unset until that target's settings, storage isolation, secrets, CORS, and protections are verified. Then set it to `true`. Enable dev first, then staging; enable production only after staging and rollback rehearsal. The workflows trust native GitHub protections; they do not audit provider settings for you.

## Daily flow

- Develop locally → PR → existing checks → merge. Each repository independently deploys its tested `main` commit to **dev**.
- For initial dev data or a later refresh, manually run Worker **CI** from `main`, choose `dev`, provide its exact SHA, and enable `refresh_dev`. Automatic dev merges do not refresh snapshots. Inspect failures before retrying.
- For a release, manually run each repository's **CI** from `main`, choose `staging`, and provide the exact merged SHA tested in dev. Run the Worker first when both change. Staging/production refresh automatically; all deployments reuse the existing CI checks, not a second test framework.
- Check the browser flow, frontend/API versions, `/health`, `/ready`, `/v3/status`, fresh data, and CORS in staging. Record the two SHAs/versions and provider deployment IDs in release notes (workflow summaries/logs supply the commit/deployment evidence).
- Manually select **production** with those same staging-tested SHAs. As sole maintainer, explicitly approve the pair and rollback plan through each repository's native production environment gate. Promotion history is an operator check, not a custom automated gate.

## Rollback

Restore the prior compatible Vercel deployment and Worker version using provider controls, **without reverting KV data**, then check versions, readiness, status, browser connectivity, and CORS. Rehearse this in staging before enabling production. Releases across two providers are not atomic: keep API changes backward-compatible, serialize manual deploys with CI, and inspect both providers after a failure. Basic Worker smoke checks are automated; full browser acceptance is manual.

## Current dev preparation — verified 2026-10-08

- Vercel project `iris-dev` exists with Vite, Node 24, `npm run build`, and `dist`. Its assigned domain is `iris-dev.vercel.app`; it has no Git link and no deployments.
- Existing Cloudflare `dev-SNAPSHOTS` is bound in the local dev configuration, separately from staging/production. `iris-api-dev` does not yet exist; creating the application requires its first deployment.
- Both GitHub `dev` environments exist, permit only branch `main`, and have `DEPLOY_ENABLED=false`. Verified Vercel IDs/Cloudflare account ID are configured. A bootstrap Worker/OpenAPI pin points to the current published Worker `main` commit; compatibility with this local checkout still requires frontend CI. Local and published Worker HEADs differ; no source was synchronized or overwritten.
- Still needed: the actual dev Worker origin, environment-scoped CI deployment tokens, dev Worker provider/refresh secrets, main protections, and separately authorized production transition settings. CLI login does not supply GitHub Actions credentials. No Worker origin was guessed, no deployment was run, and no production settings were changed.

Publication checkpoint: the local frontend includes two unpublished testing commits and the Worker includes one. Published Worker `fc48b71` (the bootstrap pin) lacks `e2e:serve`; local Worker `8b6db71` adds it. Review/publish the required Worker testing changes first, then pin an exact published revision containing them before expecting frontend vertical CI to pass. Do not replace the pin with an unpublished SHA or silently omit the prerequisite testing changes. PRs from the current local heads include those existing commits as well as the environment edits.
