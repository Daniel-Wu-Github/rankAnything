---
name: ui-ux-pro-max
description: "UI/UX design intelligence for web and mobile. Includes 50+ styles, 161 color palettes, 57 font pairings, 161 product types, 99 UX guidelines, and 25 chart types across 10 stacks (React, Next.js, Vue, Svelte, SwiftUI, React Native, Flutter, Tailwind, shadcn/ui, and HTML/CSS). Actions: plan, build, create, design, implement, review, fix, improve, optimize, enhance, refactor, and check UI/UX code. Projects: website, landing page, dashboard, admin panel, e-commerce, SaaS, portfolio, blog, and mobile app. Elements: button, modal, navbar, sidebar, card, table, form, and chart. Styles: glassmorphism, claymorphism, minimalism, brutalism, neumorphism, bento grid, dark mode, responsive, skeuomorphism, and flat design. Topics: color systems, accessibility, animation, layout, typography, font pairing, spacing, interaction states, shadow, and gradient."
---

# UI/UX Pro Max — Design Intelligence

Comprehensive design guide for web and mobile applications. Contains 50+ styles, 161 color palettes, 57 font pairings, 161 product types with reasoning rules, 99 UX guidelines, and 25 chart types across 10 technology stacks. Use as a searchable reference with priority-based recommendations.

## When to Use

Must invoke this skill when the task involves:
- Designing new pages or layouts
- Creating or refactoring UI components (buttons, modals, forms, tables)
- Choosing color schemes, typography systems, or spacing standards
- Reviewing UI code for UX, accessibility, or visual consistency
- Implementing navigation structures, animations, or responsive behavior
- Making product-level design decisions (style, information hierarchy)

Recommended when:
- UI looks "not professional enough" but the reason is unclear
- Receiving usability or experience feedback
- Pre-launch UI quality optimization
- Building design systems or reusable component libraries

Skip when:
- Pure backend logic, API design, or database work
- Performance optimization unrelated to the interface
- Non-visual scripts or automation tasks

**Decision criteria**: If the task changes how a feature **looks, feels, moves, or is interacted with**, use this skill.

## For This Project (HTML/CSS/JS Stack)

This project is a single HTML file. Apply guidelines as inline CSS within `<style>` and inline JS within `<script>`. No build tools, no framework.

Applicable stacks from the full skill: **HTML/CSS** (primary), patterns from React/Tailwind may be adapted to vanilla JS.

---

## Rule Categories by Priority

| Priority | Category | Impact | Key Checks | Anti-Patterns |
|----------|----------|--------|------------|---------------|
| 1 | Accessibility | CRITICAL | Contrast 4.5:1, Alt text, Keyboard nav, Aria-labels | Removing focus rings, Icon-only buttons without labels |
| 2 | Touch & Interaction | CRITICAL | Min size 44×44px, 8px+ spacing, Loading feedback | Reliance on hover only, Instant state changes (0ms) |
| 3 | Performance | HIGH | WebP/AVIF, Lazy loading, Reserve space (CLS < 0.1) | Layout thrashing, Cumulative Layout Shift |
| 4 | Style Selection | HIGH | Match product type, Consistency, SVG icons (no emoji) | Mixing flat & skeuomorphic randomly, Emoji as icons |
| 5 | Layout & Responsive | HIGH | Mobile-first breakpoints, Viewport meta, No horizontal scroll | Horizontal scroll, Fixed px container widths |
| 6 | Typography & Color | MEDIUM | Base 16px, Line-height 1.5, Semantic color tokens | Text < 12px body, Gray-on-gray, Raw hex in components |
| 7 | Animation | MEDIUM | Duration 150–300ms, Motion conveys meaning | Decorative-only animation, Animating width/height |
| 8 | Forms & Feedback | MEDIUM | Visible labels, Error near field, Progressive disclosure | Placeholder-only label, Errors only at top |
| 9 | Navigation Patterns | HIGH | Predictable back, Deep linking | Overloaded nav, Broken back behavior |
| 10 | Charts & Data | LOW | Legends, Tooltips, Accessible colors | Relying on color alone to convey meaning |

