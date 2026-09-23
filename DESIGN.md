# DESIGN.md — TOPUPLAB

> Visual system for a premium Indonesian PPOB & game top-up platform.
> This document is the visual authority for the project.

---

## 1. Design Goal

TOPUPLAB must look like a legitimate, mature digital commerce product.

It should feel:
- fast;
- clean;
- premium;
- energetic without becoming noisy;
- trustworthy;
- modern Indonesian;
- optimized for repeat transactions.

It must not look like:
- a generic Tailwind template;
- a neon cyberpunk gaming website;
- a cryptocurrency exchange;
- a banking clone;
- an AI-generated landing page;
- a direct PayTopUp copy.

---

## 2. Visual Concept

### “Commerce Utility × Gaming Energy”

The base UI is calm and functional.
Gaming/product artwork supplies energy.
Promotional moments use stronger visual accents.
Financial/admin surfaces stay restrained.

Think:
- strong product hierarchy;
- crisp typography;
- dark ink text;
- warm neutral surfaces;
- one confident electric accent;
- limited use of gradient;
- image-led game catalog;
- clear monetary information.

---

## 3. Brand Working Name

**TOPUPLAB**

Brand character:
- concise;
- technical;
- reliable;
- youthful but not childish.

Brand can be renamed later without redesigning core components.

---

## 4. Logo Direction

Wordmark-first.

Desired:
- strong lowercase/uppercase wordmark;
- optional compact symbol derived from:
  - upward pulse;
  - bolt;
  - transaction arrows;
  - stacked credit/token.

Avoid:
- game controller cliché;
- coin with dollar sign;
- shield/checkmark cliché;
- lightning copied from major brands.

Logo should work in:
- navbar;
- favicon;
- mobile app-like icon;
- admin sidebar;
- monochrome.

---

## 5. Color System

Do not hard-code hexadecimal values throughout pages.
Use semantic tokens.

Suggested starting palette:

### Brand
- `brand-50`: very light electric lime tint
- `brand-100`
- `brand-200`
- `brand-300`
- `brand-400`
- `brand-500`: primary accent
- `brand-600`
- `brand-700`
- `brand-800`
- `brand-900`

Recommended primary direction:
**electric chartreuse/lime leaning slightly warm**, paired with near-black ink.

Reason:
- differentiates from overused purple/blue gaming/top-up visuals;
- high recognition;
- works for CTAs;
- modern tech-commerce feel.

### Neutral
Warm/cool balanced neutral scale:
- `neutral-0`
- `neutral-50`
- `neutral-100`
- ...
- `neutral-950`

### Semantic
- success
- warning
- danger
- info

Financial semantic color usage must be conventional and readable.

Never use brand green for every positive financial status if it reduces distinction.

---

## 6. Theme

### Customer site
Primary theme: light.

Optional dark mode may be added later, but should not delay core quality.

### Admin
Light theme first.
Dense information benefits from neutral surfaces and restrained contrast.

Do not make dark mode the default merely because the product includes games.

---

## 7. Typography

Use a modern variable sans-serif with excellent Indonesian readability.

Preferred characteristics:
- open counters;
- clear numerals;
- strong medium/semi-bold;
- compact enough for pricing tables.

Possible direction:
- Geist;
- Inter;
- Plus Jakarta Sans;
- another licensed/open modern grotesk.

Use at most:
- one primary UI family;
- optional display accent only if brand work justifies it.

### Type scale

Desktop suggestion:
- Display: 48–64
- H1: 40–48
- H2: 32–40
- H3: 24–28
- H4: 20–22
- Body L: 18
- Body: 16
- Small: 14
- Micro: 12

Mobile:
- Display: 36–44
- H1: 32–36
- H2: 26–30
- H3: 22–24
- Body: 16

Pricing numerals use tabular figures where useful.

---

## 8. Layout System

### Public max widths
- content: ~1200–1280px;
- reading content: narrower;
- checkout: focused width;
- full-bleed promotional bands allowed selectively.

### Grid
Desktop:
- 12-column grid.

Tablet:
- 8-column.

Mobile:
- 4-column.

