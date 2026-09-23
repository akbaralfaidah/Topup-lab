# PRD.md — TOPUPLAB

> **Working title:** TOPUPLAB  
> **Product type:** Multi-provider PPOB & game top-up platform  
> **Primary market:** Indonesia  
> **Document status:** v1.0 — portfolio-grade / production-oriented specification  
> **Important:** Brand name is temporary and may be replaced later without changing the product architecture.

---

## 1. Product Summary

TOPUPLAB is a modern digital transaction platform for:

- game top-up;
- prepaid mobile credit;
- mobile data packages;
- e-wallet top-up;
- PLN prepaid token;
- vouchers;
- selected postpaid/PPOB products;
- reseller/member pricing;
- internal site balance;
- referral;
- promo and flash sale;
- transaction tracking;
- multi-provider routing;
- business reporting.

The product should feel like a real commercial platform, not a template, demo storefront, or direct clone of an existing competitor.

The visual and interaction quality may take inspiration from leading Indonesian top-up platforms, but TOPUPLAB must have its own information architecture, branding, components, motion system, and visual language.

---

## 2. Product Vision

Create a fast, trustworthy, premium-looking top-up and PPOB platform where:

1. customers can complete a transaction in under one minute;
2. members/resellers immediately understand their pricing advantage;
3. admins can control margin, provider routing, stock availability, promotions, and failures without editing code;
4. provider integrations are replaceable and extensible;
5. financial actions are auditable;
6. the system remains safe when callbacks are duplicated, delayed, reordered, or temporarily unavailable;
7. the portfolio demonstrates real-world product, UX, backend, architecture, and DevOps capability.

---

## 3. Product Principles

### 3.1 Fast purchase
A guest must be able to buy common products without registering.

### 3.2 Trust before decoration
Price, target account, fee, total payment, and transaction state must always be clear.

### 3.3 Multi-provider by architecture
Providers are adapters, not hard-coded business logic.

### 3.4 Never trust the browser for money
Payment success, provider success, balance mutation, refund, and commission settlement must be verified server-side.

### 3.5 Configuration over code changes
Pricing, routing, tier margin, promo, flash sale, product visibility, and provider priority should be manageable from admin.

### 3.6 Graceful failure
Pending and failed states are first-class flows, not edge cases hidden behind generic error messages.

---

## 4. Scope

### 4.1 Phase 1 — Portfolio MVP

Must be fully usable with sandbox/mock data.

- responsive landing page;
- product catalog;
- category pages;
- search;
- game/product detail;
- target account input;
- denomination selection;
- checkout;
- payment method selection;
- order tracking;
- authentication;
- member dashboard;
- transaction history;
- basic internal balance;
- admin dashboard;
- product CRUD;
- pricing rules;
- provider adapter architecture;
- one mock provider;
- one real provider integration when credentials are available;
- payment gateway sandbox;
- promo code;
- flash sale;
- referral;
- reporting overview;
- audit log;
- notification center.

### 4.2 Phase 2 — Commercial-grade

- additional PPOB categories;
- multiple live providers;
- automatic provider fallback;
- configurable routing strategies;
- provider health monitoring;
- tiered membership;
- reseller dashboard;
- wallet top-up;
- commission ledger;
- automated reconciliation;
- postpaid inquiry + payment;
- advanced financial reports;
- customer support tools;
- provider comparison;
- bulk pricing tools;
- CMS banners/articles/FAQ.

### 4.3 Not in initial scope

Unless explicitly activated later:

- peer-to-peer transfers;
- customer cash withdrawal;
- crypto;
- BNPL;
- lending;
- storing customer payment-card credentials;
- collecting third-party account passwords;
- unofficial account-login top-up flows;
- marketplace seller onboarding;
- native Android/iOS apps.

Any feature that turns internal balance into broadly transferable stored value must receive separate legal/compliance review before production use.

---

## 5. User Roles

### 5.1 Guest
Can:
- browse;
- search;
- purchase supported products;
- check order status;
- create account after checkout.

Cannot:
- use member pricing;
- use internal balance;
- access referral dashboard.

