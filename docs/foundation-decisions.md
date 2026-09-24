# Foundation decisions

## Scope

Phase 1 follows MASTER_PROMPT.md, with the user's skill-availability and motion amendments. The PRD's full MVP phase is a separate, later scope. This foundation introduces no money, user, order, or provider domain tables. Phase 0 is accepted.

## Implementation choices

- Next.js App Router with strict TypeScript keeps static shell rendering on the server and interactive motion in small client components.
- Drizzle with node-postgres is the specification's equivalent typed ORM option. One metadata table supports real migration/seed/worker checks without bringing the Phase 3 domain model forward.
- Redis/BullMQ establishes a durable queue with bounded retries, retained failures, and graceful shutdown. The only job is an infrastructure probe that writes an idempotent database marker.
- Admin authorization denies all access until Phase 9 introduces verified sessions and role policies. No temporary password, role cookie, header override, or demo backdoor is provided.
- Environment schema parsing is testable separately from the server-only cached entrypoint. Validation fails with field names, not secret values. Compilation needs no infrastructure secrets; server startup validates runtime configuration.
- Docker has separate standalone web and operations targets. PostgreSQL and Redis remain private except for the explicit local-development override.
- TypeScript is pinned to 6.0.3 because the current typescript-eslint parser supports versions below 6.1; TypeScript 7 failed lint initialization. ESLint 9 remains pinned to satisfy the React/accessibility plugins' peer ranges even though npm marks that line deprecated.
- The legacy loader within drizzle-kit pins a vulnerable esbuild version. A scoped override upgrades only that loader's esbuild to 0.25.12, matching drizzle-kit's own supported compiler. A fresh lockfile resolution is required because npm retained the prior nested version in the existing install tree. Migration generation is rechecked with the override.

## Shell design read

Reading this as a preparation notice and customer-shell foundation for Indonesian top-up customers, with light surfaces, neutral ink, and a restrained chartreuse accent. This is not the complete homepage.

Antislop dials: ENERGY 2 / RHYTHM 2 / MOTION 2. Taste dials: DESIGN_VARIANCE 4 / MOTION_INTENSITY 3 / VISUAL_DENSITY 4, with the user-requested disclosure transition as purposeful state feedback.

- Color: lime identifies the LAB portion of the temporary text wordmark; neutral surfaces keep the preparation message readable.
- Layout: a short introduction is followed by actual service availability and one expandable answer. No catalog or purchase controls imply unimplemented behavior.
- Typography: locally bundled Plus Jakarta Sans offers open counters and readable Indonesian text within the preferred font direction. One variable family serves headings and body. `font-display: optional` avoids a delayed visible swap and never hides essential content pending a font download.
- Spacing: the 4px-derived scale separates orientation from availability; the narrow state reduces padding and stacks the availability section.
- Components: semantic HTML links/buttons are the initial accessible primitives. No modal or menu library is added before a feature requires it.
- Imagery: no generated illustrations, competitor art, invented logos, or decorative product previews are needed for the foundation notice.
- Motion: opening the availability answer uses 4px and opacity to show a user-requested state change. Reduced motion is immediate. Closing is immediate to avoid leaving hidden content focusable. There is no navigation delay or animated financial state.
- Theme: light-only follows DESIGN.md; a dark-mode toggle is outside this foundation scope.

## Skill application

The user selected antislop throughout implementation. Actual project skills are now available, superseding the earlier assumption in the pasted request that antislop-code and antislop-ui were absent.

- full-output-enforcement: scope inventory, complete source files, validation honesty, and final cross-check.
- antislop: purpose checks and review gate for the foundation shell.
- antislop-code: comment hygiene only; executable correctness is checked separately.
- antislop-ui: working navigation, honest availability, restrained accents, and no fabricated feature UI.
- design-system: semantic tokens, font loading, responsive shell, and centralized motion timing.
- design-taste-frontend: brief inference, hierarchy, client/server split, and shell review. Landing-page imagery and marketing patterns are not applied to this foundation notice.
- design-spatial: responsive overflow measurement and rendered review; its independent review instruction triggered a read-only reviewer.
- antislop-human: contrast computation, keyboard/focus, and perceivable loading/error states.
- antislop-layoutmobile: fluid type, target sizing, and narrow/tablet/desktop reflow.
- antislop-copywriting: concise Indonesian availability/error copy without claims of existing transaction functionality.

The companion `design` skill referenced by design-system was not found in the inspected global skill root. DESIGN.md already supplies the user's visual direction, so the missing skill does not block this scope. No missing skill is simulated. Other brand, image, catalog, checkout, and dashboard skills are deferred until their relevant phases.

## Approved deferred dependency

`@lottiefiles/dotlottie-react` is approved for the first legitimate illustration use. It is not installed in Phase 1 because no `.lottie` asset is required. Future use must be locally managed, licensed/original, lazy-loaded when non-critical, and accompanied by a static/text fallback.

# Phase 2 acceptance boundary — 2026-09-23

Phase 1 is accepted by the user. Drizzle ORM is now the accepted ORM; no Prisma migration is authorized. Phase 2 adds brand, design-system, and motion foundations only. The public preparation notice, authorization denial, health endpoints, request IDs, and infrastructure behavior remain in place. See `design-system.md` and `phase-2-report.md` for the visual-system implementation and validation.

## Phase 3 scope — 2026-09-24

The user accepted Phase 2 and authorized the database domain model and local migrations. Drizzle/PostgreSQL remain unchanged. Phase 3 adds relational schema, structural constraints, history guards, schema tests and documentation only. See `domain-model.md` and `phase-3-report.md`. Phase 4 demo data and all business workflows require a later instruction.

## Phase 4 scope (2026-09-24)

The user accepted Phase 3 and its live database validation, then authorized deterministic local demo fixtures only. The separate `db:seed:demo` command is restricted to explicitly named disposable local databases and has no effect on the technical seed or production environments. The dataset is versioned and checked for drift without updating immutable history. See `demo-data.md`. Phase 5 pages and all business workflows still require later authorization.

## Phase 5 scope (2026-09-24)

The user accepted Phase 4 and authorized the public homepage only. The page reads a limited, read-only projection of the existing demo database in local development. Live and production modes show an unavailable catalog state until real data and workflows are implemented. See `phase-5-homepage.md`. Phase 6 later added read-only catalog/search; Phase 7 product/checkout flows remain deferred.

## Phase 6 scope (2026-09-24)

The user accepted Phase 5 and authorized public catalog discovery and search only. The shared customer-safe projection serves the homepage and `/products`; `/games/[slug]` previews game denominations without input or purchase behavior. URL parameters hold search, category, availability and sort state. The feature remains restricted to the existing local demo database and remains unavailable in production. See `phase-6-catalog.md`. Phase 7 and all business mutations remain deferred.

## Phase 7 scope (2026-09-24)

The user accepted Phase 6 and authorized transaction-preparation UI with deterministic, server-authoritative demo quote previews. The game route now prepares a transaction; non-game products share the form through `/products/[slug]`. The quote endpoint recalculates prices from eligible demo supply and Public-tier rules without domain writes. Target data is validated and masked for review, not persisted. See `phase-7-product-checkout.md`. Phase 8 pricing administration, Phase 10 orders, and payment/provider workflows remain deferred.
