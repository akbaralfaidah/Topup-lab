# MASTER_PROMPT.md — TOPUPLAB / ANTIGRAVITY EXECUTION PROMPT

> **Purpose:** Main execution prompt for Antigravity AI Agent  
> **Project:** TOPUPLAB — Multi-Provider PPOB & Game Top-Up Platform  
> **Mode:** Production-oriented, portfolio-grade, incremental implementation  
> **Primary references:** `PRD.md`, `RULE.md`, `DESIGN.md`  
> **Mandatory behavior:** Use installed skills intentionally and explicitly throughout implementation.

---

# 0. READ THIS FIRST

You are the primary implementation agent for TOPUPLAB.

You are not being asked to create a quick mockup, landing page, or generic CRUD project.

You are building a realistic multi-provider PPOB and game top-up platform with:

- public product catalog;
- game top-up;
- PPOB;
- customer checkout;
- payment gateway abstraction;
- provider abstraction;
- multi-provider routing;
- pricing engine;
- multi-tier/member pricing;
- internal balance/ledger;
- referral;
- promo;
- flash sale;
- customer dashboard;
- reseller/member support;
- reporting;
- admin dashboard;
- provider health;
- financial auditability;
- safe webhook handling;
- demo mode;
- production-oriented architecture.

The project must look polished enough for a premium portfolio while remaining technically credible.

---

# 1. DOCUMENT AUTHORITY

Before making any implementation decision, read these files completely:

1. `RULE.md`
2. `PRD.md`
3. `DESIGN.md`
4. `skills-lock.json` if present

Priority order when instructions conflict:

1. `RULE.md`
2. `PRD.md`
3. explicit user instruction
4. `DESIGN.md`
5. established project conventions
6. skill recommendations
7. your own preference

Never override a security or financial invariant for visual convenience.

---

# 2. MANDATORY SKILL USAGE

## Active-agent availability policy (2026-09-22 amendment)

Specified installed skills are mandatory when available in the active agent environment. Codex and Antigravity may have different installed skill sets. Inspect actual availability each session; never fabricate or simulate skill use. Report missing relevant skills under `Skills Unavailable`. A missing skill alone does not block implementation unless its capability cannot reasonably be completed safely without it. Use other installed skills where relevant without claiming they replace a missing skill. When working in Antigravity, actively use the user's installed skill set according to this document. Preserve an existing skills-lock.json; never fabricate one.

The Phase 0 audit, Phase 1 foundation, Phase 2 design system, Phase 3 Database Domain Model with live PostgreSQL validation, Phase 4 demo data, Phase 5 public homepage, and Phase 6 public catalog/search are accepted. The user's subsequent Phase 7 request authorizes product transaction-preparation UI and read-only, server-authoritative demo quote previews only. Drizzle ORM remains accepted. Preserve earlier phases and do not implement Phase 8 pricing administration, persistent orders, payments, provider calls, or other business mutations. See docs/domain-model.md, docs/phase-3-live-validation.md, docs/demo-data.md, docs/phase-5-homepage.md, docs/phase-6-catalog.md, and docs/phase-7-product-checkout.md for these milestones.

This project has installed skills.

You MUST actively use them.

Do not merely mention them.
Do not treat them as decoration.
Use the appropriate skill before or during the relevant task.

You must avoid blindly using every skill on every task.

Use the right skill for the right phase.

---

# 3. SKILL ROUTING TABLE

## 3.1 Global code quality skills

Use frequently throughout implementation:

- `antislop-code`
- `full-output-enforcement`

Use them when:
- creating new modules;
- refactoring;
- creating backend services;
- creating business logic;
- fixing incomplete implementations;
- reviewing generated code;
- ensuring no fake placeholder logic remains.

Expected result:
- complete implementation;
- no truncated code;
- no giant monolithic components;
- no dead code;
- no disguised TODO-based “implementation”.

---

## 3.2 Global UX / design quality

Use during frontend and design work:

- `antislop`
- `antislop-ui`
- `design`
- `design-system`
- `design-taste-frontend`
- `design-taste-frontend-v1`
- `gpt-taste`
- `high-end-visual-design`
- `ui-ux-pro-max`
- `ui-stvling`

Use them for:
- design system;
- landing page;
- product cards;
- checkout;
- customer dashboard;
- admin dashboard;
- pricing table;
- flash sale;
- referral;
- transaction states;
- responsive layouts.

Do NOT combine conflicting visual recommendations blindly.

`DESIGN.md` remains the final authority.

---

## 3.3 Mobile skills

Use when building or reviewing mobile layouts:

- `antislop-layoutmobile`
- `imagegen-frontend-mobile`

Use specifically for:
- mobile checkout;
- sticky CTA;
- mobile navigation;
- product grid;
- mobile transaction timeline;
- mobile admin adaptation where appropriate.

Mobile must not be a compressed desktop layout.

---

## 3.4 Copywriting skills

Use:

- `antislop-copywriting`
- `antislop-human`

Use for:
- homepage headlines;
- button text;
- form helpers;
- transaction state copy;
- pricing explanations;
- referral copy;
- promo copy;
- membership copy;
- empty states;
- error states;
- admin helper text.

Default public-facing language:
**Bahasa Indonesia**.

Avoid AI-sounding marketing language.

---

## 3.5 Brand skills

Use:

- `brand`
- `brandkit`
- `banner-design`

Use for:
- TOPUPLAB brand identity;
- temporary logo;
- favicon direction;
- brand tokens;
- campaign banner;
- promo visuals;
- flash sale visual system.

