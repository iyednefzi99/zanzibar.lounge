# Design System Master File

> **LOGIC:** When building a specific page, first check `design-system/pages/[page-name].md`.
> If that file exists, its rules **override** this Master file.
> If not, strictly follow the rules below.

---

**Project:** Zanzibar Lounge
**Updated:** 2026-09-27
**Category:** Restaurant / Lounge / Hospitality
**Source of truth for tokens:** `src/app/globals.css` (`@theme` block)

---

## Global Rules

### Design Identity

Charcoal & gold luxe · Cream text · Single gold accent · Sharp geometry. Dark-mode-first (`color-scheme: dark`), editorial restaurant experience for public pages; quiet, dense, utilitarian surfaces for admin/staff/kitchen/owner tools (persistent sidebar shell).

### Color Palette (brand tokens — do not substitute)

| Role | Hex | CSS Variable |
|------|-----|--------------|
| Background (night) | `#141417` | `--color-night` |
| Background deep | `#0b0b0d` | `--color-deep` |
| Background midnight | `#0a0a0c` | `--color-midnight` |
| Foreground (shell) | `#efe9dc` | `--color-shell` |
| Foreground muted | `#a39c8e` | `--color-shell-dim` |
| Primary accent (brass) | `#c9a96e` | `--color-brass` |
| Secondary (lagoon) | `#6fa396` | `--color-lagoon` |
| Warm accent (coral) | `#cf6b55` | `--color-coral` |
| Warm accent (ember) | `#c06047` | `--color-ember` |
| Surface light (mist) | `#f5f1e8` | `--color-mist` |
| Surface warm (sand) | `#e4d9c4` | `--color-sand` |
| Spice (clove) | `#1e1512` | `--color-clove` |

**Color rules:**

- Body text is `shell` on `night` — keep contrast ≥ 4.5:1. `shell-dim` is for secondary text only, never essential small text.
- Focus ring is `brass` (2px outline, 3px offset) — never remove.
- Destructive/errors: use `coral`/`ember` plus icon + text; never color alone.
- Gradients allowed only as `brass → lagoon` (`.text-gradient`) or `brass → coral` (`.text-gradient-warm`) — no purple/blue gradients, no decorative orbs.
- Dark surface contrast must be verified independently; light-mode pairings do not apply (`color-scheme: dark`).

### Typography

Fonts are self-hosted via `next/font` (`src/lib/fonts.ts`) — the CSP allows only `font-src 'self'`, so never add a Google Fonts `<link>`.

- **Heading (display):** Fraunces (`--font-display`); Arabic headings use Aref Ruqaa (`--font-display-ar`) with `line-height: 1.45`
- **Body:** Inter (`--font-body`, also `--font-sans`)
- **Mono:** DM Mono (`--font-mono`)
- **Mood:** refined, confident, editorial luxury
- **Rules:** no negative letter-spacing; no viewport-width font scaling; bound hero headings (`max-inline-size` ~20ch + `text-wrap: balance`); match display scale to container (hero-scale only in true heroes, not cards/panels)

### Spacing Variables

| Token | Value | Usage |
|-------|-------|-------|
| `--space-xs` | `4px` / `0.25rem` | Tight gaps |
| `--space-sm` | `8px` / `0.5rem` | Icon gaps, inline spacing |
| `--space-md` | `16px` / `1rem` | Standard padding |
| `--space-lg` | `24px` / `1.5rem` | Component padding (`--spacing-component`) |
| `--space-xl` | `32px` / `2rem` | Large gaps |
| `--space-2xl` | `48px` / `3rem` | Section margins |
| `--space-3xl` | `64px` / `4rem` / `6rem` (`--spacing-section`) | Section padding, hero padding |

Use an 8px rhythm. Increase horizontal gutters at larger breakpoints.

### Radius (sharp geometry)

