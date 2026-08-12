// Board page bootstrap: template loading (inline JSON or shared hash),
// toolbar, filters, CSV round-trip, share/image, autosave, view switching.
import {
  CUSTOM_TEMPLATE, ENGINE_EVENTS, createState, dispatch, emptyFilters,
  enumColors, escapeHtml, isFilterActive, markSaved, nextId, normalizeItem, track,
} from "./engine.js";
import { createBoardView } from "./views/board.js";
import { createTiersView } from "./views/tiers.js";
import { encodeToHash, decodeFromHash } from "./share.js";
import { parseCsv, stringifyCsv } from "./csv.js";
import { exportImage } from "./image.js";

function readInlineTemplate() {
  const node = document.getElementById("template-data");
  if (!node) return null;
  try { return JSON.parse(node.textContent); } catch (e) { return null; }
}

function storageKey(slug) {
  return `ra_board_${slug}`;
}

export async function bootBoardApp() {
  const inline = readInlineTemplate();
  let template = inline || CUSTOM_TEMPLATE;
  let state = null;

  // Priority: shared hash > saved local copy > template defaults.
  const shared = await decodeFromHash(window.location.hash);
  if (shared) {
    template = shared.template;
    state = createState(template);
    state.items = shared.items.map((item, index) => ({ ...item, rank: index + 1 }));
    state.tierLabels = shared.tierLabels;
    state.isDirty = true;
  } else {
    state = createState(template);
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey(template.slug)) || "null");
      if (saved && Array.isArray(saved.items) && saved.items.length) {
        state.items = saved.items.map((raw, index) => normalizeItem(raw, index, template));
        state.tierLabels = saved.tierLabels || {};
        markSaved(state);
      }
    } catch (e) { /* corrupted local copy -> template defaults */ }
  }

  const dom = {
    title: document.getElementById("board-title"),
    subtitle: document.getElementById("board-subtitle"),
    banner: document.getElementById("banner"),
    live: document.getElementById("live-region"),
    toast: document.getElementById("toast"),
    viewRoot: document.getElementById("view-root"),
    filterBar: document.getElementById("filter-bar"),
    search: document.getElementById("search-input"),
    sortSelect: document.getElementById("sort-select"),
    viewBoard: document.getElementById("view-board-btn"),
    viewTiers: document.getElementById("view-tiers-btn"),
    add: document.getElementById("add-btn"),
    importCsv: document.getElementById("import-btn"),
    exportCsv: document.getElementById("export-btn"),
    share: document.getElementById("share-btn"),
    image: document.getElementById("image-btn"),
    embed: document.getElementById("embed-btn"),
    undo: document.getElementById("undo-btn"),
    redo: document.getElementById("redo-btn"),
    csvInput: document.getElementById("csv-input"),
    noteDialog: document.getElementById("note-dialog"),
    noteText: document.getElementById("note-text"),
    dirty: document.getElementById("dirty-indicator"),
  };

  if (dom.title) dom.title.textContent = template.title;
  if (dom.subtitle && template.description) dom.subtitle.textContent = template.description;
  if (shared && dom.banner) {
    dom.banner.textContent = "Viewing a shared board — it's yours to edit now.";
    dom.banner.classList.add("active");
  }

  const enumColorMap = enumColors(template);
  let toastTimer = null;
  function showToast(message) {
    dom.toast.textContent = message;
    dom.toast.classList.add("visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => dom.toast.classList.remove("visible"), 2000);
  }

  function announce(message) {
    if (dom.live) dom.live.textContent = message;
  }

  let noteTargetId = null;
  function openNote(id) {
    noteTargetId = id;
    const item = state.items.find((candidate) => candidate.id === id);
    dom.noteText.value = item ? item.note : "";
    dom.noteDialog.showModal();
  }

  // --- mobile "more actions" sheet ---
  // Everything that is a column or an always-visible button on desktop moves
  // in here on phones, so a row stays one dense line. Same idea as the frozen
  // football board's more-actions modal.
  const moreDialog = document.getElementById("more-dialog");
  function openMore(id) {
    const item = state.items.find((candidate) => candidate.id === id);
    if (!item || !moreDialog) return;
    document.getElementById("more-title").textContent = `${item.rank}. ${item.name}`;
    document.getElementById("more-attrs").innerHTML = template.schema.map((field) => {
      const value = item.attrs[field.key];
      if (value === "" || value === undefined || value === null) return "";
      return `<div class="more-attr"><dt>${escapeHtml(field.label)}</dt><dd>${escapeHtml(value)}</dd></div>`;
    }).join("");
    const hasTier = item.tiersAbove && item.rank > 1;
    document.getElementById("more-actions").innerHTML = `
      <button class="btn" data-more-action="star">${item.starred ? "★ Unstar" : "☆ Star"}</button>
      <button class="btn" data-more-action="note">${item.note ? "Edit note" : "Add note"}</button>
      <button class="btn" data-more-action="tier">${hasTier ? "Remove tier break" : "Add tier break above"}</button>
      <button class="btn danger" data-more-action="delete">Delete</button>`;
    moreDialog.dataset.itemId = id;
    moreDialog.showModal();
  }

  if (moreDialog) {
    document.getElementById("more-close").addEventListener("click", () => moreDialog.close());
    document.getElementById("more-actions").addEventListener("click", (event) => {
      const button = event.target.closest("button[data-more-action]");
      if (!button) return;
      const id = moreDialog.dataset.itemId;
      const item = state.items.find((candidate) => candidate.id === id);
      const action = button.dataset.moreAction;
      moreDialog.close();
      if (action === "star") dispatch(state, { type: "TOGGLE_STAR", payload: id });
      if (action === "delete") dispatch(state, { type: "REMOVE_ITEM", payload: id });
      if (action === "tier") {
        dispatch(state, { type: item && item.tiersAbove ? "REMOVE_TIER" : "SET_TIER", payload: id });
      }
      if (action === "note") openNote(id);
    });
  }

  const boardView = createBoardView(state, dom.viewRoot, { announce, enumColorMap, onEdit: openNote, onMore: openMore });
  const tiersView = createTiersView(state, dom.viewRoot, { announce, enumColorMap });

  const sortableFields = template.schema.filter((field) => field.type === "number");
  if (dom.sortSelect && sortableFields.length) {
    dom.sortSelect.hidden = false;
    dom.sortSelect.innerHTML = `<option value="">Manual order</option>${sortableFields
      .map((field) => `<option value="${escapeHtml(field.key)}">Sort: ${escapeHtml(field.label)}</option>`)
      .join("")}`;
  }

  function renderFilters() {
    const enumField = template.schema.find((field) => field.type === "enum" && field.filter);
    if (!enumField) { dom.filterBar.hidden = true; return; }
    const active = state.filters.enums[enumField.key] || [];
    dom.filterBar.hidden = false;
    dom.filterBar.innerHTML = (enumField.values || []).map((value) =>
      `<button class="filter-chip" data-key="${escapeHtml(enumField.key)}" data-value="${escapeHtml(value)}"
        aria-pressed="${active.includes(value)}">${escapeHtml(value)}</button>`).join("");
  }

  function render() {
    dom.undo.disabled = state.history.undo.length === 0;
    dom.redo.disabled = state.history.redo.length === 0;
    if (dom.dirty) dom.dirty.classList.toggle("active", state.isDirty);
    dom.viewBoard.setAttribute("aria-pressed", String(state.view === "board"));
    dom.viewTiers.setAttribute("aria-pressed", String(state.view === "tiers"));
    renderFilters();
    if (dom.sortSelect && sortableFields.length) dom.sortSelect.value = state.sort.key || "";
    if (state.view === "tiers") tiersView.render();
    else boardView.render();
  }

  ENGINE_EVENTS.addEventListener("state:change", render);

  // --- toolbar wiring ---
  dom.viewBoard.addEventListener("click", () => dispatch(state, { type: "SET_VIEW", payload: "board" }));
  dom.viewTiers.addEventListener("click", () => dispatch(state, { type: "SET_VIEW", payload: "tiers" }));
  dom.undo.addEventListener("click", () => dispatch(state, { type: "UNDO" }));
  dom.redo.addEventListener("click", () => dispatch(state, { type: "REDO" }));

  document.addEventListener("keydown", (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z" && !event.shiftKey) {
      event.preventDefault();
      dispatch(state, { type: "UNDO" });
    }
    if ((event.ctrlKey || event.metaKey) && (event.key.toLowerCase() === "y" ||
      (event.shiftKey && event.key.toLowerCase() === "z"))) {
      event.preventDefault();
      dispatch(state, { type: "REDO" });
    }
  });

  dom.search.addEventListener("input", () => {
    dispatch(state, { type: "SET_FILTERS", payload: { search: dom.search.value } });
  });

  if (dom.sortSelect) {
    dom.sortSelect.addEventListener("change", () => {
      const key = dom.sortSelect.value || null;
      dispatch(state, { type: "SET_SORT", payload: { key, direction: "asc" } });
      track("sort_by", { template: template.slug, key });
    });
  }

  dom.filterBar.addEventListener("click", (event) => {
    const chip = event.target.closest(".filter-chip");
    if (!chip) return;
    const { key, value } = chip.dataset;
    const current = state.filters.enums[key] || [];
    const next = current.includes(value)
      ? current.filter((candidate) => candidate !== value)
      : [...current, value];
    dispatch(state, { type: "SET_FILTERS", payload: { enums: { ...state.filters.enums, [key]: next } } });
  });

  dom.add.addEventListener("click", () => {
    const name = window.prompt("Item name:");
    if (!name || !name.trim()) return;
    dispatch(state, {
      type: "ADD_ITEM",
      payload: normalizeItem({ id: nextId(), name: name.trim() }, state.items.length, template),
    });
  });

  // --- notes dialog ---
  document.getElementById("note-save").addEventListener("click", () => {
    if (noteTargetId) {
      dispatch(state, { type: "UPDATE_NOTE", payload: { id: noteTargetId, note: dom.noteText.value } });
    }
    dom.noteDialog.close();
  });
  document.getElementById("note-cancel").addEventListener("click", () => dom.noteDialog.close());

  // --- CSV ---
  const schemaKeys = template.schema.map((field) => field.key);
  dom.exportCsv.addEventListener("click", () => {
    const headers = ["rank", "name", ...schemaKeys, "starred", "note", "tiersabove"];
    const rows = state.items.map((item) => ({
      rank: item.rank,
      name: item.name,
      ...Object.fromEntries(schemaKeys.map((key) => [key, item.attrs[key]])),
      starred: item.starred,
      note: item.note,
      tiersabove: item.tiersAbove,
    }));
    const blob = new Blob([stringifyCsv(rows, headers)], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${template.slug}-ranking.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    track("csv_export", { template: template.slug, items: rows.length });
  });

  dom.importCsv.addEventListener("click", () => dom.csvInput.click());
  dom.csvInput.addEventListener("change", async () => {
    const file = dom.csvInput.files[0];
    if (!file) return;
    if (!window.confirm("Importing will replace the current board. Continue?")) {
      dom.csvInput.value = "";
      return;
    }
    const { records } = parseCsv(await file.text());
    const items = records
      .filter((record) => (record.name || "").trim())
      .map((record, index) => normalizeItem({
        id: nextId(),
        name: record.name,
        starred: ["true", "1", "yes"].includes(String(record.starred).toLowerCase()),
        note: record.note || "",
        tiersAbove: ["true", "1", "yes"].includes(String(record.tiersabove).toLowerCase()),
        ...Object.fromEntries(schemaKeys.map((key) => [key, record[key]])),
      }, index, template));
    if (!items.length) {
      showToast("No usable rows in that CSV");
      dom.csvInput.value = "";
      return;
    }
    dispatch(state, { type: "REPLACE_ITEMS", payload: items });
    dom.csvInput.value = "";
    track("csv_import", { template: template.slug, items: items.length });
  });

  // --- share / image / embed ---
  dom.share.addEventListener("click", async () => {
    const hash = await encodeToHash(state);
    const base = template.slug === "custom" || shared
      ? `${window.location.origin}/b/`
      : `${window.location.origin}${window.location.pathname}`;
    const url = `${base}${hash}`;
    try {
      await navigator.clipboard.writeText(url);
      showToast("Link copied — the whole board is in it");
    } catch (e) {
      window.prompt("Copy this link:", url);
    }
    track("share_url", { template: template.slug, items: state.items.length, bytes: url.length });
  });

  dom.image.addEventListener("click", () => {
    exportImage(state, enumColorMap);
    track("image_export", { template: template.slug, items: state.items.length });
  });

  if (dom.embed) {
    dom.embed.addEventListener("click", async () => {
      const hash = await encodeToHash(state);
      const url = `${window.location.origin}/embed/${hash}`;
      const snippet = `<iframe src="${url}" width="100%" height="480" style="border:0;border-radius:12px" title="${template.title}"></iframe>`;
      try {
        await navigator.clipboard.writeText(snippet);
        showToast("Embed snippet copied");
      } catch (e) {
        window.prompt("Copy this embed snippet:", snippet);
      }
      track("embed_copy", { template: template.slug });
    });
  }

  // --- autosave (30s, only when dirty) ---
  setInterval(() => {
    if (!state.isDirty) return;
    try {
      localStorage.setItem(storageKey(template.slug), JSON.stringify({
        items: state.items,
        tierLabels: state.tierLabels,
      }));
      markSaved(state);
      if (dom.dirty) dom.dirty.classList.remove("active");
      showToast("Saved");
    } catch (e) { /* storage full/blocked — keep running */ }
  }, 30000);

  render();
  document.documentElement.dataset.appReady = "true";
  track("board_opened", { template: template.slug, items: state.items.length, shared: Boolean(shared) });
}
