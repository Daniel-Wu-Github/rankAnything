# Rank Anything — e2e gate

Playwright suite over the built static site (`site/dist`, rebuilt by `pretest`).

```bash
cd e2e && npm install && npm test   # xvfb-run; use npm run test:headed with a display
```

## Coverage (57 tests)

| Spec | Guards |
|---|---|
| `engine.spec.ts` | Template load + meta, mouse drag + undo/redo, keyboard-only reorder (Space/arrows/Escape + aria-live), tier break + label + view-switch state preservation, filter lock, CSV round-trip, share-URL round-trip (< 8KB), embed render, PNG download, sort-by-field on a schema number field (ascending, and locking/unlocking reorder) |
| `engine-mobile.spec.ts` | Mobile gate for the generic engine: touch-drag on the handle reorders **and** a plain body swipe does not (native HTML5 DnD is a mouse-events spec and never fires on touch — the bug this file exists to prevent), zero horizontal scroll across all 12 templates at 320/375/414, 44px touch targets, dense single-line rows with secondary attributes in the ⋮ more-actions sheet |
| `pairwise.spec.ts` | Truthful-oracle full run must produce a correctly sorted ranking (correctness independent of the seeded shuffle), editor handoff preserves order, undo/keyboard choices |
| `home.spec.ts` | Paste-a-list → board in 2 interactions (bullets/numbers stripped), gallery count + navigation, frozen `/football/` still serves, sitemap/robots index every surface |
| `bigboard.spec.ts` | P0 on the frozen football board: keyboard reorder = one undo entry, share round-trip with stars/tiers, CSV + PNG downloads (incl. the brand watermark pixels), autosave restore after reload |
| `bigboard-mobile.spec.ts` | Mobile gate for the frozen football board: no x-scroll at 320/375/414, dense rows, filters drawer, handle-gated touch reorder, more-actions modal, 44px targets |
| `security.spec.ts` | Every surface boots with the **production** CSP applied and logs zero CSP violations (`server.mjs` applies `site/dist/_headers` the way Pages does, so a policy that would white-screen prod fails here instead), baseline headers present, `/embed/` stays iframe-able, 404 page serves, favicon/manifest resolve |
| `a11y.spec.ts` | axe: 0 critical/serious on home, template board, tier view, pairwise, **and the board at 320/375** (card collapse drops implicit table semantics, so mobile needs its own pass). `/football/` is exempt by design (feature-frozen; its keyboard path is covered functionally) |

## Non-hermetic notes

- `/football/` (frozen `big-board.html`) loads SortableJS/PapaParse/Google Fonts from CDN — the only network dependency in the suite. The generic app is dependency-free by design.
- The suite serves `site/dist` via `server.mjs` (zero-dep static server, port 4300).
