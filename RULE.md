# RULE.md — TOPUPLAB Agent Rules

> This file is the operating contract for AI coding/design agents working on TOPUPLAB.
> The rules apply to Antigravity and any other autonomous coding agent used on the repository.

---

## 1. Rule Priority

When instructions conflict, follow this order:

1. financial/security invariants in this file;
2. PRD requirements;
3. explicit user instruction for the current task;
4. DESIGN.md;
5. existing code conventions;
6. skill recommendations;
7. agent preference.

A visual skill must never override a financial or security rule.

---

## 2. Working Method

Before coding a non-trivial feature:

1. read `PRD.md`;
2. read `DESIGN.md`;
3. read `RULE.md`;
4. inspect relevant existing files;
5. identify affected modules;
6. identify financial/security impact;
7. make the smallest coherent implementation;
8. run validation/tests;
9. summarize changed behavior.

Do not rewrite the project unnecessarily.

Do not invent a new architecture because a skill prefers one.

---

## 3. Skill Routing Policy

The installed skills are tools, not a checklist.

Use the minimum set relevant to the task.

### 3.1 Code quality
Use:
- `antislop-code`
- `full-output-enforcement`

Purpose:
- complete implementations;
- no placeholder logic disguised as production code;
- no giant god-components;
- no fake API responses outside demo/mock adapters;
- no truncated code output.

### 3.2 Human copy
Use:
- `antislop-copywriting`
- `antislop-human`

Purpose:
- natural Indonesian copy;
- concise transactional language;
- no generic AI marketing clichés;
- no “revolutionize your experience” style filler.

### 3.3 UI quality
Use when designing or refactoring interfaces:
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

Do not blindly combine visual instructions.
`DESIGN.md` is the final visual authority.

### 3.4 Mobile
Use:
- `antislop-layoutmobile`
- `imagegen-frontend-mobile`

Only when mobile layout or mobile-specific image generation is relevant.

### 3.5 Web image generation
Use:
- `imagegen-frontend-web`

Generated visuals must follow brand rules and may not replace functional UI.

### 3.6 Existing visual references
Use:
- `image-to-code`
- `redesign-existing-projects`
- `stitch-design-taste`

Rules:
- recreate structure/intent, not copyrighted branding;
- never pixel-clone a competitor;
- translate references into TOPUPLAB design tokens.

### 3.7 Brand
Use:
- `brand`
- `brandkit`
- `banner-design`

Use for:
- logo system;
- social/banner assets;
- campaign graphics;
- brand rules.

### 3.8 Minimalist / brutalist
Use only when explicitly requested:
- `minimalist-ui`
- `industrial-brutalist-ui`

These are optional stylistic tools and must not override DESIGN.md.

### 3.9 Slides
`slides` is not part of website implementation unless a deck is explicitly requested.

### 3.10 Lock file
Do not hand-edit `skills-lock.json` unless the tool's own documented workflow requires it.

---

## 4. Anti-Slop Rules

Never produce:

- generic hero headline + random gradient blobs + three floating cards by default;
- excessive glassmorphism;
- neon borders everywhere;
- purple-blue gradient as a substitute for brand identity;
- meaningless stat counters;
- decorative charts with fake data in production;
- unnecessary “AI” aesthetics;
- giant rounded cards nested inside giant rounded cards;
- icon soup;
- badge soup;
- every section centered;
- every heading using the same layout;
- fake testimonials;
- fake partners;
- fake live transaction counts;
- lorem ipsum;
- dead buttons;
- UI controls with no implemented action;
- fabricated provider uptime numbers.

If data is demo data, label it as demo in code/config and ensure production cannot accidentally serve it as real operational data.

---

## 5. Copy Rules

Default customer-facing language: Indonesian.

Tone:
- straightforward;
- modern;
- friendly;
- calm;
- trustworthy.

Prefer:
- “Masukkan User ID”
- “Pilih nominal”
- “Menunggu pembayaran”
- “Pembayaran berhasil”
- “Pesanan sedang diproses”

Avoid:
- “Nikmati pengalaman transaksi revolusioner”
- “Solusi terbaik nomor satu”
- exaggerated trust claims;
- false guarantees such as “100% pasti berhasil”.

Financial status copy must be precise.

Never use “Berhasil” while provider status is pending.

---

## 6. Architecture Rules

### 6.1 Layering

Use clear layers:

- UI
- application/service
- domain/business logic
- repository/data
- adapters/integrations
- jobs/workers

Provider SDK or payload types must not leak across the application.

### 6.2 Domain modules

Prefer modules aligned with:
- catalog;
- pricing;
- checkout;
- order;
- payment;
- provider;
- fulfillment;
- wallet/ledger;
- membership;
- promo;
- referral;
- reporting;
- notification;
- admin;
- audit.

### 6.3 Avoid god services

Do not create:
- `everything.service.ts`;
- one 2000-line checkout file;
- one admin page containing all business logic.

Extract domain logic into testable units.

---

## 7. TypeScript Rules