Spacing:
- base unit 4px;
- common increments 8, 12, 16, 24, 32, 48, 64, 96.

Avoid arbitrary one-off spacing unless necessary.

---

## 9. Radius

Primary radius:
- controls: 10–12px;
- cards: 14–18px;
- large promo surfaces: 20–24px.

Avoid:
- universally huge 32px rounded rectangles;
- pill shape for every component.

Pills reserved for:
- tags;
- compact filters;
- statuses;
- segmented controls.

---

## 10. Shadows

Use shadows sparingly.

Default cards should often rely on:
- border;
- contrast;
- surface elevation.

Use stronger shadow for:
- dropdown;
- popover;
- floating bottom checkout;
- modal.

Avoid glow shadows.

---

## 11. Iconography

Use one icon family consistently.

Preferred:
- simple outline icons;
- medium stroke;
- 16/20/24 sizes.

Product/game art is image-driven; do not substitute every brand logo with generic icons.

Never mix multiple icon libraries visibly.

---

## 12. Photography & Game Artwork

Use:
- official/authorized product art;
- neutral optimized thumbnails;
- consistent aspect ratios.

Game cards:
- 4:5 or square depending layout;
- artwork may crop;
- text remains outside the image where possible.

Avoid placing critical text over busy game artwork.

Image generation may be used for:
- abstract campaign backgrounds;
- original brand textures;
- editorial visuals.

Do not generate fake official game logos or misleading licensed artwork.

---

## 13. Navigation

### Desktop navbar
Structure:
- logo;
- product categories;
- price list;
- promo;
- tracking;
- search;
- account;
- balance if logged in.

Navbar should be compact, not a giant floating capsule.

### Mobile
- top app bar;
- search accessible early;
- bottom navigation only if justified for logged-in repeat-use experience.

Possible mobile bottom nav:
- Home
- Produk
- Transaksi
- Promo
- Akun

Do not show admin navigation in customer app shell.

---

## 14. Homepage

Recommended sections:

1. compact top navigation;
2. search-first hero;
3. category shortcuts;
4. flash sale;
5. popular games;
6. popular PPOB;
7. promotional banner;
8. “how it works” compact strip;
9. benefits/trust facts grounded in real functionality;
10. FAQ;
11. footer.

### Hero

Do not use a generic giant marketing paragraph.

Hero should help transaction discovery immediately.

Example structure:
- short headline;
- search field;
- popular search chips;
- original brand visual / curated product mosaic.

CTA emphasis:
“Cari produk” rather than meaningless “Mulai sekarang”.

---

## 15. Category Shortcut

Horizontal on mobile, grid on desktop.

Each category:
- icon/art;
- concise label;
- clear hover/pressed state.

Examples:
- Game
- Pulsa
- Paket Data
- E-Wallet
- PLN
- Voucher
- Tagihan

---

## 16. Product Card

Card includes:
- art/logo;
- name;
- category/sub-label;
- optional promo badge.

Do not show unnecessary price if product contains many denominations.

Hover:
- subtle elevation or border change;
- artwork scale <= very subtle.

Mobile:
- two-column grid where readable;
- larger touch area.

---

## 17. Game/Product Detail Page

This is the main conversion page.

Desktop structure:
- left: product identity/cover + instructions;
- right: transaction form;
- lower: description/FAQ.

Transaction form should be step-based but visible enough to scan.

### Step 1 — Account target
Examples:
- User ID
- Zone ID
- phone number
- customer number

Use dynamic schema by product.

### Step 2 — Nominal
Display cards containing:
- denomination;
- bonus if real;
- member price;
- public price when relevant;
- discount.

Selection must be obvious beyond color.

### Step 3 — Payment
Group by:
- QRIS;
- e-wallet;
- VA;
- balance.

Each shows:
- payment fee;
- total or fee description.

### Step 4 — Contact & confirm
Show:
- recipient target;
- item;
- price;
- fee;
- discount;
- total.

Primary CTA:
**Bayar RpXX.XXX**

Sticky summary on desktop if helpful.

Sticky bottom CTA on mobile.

---

## 18. Price List

Reference concept: multi-tier price visibility.

