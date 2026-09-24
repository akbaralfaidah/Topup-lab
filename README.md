# TOPUPLAB

TOPUPLAB includes the accepted application foundation, design system, and Phase 3 relational domain schema. The public shell clearly says transactions are not open. Catalog, checkout, payment, provider, wallet, and referral workflows remain unimplemented.

## Requirements

- Node.js 24 LTS and npm.
- PostgreSQL 17 and Redis 7.4 for infrastructure checks, or Docker with Compose.
- Microsoft Edge for the browser checks by default; adjust Playwright's channel for another installed browser.

## Local setup

```powershell
Copy-Item .env.example .env
npm ci
docker compose -f compose.yaml -f compose.local.yaml up -d postgres redis
npm run env:check
npm run db:migrate
npm run db:seed
npm run dev
```

In another terminal, run `npm run worker`. Then run `npm run infra:check` to submit a foundation-only probe and verify that the worker persisted it in PostgreSQL. Retrying a job cannot duplicate its metadata row. The probe has no provider calls or financial effects. Failed jobs are retained for inspection; there is no public job-submission endpoint.

The shell and liveness endpoint work without database/Redis services, provided the environment values are valid. Readiness honestly returns 503 while a dependency is unreachable. Infrastructure commands fail without services rather than substituting mock success.

## Checks

```powershell
npm run lint
npm run typecheck
npm run test
npm run format:check
npm run build
npm run test:browser
npm run db:check
```

Build first, then run browser tests. Playwright starts and stops three isolated production previews on ports 3000, 3100, and 3102; keep these ports free. Tests cover Phase 1 behavior, Design Lab production gating, responsive controls, keyboard use, overlays, axe, enlarged text, and reduced motion. Screenshots are written to ignored `artifacts/`.

## Design Lab (Phase 2)

In demo development, visit `/dev/design-system`. Production disables it by default; a private demo preview can explicitly set `DESIGN_LAB_ENABLED=true`. Live mode always returns 404. All specimens use static demo data and local UI state. See [the design-system guide](docs/design-system.md) for tokens, component usage, brand guidance, and motion rules. Drizzle remains the accepted ORM.

`npm run db:generate` creates committed migration files from the typed schema. `db:migrate` applies migrations; `db:seed` inserts only a version marker and is repeatable. Never use schema push or destructive resets on deployment databases.

## Domain model (Phase 3)

See [the domain-model guide](docs/domain-model.md) for entity groups, ER diagrams, integer-IDR conventions, immutable history, privacy boundaries, and future transaction requirements. Additive migrations preserve the foundation migration and add the relational domain plus database history guards. PostgreSQL 17.11 live validation passed, including migration/seed repetition and guard/recovery tests; see [local setup and acceptance evidence](docs/phase-3-live-validation.md). Run `npm run db:validate:live` against the documented isolated local cluster. No business/demo seed data is added.

Environment validation runs when the server starts, not during compilation. Production startup requires an HTTPS APP_URL and non-placeholder database/Redis passwords. Provider/payment credentials are intentionally absent until their feature phases. A `live` APP_MODE enables no transactions in this foundation.

For a local production-build check, supply production-valid environment values (an HTTPS APP_URL and unique infrastructure credentials), then run `npm start`. Set HOSTNAME to `127.0.0.1` for a loopback-only preview. The build's postbuild step copies public/static assets into the standalone output; the start command loads the local environment and runs that server. The example development passwords are deliberately rejected. APP_URL does not make the local HTTP server provide TLS; use a real TLS reverse proxy in deployment.

## Structure

- `src/app`: Next.js routes, customer shell, protected admin skeleton, error/loading boundaries, health endpoints.
- `src/server`: validated configuration, database/Redis connections, authorization boundary, errors, logs, worker.
- `src/lib/motion`: duration/easing/spring/distance tokens and reduced-motion policy.
- `drizzle`: versioned SQL migrations and generated metadata.
- `scripts`: environment check, migration, seed, and infrastructure probe.
- `tests`: foundation behavior and browser checks.

Domain services, repositories, and provider/payment adapters will be introduced in their assigned phases. Avoid empty module scaffolding. UI must not import server infrastructure; web-facing database/config entrypoints use `server-only`.

## Access and health

- `/`: public preparation notice and service availability disclosure.
- `/admin`: always denied with a 404 until verified sessions and roles exist in Phase 9. Spoofed cookies/headers cannot unlock it. The skeleton contains no operational data or action.
- `/api/health`: process liveness, uncached, with a server-issued request ID.
- `/api/health/ready`: bounded PostgreSQL and Redis checks; 200 when ready, otherwise 503. It does not certify worker health. Use the infrastructure probe to test the worker separately.

Every page/API request passes through a server-generated UUID correlation header; inbound values are replaced. Error responses contain a stable code, safe Indonesian message, and request ID. Structured logs accept a small explicit set of fields; database URLs and raw exception payloads are not logged.

## VPS deployment

1. Copy `.env.production.example` to `.env`, configure your HTTPS domain and unique credentials. URL-encode passwords in connection URLs and use the corresponding raw values for POSTGRES_PASSWORD/REDIS_PASSWORD.
2. Configure your reverse proxy on ports 80/443 with a valid certificate and proxy to `127.0.0.1:3000`. Preserve the Host header and support streaming responses. PostgreSQL and Redis stay on the private Compose network.
3. Run `docker compose --profile app up -d --build`. The one-shot migration service must succeed before web/worker start. After subsequent schema changes, explicitly run `docker compose --profile app run --rm migrate` before rolling out the updated app.
4. Run `docker compose --profile app run --rm migrate npm run db:seed` and `docker compose --profile app run --rm migrate npm run infra:check`.
5. Monitor liveness/readiness, container logs, and failed BullMQ jobs. Configure off-host PostgreSQL backups and test restores before production use. Redis AOF with `everysec` and a persistent volume reduces job loss but can lose roughly the latest second after a crash; future financial processing needs database-backed event/outbox recovery.

Use `compose.local.yaml` only for host-based local development. It exposes database/Redis ports on loopback. Docker's runtime image runs as an unprivileged user; operations use a separate target. Secrets enter at runtime via ignored environment files and are excluded from the build context. Do not expose this Phase 1 foundation as a live transaction service.

## Motion

Use `motion/react`, shared tokens, and the global MotionConfig policy. The service-availability disclosure is the initial use: 4px/opacity feedback on opening, instant with reduced motion. Static page content is visible without hydration. CSS handles simple hover colors. No artificial page delay or continuously animated decoration is included.

`@lottiefiles/dotlottie-react` is approved but intentionally not installed: this phase has no legitimate illustration asset. Add it with the first original/licensed local `.lottie` use, lazily loaded with accessible text/static fallback.

See DESIGN.md's Motion System and MASTER_PROMPT.md's MOTION REVIEW PROTOCOL. Current upstream references: [Next.js installation](https://nextjs.org/docs/app/getting-started/installation), [Motion configuration](https://motion.dev/docs/react-motion-config), and [Motion transitions](https://motion.dev/docs/react-transitions).