### 5.2 Member
Can:
- receive member prices;
- save transaction history;
- use allowed internal balance;
- see referral code;
- manage account;
- receive loyalty/promo benefits.

### 5.3 Reseller
Can:
- receive reseller-specific pricing;
- see margin versus public price;
- maintain balance;
- use faster repeat-order tools;
- export transactions;
- access referral/reseller analytics.

### 5.4 Admin
Can:
- manage catalog;
- configure prices and tiers;
- configure providers;
- configure routing;
- manage flash sales and promos;
- inspect transactions;
- trigger safe re-check/retry actions;
- manage users;
- view reports;
- review audit logs.

### 5.5 Super Admin
Includes Admin permissions plus:
- provider credentials;
- payment configuration;
- role/permission management;
- financial adjustment approval;
- system settings;
- secrets rotation workflow;
- destructive actions requiring re-authentication.

---

## 6. Core Information Architecture

### Public
- Home
- Search
- Games
- Pulsa & Data
- E-Wallet
- PLN
- Voucher
- PPOB
- Flash Sale
- Price List
- Promo
- Order Tracking
- FAQ
- Terms
- Privacy
- Contact

### Account
- Overview
- Transactions
- Balance
- Membership
- Referral
- Promo/Voucher
- Notifications
- Profile & Security

### Admin
- Overview
- Transactions
- Products
- Categories
- Providers
- Routing
- Pricing
- Flash Sales
- Promotions
- Members
- Referrals
- Balance Ledger
- Reports
- Webhook Events
- Audit Logs
- CMS
- Settings

---

## 7. Core Customer Journey

### 7.1 Game top-up

1. User opens a game page.
2. User enters required target data:
   - user ID;
   - server/zone ID if required;
   - optional account nickname verification when supported.
3. System validates format locally.
4. User selects denomination.
5. System shows:
   - item;
   - public/member price;
   - discount;
   - payment fee;
   - grand total.
6. User enters contact destination for receipt/status.
7. User chooses payment method.
8. Server creates a unique order.
9. Payment gateway creates payment instruction.
10. Customer pays.
11. Verified payment webhook marks payment successful.
12. Order enters fulfillment queue.
13. Provider router selects provider SKU.
14. Provider adapter submits transaction with an immutable unique reference.
15. Provider result becomes:
   - success;
   - pending;
   - failed.
16. UI updates transaction timeline.
17. Success shows serial/reference where applicable.
18. Failure follows configured retry/fallback/refund policy.

### 7.2 Guest checkout

Registration must not be required before purchase.

At completion:
- show order ID;
- offer account creation;
- if same verified email/phone is used later, eligible historical transactions may be linked through a safe verification flow.

---

## 8. Transaction State Machine

### 8.1 Order status

Use explicit states:

- `DRAFT`
- `WAITING_PAYMENT`
- `PAYMENT_PENDING`
- `PAID`
- `QUEUED`
- `PROCESSING`
- `PROVIDER_PENDING`
- `SUCCESS`
- `FAILED`
- `EXPIRED`
- `REFUND_PENDING`
- `REFUNDED`
- `MANUAL_REVIEW`
- `CANCELLED`

### 8.2 Rules

- `PAID` may only originate from a trusted server-side payment verification.
- A client redirect must never directly set `PAID`.
- `SUCCESS` is immutable except via privileged reconciliation workflow.
- `FAILED` after payment must never silently discard customer value.
- every terminal state requires an audit event;
- repeated webhook delivery must not cause repeated balance mutation or repeated provider submission.

---

## 9. Financial Invariants

These rules are non-negotiable.

### 9.1 Money representation
Store money as integer minor units / whole IDR integer values. Never use binary floating point for financial arithmetic.

### 9.2 Immutable ledger
Do not store a mutable `balance` as the only source of truth.

Maintain an append-only ledger containing:
- ledger entry ID;
- account ID;
- transaction/order reference;
- direction;
- amount;
- reason;
- created by;
- timestamp;
- idempotency key;
- resulting balance snapshot if desired.

