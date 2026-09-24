# Phase 3 live PostgreSQL acceptance

Validated on 2026-09-24 with PostgreSQL 17.11 for Windows x64. Phase 4 remains unstarted.

## PostgreSQL setup

The existing environment had no PostgreSQL or Docker installation available. A project-local EDB binary distribution was used, following the ZIP option linked by [PostgreSQL's Windows download page](https://www.postgresql.org/download/windows/). No Windows service, system installer, firewall change, global PATH change or production connection was used.

- Official archive: [PostgreSQL 17.11-4 Windows x64 binaries](https://get.enterprisedb.com/postgresql/postgresql-17.11-4-windows-x64-binaries.zip), resolved from EDB's official download page.
- Download SHA-256: `b9424ee7bc60b52450ff910a3630225df32e633f3cb29c1d126d9299d59aea28`. This records the downloaded archive's fingerprint, not a separately verified publisher checksum.
- Server binaries: `runtime/postgresql17/distribution/pgsql/bin/`.
- Cluster data: `runtime/postgresql17/data/`.
- Bind address: `127.0.0.1`, port `55417`.
- Authentication: SCRAM-SHA-256 with a randomly generated 32-byte password.
- Cluster: UTF-8, locale C, timezone Asia/Bangkok, data checksums enabled.
- Local operations role: `topuplab_local`; this is a development cluster owner, not a production runtime-role template.
- Connection configuration: `runtime/postgresql17/local.json`. The runtime directory's Windows ACL is restricted to the current user. The temporary initialization password file was removed.

The archive, binaries, data, credentials and logs are ignored by Git. The existing `.env` and Compose configuration were not changed. Validation supplies explicit test-only environment overrides to child processes; the application cannot accidentally start using a test database through a changed `.env`.

## Running locally

Run these commands from the repository in the same Windows user account that owns the cluster:

```powershell
./scripts/local-postgres.ps1 start
npm run db:validate:live
./scripts/local-postgres.ps1 status
```

Stop the local server when it is no longer needed:

```powershell
./scripts/local-postgres.ps1 stop
```

The helper controls only this project's PostgreSQL 17 data directory and launches the server hidden. It does not register a service or bypass PowerShell execution policy. If another computer needs setup, obtain the official PostgreSQL 17 ZIP, extract its `pgsql/bin`, `pgsql/lib` and `pgsql/share` directories, and initialize a new user-owned cluster with `initdb`, UTF-8, data checksums and SCRAM authentication. Configure loopback port 55417 and create the protected local connection file. Do not copy this machine's credentials or data directory to another environment.

`db:validate:live` refuses a host other than 127.0.0.1, a port other than 55417, or an unexpected maintenance database/role. It generates new names prefixed `topuplab_phase3_`, creates fresh disposable databases, and runs the existing `npm run db:migrate` and `npm run db:seed` commands. It never uses schema push, production URLs or the application's default database connection. It intentionally leaves the empty/technical-seed test databases available for inspection rather than adding automatic destructive cleanup tooling.

## Migration and seed results

The final clean run applied these files in journal order and checked their database hashes against the local files:

1. `0000_foundation.sql`
2. `0001_domain_model.sql`
3. `0002_domain_guards.sql`
4. `0003_key_whitespace_guards.sql`

The second migrator run preserved every journal row. The technical seed ran twice, preserving one identical `foundation_version=1` row, including its timestamps. No business/demo data was seeded.

The first three migrations remain unchanged. Live boundary testing found that the original `btrim(key)` check accepted tab/newline-only keys. Additive migration `0003` replaces those checks with a 1–200-character raw length limit and a requirement for a non-whitespace character. It does not rewrite event identities or repair existing data silently. An existing database containing invalid keys would fail validation of the new check and require explicit data review.

The correction was also applied with the existing migrator to the already-created three-migration database `topuplab_phase3_466081355923`; the fourth journal row appeared, and a repeated run succeeded without adding another row.

## Guard and constraint tests

The final full run passed **210 checks**. The reusable harness is `scripts/validate-phase3.ts`, with live assertions in `tests/integration/phase3.ts`. Detailed results are written to ignored `artifacts/phase3-live.json`.

| Coverage                    | Observed result                                                                                                                           |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Database inventory          | All 48 tables and 25 enums match Drizzle; enum labels and order also match                                                                |
| Numeric types               | All 35 `_idr` / `_bps` columns are bigint / integer respectively                                                                          |
| Immutable history           | UPDATE rejected on all 14 immutable history tables                                                                                        |
| Deletion/truncation         | DELETE and TRUNCATE rejected on all 14 immutable tables and seven protected mutable tables                                                |
| Allowed updates             | Lifecycle updates succeed for orders, payments, provider attempts, wallets, flash reservations and both event-processing tables           |
| Immutable mutable-row terms | Identity/creation-term rewrites rejected on those seven tables                                                                            |
| External references         | Initial assignment and same-value updates succeed; replacement and clearing fail for payment/provider references                          |
| Composite associations      | Mismatched product/provider/SKU, item/order, payment/order amount, event ownership, ledger correction wallet and referral owner rejected  |
| Uniqueness                  | Duplicate command/event identities and provider SKU mappings rejected; pending/successful attempts prevent another unresolved fulfillment |
| Key validity                | Empty, spaces-only, tab/newline-only and overlength identities rejected across every event/idempotency-key table                          |
| Money checks                | Negative nonnegative-money fields rejected; signed snapshot markup/margin remain intentional exceptions                                   |
| Basis points                | Negative, above-maximum and fractional string parameters rejected for every basis-point field                                             |
| Arithmetic                  | Incorrect snapshot final amount, markup and expected margin rejected independently                                                        |
| Referral                    | Structurally identifiable self-referral rejected                                                                                          |
| Foreign-key deletion        | Deleting a referenced user rejected                                                                                                       |
| Precision                   | IDR 20,500; 9,007,199,254,740,993; and 9,223,372,036,854,775,807 round-trip exactly through PostgreSQL and Drizzle bigint mode            |
| Limits                      | Bigint overflow and fractional IDR string parameters rejected; snapshot arithmetic passes at the bigint maximum                           |
| Percentage round-trip       | 0, 1 and 10,000 basis points round-trip exactly                                                                                           |
| Cleanup                     | All temporary fixtures rolled back; every domain table contains zero business/demo rows afterward                                         |

Tests use savepoints to recover from expected constraint errors without weakening constraints or disabling triggers. TRUNCATE tests include dependent fixture tables using CASCADE so foreign-key dependency checks do not prevent reaching the truncate guards. All fixture writes occur within a transaction that is rolled back even on test failure.

Integer storage is exact, but SQL can explicitly cast and round a numeric expression to integer before insertion. Future writers must retain runtime integer validation; passing this suite does not authorize floating-point business arithmetic.

Final clean/recovery databases:

- `topuplab_phase3_be479bdd6666`
- `topuplab_phase3_be479bdd6666_recovery`

Earlier harness-development databases are also disposable and contain no retained business fixtures. No existing non-test database was modified.

## Recovery behavior

The installed Drizzle migrator applies pending SQL and journal entries within a transaction. The recovery test created a deliberate `users` table collision in a separate new database, then invoked the unchanged migrator. The run failed as expected: no pending domain tables, enums or migration journal entries survived; only the pre-created probe table remained. Removing that specific test probe allowed the real migrations to complete, and a repeat run succeeded.

This verifies failure atomicity and retry recovery. It does not claim support for down migrations. No destructive rollback framework was added.

## Skills used

- postgresql: native types, SQLSTATE checks, trigger behavior and transactional DDL validation.
- drizzle-orm-expert: existing migration/seed commands, journal hashes, additive custom migration and typed bigint round-trips.
- database-design: migration history preservation and recovery testing.
- security-auditor: loopback isolation, protected local credentials, production exclusion and adversarial guard tests.
- antislop / antislop-code: throughout-work scope discipline and concise comments explaining constraints.
- full-output-enforcement: complete live-test inventory and reporting actual failures as well as final passes.

No selected skill was unavailable.

## Files changed in this follow-up

- Added `drizzle/0003_key_whitespace_guards.sql`, its generated snapshot and journal entry; preserved migrations 0000–0002.
- Added `scripts/local-postgres.ps1`, `scripts/validate-phase3.ts` and `tests/integration/phase3.ts`.
- Added `db:validate:live` and adjusted formatter globs in `package.json` to avoid traversing the private runtime directory.
- Excluded runtime files from ESLint, TypeScript, Prettier and Docker context via `eslint.config.mjs`, `tsconfig.json`, `.prettierignore` and `.dockerignore`.
- Updated this report, `docs/domain-model.md`, `docs/phase-3-report.md` and `README.md`.
- Created only ignored local binaries/data/credentials/logs and validation artifacts. No dependency, application UI or business-service change was required.

## Regression validation

Formatting, lint, typecheck, 21 unit tests, production build/standalone preparation and all 26 browser regressions passed. Browser coverage includes responsive layouts, axe, keyboard/overlay behavior, reduced motion and production Design Lab gating. Repeated Drizzle generation produced no changes and left migration hashes stable; `db:check` passed. The standalone build contains no runtime directory. Existing historical migration hashes were also compared against the journal of a database created before the correction migration.

Early test-harness issues (enum array decoding and targeting the intended lifecycle fixture) were corrected before the final full run. Those failed attempts are not counted as passes. The actual database defect was limited to whitespace-only identity keys and was corrected additively.

## Remaining and boundaries

The Phase 3 relational live-validation gap is closed. Redis was not started: the discovered Laragon binary is Redis 5.0.14.1, older than the accepted Redis 7.4 foundation. The optional queue probe remains unrun in this follow-up.

Database owners can disable guards; production still needs a separate least-privilege runtime role. Cross-row settlement, ledger balancing, quotas, state transitions, target encryption and authenticated business writers belong to later phases. This acceptance verifies persistence behavior, not those future workflows. No Git push, production connection or Phase 4 implementation occurred.
