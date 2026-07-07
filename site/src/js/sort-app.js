// Pairwise page bootstrap: this-or-that duels -> full ranking -> handoff
// to the board editor via the share hash.
import { CUSTOM_TEMPLATE, createState, escapeHtml, track } from "./engine.js";
import { createPairwiseSession, currentPair, choose, undoChoice, progress } from "./pairwise.js";
import { encodeToHash, decodeFromHash } from "./share.js";

function readInlineTemplate() {
  const node = document.getElementById("template-data");
  if (!node) return null;
  try { return JSON.parse(node.textContent); } catch (e) { return null; }
}

// Deterministic shuffle so a template's duel sequence is stable run-to-run
// (and in tests): xorshift seeded from the slug.
function seededShuffle(items, seedText) {
  let seed = 2166136261;
  for (const char of seedText) {
    seed ^= char.charCodeAt(0);
    seed = Math.imul(seed, 16777619);
  }
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5;
    const j = Math.abs(seed) % (i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export async function bootSortApp() {
  const inline = readInlineTemplate();
  const shared = await decodeFromHash(window.location.hash);
  const template = shared ? shared.template : (inline || CUSTOM_TEMPLATE);
  const sourceItems = shared ? shared.items : createState(template).items;

  const dom = {
    title: document.getElementById("board-title"),
    duel: document.getElementById("duel-root"),
    progressFill: document.getElementById("progress-fill"),
    progressText: document.getElementById("progress-text"),
    undo: document.getElementById("undo-btn"),
    live: document.getElementById("live-region"),
  };

  if (dom.title) dom.title.textContent = `This or that: ${template.title}`;

  if (sourceItems.length < 2) {
    dom.duel.innerHTML = `<div class="empty-state">Nothing to compare — this board needs at least two items.</div>`;
    document.documentElement.dataset.appReady = "true";
    return;
  }

  let session = createPairwiseSession(seededShuffle(sourceItems, template.slug));

  function render() {
    const { done, total } = progress(session);
    dom.progressFill.style.width = `${Math.round((done / Math.max(total, 1)) * 100)}%`;
    dom.undo.disabled = session.decisions.length === 0;

    if (session.done) {
      dom.progressText.textContent = `Done — ${done} choices`;
      const list = session.sorted.map((item) => `<li>${escapeHtml(item.name)}</li>`).join("");
      dom.duel.innerHTML = `
        <h2>Your ranking</h2>
        <ol class="pairwise-result-list">${list}</ol>
        <div class="paste-actions">
          <button class="btn primary" id="open-board-btn">Refine in the board editor</button>
          <span class="paste-hint">Opens with drag, tiers, notes, share, and image export.</span>
        </div>`;
      document.getElementById("open-board-btn").addEventListener("click", async () => {
        const state = createState(template);
        state.items = session.sorted.map((item, index) => ({ ...item, rank: index + 1, tiersAbove: false }));
        const hash = await encodeToHash(state);
        track("pairwise_complete", { template: template.slug, choices: session.decisions.length });
        window.location.href = `/b/${hash}`;
      });
      return;
    }

    const pair = currentPair(session);
    dom.progressText.textContent = `${done} of ~${total} choices`;
    dom.duel.innerHTML = `
      <div class="duel">
        <button class="duel-card" data-choice="a" id="duel-a">${escapeHtml(pair.a.name)}</button>
        <div class="duel-vs" aria-hidden="true">VS</div>
        <button class="duel-card" data-choice="b" id="duel-b">${escapeHtml(pair.b.name)}</button>
      </div>
      <p class="view-hint">Pick the one you rank higher. Keyboard: ← left card, → right card, U undo.</p>`;
    if (dom.live) dom.live.textContent = `${pair.a.name} versus ${pair.b.name}`;
  }

  dom.duel.addEventListener("click", (event) => {
    const card = event.target.closest(".duel-card");
    if (!card || session.done) return;
    choose(session, card.dataset.choice);
    render();
  });

  document.addEventListener("keydown", (event) => {
    if (session.done) return;
    if (event.key === "ArrowLeft") { choose(session, "a"); render(); }
    if (event.key === "ArrowRight") { choose(session, "b"); render(); }
    if (event.key.toLowerCase() === "u" && session.decisions.length) {
      session = undoChoice(session);
      render();
    }
  });

  dom.undo.addEventListener("click", () => {
    if (session.decisions.length) {
      session = undoChoice(session);
      render();
    }
  });

  render();
  document.documentElement.dataset.appReady = "true";
  track("pairwise_started", { template: template.slug, items: sourceItems.length });
}