Brand work must remain original.

Do not clone PayTopUp, Codashop, UniPin, or any other platform.

---

## 3.6 Image generation skills

Use:

- `imagegen-frontend-web`
- `imagegen-frontend-mobile`

Only when original visuals improve the product.

Use for:
- abstract brand backgrounds;
- campaign visuals;
- promo banners;
- decorative original product imagery.

Do NOT generate fake official game logos or misleading licensed assets.

---

## 3.7 Reference translation skills

Use:

- `image-to-code`
- `redesign-existing-projects`
- `stitch-design-taste`

Use only when:
- a visual reference is provided;
- a screenshot must be interpreted;
- an existing screen must be redesigned;
- a Stitch-generated concept is being translated.

Never pixel-clone competitors.

Extract:
- layout logic;
- information hierarchy;
- interaction pattern;
- content grouping.

Then reimplement using TOPUPLAB design language.

---

## 3.8 Optional stylistic skills

These are not default.

- `minimalist-ui`
- `industrial-brutalist-ui`

Use only if explicitly requested for a specific experiment.

Do not allow them to redefine the main product style.

---

## 3.9 Slide skill

- `slides`

Do not use during website implementation unless specifically requested to create a presentation/deck.

---

## 3.10 Skills lock

If `skills-lock.json` exists:

- respect it;
- do not hand-edit it unless required by the documented skill installation workflow;
- do not remove configured skills.

---

# 4. REQUIRED EXECUTION STYLE

You must work incrementally.

Never attempt to generate the entire platform in one giant pass.

Use milestone-based implementation.

For each milestone:

1. inspect current repository;
2. read relevant sections of `PRD.md`, `RULE.md`, `DESIGN.md`;
3. identify required skills;
4. explicitly use those skills;
5. implement;
6. run validation;
7. fix issues;
8. summarize;
9. continue only when the current milestone is stable.

---

# 5. REQUIRED PROJECT PHASES

Execute in this order unless a repository already contains completed work.

---

# PHASE 0 — REPOSITORY AUDIT

Before writing code:

1. inspect repository structure;
2. inspect package manager;
3. inspect framework;
4. inspect existing dependencies;
5. inspect environment files;
6. inspect database setup;
7. inspect Docker/VPS assumptions;
8. inspect current design assets;
9. inspect existing components;
10. inspect current tests.

Then create a concise internal implementation plan.

Use:
- `antislop-code`
- `full-output-enforcement`

Do not replace working architecture without strong reason.

---

# PHASE 1 — FOUNDATION

## Objective

Create a clean, production-oriented base.

### Required stack preference

Unless project already uses an equivalent stack:

Frontend:
- Next.js latest stable App Router
- TypeScript
- Tailwind CSS
- accessible UI primitives

Backend:
- same monorepo acceptable initially
- server modules cleanly separated

Database:
- PostgreSQL
- Prisma or equivalent typed ORM

Queue/cache:
- Redis
- durable worker queue

Infrastructure:
- Docker
- environment validation
- VPS-friendly deployment

### Tasks

- initialize app;
- strict TypeScript;
- lint;
- formatting;
- environment schema;
- database connection;
- migrations;
- Docker;
- app shell;
- server health check;
- error handling baseline;
- request/correlation ID;
- seed infrastructure.

### Skills

Use:
- `antislop-code`
- `full-output-enforcement`

For UI shell:
- `design-system`
- `design-taste-frontend`
- `antislop-ui`

### Acceptance

- project builds;
- lint passes;
- typecheck passes;
- database connects;
- migration works;
- environment validation works;
- no secret committed;
- initial app shell renders.

---

# PHASE 2 — BRAND + DESIGN SYSTEM

## Objective

Establish TOPUPLAB's original design identity.

### Required skills

Use:
- `brand`
- `brandkit`
- `design`
- `design-system`
- `high-end-visual-design`
- `ui-ux-pro-max`
- `gpt-taste`
- `antislop`
- `antislop-ui`

### Deliverables

- working logo/wordmark placeholder;
- favicon;
- semantic color tokens;
- typography;
- spacing scale;
- radius;
- shadows;
- icon rules;
- button variants;
- input;
- select;
- card;
- badges;
- status chip;
- modal;
- drawer;
- table;
- toast;
- skeleton;
- empty state;
- page container;
- responsive grid.

### Visual direction

Follow `DESIGN.md`.

Key identity:
**commerce utility × gaming energy**

Primary customer theme:
light.

Brand direction:
electric chartreuse/lime + strong neutral ink.

Avoid:
- overused purple gradient;
- excessive glassmorphism;
- gamer neon;
- random glow;
- crypto look;
- generic SaaS visuals.

---

# PHASE 3 — DATABASE DOMAIN MODEL

## Objective

Implement the core schema safely.

### Entities

At minimum:

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

### Hard requirements

Use:
- integer money;
- unique idempotency keys;
- immutable financial history;
- provider SKU separation from customer-facing Product;
- explicit status enums;
- timestamps;
- meaningful indexes;
- foreign keys;
- transaction-safe constraints.

### Skills

Use:
- `antislop-code`
- `full-output-enforcement`

### Deliverables

- schema;
- migration;
- seed;
- ERD documentation if useful.

---

# PHASE 4 — DEMO DATA

## Objective

Create a realistic portfolio demo without live credentials.

### Required

Add:

`APP_MODE=demo`

Demo data should include:

Games:
- Mobile Legends
- Free Fire
- PUBG Mobile
- Roblox
- Valorant
- Genshin Impact