### 9.3 Balance mutation
A balance mutation must:
- run server-side;
- run within a database transaction;
- have an idempotency key;
- be auditable;
- reject insufficient funds where applicable;
- never be triggered directly from client-provided amounts.

### 9.4 Price snapshot
When an order is created, persist a complete immutable commercial snapshot:
- base provider cost;
- selected provider candidate;
- public price;
- tier price;
- discount;
- promo contribution;
- payment fee;
- final amount;
- expected gross margin.

Later catalog price changes must not rewrite an existing order.

### 9.5 Refund
Refund must create a new financial event, not rewrite historical rows.

### 9.6 Admin adjustment
Manual balance adjustment requires:
- reason;
- actor;
- previous balance;
- amount;
- resulting balance;
- audit log;
- optional approval threshold.

---

## 10. Product Catalog Model

A customer-facing product is separated from provider SKUs.

### Product
Example:
`Mobile Legends — 86 Diamonds`

Fields:
- `id`
- `slug`
- `name`
- `category_id`
- `brand`
- `description`
- `input_schema`
- `icon`
- `cover`
- `status`
- `sort_order`
- `tags`
- `seo`
- `created_at`
- `updated_at`

### Provider SKU Mapping

One Product may map to many provider SKUs:

- product ID;
- provider ID;
- provider SKU;
- provider cost;
- provider status;
- stock;
- cutoff;
- estimated fulfillment time;
- priority;
- health score;
- enabled;
- last sync.

This allows:
- provider A as primary;
- provider B as secondary;
- provider C as manual fallback.

---

## 11. Provider Abstraction

Create a provider contract/interface.

Minimum adapter capabilities:

- `getProducts()`
- `getBalance()`
- `createTransaction()`
- `checkTransaction()`
- `verifyWebhook()`
- `normalizeWebhook()`
- `normalizeStatus()`
- `supportsInquiry()`
- `inquirePostpaid()` when relevant
- `payPostpaid()` when relevant

Business services must not import provider-specific payloads directly.

Provider-specific request/response transformations stay inside adapters.

### 11.1 Provider routing strategies

Admin-configurable strategies:

1. **Priority**  
   Use provider with lowest configured priority number.

2. **Lowest cost**  
   Choose cheapest available mapped provider within safety constraints.

3. **Best margin**  
   Maximize expected margin while respecting provider health.

4. **Health-aware**  
   Avoid degraded providers.

5. **Manual pin**  
   Force one provider for a product.

### 11.2 Automatic fallback

Fallback is allowed only when:
- first attempt clearly failed in a non-charge state; or
- provider guarantees no duplicate charge for the same unique reference strategy; and
- routing policy permits retry.

Never auto-fallback a transaction with ambiguous/pending financial state to another provider unless duplicate fulfillment risk is eliminated.

---

## 12. Provider Health

Track:
- API latency;
- success rate;
- pending rate;
- timeout rate;
- webhook delay;
- last successful request;
- current balance;
- sync freshness;
- circuit-breaker state.

Possible states:
- HEALTHY
- DEGRADED
- PAUSED
- OFFLINE
- MAINTENANCE

Admin can manually pause a provider.

---

## 13. Product Sync

Price list sync jobs should:
- fetch provider catalog;
- normalize data;
- upsert provider SKU mappings;
- never directly overwrite curated customer product naming;
- calculate candidate price;
- flag large cost jumps;
- keep sync history;
- allow preview before mass price publication.

Suggested schedules:
- provider catalog price sync: configurable;
- provider balance sync: configurable;
- product health refresh: configurable.

Do not fetch a provider price list on every customer page load.

---

## 14. Pricing Engine

Pricing should support:

### 14.1 Base formula
`selling_price = provider_cost + fixed_markup + percentage_markup`

### 14.2 Minimum margin
`selling_price >= provider_cost + min_margin`

### 14.3 Tier pricing
Example tiers:
- PUBLIC
- MEMBER
- SILVER
- GOLD
- RESELLER

Tier names must be admin-configurable.

