// Embed page: read-only render of a shared board hash, with a CTA back to
// the full editor. No toolbar, no persistence.
import { escapeHtml } from "./engine.js";
import { decodeFromHash } from "./share.js";

export async function bootEmbedApp() {
  const root = document.getElementById("embed-root");
  const shared = await decodeFromHash(window.location.hash);

  if (!shared) {
    root.innerHTML = `<div class="empty-state">No board in this link.</div>`;
    document.documentElement.dataset.appReady = "true";
    return;
  }

  let tierNumber = 1;
  const rows = shared.items.map((item, index) => {
    const tier = item.tiersAbove && index > 0
      ? `<li class="tier-row-li">${escapeHtml((shared.tierLabels[item.id] || `Tier ${(tierNumber += 1)}`).toUpperCase())}</li>`
      : "";
    return `${tier}<li>${item.starred ? "★ " : ""}${escapeHtml(item.name)}</li>`;
  }).join("");

  root.innerHTML = `
    <h2 style="margin:4px 0 10px;font-size:17px">${escapeHtml(shared.template.title)}</h2>
    <ol class="pairwise-result-list">${rows}</ol>
    <a class="embed-cta" href="/b/${escapeHtml(window.location.hash)}" target="_blank" rel="noopener">
      Rank this yourself on Rank Anything →</a>`;
  document.documentElement.dataset.appReady = "true";
}