TOPUPLAB implementation:
- search;
- category;
- brand;
- status;
- tier selector where appropriate.

Columns:
- product;
- Public;
- Member;
- Gold/Reseller if configured;
- status.

Desktop:
dense table.

Mobile:
product rows/cards with expandable tier pricing.

Do not force a desktop table to overflow badly on small screens.

---

## 19. Flash Sale

Visual emphasis is allowed here.

Component:
- heading;
- countdown;
- item carousel/grid;
- old price;
- flash price;
- quota/progress;
- time.

Use brand accent + warm sale accent sparingly.

Countdown:
- compact;
- accessible;
- no fake urgency after server expiry.

Expired state:
- clearly disabled.

---

## 20. Membership UI

Membership page should answer:
- current tier;
- benefit;
- progress;
- next tier;
- price difference.

Tier cards should not become casino-like “VIP” visuals.

Use:
- restrained metallic accent;
- simple tier identity;
- benefit comparison.

Price saving should be quantified when data exists.

---

## 21. Balance UI

Balance is a financial surface.

Show:
- available balance;
- reserved balance if relevant;
- top-up button;
- transaction ledger.

Do not show:
- misleading profit chart;
- crypto-wallet visual language.

Each ledger row:
- amount;
- reason;
- reference;
- date;
- status.

---

## 22. Referral UI

Referral dashboard:
- referral code;
- copy link;
- qualified referrals;
- reward;
- pending reward;
- rules.

Use simple share affordance.

Never imply earnings are guaranteed.

---

## 23. Transaction Tracking

High trust page.

Header:
- order ID;
- current status;
- amount.

Timeline:
1. order;
2. payment;
3. processing;
4. completion.

Each event:
- title;
- timestamp;
- optional detail.

Pending state:
- calm;
- explain what is happening.

Failed:
- explain next step;
- refund/manual review state.

No giant red error page unless action truly failed irrecoverably.

---

## 24. Customer Dashboard

Overview:
- greeting;
- balance;
- membership;
- recent transactions;
- promo/referral summary.

Do not turn it into an analytics SaaS dashboard.

Customer mostly wants:
- buy again;
- check transaction;
- see balance;
- see benefit.

“Buy again” should be prominent.

---

## 25. Admin Visual Language

Admin is a separate information-dense system using the same brand tokens.

Layout:
- left sidebar desktop;
- top bar;
- content canvas;
- optional command/search.

Admin tables prioritize:
- density;
- sorting;
- filters;
- status readability;
- bulk actions only when safe.

Avoid huge cards for every metric.

Use:
- compact KPI strip;
- one or two meaningful charts;
- tables;
- detail drawers.

---

## 26. Admin Overview

Top:
- time range;
- KPI row.

KPIs:
- GMV;
- success;
- gross margin;
- pending;
- failure.

Middle:
- sales/profit trend;
- transaction status breakdown.

Bottom:
- provider health;
- recent failures;
- top products.

No decorative “world map” unless business data actually requires it.

---

## 27. Provider Management

Provider list card/table:

- provider;
- status;
- balance;
- latency;
- success rate;
- last sync;
- enabled.

Health colors:
- healthy;
- degraded;
- paused/offline.

Provider detail:
- mapped SKUs;
- sync history;
- webhook status;
- attempts;
- configuration.

Never reveal full secret values after initial entry.

Show:
`••••••••abcd`

---

## 28. Pricing Management

Pricing UI must make commercial consequences obvious.

Rule builder:
- scope;
- tier;
- fixed markup;
- percent markup;
- minimum margin;
- schedule.

Preview panel:
- provider cost;
- computed price;
- payment fee assumption;
- margin;
- warning.

Negative margin:
- danger state;
- require explicit privileged override if allowed.

---

## 29. Transaction Admin Detail

This is one of the strongest portfolio screens.

Structure:

### Header
- Order ID
- state
- amount
- customer
- actions

### Commercial snapshot
- provider cost
- sell price
- fee
- promo
- expected margin

### Timeline
Unified chronological timeline:
- order creation;
- payment events;
- fulfillment;
- provider callbacks;
- admin action;
- refund.