### 14.4 Overrides
Allow:
- category rule;
- brand rule;
- product rule;
- provider-specific rule;
- tier rule;
- scheduled rule.

Precedence:
`product > brand > category > global`

### 14.5 Guard rails
Admin UI must warn when:
- price < provider cost;
- margin below threshold;
- flash sale causes negative margin;
- payment fee makes net margin negative.

---

## 15. Membership

Membership is primarily a pricing and loyalty layer.

Data:
- tier;
- qualification rule;
- active period;
- spending threshold;
- order threshold;
- manual assignment option;
- benefits;
- discount model.

Possible qualification:
- lifetime spend;
- rolling 30/90-day spend;
- prepaid membership;
- admin assignment.

Do not hard-code tier names into pricing logic.

---

## 16. Internal Balance

For initial product:
- internal balance may be used for purchases and eligible refunds;
- no P2P transfer;
- no withdrawal unless separately reviewed and implemented;
- all mutations go through ledger;
- balance top-up requires verified payment;
- balance payment reserves/deducts atomically.

Balance status:
- AVAILABLE
- RESERVED
- SETTLED
- REFUNDED

Admin must see ledger, not only balance totals.

---

## 17. Payment Gateway

Implement payment gateway through adapter abstraction.

Capabilities:
- create payment;
- get status;
- cancel when supported;
- verify webhook;
- normalize status;
- retrieve payment instruction.

Supported UI categories may include:
- QRIS;
- virtual account;
- e-wallet;
- retail outlet;
- balance.

No secrets in frontend.

### Payment webhook rules

- verify signature/authenticity;
- persist raw event safely;
- identify event uniquely;
- process idempotently;
- compare amount against order;
- check known order ID;
- ignore unsupported transitions;
- acknowledge quickly;
- move heavy work to queue;
- support reconciliation polling for delayed callbacks.

---

## 18. Referral

Each member receives:
- referral code;
- referral link;
- referral dashboard.

Referral events:
- CLICKED
- REGISTERED
- QUALIFIED
- REWARDED
- REVERSED

Reward may be:
- internal balance;
- voucher;
- points;
- tier progress.

Anti-abuse:
- no self-referral;
- configurable qualification transaction;
- delayed reward;
- duplicate identity/device/payment checks when appropriate;
- manual fraud review.

---

## 19. Promotions

Supported promo types:
- fixed discount;
- percentage discount;
- cashback;
- free admin fee;
- specific product/category promo;
- tier-only promo;
- minimum spend;
- first-order promo.

Promo constraints:
- start/end;
- quota;
- per-user limit;
- total budget;
- allowed tiers;
- allowed products;
- stacking rule.

Every application must produce a deterministic pricing breakdown.

---

## 20. Flash Sale

Flash Sale requires:
- dedicated landing section;
- countdown;
- original price;
- sale price;
- quota;
- per-user limit;
- start/end;
- sold count;
- status.

Backend is authoritative for:
- time;
- eligibility;
- quota;
- final price.

Never trust client countdown for eligibility.

Use atomic quota reservation or equivalent concurrency-safe mechanism.

---

## 21. Order Tracking

Public tracking should require:
- order ID;
- secondary verification when sensitive details are shown.

Timeline:
- Order created
- Waiting payment
- Payment received
- Processing
- Provider pending
- Completed / Failed / Refunded

Do not expose raw provider secrets or internal error traces.

---

## 22. Admin Dashboard

### 22.1 Overview KPIs
- GMV;
- paid orders;
- successful orders;
- failure rate;
- pending rate;
- estimated gross profit;
- provider cost;
- payment fees;
- promo cost;
- new members;
- repeat purchase rate.

All KPIs must define time range and calculation basis.

### 22.2 Transaction table
Columns:
- order ID;
- customer;
- product;
- target;
- amount;
- payment;
- provider;
- provider ref;
- order status;
- created;
- duration.

Actions:
- view details;
- re-check;
- copy references;
- send notification;
- move to manual review;
- eligible refund;
- retry only when safe.

Never offer a generic “force success” button.