- enable strict mode;
- avoid `any`;
- use `unknown` for untrusted payloads;
- validate external input at runtime;
- use enums/unions for finite states;
- do not cast external payloads directly into trusted domain types;
- use exhaustive switch for state transitions;
- use branded/opaque IDs when useful;
- never use JS floating point for monetary calculations.

---

## 8. Database Rules

- PostgreSQL is the source of truth;
- all schema changes use migrations;
- no manual production schema editing;
- use foreign keys where appropriate;
- use unique constraints for idempotency keys;
- index common lookup fields;
- preserve created/updated timestamps;
- financial/event tables should favor append-only history.

Never delete financial history because an admin wants a “cleaner” dashboard.

Use soft-delete/archive where appropriate for catalog entities.

---

## 9. Financial Rules — HARD STOP

If an implementation violates any rule below, stop and redesign it.

### 9.1 No client-authoritative money
Never trust:
- amount;
- discount;
- margin;
- fee;
- tier price;
- wallet delta;
- “payment successful” flag

from the client.

Recalculate server-side.

### 9.2 Integer money
Store IDR as integer values.

### 9.3 Ledger
Every wallet change = ledger entry.

### 9.4 Transactions
Balance deduction, reservation, and order mutation must use database transaction/locking strategy appropriate to concurrency.

### 9.5 Idempotency
Financial endpoints and webhooks must support idempotency.

### 9.6 Immutable history
Never overwrite prior ledger records to “fix” balance.

Use corrective entries.

### 9.7 Price snapshot
Existing orders retain their original commercial terms.

### 9.8 Refund
Refund is a new state + event + ledger action where applicable.

---

## 10. Payment Rules — HARD STOP

- never mark paid from frontend redirect;
- verify webhook authenticity;
- validate order ID;
- validate amount;
- validate allowed status transition;
- deduplicate event;
- persist raw/normalized event safely;
- acknowledge webhook quickly;
- queue heavy processing;
- support delayed callbacks;
- support reconciliation status check.

A duplicate webhook must produce the same final state without duplicated side effects.

---

## 11. Provider Rules — HARD STOP

### 11.1 Unique transaction reference
Each provider attempt gets an immutable unique reference.

### 11.2 Pending != Failed
Timeout/ambiguous response defaults to pending/manual reconciliation unless the provider contract proves failure.

### 11.3 Safe retry
Retry only when the provider semantics make duplicate fulfillment impossible or adequately protected.

### 11.4 Fallback
Never send a second provider request for an unresolved first-provider transaction simply because the first call timed out.

### 11.5 Adapter isolation
All provider-specific:
- signing;
- field names;
- status mapping;
- webhook validation;
- retry semantics

stay inside provider adapter.

### 11.6 Secrets
Provider credentials only on server.

---

## 12. Webhook Rules

For each webhook:

1. obtain raw request body when signature scheme requires it;
2. verify authenticity before trusted mutation;
3. validate payload schema;
4. derive stable event/idempotency key;
5. persist event;
6. check duplicate;
7. process valid transition;
8. queue downstream work;
9. return appropriate response.

Webhook handlers must be safe against:
- duplicate;
- delayed;
- out-of-order;
- malformed;
- forged;
- replayed events.

---

## 13. State Machine Rules

Order state changes must go through one transition function/service.

Do not scatter:

`order.status = ...`

through controllers and UI actions.

Invalid transitions must throw/log explicit domain errors.

Terminal states must be protected.

---

## 14. Flash Sale Rules

- server time is authoritative;
- database/atomic primitive protects quota;
- price calculated server-side;
- customer eligibility server-side;
- expiration handled at checkout;
- do not oversell due to race condition.

Client countdown is presentation only.

---

## 15. Promo Rules

Promotion engine must produce:
- applied rule;
- reason;
- discount;
- final price;
- rejection reason if invalid.

Promo limits must be concurrency safe.

---

## 16. Referral Rules

- no self-referral;
- reward only after qualification;
- reversal supported;
- each qualification reward idempotent;
- suspicious patterns may enter manual review.

Do not credit referral reward on mere page visit.

---

## 17. Authentication & Authorization

- authorization happens server-side;
- UI hiding is not authorization;
- role checks use centralized policy;
- admin routes protected;
- super admin actions require elevated permission;
- sensitive actions may require recent authentication/MFA.

Never return secret configuration to client.

---

## 18. Validation

Validate:
- request bodies;
- route params;
- query params;
- webhook payloads;
- provider responses when practical;
- environment variables.

Use one consistent schema validation library.

---

## 19. API Design

Prefer predictable endpoints/actions.

All error responses should include:
- stable code;
- user-safe message;
- request/correlation ID where useful.

Do not expose:
- stack traces;
- SQL errors;
- secret provider response;
- internal file paths.

---

## 20. Background Jobs

Use queue for:
- fulfillment;
- notifications;
- provider recheck;
- catalog sync;
- report generation;
- reconciliation.

Jobs must be:
- idempotent;
- retry-aware;
- observable;
- bounded.

Use dead-letter/manual review for exhausted critical jobs.

---

## 21. Caching

Never cache sensitive user-specific financial state without a clear invalidation strategy.