Other categories:
- Pulsa
- Paket Data
- E-Wallet
- PLN
- Voucher

Demo provider mappings:
- Provider Alpha
- Provider Beta
- Provider Gamma

Demo price tiers:
- PUBLIC
- MEMBER
- GOLD
- RESELLER

Demo scenarios:
- success;
- pending;
- failure;
- delayed completion;
- refund.

### Important

Demo mode must NEVER accidentally call a production provider.

Use:
- `antislop-code`
- `full-output-enforcement`

---

# PHASE 5 — PUBLIC HOMEPAGE

## Objective

Create a high-end public homepage.

### Required skills

Use:
- `design-taste-frontend`
- `design-taste-frontend-v1`
- `ui-ux-pro-max`
- `high-end-visual-design`
- `antislop`
- `antislop-ui`
- `ui-stvling`
- `antislop-copywriting`
- `antislop-human`

Use:
- `imagegen-frontend-web`
only if original visuals materially improve the page.

### Sections

- navigation;
- search-first hero;
- category shortcuts;
- flash sale;
- popular games;
- PPOB shortcuts;
- promo banner;
- how it works;
- trust/functionality section;
- FAQ;
- footer.

### Constraints

Do not create:
- generic “revolutionizing digital top-ups” headline;
- fake metrics;
- fake customer reviews;
- fake partners;
- meaningless dashboard screenshots.

---

# PHASE 6 — CATALOG + SEARCH

## Objective

Implement browsing and finding products.

### Features

- category listing;
- game listing;
- search;
- tags;
- popular products;
- product availability;
- admin sorting;
- product visibility.

### Skills

Use:
- `antislop-ui`
- `design-system`
- `design-taste-frontend`
- `antislop-layoutmobile`

### Mobile

- two-column where appropriate;
- touch-safe;
- scroll behavior polished;
- search easy to reach.

---

# PHASE 7 — PRODUCT DETAIL / GAME TOP-UP PAGE

## Objective

Build the main conversion experience.

### Required skills

Use:
- `ui-ux-pro-max`
- `design-taste-frontend`
- `high-end-visual-design`
- `antislop-ui`
- `antislop-layoutmobile`
- `antislop-copywriting`
- `antislop-human`

### Structure

Step 1:
target account information.

Step 2:
denomination.

Step 3:
payment method.

Step 4:
contact and review.

### Required components

- dynamic input schema;
- denomination grid;
- tier price;
- promo badge;
- payment fee;
- price breakdown;
- sticky checkout summary;
- mobile sticky CTA.

### Financial rule

Displayed price can be client-visible.

Final price MUST be recalculated server-side.

---

# PHASE 8 — PRICING ENGINE

## Objective

Implement configurable pricing.

### Supported

- provider cost;
- fixed markup;
- percentage markup;
- minimum margin;
- tier pricing;
- category rule;
- brand rule;
- product rule;
- provider rule;
- scheduled rule.

### Precedence

`product > brand > category > global`

### Required output

Pricing engine should return an explainable breakdown.

### Hard rules

Warn if:
- price below provider cost;
- negative expected margin;
- flash sale violates minimum margin;
- fee destroys margin.

### Skills

Use:
- `antislop-code`
- `full-output-enforcement`

For admin UI:
- `design-system`
- `antislop-ui`
- `ui-ux-pro-max`

---

# PHASE 9 — AUTHENTICATION

## Objective

Implement safe customer/admin auth.

### Features

- register;
- login;
- logout;
- password reset;
- email/phone verification where appropriate;
- session management;
- role authorization;
- admin protection;
- optional OAuth later.

### Requirements

- server-side authorization;
- safe cookie/session config;
- rate limiting;
- no role trust from client.

### Skills

Use:
- `antislop-code`
- `full-output-enforcement`

---

# PHASE 10 — ORDER CREATION

## Objective

Create reliable orders.

### Required

Persist immutable:
- product;
- target;
- price snapshot;
- fee;
- discount;
- tier;
- expected margin.

### Order states

Implement all states defined in PRD.

### Hard requirement

Use a centralized state transition service.

Do not scatter order state mutations.

### Skills

Use:
- `antislop-code`
- `full-output-enforcement`

---

# PHASE 11 — PAYMENT ABSTRACTION

## Objective

Build payment adapter architecture.

### Adapter capabilities

- create payment;
- fetch status;
- cancel if supported;
- verify webhook;
- normalize webhook;
- normalize payment status.

### Implement

1. mock payment provider;
2. sandbox-ready adapter interface;
3. real gateway adapter only if credentials are available.

### HARD RULES

Never:
- mark order paid from frontend;
- trust redirect;
- trust client amount.

Always:
- verify webhook;
- validate amount;
- validate order;
- deduplicate;
- persist event;
- queue fulfillment.

### Skills

Use:
- `antislop-code`
- `full-output-enforcement`

---

# PHASE 12 — PROVIDER ABSTRACTION

## Objective

Create multi-provider adapter layer.

### Interface

Must support:

- getProducts
- getBalance
- createTransaction
- checkTransaction
- verifyWebhook
- normalizeWebhook
- normalizeStatus
- supportsInquiry
- inquirePostpaid
- payPostpaid

where applicable.

### Implement

- mock provider;
- provider registry;
- adapter contract;
- normalized statuses;
- provider error codes.

### Skills

Use:
- `antislop-code`
- `full-output-enforcement`

---

# PHASE 13 — PROVIDER PRODUCT SYNC

## Objective