### 22.3 Transaction detail
Show:
- immutable order snapshot;
- payment timeline;
- provider attempt timeline;
- webhook events;
- status history;
- ledger entries;
- admin notes;
- audit events.

---

## 23. Reports

Reports:
- sales;
- gross margin;
- product performance;
- category performance;
- provider performance;
- payment method performance;
- member tier;
- referral;
- promotions;
- refund/failure.

Filters:
- date range;
- provider;
- category;
- product;
- payment method;
- tier;
- status.

Export:
- CSV first;
- XLSX optional;
- PDF optional.

---

## 24. Notifications

Channels:
- in-app;
- email;
- WhatsApp integration optional.

Events:
- payment waiting;
- paid;
- processing;
- success;
- failed;
- refunded;
- balance changed;
- membership upgraded;
- referral reward;
- promo.

Notification dispatch must not block financial transaction processing.

---

## 25. Authentication & Account Security

Recommended:
- email/password or phone-based flow;
- secure session cookies;
- email/phone verification;
- optional OAuth;
- password reset;
- rate limiting;
- suspicious-login logging;
- admin MFA strongly recommended;
- re-authentication for sensitive admin actions.

Session and authorization checks must happen server-side.

---

## 26. Suggested Technical Architecture

### Frontend
- latest stable Next.js with App Router;
- TypeScript strict mode;
- Tailwind CSS;
- accessible primitive components;
- custom design system;
- motion library only where useful.

### Backend
Can initially live in the same TypeScript monorepo if cleanly layered.

Modules:
- auth;
- catalog;
- pricing;
- checkout;
- payment;
- providers;
- fulfillment;
- ledger;
- promotions;
- referrals;
- memberships;
- reports;
- notifications;
- admin;
- audit.

### Database
- PostgreSQL;
- Prisma or equivalent typed ORM;
- explicit migrations.

### Queue/cache
- Redis;
- durable job queue.

Jobs:
- fulfillment;
- webhook processing;
- retry/check status;
- price sync;
- notifications;
- reports.

### Infrastructure
- Docker;
- reverse proxy;
- HTTPS;
- VPS;
- managed/off-host database backup preferred;
- object storage for media where needed.

Do not assume Vercel-only architecture for server-side provider/payment workloads if the deployment target is VPS.

---

## 27. Minimum Data Entities

- User
- Role
- Permission
- Session
- CustomerProfile
- MembershipTier
- MembershipHistory
- Category
- Product
- ProductInputSchema
- Provider
- ProviderSku
- ProviderHealth
- ProviderSync
- PricingRule
- PriceSnapshot
- Order
- OrderItem
- OrderStatusHistory
- Payment
- PaymentEvent
- ProviderAttempt
- ProviderEvent
- WalletAccount
- LedgerEntry
- Promo
- PromoUsage
- FlashSale
- FlashSaleItem
- ReferralCode
- ReferralEvent
- Notification
- AuditLog
- AdminNote
- CmsBanner
- SystemSetting

---

## 28. Observability

Use structured logs with:
- request ID;
- order ID;
- payment ID;
- provider attempt ID;
- provider;
- normalized status.

Never log:
- passwords;
- full secrets;
- payment server keys;
- raw authorization tokens;
- sensitive account credentials.

Track:
- error rate;
- queue lag;
- webhook lag;
- provider latency;
- fulfillment latency;
- provider success;
- payment conversion.

---

## 29. Error Handling

User-facing errors:
- friendly;
- actionable;
- no stack traces;
- no provider secret messages.

Admin-facing:
- normalized error code;
- raw provider response in restricted diagnostic view if safe;
- correlation ID.

All provider timeouts must resolve to an explicit ambiguous/pending state unless failure is certain.

---

## 30. SEO & Performance

Public product pages should support:
- semantic HTML;
- metadata;
- canonical URL;
- Open Graph;
- sitemap;
- structured data where valid;
- fast LCP;
- optimized images;
- lazy loading below fold;
- no layout shifts from banners.

Do not sacrifice checkout reliability for animation.

---

## 31. Accessibility

