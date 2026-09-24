# Phase 3 — Database Domain Model

Validation date: 2026-09-24. Scope: persistence architecture only, under the user's explicit Phase 3 and local-migration authorization.

Live-validation follow-up: the original infrastructure gap is now closed. PostgreSQL 17.11 passed 210 live checks. One whitespace-key defect was fixed with additive migration `0003_key_whitespace_guards.sql`; the original three migrations were preserved. See [the live acceptance report](phase-3-live-validation.md) for setup, results and remaining boundaries.

## Completed

Added the relational domain, additive migrations, database guards, schema tests and domain documentation. Preserved the accepted foundation and design system. No Phase 4 data, business services, transaction endpoints or product UI were implemented.

Git preflight found an existing clean repository with baseline `4200337` (`chore: establish TOPUPLAB foundation and design system`). The existing origin remote was left unchanged. No repository initialization, commit, history rewrite, remote configuration or push was performed. Existing ignore rules exclude environment files, build output, screenshots, runtime data and secret files.

## Domain Architecture

47 domain tables plus the original foundation table, organized by identity, catalog, supply, pricing, orders, payments, fulfillment, wallet, promotions, referrals and operations. UUIDv4 entity/public references, timezone-safe timestamps and explicit restricted foreign keys are consistent across contexts. The [domain-model guide](domain-model.md) contains inventory, bounded ER diagrams, indexes and implementation boundaries.

## Financial Invariants

- Whole-IDR bigint storage maps to JavaScript bigint; no floating-point money.
- Integer basis points represent percentages, with explicit range checks.
- Immutable snapshots preserve unit prices, discounts, fees, provider costs and expected margins; row checks enforce arithmetic identities.
- Composite foreign keys prevent mismatched SKU/provider/product, item/order/product, payment/order amount and wallet/currency associations.
- History guards reject ordinary update/delete/truncate; mutable financial records allow only specified lifecycle updates. External references are write-once after assignment.
- Wallet truth is an append-only ledger; corrections append compensating entries.
- Uniqueness supports event/command deduplication. Cross-row totals, state transitions, settlement, quotas, journal balancing and eligibility still require future atomic business transactions.

## Schema Added

All requested entities, plus separate password credentials/sessions, normalized brands, promo scope junctions, immutable snapshot promos, event-processing companions and flash-sale reservations. There are 25 centralized PostgreSQL enum types. Membership names remain configurable data. JSON is limited to strict descriptive metadata; provider secrets, game passwords, card credentials and unnecessary personal data are excluded.

## Migration

1. `0000_foundation.sql` and its snapshot are unchanged.
2. `0001_domain_model.sql` creates the domain tables, enums, checks, indexes and foreign keys.
3. `0002_domain_guards.sql` adds history/term/reference guards, update timestamps and nonblank idempotency/event-key checks.
4. `0003_key_whitespace_guards.sql` rejects tab/newline-only keys and enforces the raw 200-character limit, correcting the defect found by live boundary tests.

All new migrations are journaled with snapshots. Repeat generation reported no schema changes; hashes of every migration/metadata file were unchanged. `db:check` passed. Custom trigger DDL is intentionally outside Drizzle's schema diff representation and must remain in versioned migrations.

An initial generator attempt exposed drizzle-kit's inability to serialize bigint JavaScript defaults; SQL integer defaults corrected that without changing the money representation. An initial test-helper type error was corrected before the successful typecheck/build. These initial failures are not counted as successful validation.

## Skills Used

| Skill                   | Applied work                                                                                    |
| ----------------------- | ----------------------------------------------------------------------------------------------- |
| antislop                | Throughout-work scope and purpose review; no speculative UI or filler                           |
| antislop-code           | Comments explain actual invariants and limitations; comment hygiene only                        |
| full-output-enforcement | Complete entity inventory, finished source and honest validation reporting                      |
| drizzle-orm-expert      | Modular pg-core schema, composite constraints, generated migrations and metadata checks         |
| database-design         | Keys, relationships, money types, query-oriented indexes and additive migration policy          |
| postgresql              | bigint/timestamptz/enums, SQL checks, partial uniqueness and trigger guards                     |
| typescript-pro          | Inferred domain types, strict JSON contracts and typed metadata tests                           |
| security-auditor        | Secret exclusions, digest-only sessions, sensitive target storage and history/deletion review   |
| backend-architect       | Context separation and explicit boundary between structural and future transactional invariants |