Safe cache candidates:
- public category list;
- public product catalog;
- CMS content;
- non-sensitive price presentation with short TTL.

Checkout always recomputes authoritative price.

---

## 22. Frontend Rules

### 22.1 Server/client split
Use server rendering where it improves:
- SEO;
- first load;
- data security.

Use client components only for actual interactivity.

### 22.2 Forms
Every form has:
- label;
- validation;
- pending state;
- error state;
- success path;
- keyboard behavior.

### 22.3 Async states
Every fetch-driven component has:
- skeleton/loading;
- empty;
- error;
- success.

No infinite spinner without explanation.

### 22.4 Buttons
Buttons must:
- have implemented action;
- show pending state;
- prevent accidental duplicate submission when relevant.

---

## 23. Design System Discipline

Do not create random values inside pages when a token/component exists.

Prefer:
- semantic colors;
- consistent radius;
- consistent spacing;
- consistent type scale.

If a new pattern appears 3+ times, consider a reusable component.

Do not abstract a component after only one trivial use if abstraction makes code harder to read.

---

## 24. Mobile Rules

Mobile is not a shrunk desktop.

Priorities:
1. product target input;
2. denomination;
3. payment;
4. total;
5. CTA;
6. transaction status.

Use bottom sheet / sticky bottom CTA where appropriate.

Avoid:
- dense 5-column admin tables on phone;
- tiny touch targets;
- hover-only interactions.

---

## 25. Accessibility Rules

- semantic elements;
- visible focus;
- keyboard navigation;
- associated labels;
- aria only when native semantics insufficient;
- contrast;
- reduced motion;
- accessible dialog focus management;
- errors tied to fields.

Do not disable outlines globally.

---

## 26. Motion Rules

Motion:
- supports hierarchy;
- communicates state;
- confirms action.

Do not:
- animate every card;
- use continuous decorative movement;
- delay checkout for cinematic transitions;
- make critical UI dependent on animation.

Respect `prefers-reduced-motion`.

---

## 27. Testing Strategy

### Unit
Must cover:
- pricing;
- tier selection;
- promo;
- state transitions;
- provider status normalization;
- referral qualification;
- ledger calculations.

### Integration
Must cover:
- checkout creation;
- payment webhook;
- duplicate webhook;
- provider success;
- provider pending;
- provider failure;
- wallet deduction;
- rollback on failure;
- flash sale concurrency.

### E2E
Must cover at least:
- guest successful mock order;
- member pricing order;
- pending provider flow;
- failed + refund flow;
- admin catalog edit;
- flash sale checkout;
- duplicate-submit protection.

Never remove a failing test just to make CI green without fixing or explicitly changing the requirement.

---

## 28. Security Checklist

Before completing sensitive code, verify:
- secrets server-only;
- CSRF strategy appropriate;
- XSS-safe rendering;
- input validation;
- SQL injection protected by ORM/parameterization;
- SSRF risk reviewed for user-supplied URLs;
- rate limiting;
- auth brute-force protection;
- webhook verification;
- replay/idempotency protection;
- admin authorization;
- file upload validation if enabled.

---

## 29. Logging Rules

Structured logs.

Include:
- request ID;
- order ID;
- event ID;
- provider attempt ID.

Never log:
- password;
- session secret;
- API key;
- webhook secret;
- authorization bearer;
- raw card data.

Mask customer identifiers in broad operational logs when appropriate.

---

## 30. Environment Rules

Maintain:
- `.env.example`;
- development;
- test;
- demo;
- production config boundaries.

Application must fail fast at startup if required production secrets are missing.

Demo mode must never silently use production provider credentials.

---

## 31. Git Rules

- small coherent commits;
- descriptive messages;
- no secrets;
- no generated credential files;
- no `.env`;
- migrations committed;
- lock file committed;
- do not reformat unrelated files in a feature commit.

---

## 32. Documentation Rules

When adding a provider:
- document capabilities;
- webhook;
- retry semantics;
- pending semantics;
- auth;
- required env vars;
- known limitations.

When adding a state:
- update state machine docs and tests.

When adding a pricing feature:
- update PRD behavior if needed.

---

## 33. Agent Completion Format

After implementing a task, report:

### Implemented
What changed.

### Files
Key files changed.

### Validation
Tests/typecheck/lint/build run.

### Notes
Migration/env/config required.

### Risks
Only real unresolved issues.

Do not claim tests passed if they were not run.

---

## 34. Forbidden Agent Behavior

Never:
- fabricate successful test output;
- claim production-ready without production readiness checks;
- hard-code secrets;
- bypass webhook verification “temporarily” in production path;
- use fake success responses outside mock adapter;
- force a transaction success from admin;
- delete ledger history;
- treat timeout as definite failure;
- implement fallback that risks double top-up;
- expose credentials to browser;
- collect Roblox/game account passwords;
- clone competitor branding/copy;
- add unrequested large dependency sets;
- replace functioning architecture without necessity.

---

## 35. Final Rule

A prettier implementation is not better if it is less correct.

A shorter implementation is not better if it hides financial risk.

For TOPUPLAB, correctness, auditability, idempotency, and user trust come first.