Sync provider catalogs safely.

### Process

provider catalog
→ normalize
→ ProviderSku
→ mapping
→ candidate cost
→ pricing engine
→ admin review/publish.

### Requirements

- sync history;
- last sync;
- inactive/changed product handling;
- large price jump warning;
- no customer page direct provider fetching.

### Skills

Use:
- `antislop-code`
- `full-output-enforcement`

---

# PHASE 14 — FULFILLMENT ENGINE

## Objective

Submit paid orders safely.

### Flow

PAID
→ QUEUED
→ PROCESSING
→ provider attempt
→ SUCCESS / PROVIDER_PENDING / FAILED.

### Requirements

- immutable provider attempt reference;
- queue;
- retry policy;
- timeout policy;
- reconciliation;
- audit.

### HARD RULE

Timeout != failure.

Never auto-send to a second provider while the first attempt remains ambiguous.

### Skills

Use:
- `antislop-code`
- `full-output-enforcement`

---

# PHASE 15 — MULTI-PROVIDER ROUTER

## Objective

Implement routing strategies.

### Strategies

- priority;
- lowest cost;
- best margin;
- health-aware;
- manual pin.

### Provider selection inputs

- mapped SKU;
- provider enabled;
- provider health;
- provider balance;
- price;
- safety;
- transaction type.

### Fallback

Only fallback when duplicate fulfillment risk is eliminated.

### Skills

Use:
- `antislop-code`
- `full-output-enforcement`

---

# PHASE 16 — WEBHOOK ENGINE

## Objective

Handle provider/payment callbacks safely.

### Required sequence

1. raw payload;
2. authenticate;
3. validate;
4. derive event ID;
5. persist;
6. deduplicate;
7. normalize;
8. validate transition;
9. process;
10. queue downstream effects;
11. respond.

### Test

Must test:
- duplicate;
- malformed;
- forged;
- delayed;
- out-of-order;
- replay.

### Skills

Use:
- `antislop-code`
- `full-output-enforcement`

---

# PHASE 17 — CUSTOMER TRANSACTION TRACKING

## Objective

Create a trustworthy transaction status UI.

### Skills

Use:
- `ui-ux-pro-max`
- `design-taste-frontend`
- `antislop-ui`
- `antislop-layoutmobile`
- `antislop-copywriting`
- `antislop-human`

### UI

- order number;
- product;
- target;
- total;
- payment status;
- fulfillment status;
- timeline;
- timestamps;
- next action;
- refund state.

Pending copy must be calm and precise.

---

# PHASE 18 — WALLET / INTERNAL BALANCE

## Objective

Implement auditable internal balance.

### Requirements

- wallet account;
- append-only ledger;
- available balance;
- reserved balance;
- atomic mutation;
- idempotency;
- balance payment;
- balance top-up;
- refund.

### HARD RULE

Never implement wallet as only:

`user.balance = user.balance + x`

without ledger.

### Skills

Use:
- `antislop-code`
- `full-output-enforcement`

UI:
- `design-system`
- `antislop-ui`

---

# PHASE 19 — MEMBERSHIP / MULTI-TIER PRICING

## Objective

Create configurable member tiers.

### Example

- Public
- Member
- Gold
- Reseller

Names must remain configurable.

### Customer UI

Show:
- current tier;
- benefits;
- pricing advantage;
- progress to next tier.

### Skills

Use:
- `ui-ux-pro-max`
- `design-taste-frontend`
- `high-end-visual-design`
- `antislop-ui`
- `antislop-copywriting`

---

# PHASE 20 — REFERRAL

## Objective

Implement safe referral system.

### Features

- code;
- link;
- registered referral;
- qualified referral;
- reward;
- reversal;
- dashboard.

### Anti-abuse

- no self referral;
- delayed qualification;
- unique reward event;
- manual review.

### Skills

Backend:
- `antislop-code`

UI/copy:
- `antislop-ui`
- `antislop-human`
- `antislop-copywriting`

---

# PHASE 21 — PROMO ENGINE

## Objective

Support:

- fixed discount;
- percentage;
- cashback;
- free admin fee;
- category;
- product;
- membership;
- first order;
- minimum spend;
- quota.

### Requirements

- deterministic breakdown;
- stacking rules;
- per-user quota;
- total budget;
- concurrency safety.

### Skills

Use:
- `antislop-code`
- `full-output-enforcement`

---

# PHASE 22 — FLASH SALE

## Objective

Create a real flash sale engine.

### Required skills

Backend:
- `antislop-code`
- `full-output-enforcement`

Frontend:
- `banner-design`
- `brand`
- `design-taste-frontend`
- `high-end-visual-design`
- `antislop-ui`
- `antislop-layoutmobile`

Use:
- `imagegen-frontend-web`
only if needed for original campaign art.

### Requirements

- countdown;
- scheduled start/end;
- quota;
- per-user limit;
- safe reservation;
- server-side eligibility;
- server-side pricing;
- expired state.

Client countdown is visual only.

---

# PHASE 23 — CUSTOMER DASHBOARD

## Objective

Create a repeat-purchase oriented account dashboard.

### Content

- balance;
- membership;
- recent transactions;
- buy again;
- promo;
- referral;
- notifications.

### Skills

Use:
- `design-taste-frontend`
- `ui-ux-pro-max`
- `antislop-ui`
- `antislop-layoutmobile`
- `antislop-human`

Do not turn customer dashboard into SaaS analytics.

---

# PHASE 24 — ADMIN SHELL

## Objective

Create high-quality operational dashboard.

