# Phase 5 public homepage

The homepage replaces the Phase 1 preparation notice with a search-first public preview. It uses the Phase 2 ink, warm-neutral and chartreuse tokens, Plus Jakarta Sans, Lucide and restrained Motion. At narrow widths the search stays in the first viewport; the abstract desktop brand panel gives way to category access.

## Data and safety boundary

`src/server/homepage.ts` is a read-only server projection. It reads active categories, brands and denomination products, provider-SKU availability flags, flash-sale configuration, one active CMS banner, membership-tier names and the allowlisted `PUBLIC_CONTACT` setting. The service returns customer-facing strings and counts only. It never selects costs, provider IDs, margins, credentials, customer data or order records. Game brands become six customer-facing groups; denominations are counted, not rendered as separate games. Local search filters these group DTOs in the browser and has no backend or checkout behavior.

The projection runs only with `APP_MODE=demo`, non-production `NODE_ENV`, and a loopback `topuplab_demo_<12 hex>` database on the accepted local PostgreSQL 17 cluster. A missing database, empty catalog, live mode or production mode returns an honest unavailable state without fixtures or invented fallback products. The global navigation includes catalog anchors only when the projection is available. The sample public contact uses the reserved `example.invalid` domain, so the UI identifies it as inactive instead of presenting a dead mail link.

Flash states are evaluated at the seed's fixed reference instant, 24 September 2026 at 12:00 WIB. The page labels that context and does not claim a current offer, remaining quota or sale countdown. Displayed IDR values are configured sample flash prices, not a computed quote. CMS copy has no CTA. Tiers are names only; no member savings are implied.

## Interaction and accessibility

The combobox supports typing, arrow selection, Enter, Escape, empty results and clear. Selection reports a non-transactional preview. Native details handles the mobile menu; the existing design-system accordion handles FAQ. Both work without hover. The content remains in server HTML before hydration. The former route-level `loading.tsx` boundary was removed because it left no-JavaScript visitors on a permanent loading message while the async database read streamed. Loading primitives remain in the design system. Motion is limited to the search result panel using the central reduced-motion policy; color and border responses remain CSS. The responsive review covers 320, 360, 390, 768, 1024, 1280 and 1440 px, including 200% text enlargement without document overflow. Automated axe checks cover demo and production fallback states.

SEO metadata describes the preview accurately, with a homepage canonical and Open Graph copy. Robots remain noindex while commerce is unavailable. No product route, account flow, payment, order, provider action, price engine or catalog search backend is introduced.

## Design review

Purpose: find a game or digital category quickly and understand the current service state. The custom typographic panel is an abstract TOPUPLAB composition; it is not game art or a partner logo. Game covers use restrained letterforms and geometry to identify rows without implying licensed artwork. At mobile sizes the panel is removed so categories follow the search. Section surfaces alternate between open lists and two compact emphasis bands, avoiding nested card repetition. Copy labels demo fixtures and future capabilities explicitly.

The design-taste and antislop reviews were applied throughout implementation. The ui-ux-pro-max search was used for accessibility, touch and responsive guidance; its generic palette and font recommendations were rejected because the existing TOPUPLAB design system is authoritative. No image-generation asset was needed.