The user-selected throughout-work antislop preference was retained. Installed skill guidance was applied within the accepted stack and Phase 3 scope. No visual skill was needed for this database-only phase.

## Skills Unavailable

None among the required or selected database, ORM, TypeScript, security and backend skills. No missing skill was simulated.

## Files Changed

- `src/server/db/schema.ts`: retained foundation table and exported domain modules.
- `src/server/db/schema/`: auth, catalog, providers, pricing, orders, payments, fulfillment, wallet, promotions, referrals, operations, enums, shared conventions and JSON validation.
- `drizzle/0001_domain_model.sql`, `drizzle/0002_domain_guards.sql`, corresponding snapshots and journal.
- `tests/domain-schema.test.ts`: nine infrastructure-independent invariant tests.
- `scripts/migrate.ts`: success message now covers all database migrations.
- `package.json`: added `db:check`; no dependencies added or versions changed.
- `docs/domain-model.md`, this report, `docs/foundation-decisions.md`, `README.md`, `MASTER_PROMPT.md`: current phase, architecture and validation guidance.

The dependency lockfile, skills lockfile, original migration/snapshot, seed, UI components/routes and motion implementation are unchanged.

## Validation

| Check                                       | Result                                                           |
| ------------------------------------------- | ---------------------------------------------------------------- |
| Formatting                                  | Full repository `format:check` passed                            |
| Lint                                        | Passed, zero warnings allowed                                    |
| Typecheck                                   | Passed                                                           |
| Unit tests                                  | 21/21 passed: 12 existing, 9 new                                 |
| Production build and standalone preparation | Passed                                                           |
| Migration generation                        | Passed; repeat generation unchanged, all migration hashes stable |
| Drizzle migration consistency               | Passed                                                           |
| Browser regressions                         | 26/26 passed against isolated production previews                |

Schema tests cover table inventory, bigint precision/ranges, integer percentages, restricted FKs, required uniqueness, composite associations, exact order states, pending-attempt uniqueness, history definitions/custom DDL presence, credential exclusions, relational tiers and strict target/metadata validation. Custom DDL presence checks are not a substitute for executing triggers in PostgreSQL.

## Database Validation

The initial migration attempt failed while PostgreSQL was unavailable. Under the user's subsequent setup authorization, a project-local PostgreSQL 17.11 cluster was initialized on loopback port 55417 without a Windows service or system installation. The existing application configuration was preserved.

Clean-database migration, repeat application, repeated technical seed, guard/constraint behavior, exact bigint round-trips and failure/retry recovery all passed in the final 210-check live run. An existing three-migration disposable database also upgraded to migration 0003 and repeated safely. All temporary fixtures were rolled back. The technical seed remains unchanged. Redis/worker integration was not revalidated; the discovered Redis 5 binary is older than the accepted stack.

## Regression Status

All 26 Phase 1/2 browser tests passed in one full run (1.3 minutes). Coverage includes the shell and Design Lab at 320, 360, 390, 768, 1024, 1280 and 1440 pixels; controls and overlays; focus trapping/return, Escape and keyboard navigation; axe checks; 200% text; reduced motion; JavaScript-disabled essential content; protected admin routes; health/request IDs; and Design Lab production gating. Responsive screenshots were regenerated in ignored artifacts. No UI implementation changed, and no new visual-design claim is made from this database phase.

## Remaining

The Phase 3 live database validation is complete. Future phases must implement authenticated writers, atomic state/history updates, JSON validation at write boundaries, safe target encryption, financial concurrency checks and least-privilege runtime database roles. None of those workflows is represented as complete by this schema phase.

Phase 4 remains unstarted.

## Risks

Custom SQL was executed and tested against PostgreSQL 17.11. Database owners can disable triggers; deploy migrations with an operations identity and restrict runtime DDL privileges. Application-level Zod validation is not automatically invoked by Drizzle insert calls. Polymorphic audit/ledger references need trusted writers. Privacy retention/erasure, guest flash-sale identity and guest notification delivery need explicit future policies. These limits are documented in the domain guide and do not imply working financial services.