### Technical panel
Restricted:
- payment IDs;
- provider attempt IDs;
- response code;
- correlation IDs.

### Ledger
Exact financial entries.

This screen should demonstrate system transparency without exposing secrets.

---

## 30. Status System

Consistent statuses.

### Neutral
- Draft
- Waiting Payment

### Info
- Paid
- Queued
- Processing

### Warning
- Pending
- Manual Review

### Success
- Success
- Refunded where context uses a neutral/refund semantic

### Danger
- Failed
- Expired
- Cancelled

Never use only color.
Always include text/icon where appropriate.

---

## 31. Forms

Input height:
- comfortable, not oversized.

Labels:
- always visible for transactional forms.

Placeholder:
- example only;
- never substitute label.

Validation:
- inline;
- immediately understandable.

For User ID/server:
include small helper link:
“Cara melihat User ID”

Avoid long explanatory copy inside the main purchase form.

---

## 32. Buttons

Hierarchy:

### Primary
Brand accent background, high contrast.

### Secondary
Neutral surface/border.

### Tertiary
Text/ghost.

### Danger
Reserved for destructive action.

Never use more than one dominant primary action in a small decision area.

Financial confirmation button should include amount where helpful.

---

## 33. Tables

Desktop:
- compact row heights;
- sticky header where needed;
- sortable columns;
- filters;
- clear pagination.

Mobile:
- transform complex table into cards/detail rows;
- preserve critical actions.

Do not rely on horizontal scroll for all administrative workflows.

---

## 34. Modals & Drawers

Use modal for:
- explicit confirmation;
- small forms;
- destructive action.

Use drawer for:
- transaction detail preview;
- filter panel;
- non-destructive side workflows.

Do not put full complex product creation inside a tiny modal.

---

## 35. Toasts

Use for:
- copied;
- saved;
- queued;
- non-critical confirmation.

Do not use toast as the only notification for:
- payment status;
- failed order;
- destructive errors.

Critical state remains visible in page context.

---

## 36. Empty States

Empty states are concise.

Example:
“Belum ada transaksi.”
“Setelah kamu melakukan pembelian, riwayatnya akan muncul di sini.”

Optional CTA:
“Cari produk”

No giant illustration required for every empty state.

---

## 37. Loading

Public:
- skeletons preserving layout.

Checkout:
- button spinner + disabled duplicate action;
- clear status message.

Admin:
- table skeleton.

Do not block whole page if only one widget refreshes.

---

## 38. Responsive Breakpoints

Use content-driven breakpoints, approximately:

- small: 360+
- medium: 640+
- tablet: 768+
- laptop: 1024+
- wide: 1280+
- large: 1440+

Support 320px minimally without catastrophic overflow.

---

## 39. Mobile Checkout

Mobile is the highest-priority customer experience.

Rules:
- no tiny denomination cards;
- payment methods easy to tap;
- total always discoverable;
- sticky bottom CTA;
- keyboard does not cover required action;
- form step state retained;
- modal becomes bottom sheet where sensible.

Target one-hand usage.

---

## 40. Animation

Default durations:
- micro: 120–180ms;
- surface: 180–240ms;
- larger transition: <= 320ms.

Easing:
- smooth deceleration;
- no bouncy spring for financial state.

Good animation:
- selected denomination;
- expanding payment method;
- success status;
- drawer.

Bad animation:
- rotating glowing logo forever;
- floating product cards;
- aggressive parallax;
- confetti on every top-up.

One restrained celebration on completed purchase may be acceptable if reduced-motion safe.

---

## Motion System

Motion is a shared design-system capability. Use `motion` and imports from `motion/react` for interactive motion; simple color, border, and small opacity feedback can stay in CSS. dotLottie is a selective illustration player, not the general UI animation engine.

### Tokens

Keep reusable configuration in `src/lib/motion/`. Durations below are milliseconds in CSS and seconds in Motion:

| Token | Duration | Use |
| --- | --- | --- |
| instant | 110ms | Small immediate feedback |
| fast | 160ms | Hover/tap feedback |
| normal | 220ms | Component state changes |
| emphasized | 300ms | Dialog/sheet transitions |