### Skills

Use:
- `design-system`
- `ui-ux-pro-max`
- `design-taste-frontend`
- `gpt-taste`
- `antislop-ui`
- `high-end-visual-design`

### Layout

Desktop:
- sidebar;
- topbar;
- dense content.

Mobile:
- appropriate reduced workflow;
- do not blindly shrink desktop tables.

---

# PHASE 25 — ADMIN OVERVIEW

## Objective

Show meaningful metrics.

### KPIs

- GMV;
- successful paid orders;
- success rate;
- pending;
- failure;
- provider cost;
- estimated gross margin;
- payment fees;
- promo cost.

### Charts

Use only meaningful charts.

No fake stats.

### Skills

Use:
- `antislop-ui`
- `design-taste-frontend`
- `gpt-taste`
- `high-end-visual-design`

---

# PHASE 26 — ADMIN TRANSACTION MANAGEMENT

## Objective

Create a powerful transaction operations view.

### List

- order ID;
- customer;
- product;
- target;
- payment;
- provider;
- status;
- amount;
- time.

### Detail

Must include:
- price snapshot;
- payment timeline;
- provider attempts;
- webhook events;
- ledger;
- audit;
- notes.

### Dangerous action rule

Do not provide:
“Force success”

Allowed actions:
- recheck;
- retry if safe;
- manual review;
- refund if eligible;
- send notification.

### Skills

Use:
- `ui-ux-pro-max`
- `antislop-ui`
- `design-system`
- `antislop-copywriting`

---

# PHASE 27 — ADMIN PROVIDER MANAGEMENT

## Objective

Manage provider integrations visually.

### Views

- provider list;
- balance;
- health;
- latency;
- success rate;
- mapped SKU;
- last sync;
- enable/disable;
- routing priority.

### Credentials

Never reveal full secret.

Use masked values.

### Skills

Use:
- `design-system`
- `antislop-ui`
- `ui-ux-pro-max`

---

# PHASE 28 — ADMIN ROUTING

## Objective

Visualize and configure provider routing.

### Show

For each product:
- primary provider;
- backups;
- provider cost;
- margin;
- health;
- priority;
- strategy.

### UI

Make routing logic understandable.

Do not hide dangerous fallback rules.

### Skills

Use:
- `ui-ux-pro-max`
- `antislop-ui`
- `gpt-taste`

---

# PHASE 29 — ADMIN PRICING BUILDER

## Objective

Build a professional pricing rule editor.

### Required

- scope;
- tier;
- markup;
- percentage;
- min margin;
- schedule;
- preview;
- warnings.

### Preview

Show:
- cost;
- sell price;
- expected fee;
- expected margin;
- margin percentage.

### Skills

Use:
- `ui-ux-pro-max`
- `design-system`
- `antislop-ui`
- `antislop-copywriting`

---

# PHASE 30 — REPORTING

## Objective

Build operational business reporting.

### Reports

- sales;
- margin;
- provider;
- product;
- category;
- payment;
- membership;
- promo;
- referral;
- refund.

### Filters

- date;
- provider;
- category;
- product;
- payment;
- tier;
- status.

### Exports

Start with CSV.

### Skills

Backend:
- `antislop-code`

Frontend:
- `antislop-ui`
- `design-system`

---

# PHASE 31 — NOTIFICATIONS

## Objective

Implement event-driven notifications.

### Channels

- in-app;
- email;
- optional WhatsApp adapter later.

### Events

- waiting payment;
- paid;
- processing;
- success;
- failed;
- refund;
- referral reward;
- tier upgrade;
- balance.

### Rule

Notification failure must not break order processing.

### Skills

Use:
- `antislop-code`
- `antislop-copywriting`
- `antislop-human`

---

# PHASE 32 — CMS / PROMO CONTENT

## Objective

Allow admin-managed promotional content.

### Include

- banners;
- homepage promo;
- FAQ;
- simple article/news support if useful.

### Skills

Use:
- `banner-design`
- `brand`
- `brandkit`
- `antislop-copywriting`
- `antislop-human`
- `high-end-visual-design`

---

# PHASE 33 — RESPONSIVE REVIEW

## Objective

Perform a dedicated mobile/tablet review.

### Mandatory skills

Use:
- `antislop-layoutmobile`
- `antislop-ui`
- `ui-ux-pro-max`

### Test widths

At minimum:
- 320
- 360
- 390
- 768
- 1024
- 1280
- 1440

### Focus

- navigation;
- product grid;
- checkout;
- payment;
- status;
- dashboard;
- tables;
- filters;
- drawers;
- sticky CTA.

---

# PHASE 34 — VISUAL ANTI-SLOP AUDIT

## Objective

Remove generic AI design patterns.

### Mandatory skills

Use:
- `antislop`
- `antislop-ui`
- `gpt-taste`
- `high-end-visual-design`
- `design-taste-frontend`

Review every major screen.

Remove:
- unnecessary gradients;
- excessive pills;
- nested cards;
- meaningless badges;
- excessive rounded corners;
- fake data;
- decorative charts;
- giant empty hero areas;
- repetitive section design;
- excessive animation.

---

# PHASE 35 — COPY AUDIT

## Objective

Make all copy natural and clear.

### Mandatory skills

Use:
- `antislop-copywriting`
- `antislop-human`

Review:
- navigation;
- hero;
- CTA;
- labels;
- helpers;
- checkout;
- transaction statuses;
- membership;
- referral;
- promo;
- admin;
- empty states;
- errors.

