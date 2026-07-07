# Rank Anything — e2e gate

Playwright suite over the built static site (`site/dist`, rebuilt by `pretest`).

```bash
cd e2e && npm install && npm test   # xvfb-run; use npm run test:headed with a display
```

## Coverage (23 tests)

| Spec | Guards |
|---|---|
| `engine.spec.ts` | Template load + meta, mouse drag + undo/redo, keyboard-only reorder (Space/arrows/Escape + aria-live), tier break + label + view-switch state preservation, filter lock, CSV round-trip, share-URL round-trip (< 8KB), embed render, PNG download |
| `pairwise.spec.ts` | Truthful-oracle full run must produce a correctly sorted ranking (correctness independent of the seeded shuffle), editor handoff preserves order, undo/keyboard choices |
| `home.spec.ts` | Paste-a-list → board in 2 interactions (bullets/numbers stripped), gallery count + navigation, frozen `/football/` still serves, sitemap/robots index every surface |
| `bigboard.spec.ts` | P0 on the frozen football board: keyboard reorder = one undo entry, share round-trip with stars/tiers, CSV + PNG downloads, autosave restore after reload |
| `a11y.spec.ts` | axe: 0 critical/serious on home, template board, tier view, pairwise. `/football/` is exempt by design (feature-frozen; its keyboard path is covered functionally) |

## Non-hermetic notes

- `/football/` (frozen `big-board.html`) loads SortableJS/PapaParse/Google Fonts from CDN — the only network dependency in the suite. The generic app is dependency-free by design.
- The suite serves `site/dist` via `server.mjs` (zero-dep static server, port 4300).