Target WCAG 2.2 AA behaviors where practical:
- keyboard navigation;
- visible focus;
- proper labels;
- sufficient contrast;
- reduced-motion preference;
- no color-only state meaning;
- accessible dialogs;
- screen-reader-friendly form errors.

---

## 32. Demo Mode for Portfolio

The repository must support:

`APP_MODE=demo`

Demo mode:
- uses mock provider;
- uses payment sandbox/mock;
- seeds realistic products;
- never sends real top-ups;
- clearly labels admin-only demo configuration;
- produces realistic transaction timelines;
- allows safe portfolio demonstration.

Also support:
- deterministic seeded demo users;
- deterministic mock success/pending/failure scenarios.

---

## 33. Acceptance Criteria — MVP

MVP is accepted when:

1. guest can complete mock purchase end-to-end;
2. member sees a different configured price from public;
3. price is recomputed server-side;
4. payment webhook processing is idempotent;
5. duplicate webhook cannot double-fulfill;
6. provider adapter can be swapped without changing checkout logic;
7. admin can map one product to multiple provider SKUs;
8. admin can define provider priority;
9. provider pending is shown correctly;
10. unsafe fallback is blocked;
11. flash sale is enforced server-side;
12. referral event chain works;
13. every balance mutation produces a ledger entry;
14. order preserves price snapshot;
15. admin transaction detail shows full timeline;
16. dashboard reports use real database queries;
17. responsive layout works from small mobile to desktop;
18. keyboard navigation works through checkout;
19. no secret is shipped to browser;
20. demo mode runs without live third-party credentials.

---

## 34. Production Readiness Gate

Do not call the product production-ready until:

- live provider onboarding completed;
- payment gateway production onboarding completed;
- webhook secrets configured;
- HTTPS valid;
- backup tested;
- restore tested;
- environment secrets rotated;
- admin MFA enabled;
- rate limiting enabled;
- retry policy tested;
- duplicate webhook tests passed;
- concurrent flash-sale quota tests passed;
- wallet race-condition tests passed;
- provider outage test passed;
- reconciliation flow tested;
- terms/privacy/compliance review completed;
- real-money smoke test performed using minimal values.

---

## 35. Implementation Milestones

### M0 — Foundation
- repository;
- linting;
- formatting;
- database;
- Docker;
- auth skeleton;
- design tokens.

### M1 — Catalog
- categories;
- products;
- search;
- game/product detail;
- admin product management.

### M2 — Checkout & Orders
- dynamic input schemas;
- cart/order;
- price snapshot;
- transaction timeline.

### M3 — Payment
- gateway adapter;
- sandbox;
- webhook;
- idempotency;
- reconciliation.

### M4 — Provider Engine
- provider contract;
- mock provider;
- live provider adapter;
- mapping;
- sync;
- fulfillment queue.

### M5 — Multi-provider
- routing;
- health;
- fallback guards;
- provider dashboards.

### M6 — Growth
- membership;
- tiers;
- wallet;
- referral;
- promo;
- flash sale.

### M7 — Admin & Reporting
- metrics;
- ledger;
- audit;
- exports;
- CMS.

### M8 — Hardening
- tests;
- concurrency;
- security;
- accessibility;
- performance;
- deployment;
- backup.

---

## 36. Definition of Done

A feature is not done because “the UI works.”

A feature is done when:
- UX states exist;
- empty/loading/error/success states exist;
- validation exists;
- authorization exists;
- server-side rule exists;
- tests cover core behavior;
- audit/logging exists where relevant;
- responsive behavior exists;
- accessibility basics exist;
- secrets are protected;
- acceptance criteria pass.

---

## 37. Final Product Character

TOPUPLAB should communicate:

**fast, reliable, modern, transparent, technically serious, and built for repeat transactions.**

It should never feel like:
- a generic SaaS template;
- a crypto dashboard;
- a gaming poster;
- an over-neon “gamer” site;
- a clone;
- an AI-generated page with excessive gradients and floating cards.

The experience should make buying a top-up feel almost boringly simple, while the backend handles the complexity safely.