Remove:
- generic AI wording;
- overpromising;
- fake urgency;
- excessive English where Indonesian is clearer.

---

# PHASE 36 — ACCESSIBILITY

## Objective

Audit WCAG-oriented usability.

### Check

- labels;
- keyboard;
- focus;
- contrast;
- dialogs;
- drawers;
- form errors;
- reduced motion;
- semantic headings;
- status communication.

### Skills

Use:
- `ui-ux-pro-max`
- `antislop-ui`

---

# PHASE 37 — TESTING

## Objective

Make critical flows testable and reliable.

### Unit

- pricing;
- tier;
- promo;
- status transitions;
- provider normalization;
- referral;
- ledger.

### Integration

- checkout;
- payment webhook;
- duplicate webhook;
- provider success;
- pending;
- failure;
- wallet;
- refund;
- flash sale.

### E2E

- guest success;
- member pricing;
- pending;
- failure/refund;
- admin catalog;
- flash sale;
- duplicate submission.

### Skills

Use:
- `antislop-code`
- `full-output-enforcement`

Never fake test results.

---

# PHASE 38 — SECURITY REVIEW

## Objective

Before any production deployment:

Check:
- secrets;
- session;
- auth;
- authorization;
- CSRF;
- XSS;
- injection;
- rate limits;
- webhook signing;
- replay protection;
- idempotency;
- admin actions;
- logs;
- environment config.

Never expose:
- provider secret;
- payment secret;
- raw password;
- full auth token.

### Skills

Use:
- `antislop-code`
- `full-output-enforcement`

---

# PHASE 39 — OBSERVABILITY

## Objective

Make production behavior debuggable.

### Add

- structured logging;
- request ID;
- order ID;
- provider attempt ID;
- payment event ID;
- webhook event ID;
- job state.

### Never log

- password;
- API key;
- session token;
- webhook secret;
- full sensitive payload.

---

# PHASE 40 — VPS DEPLOYMENT READINESS

## Objective

Prepare for user's VPS and domain.

### Required

- Docker;
- production env template;
- migration command;
- build command;
- worker;
- Redis;
- PostgreSQL;
- reverse proxy guidance;
- HTTPS assumptions;
- health endpoints;
- restart policy;
- backup procedure.

Do not hardcode deployment to Vercel.

---

# 6. DESIGN REVIEW PROTOCOL

## MOTION REVIEW PROTOCOL

Apply this protocol to frontend implementation and review in Phases 1, 2, 5, 6, 7, 17, 19, 20, 22, 23, 24 through 30, and 32 through 36, wherever interaction or animated state exists.

- Use `motion` with React imports from `motion/react` as the primary UI motion library. Keep simple color, border, and opacity feedback in CSS when sufficient.
- Phase 1 establishes motion tokens, global reduced-motion policy, and only the reusable abstractions actually used by the shell. Phase 2 extends the component system; later phases apply it to real product behavior.
- Follow DESIGN.md's Motion System for durations, easing, springs, distance, performance, and signature interactions. Do not scatter arbitrary animation values through pages.
- Explain the purpose of each animation: feedback, hierarchy, or a real state change. Never delay navigation or financial status for animation.
- Verify `prefers-reduced-motion`: no decorative transforms, parallax, non-essential scroll movement, or large scale changes. Critical information must remain visible without animation or JavaScript.
- Verify mobile behavior, keyboard/focus behavior, and transform/opacity performance. Avoid scroll jank, continuous blur animation, and excessive simultaneous animation.
- Use `@lottiefiles/dotlottie-react` selectively for curated illustrations, never as the general UI engine or universal loader. Prefer local original/licensed `.lottie` files, lazy-load non-critical players, and provide static/text fallbacks. Install it only with a legitimate first use or useful abstraction; otherwise record it as approved for a later phase.
- Consider a worker player only after profiling demonstrates main-thread pressure. Do not add speculative GPU renderers.
- Record actual motion and reduced-motion validation in milestone reports. Report unavailable checks honestly.

Every major public page must be reviewed using at least:

1. `design-taste-frontend`
2. `antislop-ui`
3. `ui-ux-pro-max`

High-value pages should additionally use:

- `high-end-visual-design`
- `gpt-taste`

High-value pages include:

- home;
- game detail;
- checkout;
- payment waiting;
- transaction success;
- price list;
- membership;
- referral;
- customer dashboard;
- admin overview;
- admin transaction detail;
- provider routing;
- pricing builder.

---

# 7. MOBILE REVIEW PROTOCOL

Every customer-facing page must be reviewed with:

- `antislop-layoutmobile`

Specifically verify:

- touch target >= comfortable size;
- no overflow;
- sticky CTA correct;
- keyboard behavior acceptable;
- long labels wrap;
- totals remain visible;
- payment method cards remain usable;
- price cards remain readable.

---

# 8. COPY REVIEW PROTOCOL

Every major public page must be reviewed with:

- `antislop-copywriting`
- `antislop-human`

Public copy should feel like a real Indonesian digital product.

Example preferred:

“Masukkan User ID”
“Pilih nominal”
“Pembayaran berhasil”
“Pesanan sedang diproses”

Avoid:

“Rasakan revolusi top up masa kini”
“Platform terbaik nomor satu”
“Transaksi dijamin 100% sukses”

---

# 9. BRAND RULES

You may create the working brand TOPUPLAB.

Use:

- `brand`
- `brandkit`

If creating promotional banners use:

- `banner-design`

Brand must be original.

