# Phase 8 pricing engine and demo administration

The Phase 7 quote now consumes the same `calculatePricing` domain function used by the Phase 8 internal simulator. Price arithmetic lives in `src/server/pricing/quote-math.ts`; database loading, demo administration and HTTP boundaries are separate. No order, payment, wallet, provider attempt or price snapshot is written by pricing preview.

## Pipeline and exact arithmetic

1. Select an eligible provider SKU using enabled/available supply, acceptable provider state, stock state, numeric priority, cost and stable ID. This selects a cost for preview, not a fulfillment route.
2. Resolve an active commercial rule by **PRODUCT > BRAND > CATEGORY > GLOBAL**. Within one scope, an exact tier rule precedes a tier-neutral rule; lower numeric priority wins. A collision at the same scope, tier specificity and priority fails closed. Start is inclusive; end is exclusive. Null bounds mean unbounded. An invalid schedule fails closed.
3. Calculate percentage markup as `ceil(cost × markupBps / 10_000)` with bigint integers, add fixed markup, then apply `max(calculated markup, minimum margin)`. The commercial selling price is provider cost plus that markup.
4. A PROVIDER-scoped rule is an independent **minimum selling-price floor** for the selected provider. Its fixed, percentage and minimum-margin fields use the same arithmetic. Final base price is `max(commercial price, provider floor)`. It neither changes provider cost nor replaces the commercial precedence chain. If no provider rule applies, the commercial result is unchanged. This policy prevents an accidental loss or reduction below a required provider floor.
5. Payment fees remain in the quote layer, after base price. Promotions, flash sales, cashback and gateway cost are outside this engine. No negative-margin override is available in the demo workspace.

Money is PostgreSQL/JavaScript bigint IDR. Public DTOs serialize money as decimal strings; the internal result retains provider cost, winning rules, markup components, floor, selling price, expected margin and reference instant. Values outside signed PostgreSQL bigint, negative cost/markup/margin or out-of-range basis points are rejected. A deterministic matrix tests the no-loss and minimum-margin invariants. Public HTML and `/api/demo/quote` never serialize the internal trace.

The unauthenticated public quote uses the Public tier and the fixed fixture reference instant `2026-09-24T05:00:00Z`. Membership tier codes are relational data, not application enums. The admin simulator can select any active configured tier and an optional reference time. The demo fixture has no provider SKU synchronization timestamps; the simulator labels freshness **unknown**. A timestamp older than seven days relative to the selected reference is **stale**; one after the reference is **future**. This is internal visibility, not an operational freshness guarantee; real quoting must define a live cost freshness gate when provider synchronization exists.

## Workspace and rule mutation

`/dev/admin/pricing` provides real fixture-derived rule counts, scope coverage and configuration findings; rule list; builder; before/after impact preview; internal provider comparison; a calculation trace; and tier comparison. Impact counts are bounded to the local demo catalog and include the old and new scope when editing. No invented revenue or transaction metrics appear.

The workspace and `/api/dev/pricing` require the existing local-demo gate: development mode, `APP_MODE=demo`, loopback PostgreSQL 17 on the approved port, local app role and a `topuplab_demo_<12 hex>` database. The request host must also be localhost or 127.0.0.1. They return 404 in production or live mode. A caller that can spoof headers against an exposed development server is not authenticated by this gate; keep the development server private to the local machine. The real `/admin` route remains deny-all.

Rule create/update/enable/disable is restricted to that disposable local database. Input is strict and bounded: known scope, exactly its required target, existing tier/target row, safe name, nonnegative integer IDR, exact percentage input with at most two decimals, 0–10,000 priority, valid schedule and active-state conflict check. For example, `7.5` becomes exactly 750 basis points without floating-point financial arithmetic. Active overlapping rules with the same scope, target, tier and priority are rejected before save. A preview is required in the UI before save; the server repeats all validation independently. Rules are never hard-deleted.

Writes run in a serializable PostgreSQL transaction. An `xmin` version token prevents stale updates without timestamp precision loss. The write and an immutable AuditLog entry commit together. Audit origin is `SYSTEM` with a null actor, reason `DEMO_PRICING_WORKSPACE`; no authenticated person is fabricated. Origin checks, JSON type checks, payload limits, parameterized Drizzle queries and safe error codes protect the demo endpoint. There is no production mutation route.

Current limits are 200 rules, 100 products, 500 provider SKUs and 50 displayed findings. A larger production administration surface needs scoped queries and pagination before those ceilings change. PostgreSQL migration history is unchanged; the existing schema supports this phase.

## Boundaries

Phase 9 must provide real identity, authorization and actor attribution before any production admin mutation. Later order creation must call this pricing engine, revalidate live supply cost/freshness, and persist immutable `PriceSnapshot` terms transactionally. Payment fees, promo redemption and flash-sale reservations require their own later engines. The Phase 8 simulator is configuration preview, not a live customer price promise or provider routing decision.
