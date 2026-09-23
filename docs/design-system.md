# TOPUPLAB design system

Phase 2 visual infrastructure. Commerce examples are local presentation states, with no product, order, payment, or provider integration. Drizzle remains the accepted ORM.

## Identity

Commerce Utility × Gaming Energy means legible commerce controls with a focused chartreuse accent. Warm light surfaces and ink text keep the system calm. Success uses a separate green semantic family.

The original mark uses two rising, interlocking angular segments on a 32-unit grid. It suggests credit movement and a modular system, without a coin, controller, shield, cart, or lightning bolt. `Brand` combines the mark with a Plus Jakarta Sans wordmark and a lime LAB segment; `BrandMark` is the compact version. The wordmark uses weight 800 as an identity-only exception.

- SVG assets: `public/brand/mark.svg`, `public/brand/mark-inverse.svg`; favicon: `src/app/icon.svg`.
- Minimum mark size: 16px; preferred UI mark: 32px. Wordmark alone: at least 96px wide; full lockup: at least 132px.
- Clear space: at least one quarter of the mark width on every side (8px for a 32px mark).
- Light surfaces use ink; inverse surfaces use the monochrome light treatment. A monochrome lockup inherits its foreground color.
- Preserve proportions and geometry. Do not rotate, outline, glow, add gradients, or place the mark on busy artwork. Do not combine it with invented partner logos.

## Tokens

`src/styles/tokens.css` is the CSS color source. Components consume semantic variables; raw colors belong only in the token file and standalone logo assets.

| Family  | Values / roles                                                                                   |
| ------- | ------------------------------------------------------------------------------------------------ |
| Brand   | subtle #f5fadf; soft #e8f3af; default #d0ec57; hover #c0dc47; active #adca35; foreground #20251b |
| Surface | page #f7f8f4; surface/elevated #ffffff; subdued #edf0e7; inverse #20251b                         |
| Text    | primary #20251b; secondary #485140; muted #5c6654; inverse #f7f8f4; disabled #66705e             |
| Border  | subtle #d9ddd2; default #727e67; strong #485140; focus #20251b                                   |
| Success | foreground #23653d; subtle #eaf4ed; border #43835a                                               |
| Warning | foreground #79500a; subtle #fff3d8; border #9b731e                                               |
| Danger  | foreground #a12929; subtle #fff0ed; border #b94639                                               |
| Info    | foreground #265c86; subtle #ebf3fa; border #477ba2                                               |

Subtle borders divide noninteractive surfaces; default borders identify controls. Unit tests calculate WCAG contrast from the actual CSS: ordinary text and semantic foreground/background pairs must meet 4.5:1, control and semantic borders 3:1. Statuses also use text and distinct Lucide symbols. Disabled content remains readable but is visibly unavailable.

## Typography and numbers

Locally managed Plus Jakarta Sans remains the only family. Body weights are 400, 600, and 700. Avoid uppercase paragraphs and excessive tracking.

| Style            | Size          |
| ---------------- | ------------- |
| Display          | fluid 36–64px |
| H1               | fluid 32–48px |
| H2               | fluid 26–36px |
| H3               | fluid 22–28px |
| H4               | 20px          |
| Body large       | 18px          |
| Body             | 16px          |
| Small            | 14px          |
| Micro / metadata | 12px          |

Sizes use rem-based tokens; text enlargement must preserve content and controls. `.numeric` enables tabular numerals. Prices use the price style; KPI-sized numerals are specimens only, never invented business metrics. Transaction references remain selectable text and can wrap. Currency strings use Indonesian examples such as `Rp20.000`; presentation primitives receive formatted strings and do not calculate prices.

## Layout and surfaces

Spacing is based on 4px: 0, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96. Mobile gutters are 20px, becoming 32px at 640px. Content widths: normal 1216px, reading 672px, checkout 1024px, admin 1440px. These are layout presets, not implemented product pages.

`ResponsiveGrid` uses 4 columns on mobile, 8 from 768px, and 12 from 1024px, with 16–24px gaps. Use `minmax(0, 1fr)` and allow long Indonesian labels to wrap. Reorganize content at breakpoints; do not compress desktop panels into narrow columns.

Radii: controls 12px, cards 16px, large surfaces 24px, pills reserved for compact status badges. Borders: 1px, emphasis 2px. Cards normally use surface plus border. Shadows are reserved for popovers and modal overlays. Avoid nested floating cards.

## Components

Core exports live in `src/components/ui/`:

- Actions: Button (primary, secondary, tertiary, danger; sizes; loading), IconButton, Link.
- Forms: Input, Textarea, native Select, Checkbox, Radio, Switch, Field, FormMessage.
- Feedback: Badge, StatusBadge, Skeleton, Spinner, Progress, ToastProvider/useToast, EmptyState, Alert.
- Surfaces: Card, Divider, Tooltip, Popover, Dropdown, Dialog, Drawer, BottomSheet.
- Navigation/data: Tabs, Accordion, Table, Pagination, PageContainer, ResponsiveGrid.