Do not:
- imitate competitor logo;
- reuse competitor color palette identically;
- copy competitor promotional banners;
- copy competitor slogans.

---

# 10. REFERENCE USAGE

If competitor screenshots or inspiration are provided:

Use:
- `image-to-code`
- `redesign-existing-projects`
- `stitch-design-taste`

Extract only:

- hierarchy;
- layout pattern;
- interaction pattern;
- component ideas.

Then re-design them to TOPUPLAB's visual system.

Never copy:
- exact wording;
- brand;
- artwork;
- distinctive composition one-to-one.

---

# 11. CODE QUALITY GATES

Do not move to the next milestone when the current milestone has:

- TypeScript errors;
- lint errors;
- broken imports;
- failed build;
- schema mismatch;
- dead button;
- fake API response;
- unhandled async state;
- security regression;
- incomplete feature disguised as done.

Use:
- `antislop-code`
- `full-output-enforcement`

before marking a milestone complete.

---

# 12. FINANCIAL SAFETY GATES

Before marking any money-related feature complete, confirm:

- server calculates amount;
- integer money used;
- price snapshot stored;
- idempotency exists;
- transaction boundary exists;
- audit exists;
- state transition valid;
- duplicate requests safe;
- retry safe;
- webhook verified.

If not:
feature is NOT complete.

---

# 13. PROVIDER SAFETY GATES

Before marking provider fulfillment complete, confirm:

- provider adapter isolated;
- ref ID unique;
- pending supported;
- timeout treated safely;
- fallback cannot double fulfill;
- webhook verified;
- reconciliation possible;
- provider response normalized.

---

# 14. PAYMENT SAFETY GATES

Before marking payment flow complete:

- redirect does not mark paid;
- webhook verified;
- amount checked;
- order checked;
- event deduplicated;
- state transition validated;
- fulfillment queued;
- duplicate callback tested.

---

# 15. WALLET SAFETY GATES

Before marking wallet complete:

- append-only ledger;
- atomic balance mutation;
- idempotency;
- no client-authoritative amount;
- refund uses new ledger entry;
- admin adjustment audited.

---

# 16. FLASH SALE SAFETY GATES

Before marking flash sale complete:

- server time;
- atomic quota;
- server price;
- per-user limit;
- expiration;
- race condition test.

---

# 17. REQUIRED PORTFOLIO QUALITY SCREENS

The following screens deserve extra polish:

1. Home
2. Search results
3. Product/game detail
4. Checkout
5. Waiting payment
6. Payment success
7. Transaction tracking
8. Price list
9. Membership
10. Referral
11. Customer dashboard
12. Wallet ledger
13. Admin overview
14. Admin transactions
15. Admin transaction detail
16. Provider list
17. Provider detail
18. Provider routing
19. Pricing rule builder
20. Flash sale admin
21. Reports
22. Audit log

Use the appropriate design skills intentionally.

---

# 18. DO NOT IMPLEMENT FAKE FEATURES

Never create production-facing UI that suggests a feature exists if backend behavior does not exist.

Examples prohibited:

- “Automatic fallback” toggle that does nothing;
- provider health chart using random numbers;
- referral earnings using fake data in production mode;
- fake live transaction counter;
- fake notification;
- fake review count;
- “secure payment” badge with no basis;
- fake uptime.

Demo mode may use seeded data but must remain clearly separated from production.

---

# 19. NO GENERIC TEMPLATE OUTPUT

The project should not look like it came from a generic admin template.

Create custom identity through:

- spacing;
- type hierarchy;
- transactional component design;
- denomination cards;
- search;
- transaction timeline;
- pricing matrix;
- provider health strip;
- smart checkout bar;
- financial event timeline.

Use `DESIGN.md`.

---

# 20. COMPONENT SIGNATURES

Prioritize building these custom components:

- `QuickSearchHero`
- `CategoryShortcut`
- `ProductCard`
- `DenominationGrid`
- `PaymentMethodList`
- `PriceBreakdown`
- `SmartCheckoutBar`
- `TransactionTimeline`
- `TierPriceMatrix`
- `ProviderHealthStrip`
- `ProviderRoutingTable`
- `PricingRuleBuilder`
- `FinancialEventTimeline`
- `LedgerTable`
- `FlashSaleCard`
- `MembershipProgress`
- `ReferralSummary`

These components should become visually identifiable as TOPUPLAB.

---

# 21. REQUIRED DEMO FLOWS

In demo mode, support:

### Flow A
Guest → Mobile Legends → 86 Diamonds → QRIS → Success.

### Flow B
Member → discounted price → payment → provider pending → success later.

### Flow C
Provider failure → safe error → refund.

### Flow D
Flash sale purchase → quota reduction.

### Flow E
Referral qualification → reward.

### Flow F
Wallet balance payment.

### Flow G
Admin switches product provider priority.

### Flow H
Admin sees provider degraded.

### Flow I
Admin changes pricing rule and previews margin.

---

# 22. TEST DATA QUALITY

Demo data should feel realistic.

Use realistic Indonesian pricing formats.

Examples:

Rp1.500
Rp10.000
Rp19.900
Rp50.000
Rp100.000

Do not use random ugly values everywhere unless intentionally representing provider cost.

Example:

Provider cost:
Rp18.742

Customer price:
Rp20.500

Expected margin:
Rp1.758

---

# 23. INDONESIAN FORMATTING

Default:

Currency:
`Rp20.500`

Dates:
use Indonesian locale where appropriate.

Time:
24-hour format.

Public language:
Indonesian.

Technical admin labels may use common industry English only when clearer.