| Token | Value |
|-------|-------|
| `--radius-sm` | `0.125rem` (2px) |
| `--radius-md` | `0.25rem` (4px) |
| `--radius-lg` | `0.375rem` (6px) |
| `--radius-xl` | `0.5rem` (8px) |
| `--radius-2xl` | `0.75rem` (12px) |
| Cards | ≤ `12px`; prefer `--radius-xl` in dense admin/staff surfaces |
| Buttons/badges | `--radius-sm` — never `rounded-full` except status dots/avatars |

### Motion

| Token | Value |
|-------|-------|
| `--ease-smooth` / `--ease-door` | `cubic-bezier(0.16, 1, 0.3, 1)` |
| `--ease-bounce` | `cubic-bezier(0.34, 1.56, 0.64, 1)` |
| Micro-interactions | 150–300ms |
| Reveals | 300–900ms, y-offset 8–16px for scroll reveals |

Signature entrance: `door-open` (`.reveal`, staggered `.reveal-1..4`). Respect `prefers-reduced-motion` (global override already in `globals.css`).

### Shadow Depths (dark-tuned)

| Level | Value | Usage |
|-------|-------|-------|
| `--shadow-sm` | `0 1px 2px rgba(0,0,0,0.25)` | Subtle lift |
| `--shadow-md` | `0 4px 12px rgba(0,0,0,0.25)` | Cards, skip-link |
| `--shadow-lg` | `0 8px 32px rgba(0,0,0,0.16)` | Glass card hover |
| `--shadow-xl` | `0 12px 40px rgba(0,0,0,0.2)` + brass ring | Card hover, modals |

---

## Component Specs

### Buttons (`src/components/ui/button.tsx`)

- Primary: `brass` background, `deep` text; ghost/secondary: transparent with `shell` text and `shell`/`brass` border
- Padding ≥ 12px 24px; `cursor: pointer`; transition 200ms `--ease-door`
- Hover: color/opacity/shadow only — no layout-shifting transforms on controls
- Visible `:focus-visible` (brass outline or `.focus-ring` brass glow)
- Disabled: clear non-interactive styling, no tap/click action

### Cards (`.glass-card`, `.card-hover`, `src/components/ui/card.tsx`)

```css
/* Use existing utilities from globals.css — do not invent new glass styles */
.glass-card { /* deep translucent + blur(16px) + shell border */ }
.card-hover:hover {
  transform: translateY(-2px); /* max -2px; no scale jitter */
  box-shadow: 0 12px 40px rgba(0,0,0,0.2),
    0 0 0 1px color-mix(in oklab, var(--color-brass) 20%, transparent);
}
```

- Radius ≤ 8–12px (`--radius-md`/`lg`)
- Optional `.card-accent-top` brass→lagoon hover rule
- Verify text ≥ 4.5:1 on the composed blurred surface

### Inputs (`src/components/ui/input.tsx`)

- Background `deep`/`midnight`, text `shell`, border `shell` at low opacity
- Focus: brass border + `--focus-ring` brass glow (`0 0 0 3px brass 40%`)
- Always pair with a real `<label>`; hint/errors via `aria-describedby`
- Inline validation on blur (not submit-only); error text below input with icon — not border color alone

### Modals / Dialogs (`src/components/ui/dialog.tsx`)

- Overlay: dark scrim `rgba(0,0,0,0.5–0.6)` + blur; measure legibility against real background
- Panel: `.glass-card` or solid `night`, radius ≤ 12px, padding 32px, max-width ~500px
- Focus trap, Escape to close, restore focus to trigger

### Glass (existing utilities only)

`.glass`, `.glass-subtle`, `.glass-card` — blur 8–16px, translucent night/deep fills, 1px shell borders. Accessibility risk is conditional: contrast 4.5:1, keyboard, visible focus, reduced motion.

### Signature elements

- `.brass-rule` — gradient hairline divider (the only divider motif)
- `.grain` — noise overlay on hero/media (not on text containers)
- `.text-gradient` / `.text-gradient-warm` — brass→lagoon / brass→coral headings
- Hero image slot: drop `public/images/hero.jpg` (landscape, ≥2400px) and the hero switches from the placeholder composition to the photo automatically (`src/components/hero/hero-section.tsx`)

---

