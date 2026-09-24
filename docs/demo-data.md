# Phase 4 demo dataset

Phase 4 adds local database fixtures for catalog, supply, membership, pricing configuration, promotions, CMS, and a few fictional account profiles. No storefront, order, payment, provider, wallet, referral, or authentication workflow reads or acts on these rows yet. The records are for development and testing, not an offer or operational report.

## Seed and safety boundary

The technical seed remains `npm run db:seed`. After the existing migrations and technical seed, run `npm run db:seed:demo` with explicit `NODE_ENV=development` or `test`, `APP_MODE=demo`, a loopback `APP_URL`, and `DATABASE_URL` for the project-local PostgreSQL 17 cluster on `127.0.0.1:55417`. The database name must match `topuplab_demo_<12 lowercase hex>`, and the database user must be `topuplab_local`. The script refuses live mode, production mode, known hosted runtime flags, other hosts, ports, users, databases and URL options. It checks the actual connected server, version and database, then verifies the complete migration journal against the existing migration files. It never reads provider or payment credentials.

The target must contain only the technical `foundation_version=1` marker and no domain rows. One transaction inserts all related fixtures and a `topuplab-demo-v1` marker with a fixture hash and full database snapshot hash. Failure rolls back the entire transaction. A repeated run compares the marker and every domain row, then exits without updates. It refuses drift or a revised fixture version; it will not rewrite immutable histories or silently adopt unrelated data. Transaction advisory and table locks serialize duplicate seed attempts and protect the empty check.

To reset, create a **new disposable local demo database** with a new matching name, run `npm run db:migrate`, `npm run db:seed`, then `npm run db:seed:demo`. Point only this command's process environment at the new database. Keep `.env` unchanged. There is no wipe, down migration, or production reset command. `npm run db:validate:demo` creates fresh local disposable databases and runs these steps twice, including rollback and drift checks. It writes ignored evidence to `artifacts/phase4-live.json` and `artifacts/phase4-inventory.json`; the test databases remain available for inspection.

The 2026-09-24 local run passed 14 Phase 4 live check groups. It verified 43 products, 85 provider mappings, 47 domain table counts, exact repeat and concurrent-run snapshots, immutable guards, deliberate late-failure rollback, and drift rejection. The Phase 3 live suite passed 210 checks again after the timezone change. The PostgreSQL server was stopped after validation.

## Catalog and target input

Seven ordered, visible categories are Game, Pulsa, Paket Data, E-Wallet, PLN, Voucher and Tagihan. Six game groups are Mobile Legends, Free Fire, PUBG Mobile, Roblox, Valorant and Genshin Impact. Products are denomination rows in the Phase 3 schema. Mobile Legends has 5, 12, 28, 59, 86, 172, 257 and 344 Diamonds. Free Fire has 5, 20, 50, 70, 140 and 355 Diamonds. Other groups include three denominations each, except Pulsa with four and Voucher/Tagihan with two each. There are 43 products total.

Input schema versions use the existing strict allowlist. Mobile Legends requires user ID and zone ID. Free Fire and PUBG Mobile require player ID. Roblox uses a username, Valorant uses Riot ID text, and Genshin uses UID. Phone-based categories request an Indonesian E.164 number, PLN requests a meter number, and voucher/tagihan examples request a customer number. The fixture creates no password, OTP, cookie, card, or token input. Product metadata is parsed by the Phase 3 Zod schema before insertion. The existing local TOPUPLAB mark is a neutral temporary media reference; there is no game artwork or invented partner logo.

## Fictional providers and health

`DEMO_ALPHA` is Alpha Digital (Demo), `DEMO_BETA` is Beta Supply (Demo), and `DEMO_GAMMA` is Gamma H2H (Demo). They are fictional. No provider endpoint, adapter, secret or configuration reference exists. Product mappings intentionally cover one, two or three providers. Some mappings are unavailable or disabled; Gamma is disabled. Costs are illustrative nonnegative bigint IDR, with priority and stock-state variation. They are not calculated selling prices.

Four immutable health observations represent HEALTHY, DEGRADED, OFFLINE and PAUSED at fixed instants. Latency and success/pending/timeout rates are illustrative integer measurements for future presentation tests. Provider balances are null. These observations say nothing about actual providers or service quality.

## Membership and pricing

Public, Member, Gold and Reseller are four relational tier rows with levels, active flags and validated benefit descriptions. Three fictional demo users use reserved `example.invalid` email addresses; they have relational profiles, customer/reseller roles and initial append-only membership history. They have no passwords, sessions, verified contacts, real phone numbers or wallets. The seed creates no admin permissions or access.

Six pricing rules configure Public, Member, Gold and Reseller global markups, a Game category rule and a Mobile Legends 86 product example. Fixed markups and minimum margins are bigint IDR; percentages are integer basis points. All rules pass the existing target-scope constraint. Priority is sample configuration only. There is no price calculation, sale price, quote or financial snapshot.

## Promotions, flash sales and CMS

Four promos show fixed discount, percentage discount, free admin fee and cashback. Their fixture states illustrate active, upcoming, expired and paused behavior relative to the fixed reference instant `2026-09-24T05:00:00Z`; a paused promo is disabled even when its schedule spans that instant. Quotas, per-user limits and budgets are examples. Product/category/tier scope junctions use real fixture foreign keys. There is no eligibility, redemption, budget accounting or usage history.

Three flash sales have active, upcoming and expired schedules at that same reference instant. Each has two configured items with bigint IDR prices, quotas and per-user limits. There are no reservations or sold counters. Three CMS banners use original Indonesian demo copy about top ups, membership and flash schedules. They have no clickable CTA, preventing dead links to pages that do not yet exist. The only system settings are the three Phase 3 allowlisted keys: PUBLIC_CONTACT, RECEIPT_COPY and CATALOG_PAGE_SIZE. They contain no secrets.

## Time and future use

Fixture IDs are deterministic versioned UUIDs from stable keys. All fixture instants and windows are fixed, and local PostgreSQL uses `Asia/Jakarta` as its operational default after live validation. Stored `timestamptz` values remain absolute instants. The terms active, upcoming and expired describe the fixture reference date; they will not stay aligned with wall-clock time. Future UI should label this as a demo reference or replace fixtures deliberately on a new disposable database. Real transaction scenario records are deferred until their workflow phases can create and validate them. No fake GMV, revenue, customer order history, wallet balance or provider performance claim is present.
