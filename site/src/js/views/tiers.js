// Tier grid view: the same ordered state rendered as tier rows of chips.
// Dragging a chip between/within tiers reorders the master list; keyboard
// chips move with arrows (left/right within order, up/down across tiers).
import { dispatch, escapeHtml, renumber, tierGroups, cloneItems } from "../engine.js";

export function createTiersView(state, root, options) {
  const { announce, enumColorMap } = options;
  const kbGrab = { id: null, original: null };

  function render() {
    if (!state.items.length) {
      root.innerHTML = `<div class="empty-state">Nothing here yet — add items or paste a list.</div>`;
      return;
    }
    const enumField = state.template.schema.find((field) => field.type === "enum");
    const groups = tierGroups(state);

    const rows = groups.map((group, groupIndex) => {
      const first = group.items[0];
      const label = groupIndex === 0
        ? (state.tierLabels[first.id] || "Tier 1")
        : (state.tierLabels[first.id] || `Tier ${groupIndex + 1}`);
      const chips = group.items.map((item) => {
        const enumValue = enumField ? item.attrs[enumField.key] : null;
        const color = enumField ? enumColorMap[`${enumField.key}:${enumValue}`] : null;
        return `<button class="chip" draggable="true" data-id="${item.id}"
          style="--badge-color:${color || "var(--border)"}"
          aria-label="${escapeHtml(item.name)}, rank ${item.rank} in ${escapeHtml(label)}. Press Space to lift, arrows to move, Space to drop, Escape to cancel.">
          <span class="chip-rank">${item.rank}</span>${escapeHtml(item.name)}${item.starred ? " ★" : ""}
        </button>`;
      }).join("");
      return `<div class="tier-lane" data-group="${groupIndex}">
        <div class="tier-lane-label">${escapeHtml(label)}</div>
        <div class="tier-lane-chips" data-group="${groupIndex}">${chips}</div>
      </div>`;
    });

    root.innerHTML = `<div class="tier-grid">${rows.join("")}</div>
      <p class="view-hint">Tier breaks are edited in Board view (+ button on a row). Dragging here reorders across tiers.</p>`;
  }

  function focusChip(id) {
    const chip = root.querySelector(`.chip[data-id="${id}"]`);
    if (chip) {
      chip.focus();
      chip.classList.toggle("kb-lifted", kbGrab.id === id);
    }
  }

  function masterIndex(id) {
    return state.items.findIndex((item) => item.id === id);
  }

  // Move item so it lands immediately before/after a target chip, carrying
  // tier flags with positions: tiersAbove stays attached to positions, so we
  // swap flag ownership when the moved item crosses a boundary owner.
  function moveNear(dragId, targetId, before) {
    if (!dragId || !targetId || dragId === targetId) return;
    const items = [...state.items];
    const fromIndex = items.findIndex((item) => item.id === dragId);
    if (fromIndex === -1) return;
    // Boundary flags belong to positions, not riders: if the moved item owns
    // a tier break, hand the flag to the next item so the break stays put.
    const moved = { ...items[fromIndex] };
    if (moved.tiersAbove && items[fromIndex + 1]) {
      items[fromIndex + 1] = { ...items[fromIndex + 1], tiersAbove: true };
      if (state.tierLabels[moved.id] !== undefined) {
        state.tierLabels[items[fromIndex + 1].id] = state.tierLabels[moved.id];
        delete state.tierLabels[moved.id];
      }
    }
    moved.tiersAbove = false;
    items.splice(fromIndex, 1);
    const targetIndex = items.findIndex((item) => item.id === targetId);
    const insertIndex = before ? targetIndex : targetIndex + 1;
    // Landing right ON a boundary owner's slot from above: the break flag
    // must move to the incoming item so group membership matches intent.
    if (before && items[targetIndex] && items[targetIndex].tiersAbove) {
      items[targetIndex] = { ...items[targetIndex], tiersAbove: false };
      moved.tiersAbove = true;
      if (state.tierLabels[items[targetIndex].id] !== undefined) {
        state.tierLabels[moved.id] = state.tierLabels[items[targetIndex].id];
        delete state.tierLabels[items[targetIndex].id];
      }
    }
    items.splice(insertIndex, 0, moved);
    dispatch(state, { type: "REORDER", payload: items });
  }

  const drag = { id: null };

  root.addEventListener("dragstart", (event) => {
    const chip = event.target.closest(".chip");
    if (!chip) return;
    drag.id = chip.dataset.id;
    event.dataTransfer.setData("text/plain", drag.id);
  });

  root.addEventListener("dragover", (event) => {
    if (!drag.id) return;
    event.preventDefault();
  });

  root.addEventListener("drop", (event) => {
    event.preventDefault();
    if (!drag.id) return;
    const chip = event.target.closest(".chip");
    if (chip && chip.dataset.id !== drag.id) {
      const rect = chip.getBoundingClientRect();
      const before = event.clientX < rect.left + rect.width / 2;
      moveNear(drag.id, chip.dataset.id, before);
    } else {
      const lane = event.target.closest(".tier-lane-chips");
      if (lane) {
        const groups = tierGroups(state);
        const group = groups[Number(lane.dataset.group)];
        if (group && group.items.length) {
          const last = group.items[group.items.length - 1];
          if (last.id !== drag.id) moveNear(drag.id, last.id, false);
        }
      }
    }
    drag.id = null;
  });

  root.addEventListener("keydown", (event) => {
    const chip = event.target.closest(".chip");
    if (!chip) return;
    const id = chip.dataset.id;
    const item = state.items.find((candidate) => candidate.id === id);
    if (!item) return;

    if (event.key === " " || event.key === "Enter") {
      event.preventDefault();
      if (kbGrab.id === id) {
        const finalItems = state.items;
        state.items = kbGrab.original;
        kbGrab.id = null;
        kbGrab.original = null;
        dispatch(state, { type: "REORDER", payload: finalItems });
        focusChip(id);
        announce(`${item.name} dropped at rank ${finalItems.findIndex((candidate) => candidate.id === id) + 1}`);
      } else {
        kbGrab.id = id;
        kbGrab.original = cloneItems(state.items);
        chip.classList.add("kb-lifted");
        announce(`${item.name} lifted. Left and right arrows move within the order, Space drops, Escape cancels.`);
      }
      return;
    }

    if (kbGrab.id !== id) return;

    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      const items = [...state.items];
      const fromIndex = masterIndex(id);
      const toIndex = fromIndex + (event.key === "ArrowLeft" ? -1 : 1);
      if (toIndex < 0 || toIndex >= items.length) return;
      const [moved] = items.splice(fromIndex, 1);
      items.splice(toIndex, 0, moved);
      state.items = renumber(items);
      render();
      focusChip(id);
      announce(`${moved.name} moved to rank ${toIndex + 1}`);
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      state.items = renumber(kbGrab.original);
      kbGrab.id = null;
      kbGrab.original = null;
      render();
      focusChip(id);
      announce(`Reorder cancelled.`);
    }
  });

  return { render, focusChip };
}