## Page Pattern

**Pattern Name:** Hero + Content + Testimonials + CTA (matches `src/app/[locale]/page.tsx`)

- **Section order:** Hero → About/Problem → Menu/Solution → Info → Reviews (social proof) → CTA
- **Hero:** brand/venue is a first-viewport signal; full-bleed real imagery when `public/images/hero.jpg` exists (otherwise the charcoal & gold placeholder composition), text over image — not in a card; no split text/media layout; leave a hint of the next section visible on all viewports
- **CTA:** sticky in hero + post-testimonials; `brass` primary action ("Réserver")
- **Reviews carousel:** photo, name, role; prev/next + play/pause; stop on focus/hover/reduced motion; announce slide position; keyboard-reachable slides
- **Admin/staff/kitchen/owner:** no oversized heroes or card-heavy marketing chrome — dense, scannable, predictable navigation

---

## Anti-Patterns (Do NOT Use)

- ❌ Poor, dark/blurred/cropped stock photos when users need to inspect the real dish/venue
- ❌ Complex booking flow — keep the wizard short with visible step progress ("Step 2 of 4")
- ❌ Emojis as icons — use the project's icon approach (Phosphor/Heroicons, consistent stroke)
- ❌ Generic navy/light palette substitutions — always use brand tokens above
- ❌ Purple/blue gradients, beige/cream one-note themes, decorative orbs/bokeh blobs
- ❌ Missing `cursor: pointer` on clickable elements
- ❌ Layout-shifting hovers (scale beyond the established -2px lift)
- ❌ Low contrast text (< 4.5:1) especially `shell-dim` on `night` for small text
- ❌ Instant state changes — 150–300ms transitions
- ❌ Invisible focus states
- ❌ Auto-rotating content without pause; no reduced-motion support
- ❌ Color-only status indication
- ❌ Cards inside cards; page sections styled as floating cards (use full-width bands)
- ❌ Viewport-scaled fonts; negative letter-spacing
- ❌ Unlabeled inputs; submit-only validation; toast-only error summaries

---

## Stack Rules (Next.js 16 + Tailwind 4)

- Server Components by default; fetch data in async server components; push `'use client'` to interactive leaves (booking wizard, carousel, dialogs)
- Every page renders dynamically (CSP nonce) — do not assume static rendering
- RTL: honor `lang="ar"` display font rules; no hardcoded LTR-only insets (`inset-inline-start` etc.)
- Widget runs in iframes — `<img>` not `next/image` there, intentionally

---

## Pre-Delivery Checklist

Before delivering any UI code, verify:

- [ ] No emojis used as icons (vector icons only)
- [ ] All icons from one family, consistent size/stroke
- [ ] Brand tokens only (`night`/`deep`/`shell`/`brass`/`lagoon`/`coral`) — no ad-hoc hex
- [ ] `cursor-pointer` on all clickable elements
- [ ] Hover states with 150–300ms transitions, no layout shift
- [ ] Text contrast ≥ 4.5:1 on real composed dark surfaces (test separately from any light UI)
- [ ] Non-text/controls contrast ≥ 3:1
- [ ] Focus states visible (brass outline) for keyboard navigation
- [ ] `prefers-reduced-motion` respected
- [ ] Color is never the only indicator (icon/text + color)
- [ ] Forms: labels, hints, inline blur errors, focusable error summary on failed submit
- [ ] Multi-step flows show progress; submit shows loading → success/error
- [ ] Auto-rotating carousels: pause control, stop on focus/hover/reduced motion
- [ ] Touch targets ≥ 44×44pt where applicable; hit area expanded for small icons
- [ ] Responsive: 375px, 768px, 1024px, 1440px + landscape; no horizontal scroll
- [ ] No content hidden behind fixed navbars; scroll margins for anchors (`.scroll-mt-20`)
- [ ] Decorative icons `aria-hidden="true"`; meaningful images have alt text
- [ ] Heading hierarchy sequential (h1→h2→h3)
- [ ] Text fits all containers across locales (FR/AR/EN/…); long words wrap or scale
