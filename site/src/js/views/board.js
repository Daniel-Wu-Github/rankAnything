// Board view: ordered table with native drag-and-drop + keyboard reordering.
import {
  applyFilters, applySort, dispatch, escapeHtml, isFilterActive, isSortActive,
  moveItem, cloneItems, renumber, tierGroups,
} from "../engine.js";

export function createBoardView(state, root, options) {
  const { announce, enumColorMap, onEdit } = options;
  const kbGrab = { id: null, original: null };

  function locked() {
    return isFilterActive(state) || isSortActive(state);
  }

  function render() {
    const filtered = applySort(state, applyFilters(state));
    const showTiers = !locked();
    const [enumField, ...secondaryEnumFields] = state.template.schema.filter((field) => field.type === "enum");
    const numberFields = state.template.schema.filter((field) => field.type === "number");

    if (!state.items.length) {
      root.innerHTML = `<div class="empty-state">Nothing here yet — add items or paste a list.</div>`;
      return;
    }
    if (!filtered.length) {
      root.innerHTML = `<div class="empty-state">No items match your filters.</div>`;
      return;
    }

    const header = `
      <tr>
        <th class="col-rank">#</th>
        <th class="col-star" aria-label="Starred">★</th>
        <th class="col-name">Name</th>
        ${enumField ? `<th>${escapeHtml(enumField.label)}</th>` : ""}
        ${secondaryEnumFields.map((field) => `<th class="col-num">${escapeHtml(field.label)}</th>`).join("")}
        ${numberFields.map((field) => `<th class="col-num">${escapeHtml(field.label)}</th>`).join("")}
        <th class="col-actions" aria-label="Actions"></th>
      </tr>`;

    const rows = filtered.map((item, index) => {
      const isLocked = locked();
      const next = filtered[index + 1];
      const tierAbove = showTiers && item.tiersAbove && index > 0;
      const preTier = showTiers && next && next.tiersAbove;
      const enumValue = enumField ? item.attrs[enumField.key] : null;
      const enumColor = enumField ? enumColorMap[`${enumField.key}:${enumValue}`] : null;
      const tierControl = showTiers
        ? (item.tiersAbove && index > 0
          ? `<button class="tier-btn" data-action="remove-tier" data-id="${item.id}" aria-label="Remove tier break">×</button>`
          : `<button class="tier-btn tier-add" data-action="add-tier" data-id="${item.id}" aria-label="Add tier break above">+</button>`)
        : "";
      const tierLabelRow = tierAbove
        ? `<tr class="tier-row"><td colspan="99">
             <input class="tier-label" data-id="${item.id}" value="${escapeHtml(state.tierLabels[item.id] || "")}" placeholder="Tier label" aria-label="Tier label" />
           </td></tr>`
        : "";

      return `${tierLabelRow}
        <tr class="item-row ${item.starred ? "starred" : ""} ${preTier ? "pre-tier" : ""}"
            data-id="${item.id}"
            draggable="${!isLocked}"
            tabindex="${isLocked ? "-1" : "0"}"
            aria-label="${escapeHtml(item.name)}, rank ${item.rank}${isLocked ? "" : ". Press Space to lift, arrow keys to move, Space to drop, Escape to cancel"}">
          <td class="col-rank">${item.rank}</td>
          <td><button class="icon-btn" data-action="star" data-id="${item.id}" aria-pressed="${item.starred}">${item.starred ? "★" : "☆"}</button></td>
          <td class="col-name">
            ${tierControl}
            <span class="item-name">${escapeHtml(item.name)}</span>
            ${item.note ? `<span class="note-dot" title="${escapeHtml(item.note)}"></span>` : ""}
          </td>
          ${enumField ? `<td data-label="${escapeHtml(enumField.label)}"><span class="enum-badge" style="--badge-color:${enumColor || "var(--muted)"}">${escapeHtml(enumValue ?? "")}</span></td>` : ""}
          ${secondaryEnumFields.map((field) => `<td class="col-num" data-label="${escapeHtml(field.label)}">${escapeHtml(item.attrs[field.key] ?? "")}</td>`).join("")}
          ${numberFields.map((field) => `<td class="col-num" data-label="${escapeHtml(field.label)}">${escapeHtml(item.attrs[field.key] ?? "")}</td>`).join("")}
          <td class="col-actions">
            <button class="icon-btn" data-action="note" data-id="${item.id}" aria-label="Edit note">✎</button>
            <button class="icon-btn danger" data-action="delete" data-id="${item.id}" aria-label="Delete ${escapeHtml(item.name)}">×</button>
            <button class="drag-handle" data-id="${item.id}" aria-label="Drag to reorder ${escapeHtml(item.name)}" ${isLocked ? "disabled" : ""}>⠿</button>
          </td>
        </tr>`;
    });

    root.innerHTML = `<table class="board-table"><thead>${header}</thead><tbody>${rows.join("")}</tbody></table>`;
  }

  function focusRow(id) {
    const row = root.querySelector(`tr.item-row[data-id="${id}"]`);
    if (row) {
      row.focus();
      row.classList.toggle("kb-lifted", kbGrab.id === id);
    }
  }

  // --- native drag & drop ---
  const drag = { id: null, overId: null, position: null };

  root.addEventListener("dragstart", (event) => {
    const row = event.target.closest("tr.item-row");
    if (!row || locked()) return;
    drag.id = row.dataset.id;
    event.dataTransfer.setData("text/plain", drag.id);
    event.dataTransfer.effectAllowed = "move";
  });

  root.addEventListener("dragover", (event) => {
    if (!drag.id) return;
    event.preventDefault();
    const row = event.target.closest("tr.item-row");
    if (!row) return;
    const rect = row.getBoundingClientRect();
    drag.overId = row.dataset.id;
    drag.position = event.clientY < rect.top + rect.height / 2 ? "above" : "below";
    root.querySelectorAll(".drop-before, .drop-after").forEach((el) =>
      el.classList.remove("drop-before", "drop-after"));
    row.classList.add(drag.position === "above" ? "drop-before" : "drop-after");
  });

  root.addEventListener("drop", (event) => {
    event.preventDefault();
    moveItem(state, drag.id, drag.overId, drag.position);
    drag.id = drag.overId = drag.position = null;
  });

  root.addEventListener("dragend", () => {
    drag.id = drag.overId = drag.position = null;
    root.querySelectorAll(".drop-before, .drop-after").forEach((el) =>
      el.classList.remove("drop-before", "drop-after"));
  });

  // --- touch drag & drop ---
  // Native HTML5 DnD above is a mouse-events spec and never fires on touch,
  // so touch gets its own handler. Gated to .drag-handle on purpose: starting
  // a drag from anywhere on the row would hijack scrolling (a plain swipe
  // must still scroll the list), which is the exact trap big-board.html hit.
  const touchDrag = { id: null, overId: null, position: null };

  function clearDropMarkers() {
    root.querySelectorAll(".drop-before, .drop-after").forEach((el) =>
      el.classList.remove("drop-before", "drop-after"));
  }

  root.addEventListener("touchstart", (event) => {
    const handle = event.target.closest(".drag-handle");
    if (!handle || locked()) return;
    touchDrag.id = handle.dataset.id;
    const row = handle.closest("tr.item-row");
    if (row) row.classList.add("kb-lifted");
  }, { passive: true });

  root.addEventListener("touchmove", (event) => {
    if (!touchDrag.id) return;
    // Only now suppress scrolling — the gesture is a confirmed drag.
    event.preventDefault();
    const touch = event.touches[0];
    const target = document.elementFromPoint(touch.clientX, touch.clientY);
    const row = target && target.closest ? target.closest("tr.item-row") : null;
    if (!row || row.dataset.id === touchDrag.id) return;
    const rect = row.getBoundingClientRect();
    touchDrag.overId = row.dataset.id;
    touchDrag.position = touch.clientY < rect.top + rect.height / 2 ? "above" : "below";
    clearDropMarkers();
    row.classList.add(touchDrag.position === "above" ? "drop-before" : "drop-after");
  }, { passive: false });

  root.addEventListener("touchend", () => {
    if (!touchDrag.id) return;
    root.querySelectorAll(".kb-lifted").forEach((el) => el.classList.remove("kb-lifted"));
    clearDropMarkers();
    if (touchDrag.overId) {
      moveItem(state, touchDrag.id, touchDrag.overId, touchDrag.position);
    }
    touchDrag.id = touchDrag.overId = touchDrag.position = null;
  });

  // --- keyboard reordering (Space lift / arrows / Space drop / Esc cancel) ---
  root.addEventListener("keydown", (event) => {
    const row = event.target.closest("tr.item-row");
    if (!row || locked()) return;
    const id = row.dataset.id;
    const item = state.items.find((candidate) => candidate.id === id);
    if (!item) return;

    if ((event.key === " " || event.key === "Enter") && event.target === row) {
      event.preventDefault();
      if (kbGrab.id === id) {
        const finalItems = state.items;
        state.items = kbGrab.original;
        kbGrab.id = null;
        kbGrab.original = null;
        dispatch(state, { type: "REORDER", payload: finalItems });
        focusRow(id);
        announce(`${item.name} dropped at rank ${finalItems.findIndex((candidate) => candidate.id === id) + 1}`);
      } else {
        kbGrab.id = id;
        kbGrab.original = cloneItems(state.items);
        row.classList.add("kb-lifted");
        announce(`${item.name} lifted at rank ${item.rank}. Arrow keys to move, Space to drop, Escape to cancel.`);
      }
      return;
    }

    if (kbGrab.id !== id) return;

    if (event.key === "ArrowUp" || event.key === "ArrowDown") {
      event.preventDefault();
      const items = [...state.items];
      const fromIndex = items.findIndex((candidate) => candidate.id === id);
      const toIndex = fromIndex + (event.key === "ArrowUp" ? -1 : 1);
      if (toIndex < 0 || toIndex >= items.length) return;
      const [moved] = items.splice(fromIndex, 1);
      items.splice(toIndex, 0, moved);
      state.items = renumber(items);
      render();
      focusRow(id);
      announce(`${moved.name} moved to rank ${toIndex + 1} of ${items.length}`);
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      state.items = renumber(kbGrab.original);
      kbGrab.id = null;
      kbGrab.original = null;
      render();
      focusRow(id);
      announce(`Reorder cancelled. ${item.name} returned to rank ${item.rank}.`);
    }
  });

  // --- row actions ---
  root.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;
    const { action, id } = button.dataset;
    if (action === "star") dispatch(state, { type: "TOGGLE_STAR", payload: id });
    if (action === "delete") dispatch(state, { type: "REMOVE_ITEM", payload: id });
    if (action === "add-tier") dispatch(state, { type: "SET_TIER", payload: id });
    if (action === "remove-tier") dispatch(state, { type: "REMOVE_TIER", payload: id });
    if (action === "note" && onEdit) onEdit(id);
  });

  root.addEventListener("input", (event) => {
    const label = event.target.closest("input.tier-label");
    if (label) {
      // Direct mutation, no dispatch: a re-render per keystroke would steal
      // focus from the input. Autosave persists tierLabels with the items.
      state.tierLabels[label.dataset.id] = label.value;
      state.isDirty = true;
    }
  });

  return { render, focusRow };
}