Unstyled Radix supplies dialog focus trapping/return, popover and menu interactions, tooltips, and tabs. Native form elements retain platform keyboard behavior. Styling is entirely TOPUPLAB-specific. Dropdowns are nonmodal menus; Tab and Escape can dismiss them. Mobile drawers become bottom sheets. Tables retain captions/headers and reflow into labeled rows on narrow screens. Toasts require explicit dismissal; essential errors stay inline.

Lucide is the only icon family: 16px inline, 20px controls, 24px emphasized feedback, default stroke 2. Icons explain actions or state; do not decorate every heading. Icon-only buttons require an accessible label. Adjacent icons are decorative when text already names the action.

Example in a client component:

```tsx
import { Field, Input } from "@/components/ui/forms";
import { Button } from "@/components/ui/actions";

<Field label="Kode contoh" hint="Gunakan data demonstrasi." required>
  {(attributes) => <Input {...attributes} required autoComplete="off" />}
</Field>;
<Button type="submit">Periksa contoh</Button>;
```

Pass Field's attributes to the actual control, and pass `required` to that control when needed. Error text is associated through `aria-describedby` and `aria-invalid`. Do not replace visible labels with placeholders. Native disabled controls and loading buttons cannot submit again.

## Commerce presentation foundations

`src/components/commerce/foundations.tsx` exports QuickSearchHero, ProductCard, DenominationOption, PaymentMethodRow, PriceBreakdown, SmartCheckoutBar, TransactionTimeline, TierPriceCell, and ProviderHealthIndicator. They accept props and callbacks, without infrastructure imports. The checkout bar is an in-flow foundation; sticky behavior belongs to a future real page with enough reserved space and a keyboard-safe placement.

The lab deliberately labels products, methods, prices, and provider states as examples. A denomination selection does not update the separate price specimen. Search filters only the local specimen. None of these demonstrations creates a transaction.

## Motion

Keep `motion` with React APIs from `motion/react`. Tokens live in `src/lib/motion/tokens.ts`; CSS color timings mirror them in the token stylesheet.

- Durations: instant 110ms, fast 160ms, normal 220ms, emphasized 300ms.
- Easing: standard `[.2,0,0,1]`, enter `[0,0,.2,1]`, exit `[.4,0,1,1]`, emphasized `[.2,.8,.2,1]`.
- Movement: press 1px, small 4px, normal 8px, emphasized 12px, maximum 24px.
- Springs: interactive 160ms/no bounce; soft 220ms/0.08 bounce; sheet 300ms/no bounce.
- Functional spinner: 1000ms rotation while loading, never decoration. Reduced motion removes rotation.

The hydration-safe motion hook treats the initial server/client render conservatively, then enables motion only after preferences are known. Reduced motion makes interaction transitions immediate and removes transform movement. Critical content is visible before hydration. Dialog entry uses small movement; closure returns focus without an artificial animation delay. Color changes remain CSS. No page choreography, parallax, glow loops, or financial bounce. Lottie is not installed: there is no legitimate original/licensed illustration asset in this phase.

## Indonesian copy

| Context            | Example                                          |
| ------------------ | ------------------------------------------------ |
| Action             | Lanjutkan; Simpan perubahan; Coba lagi           |
| Form               | Masukkan ID pengguna; Periksa kembali isian ini. |
| Loading            | Memuat pilihan…                                  |
| Empty              | Belum ada transaksi.                             |
| Error              | Data belum dapat dimuat. Coba lagi.              |
| Success            | Perubahan tersimpan.                             |
| Pending            | Menunggu pembayaran                              |
| Disabled           | Pilihan ini belum tersedia.                      |
| Transaction status | Diproses; Berhasil; Gagal; Kedaluwarsa           |

These are copy patterns, not assertions about implemented features. Demo actions explicitly say no data was created or changed. Avoid fake urgency, unsupported security claims, jargon, and marketing promises.

## Design Lab and accessibility

`/dev/design-system` is available in development only with `APP_MODE=demo`. Production requires both `APP_MODE=demo` and the explicit server setting `DESIGN_LAB_ENABLED=true`; otherwise it returns 404. Live mode always returns 404. Query strings and request headers cannot enable it. Explicitly enabled demo deployments are reachable by anyone with network access; the switch is not authentication. Keep previews private and use only static examples.

The lab organizes foundations, type, colors, controls, forms, feedback, surfaces, navigation, data, commerce specimens, motion, and responsive behavior. Its local state is disposable.

Validation covers visible focus, keyboard controls, Escape, dialog focus trapping/return, field associations, 44px control targets, contrast, disabled/error states, text enlargement, and reduced motion. Automated axe checks complement rendered review; they do not establish full screen-reader or real-device certification.

## Prohibited patterns

No gradients, glassmorphism, neon gaming/crypto imagery, fake charts or metrics, testimonials, arbitrary animation constants, decorative icon clusters, oversized pill controls, placeholder lorem ipsum, or mixed icon families. Do not bring business logic into this layer. Keep Phase 1 authorization, health, configuration, and infrastructure behavior intact.

Implementation references: [Radix Dialog](https://www.radix-ui.com/primitives/docs/components/dialog), [Radix Dropdown Menu](https://www.radix-ui.com/primitives/docs/components/dropdown-menu), [Lucide React](https://lucide.dev/guide/react). The project brief overrides conflicting skill recipes such as glass surfaces, additional fonts, GSAP, or perpetual motion.