Ordinary UI transitions should stay under 400ms. Use consistent easing categories: standard `[0.2, 0, 0, 1]`, enter `[0, 0, 0.2, 1]`, exit `[0.4, 0, 1, 1]`, emphasized `[0.2, 0.8, 0.2, 1]`.

Spring presets use Motion's duration-based springs: interactive (160ms, bounce 0), soft (220ms, bounce 0.08), and sheet/dialog (300ms, bounce 0). Do not invent physics per component. Financial state transitions use non-bouncy timing.

Movement distances: 4px, 8px, 12px; ordinary reveals must not exceed 24px. Avoid large slide-ins. Keep abstractions small and grounded in real use; do not generate an unused wrapper catalogue.

### Accessibility and performance

Respect `prefers-reduced-motion` globally through MotionConfig and a reusable hook for interactive leaves. Remove decorative transforms, parallax, non-essential scroll movement, and large scale changes. Keep instant or simple opacity feedback where useful. Critical information, focus, and state must never depend on animation. Server-rendered content remains visible before hydration.

Prioritize transform and opacity. Avoid continuous expensive layout/paint animation, large animated blurs, and scroll jank. Navigation remains immediate; page transitions are short and optional, with no full-screen wipes. Admin tables generally render immediately. Public scroll reveals may use opacity, small Y movement, and restrained grouped stagger; do not reveal every object separately.

### Signature interactions (later feature phases)

- QuickSearchHero: clear focus, keyboard selection, and result appearance.
- ProductCard: subtle hover lift, restrained image response, and pressed feedback without excessive card scaling.
- DenominationGrid: border/accent feedback and a smoothly appearing check; selection remains explicit without motion.
- PaymentMethodList: smooth expansion and state changes with accessible focus.
- SmartCheckoutBar: short mobile entrance and readable changes to total/state.
- PriceBreakdown: restrained discount/total changes; values remain easy to verify.
- TransactionTimeline: communicate PAID, QUEUED, PROCESSING, and SUCCESS changes without delaying the true status.
- ProviderHealthStrip: subtle operational changes, without flashing or celebration.
- FlashSaleCard: restrained countdown changes, never fake urgency.
- Admin KPI: optional initial count-up; refresh remains readable without repeating dramatic count animations.

### Curated dotLottie illustrations

Approved package: `@lottiefiles/dotlottie-react`. Add it only with a legitimate first use or used abstraction. Prefer locally managed original/licensed `.lottie` assets, never competitor assets or permanent third-party animation URLs. Appropriate moments include completed payments/top-ups, processing, meaningful empty states, membership upgrades, referral rewards, maintenance, 404, and occasional campaigns.

Use neutral ink, chartreuse/lime, and clean geometric commerce/gaming forms. Avoid generic corporate illustration, excessive gradients, and crypto aesthetics. Lazy-load non-critical players and avoid excessive simultaneous instances. Consider the official worker player only after profiling justifies it; do not preemptively add GPU renderers.

Skeletons serve content loading, spinners serve short actions, progress indicators serve determinate operations, and Lottie serves meaningful illustration. Processing always includes truthful text such as “Pembayaran berhasil. Pesanan sedang diproses.”

### Motion review

For each implemented interaction, verify purpose, token consistency, performance, reduced motion, mobile behavior, and keyboard accessibility. Record real results. Lottie requires an explicit product purpose and a static/text fallback.

## 41. Data Visualization

Use charts only for data that benefits from visual trend comparison.

Admin chart rules:
- labels readable;
- tooltip values formatted as IDR;
- time range visible;
- zero baseline when analytically relevant;
- no 3D charts;
- no donut chart for 12 categories.

Prefer:
- line;
- area;
- bar;
- stacked bar.

---

## 42. Content Density

Public:
- medium airiness;
- strong scanability.

Checkout:
- compact;
- focused.

Admin:
- dense but breathable.

Do not apply the same large spacing everywhere.

---

## 43. Trust Signals

Allowed:
- clear transaction status;
- supported payment logos if authorized;
- support channel;
- transparent fees;
- transaction history;
- terms/privacy;
- provider/system status if real.

