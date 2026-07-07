// Pairwise ranking core: binary-insertion sort driven by user choices.
// Deterministic: same item order + same decision sequence => same ranking.
// Pure logic, UI-free, so tests can drive it headlessly.

export function estimateComparisons(n) {
  let total = 0;
  for (let i = 1; i < n; i += 1) total += Math.ceil(Math.log2(i + 1));
  return total;
}

export function createPairwiseSession(items) {
  const session = {
    pool: [...items],        // items not yet placed, in insertion order
    sorted: [],              // ranked best-first so far
    nextIndex: 0,            // pointer into pool
    lo: 0, hi: 0,            // binary-search window for the current insert
    current: null,           // item being inserted
    decisions: [],           // log of "a" | "b" for undo/replay
    done: false,
  };
  advance(session);
  return session;
}

function advance(session) {
  if (session.current === null) {
    if (session.nextIndex >= session.pool.length) {
      session.done = true;
      return;
    }
    session.current = session.pool[session.nextIndex];
    session.nextIndex += 1;
    if (session.sorted.length === 0) {
      session.sorted.push(session.current);
      session.current = null;
      advance(session);
      return;
    }
    session.lo = 0;
    session.hi = session.sorted.length;
  }
  if (session.lo >= session.hi) {
    session.sorted.splice(session.lo, 0, session.current);
    session.current = null;
    advance(session);
  }
}

export function currentPair(session) {
  if (session.done || session.current === null) return null;
  const mid = Math.floor((session.lo + session.hi) / 2);
  return { a: session.current, b: session.sorted[mid] };
}

// choice: "a" means the inserting item ranks HIGHER (better) than b.
export function choose(session, choice) {
  if (session.done) return;
  const mid = Math.floor((session.lo + session.hi) / 2);
  session.decisions.push(choice);
  if (choice === "a") session.hi = mid;
  else session.lo = mid + 1;
  advance(session);
}

export function undoChoice(session) {
  if (!session.decisions.length) return null;
  const decisions = session.decisions.slice(0, -1);
  const replayed = createPairwiseSession(session.pool);
  for (const decision of decisions) choose(replayed, decision);
  return replayed;
}

export function progress(session) {
  const total = estimateComparisons(session.pool.length);
  return { done: session.decisions.length, total: Math.max(total, session.decisions.length) };
}
