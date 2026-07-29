---
name: mobile-interaction-patterns
description: "Mobile-specific UX for phone-width viewports: responsive-table collapse strategies, filter drawers, touch/mouse/keyboard input-method parity, touch-target sizing, and horizontal-scroll containment. Use alongside ui-ux-pro-max whenever an interface must work below ~600px, especially when the desktop version relies on dense tables, drag-and-drop, hover, or always-visible filter panels."
user-invocable: false
---

# Mobile Interaction Patterns

Companion to `ui-ux-pro-max` and `frontend-design`, focused narrowly on what
breaks when a desktop-first interface is used on a phone. Those skills cover
the design system; this one covers small-viewport interaction correctness.

## When to Use

- Any task targeting phone-width viewports (<600px).
- The desktop version relies on: dense data tables, drag-and-drop, hover-only
  affordances, right-click, or always-visible multi-field filter panels.
- A "make it work on mobile" / "mobile UX pass" request.

## When Not to Use

- Desktop-only tools, or tasks where mobile is explicitly out of scope.
- Pure backend/logic work with no interactive surface.

## Core Checks

### 1. Input-method parity (the highest-value check)
Before shipping any drag / hover / right-click interaction, confirm it has a
**touch equivalent, and verify it by driving touch — do not infer from the
CSS or from reading the handler.**
- Native HTML5 Drag and Drop (`draggable`, `dragstart`/`dragover`/`drop`) is
  a **mouse-events spec and does not fire on touch** in mobile browsers. A
  page can look drag-capable and be completely dead to a finger.
- Equally, a working touch-drag handler can be **too aggressive**: if it
  starts a drag on any touch of a list row and `preventDefault`s the move,
  it *hijacks scrolling* — the user can no longer swipe to scroll the list.
  Gate touch-drag behind an explicit handle (or a long-press) so a plain
  swipe scrolls and only a deliberate grab reorders.
- Fixes, in order of preference: gate/adjust the existing handler; use the
  Pointer Events API (unifies mouse+touch+pen); use a touch-aware library
  (SortableJS, interact.js) or a DnD touch polyfill. Prefer the smallest fix
  that keeps existing engines intact — don't swap a working reorder engine
  for a library just because a library exists.
- **Verify with an automated touch test** (Playwright `hasTouch` context +
  dispatched `TouchEvent`s, or `page.touchscreen`), covering both the
  positive case (handle-drag reorders) and the negative case (body-swipe
  scrolls, does not reorder).

### 2. No horizontal page scroll
`document.body.scrollWidth` must equal `window.innerWidth` at every target
breakpoint — this is binary, not a tolerance. Common cause: a flex/grid
child with default `min-width:auto` expands to its content (e.g. a wide
table) and stretches its track past the viewport. Fix: `min-width:0` on the
shrinking child, and move genuinely-wide content into its own
`overflow-x:auto` container so it scrolls locally instead of the page. Beware
`overflow:hidden` on such a container — it *clips* (data becomes
unreachable) rather than scrolls.

### 3. Table collapse strategy — choose deliberately
Don't default to "just shrink the columns" (they get truncated/unreadable).
Pick one:
- **Row→card collapse** — each row becomes a labeled key-value card. Best
  when records are read individually (scan-and-tap). Implement CSS-first:
  grid/flex on the `<tr>`, `data-label` attributes surfaced via
  `td::before { content: attr(data-label) }`. Watch semantics: switching
  `display:table-*` to `block/grid` drops implicit table roles — keep DOM
  reading order logical, and add ARIA roles if the header→cell association
  matters.
- **Horizontal scroll + frozen key column(s)** — `position:sticky` the
  identifying column. Best when row density / side-by-side comparison beats
  avoiding a sideways swipe.
- **Priority+ column hiding** — only when hidden columns are genuinely
  non-critical; never silently drop data a user needs to make the decision
  the tool exists for.

### 4. Filter drawer over always-visible filter row
Below ~600px, move multi-field filter UI into a bottom sheet / drawer behind
a **"Filters (n)"** button rather than consuming above-the-fold vertical
space. Show the active-filter count on the trigger. Manage focus: move focus
into the drawer on open, return it to the trigger on close, Escape to
dismiss.

### 5. Touch-target sizing
≥44×44px hit area, ≥8px spacing between adjacent targets, even when the
visual glyph is smaller — expand the hit area with padding rather than
necessarily enlarging the icon. Audit icon-only buttons specifically
(star/close/toggle glyphs are the usual offenders).

### 6. Breakpoint floor
Cover down to **320px** (smallest common phone width), not just a single
"mobile" breakpoint at 768px. Phones cluster around 360/375/390/414 — test
the small end explicitly.

## Verification Gate

- `body.scrollWidth === window.innerWidth` at 320 / 375 / 414 / 768px.
- Every drag/reorder has an automated **touch** test (positive AND negative:
  handle-drag works, body-swipe scrolls), not just a mouse test.
- axe 0 critical/serious at each target breakpoint.
- Every interactive element ≥44×44px hit area at each breakpoint.
- Before/after screenshots at the target breakpoints — visual proof, not
  just assertions.

## Minimum Completion Output

1. Which collapse/drawer strategy was chosen and why.
2. Input-method parity confirmed by an actual touch test (state the result),
   not assumed from CSS.
3. Breakpoints covered and the evidence (scrollWidth checks, screenshots).
4. What was intentionally not changed to preserve scope.