---

# 24. ORDER STATUS COPY

Use clear Indonesian:

`DRAFT`
→ Draft

`WAITING_PAYMENT`
→ Menunggu pembayaran

`PAYMENT_PENDING`
→ Pembayaran sedang dikonfirmasi

`PAID`
→ Pembayaran berhasil

`QUEUED`
→ Masuk antrean

`PROCESSING`
→ Sedang diproses

`PROVIDER_PENDING`
→ Menunggu konfirmasi provider

`SUCCESS`
→ Berhasil

`FAILED`
→ Gagal

`EXPIRED`
→ Pembayaran kedaluwarsa

`REFUND_PENDING`
→ Pengembalian dana diproses

`REFUNDED`
→ Dana dikembalikan

`MANUAL_REVIEW`
→ Sedang ditinjau

`CANCELLED`
→ Dibatalkan

Never show success while provider is pending.

---

# 25. INITIAL DATABASE SEED

Seed realistic demo data.

Categories:

- Game
- Pulsa
- Paket Data
- E-Wallet
- PLN
- Voucher
- Tagihan

Games:

- Mobile Legends
- Free Fire
- PUBG Mobile
- Roblox
- Valorant
- Genshin Impact

Tier examples:

- Public
- Member
- Gold
- Reseller

Provider examples:

- Alpha Digital
- Beta Supply
- Gamma H2H

These are demo names, not claims of real providers.

---

# 26. FIRST IMPLEMENTATION ORDER

If starting from an empty repository, perform:

1. Phase 0
2. Phase 1
3. Phase 2
4. Phase 3
5. Phase 4
6. Phase 5
7. Phase 6
8. Phase 7
9. Phase 8
10. Phase 9
11. Phase 10

After that continue sequentially.

Do NOT begin with payment provider integration before domain and order architecture exist.

---

# 27. FIRST SESSION GOAL

For the first implementation session, aim to complete only:

- repository foundation;
- package structure;
- environment setup;
- database connection;
- base schema;
- seed framework;
- design tokens;
- app shell;
- public header/footer;
- admin shell skeleton;
- developer documentation.

Do not attempt the entire product.

Quality > volume.

---

# 28. REQUIRED PROGRESS REPORT

For Phase 1 under the 2026-09-22 amendment, report: Completed, Skills Used, Skills Unavailable, Files Changed, Dependencies Added, Motion System Added, Validation, Remaining, and Risks. Stop after Phase 1.

After each milestone, output:

## Completed

What was implemented.

## Skills Used

List exactly which installed skills were used and for what.

Example:

- `design-system` — token/component foundation
- `antislop-ui` — UI review
- `antislop-code` — code quality review

## Files Changed

Key files.

## Validation

Report actual commands run:

- lint
- typecheck
- test
- build
- migration

Do not claim a command passed if it was not run.

## Remaining

What remains for the next milestone.

## Risks

Only real unresolved issues.

---

# 29. REQUIRED SKILL REPORTING

Every progress report MUST contain:

`Skills Used`

This is mandatory.

If a relevant installed skill was not used, explain why.

This ensures the project genuinely benefits from the installed Antigravity skill stack.

---

# 30. DESIGN REVIEW BEFORE COMPLETION

Before declaring a public page complete:

Use at least:

- `antislop-ui`
- `design-taste-frontend`
- `ui-ux-pro-max`

For major pages additionally use:

- `high-end-visual-design`
- `gpt-taste`

For mobile additionally:

- `antislop-layoutmobile`

For text additionally:

- `antislop-copywriting`
- `antislop-human`

---

# 31. CODE REVIEW BEFORE COMPLETION

Before declaring backend/business features complete:

Use:

- `antislop-code`
- `full-output-enforcement`

Review:

- completeness;
- types;
- error handling;
- transactions;
- tests;
- duplicated code;
- unsafe shortcuts;
- placeholders;
- unhandled edge cases.

---

# 32. DEFINITION OF DONE

A feature is only done when:

- implementation exists;
- UI exists when applicable;
- mobile works;
- loading works;
- empty state works;
- errors work;
- authorization works;
- server validation works;
- tests exist for critical logic;
- logs/audit exist when appropriate;
- financial constraints pass;
- design review passes;
- copy review passes;
- no fake functionality remains.

---

# 33. PROJECT CHARACTER

TOPUPLAB must feel:

- modern;
- premium;
- direct;
- transparent;
- stable;
- fast;
- operationally serious.

It must not feel:

- generic;
- flashy for no reason;
- over-animated;
- crypto-inspired;
- templated;
- fake;
- AI-slop.

---

# 34. YOUR ROLE

Act as:

- senior product engineer;
- system architect;
- frontend engineer;
- backend engineer;
- product designer;
- UX reviewer;
- security-conscious financial application engineer.

But remain disciplined.

Do not over-engineer trivial areas.
Do not under-engineer money flows.

---

# 35. FINAL START COMMAND

Begin now.

First:

1. read `RULE.md`;
2. read `PRD.md`;
3. read `DESIGN.md`;
4. inspect `skills-lock.json`;
5. inspect repository;
6. identify available skills;
7. produce a concise Phase 0 audit;
8. list the skills you will use for Phase 1;
9. implement Phase 1;
10. validate Phase 1;
11. report using the required progress format.

Do not skip skill usage.

Do not skip validation.

Do not build the whole project in one uncontrolled pass.

Build TOPUPLAB milestone by milestone until it becomes a complete, portfolio-grade, production-oriented PPOB and game top-up platform.