Avoid:
- fake “10 juta pelanggan”;
- fake live purchases;
- invented security certifications;
- fabricated 99.99% uptime.

---

## 44. SEO Page Design

Category/product pages:
- clear H1;
- short useful intro;
- product list;
- FAQ when genuinely useful;
- internal links.

Do not add 1500 words of keyword-stuffed SEO text beneath every game page.

---

## 45. Design Review Checklist

Before approving a screen:

### Hierarchy
- Is primary action obvious?
- Is monetary information easy to verify?
- Is status understandable?

### Consistency
- Tokens used?
- Component reused appropriately?
- Same status means same visual treatment?

### Anti-slop
- Any unnecessary gradient?
- Any nested cards?
- Any meaningless badge?
- Any fake metric?
- Any decorative noise?

### Mobile
- Is it usable at 360px?
- Is CTA reachable?
- Are touch targets large enough?

### Accessibility
- Focus?
- Labels?
- Contrast?
- Keyboard?
- Reduced motion?

### Trust
- Any ambiguous fee?
- Any misleading success state?
- Any fake urgency?

---

## 46. Skill Application to Design

Use the installed skills selectively.

### First-pass system
- `design-system`
- `ui-ux-pro-max`
- `design-taste-frontend`

### Quality critique
- `antislop`
- `antislop-ui`
- `gpt-taste`
- `high-end-visual-design`

### Mobile critique
- `antislop-layoutmobile`

### Copy
- `antislop-copywriting`
- `antislop-human`

### Brand/art
- `brand`
- `brandkit`
- `banner-design`
- `imagegen-frontend-web`
- `imagegen-frontend-mobile`

### Reference translation
- `image-to-code`
- `redesign-existing-projects`
- `stitch-design-taste`

Never ask multiple style skills to independently redesign the same screen and merge the output blindly.
Use one design authority: this file.

---

## 47. Suggested Signature Components

Create distinctive reusable components that become part of the portfolio identity:

1. **QuickSearchHero**
   - category-aware search;
   - popular chips;
   - keyboard-first.

2. **DenominationGrid**
   - excellent selected states;
   - tier price visibility;
   - sale marker.

3. **PriceBreakdown**
   - item;
   - discount;
   - fee;
   - total;
   - margin only in admin.

4. **TransactionTimeline**
   - reusable customer/admin variant.

5. **ProviderHealthStrip**
   - restrained operational status.

6. **TierPriceMatrix**
   - responsive multi-level pricing.

7. **SmartCheckoutBar**
   - mobile sticky total + CTA.

8. **FinancialEventTimeline**
   - admin audit/payment/provider/ledger events.

These should feel custom-built, not copied from a component library.

---

## 48. Portfolio Showcase Screens

Prioritize polish on:

1. Home
2. Game detail / checkout
3. Payment waiting
4. Transaction success
5. Price list
6. Membership
7. Referral
8. Customer dashboard
9. Admin overview
10. Admin transaction detail
11. Provider routing
12. Pricing rule builder
13. Flash sale manager
14. Ledger/report screen

These screens collectively demonstrate:
- frontend;
- UX;
- responsive design;
- e-commerce;
- financial UI;
- dashboards;
- system thinking;
- integrations.

---

## 49. Final Visual Standard

The best version of TOPUPLAB should make someone think:

> “Ini kelihatan seperti produk top-up yang beneran bisa dipakai, bukan project tutorial.”

Every visual decision should reinforce:
**clarity → speed → trust → repeat purchase.**
# Phase 2 implementation decisions — 2026-09-23

The implemented brand system uses an original two-segment rising mark, a locally rendered Plus Jakarta Sans wordmark, chartreuse primary actions, warm light surfaces, and ink text. Success has its own semantic green; it does not reuse the brand accent. Final semantic tokens, type scale, layout presets, brand clear space, component usage, and restrained Motion rules are documented in `docs/design-system.md` and implemented in `src/styles/tokens.css`.

Core controls use custom TOPUPLAB styling, native form semantics, selected unstyled Radix primitives, and Lucide icons only. The development/demo Design Lab is disabled by default in production and always unavailable in live mode. Commerce specimens remain static presentation foundations. No Phase 3 functionality is included.