---

## Quick Reference

### 1. Accessibility (CRITICAL)

- `color-contrast` — Minimum 4.5:1 for normal text (large text 3:1)
- `focus-states` — Visible focus rings on interactive elements (2–4px)
- `alt-text` — Descriptive alt text for meaningful images
- `aria-labels` — aria-label for icon-only buttons
- `keyboard-nav` — Tab order matches visual order; full keyboard support
- `form-labels` — Use label with for attribute
- `heading-hierarchy` — Sequential h1→h6, no level skip
- `color-not-only` — Don't convey info by color alone (add icon/text)
- `reduced-motion` — Respect prefers-reduced-motion

### 2. Touch & Interaction (CRITICAL)

- `touch-target-size` — Min 44×44px; extend hit area if icon is smaller
- `touch-spacing` — Minimum 8px gap between touch targets
- `hover-vs-tap` — Use click/tap for primary interactions
- `loading-buttons` — Disable button during async; show spinner
- `error-feedback` — Clear error messages near problem
- `cursor-pointer` — Add cursor: pointer to clickable elements
- `tap-delay` — Use touch-action: manipulation to reduce 300ms delay

### 3. Performance (HIGH)

- `image-optimization` — Use WebP/AVIF, lazy load non-critical assets
- `font-loading` — font-display: swap to avoid invisible text
- `critical-css` — Prioritize above-the-fold CSS
- `reduce-reflows` — Avoid frequent layout reads/writes
- `content-jumping` — Reserve space for async content (CLS)

### 4. Style Selection (HIGH)

- `style-match` — Match style to product type
- `consistency` — Use same style across all pages/sections
- `no-emoji-icons` — Use SVG or text symbols, not emojis
- `effects-match-style` — Shadows, blur, radius aligned with chosen style
- `elevation-consistent` — Consistent shadow scale for cards, modals
- `dark-mode-pairing` — This project is dark-first; maintain contrast in all states

### 5. Layout & Responsive (HIGH)

- `viewport-meta` — width=device-width initial-scale=1 (never disable zoom)
- `mobile-first` — Design mobile-first, scale up to desktop
- `breakpoint-consistency` — Use systematic breakpoints (768 / 980 / 1440)
- `readable-font-size` — Minimum 16px body text on mobile
- `line-length-control` — Mobile 35–60 chars/line; desktop 60–75
- `horizontal-scroll` — No horizontal scroll on mobile
- `spacing-scale` — 4/8px incremental spacing system
- `container-width` — Consistent max-width on desktop

### 6. Typography & Color (MEDIUM)

- `line-height` — 1.5–1.75 for body text
- `font-pairing` — Match heading/body font personalities
- `font-scale` — Consistent type scale (12 14 16 18 24 32)
- `contrast-readability` — Darker text on light; lighter on dark
- `color-semantic` — Define semantic color tokens (primary, error, surface) not raw hex
- `weight-hierarchy` — Bold headings (600–700), Regular body (400), Medium labels (500)

### 7. Animation (MEDIUM)

- `duration-timing` — 150–300ms for micro-interactions; complex ≤400ms
- `transform-performance` — Use transform/opacity only; avoid width/height
- `loading-states` — Skeleton or spinner when loading > 300ms
- `easing` — ease-out entering, ease-in exiting; avoid linear
- `motion-meaning` — Every animation must express cause-effect, not just decoration
- `stagger-sequence` — Stagger list/grid entrance 30–50ms per item

### 8. Forms & Feedback (MEDIUM)

- `input-labels` — Visible label per input (not placeholder-only)
- `error-placement` — Show error below the related field
- `submit-feedback` — Loading then success/error state on submit
- `empty-states` — Helpful message and action when no content
- `toast-dismiss` — Auto-dismiss toasts in 3–5s
- `confirmation-dialogs` — Confirm before destructive actions

### 9. Navigation Patterns (HIGH)

- `back-behavior` — Back navigation predictable and consistent
- `modal-escape` — Modals must offer a clear close/dismiss affordance
- `search-accessible` — Search easily reachable
- `state-preservation` — Back must restore scroll position, filter state

### 10. Charts & Data (LOW)

- `chart-type` — Match chart type to data type
- `color-guidance` — Accessible color palettes; avoid red/green-only pairs
- `legend-visible` — Always show legend near the chart
- `tooltip-on-interact` — Tooltips showing exact values on hover/tap
- `axis-labels` — Label axes with units; avoid truncated labels

---

## 50+ Styles Reference (Condensed)

| Style | Best For | Key Tokens |
|-------|----------|------------|
| Glassmorphism | Dark dashboards, overlays | backdrop-filter: blur, rgba backgrounds, subtle borders |
| Claymorphism | Playful apps, consumer products | rounded corners, soft shadows, pastel fills |
| Minimalism | Tools, productivity, editorial | whitespace, monochrome, restrained type scale |
| Brutalism | Bold statements, creative portfolios | raw borders, high contrast, monospace fonts |
| Neumorphism | Soft dashboards (use sparingly) | light/shadow pairs, same-hue bumps |
| Bento Grid | Dashboards, feature showcases | asymmetric cards, varied heights |
| Flat Design | Mobile apps, broad audiences | solid fills, no shadow, bold icons |
| Retro/Terminal | Developer tools, data tools | monospace, green/amber on black |
| Editorial | Content-heavy, media | large type, vertical rhythm, pull quotes |
| Luxury/Refined | Premium products | serif type, gold/cream, generous whitespace |

**This project's current style**: Dark panel / data-dashboard — closest to a refined glassmorphism-adjacent dark theme with blue accent glows. Extensions should stay in this family unless a full redesign is requested.

---

## 57 Font Pairing Categories (Condensed)

| Category | Heading | Body | Mood |
|----------|---------|------|------|
| Technical/Data | JetBrains Mono | Inter | Precision |
| Editorial | Playfair Display | Source Serif | Authority |
| Modern Sans | Neue Haas Grotesk | DM Sans | Clean |
| Sporty/Bold | Barlow Condensed | Barlow | Energy |
| Luxury | Cormorant Garamond | Jost | Premium |
| Retro | Bebas Neue | IBM Plex Mono | Vintage |
| Geometric | Syne | Outfit | Futuristic |

**Avoid for this project**: Inter as the *only* font — it is overused. Pair it with a display font at minimum, or replace with a more characterful choice.

---

## Color Palette Guidance (Sports/Data Category)

Recommended palettes for a fantasy sports data tool:

| Palette | Background | Primary | Accent | Mood |
|---------|-----------|---------|--------|------|
| Current | `#0f1117` | `#151b26` | `#36c2ff` | Deep navy / electric blue |
| Alternative A | `#0a0e14` | `#12181f` | `#00e5a0` | Dark ocean / mint |
| Alternative B | `#111014` | `#1a1523` | `#c084fc` | Near-black / violet |
| Alternative C | `#0d1117` | `#161b22` | `#f97316` | GitHub dark / orange |

---

## Verification Gate

Before completion, confirm:
- Priority 1 (Accessibility) and Priority 2 (Touch & Interaction) rules met
- No raw hex values in new component code — use `--var` tokens
- Responsive behavior verified at 375px, 768px, and 1440px mentally
- Animation respects `prefers-reduced-motion`
- No emoji used as structural icons

## Minimum Completion Output

1. Design system decisions made (style, palette, fonts)
2. Priority rules applied and how
3. Any rule conflicts and how they were resolved
4. What was intentionally not changed to preserve scope
