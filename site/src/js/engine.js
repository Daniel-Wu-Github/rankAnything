// Rank Anything — core engine. Schema-driven items, ordered master list,
// tier breaks, filters, sort, undo/redo, dirty tracking. No framework,
// no dependencies; views subscribe via the exported event target.

export const ENGINE_EVENTS = new EventTarget();

export const CUSTOM_TEMPLATE = {
  slug: "custom",
  title: "Custom Board",
  description: "Your own list, ranked.",
  schema: [],
  items: [],
};

let uid = 0;
export function nextId() {
  uid += 1;
  return `i${uid}`;
}

export function createState(template) {
  const items = (template.items || []).map((raw, index) => normalizeItem(raw, index, template));
  return {
    template,
    items,
    filters: emptyFilters(template),
    sort: { key: null, direction: "asc" },
    history: { undo: [], redo: [] },
    view: template.defaultView || "board",
    tierLabels: {},
    lastSavedSerialized: JSON.stringify(items),
    isDirty: false,
  };
}

export function emptyFilters(template) {
  const enums = {};
  const numbers = {};
  for (const field of template.schema) {
    if (!field.filter) continue;
    if (field.type === "enum") enums[field.key] = [];
    if (field.type === "number") numbers[field.key] = { min: "", max: "" };
  }
  return { search: "", enums, numbers };
}

export function normalizeItem(raw, index, template) {
  const attrs = {};
  for (const field of template.schema) {
    const value = raw.attrs ? raw.attrs[field.key] : raw[field.key];
    attrs[field.key] = field.type === "number" ? Number(value) || 0 : String(value ?? "");
  }
  return {
    id: raw.id || nextId(),
    rank: index + 1,
    name: String(raw.name ?? "").trim(),
    attrs,
    starred: Boolean(raw.starred),
    note: String(raw.note ?? ""),
    tiersAbove: Boolean(raw.tiersAbove),
  };
}

export function cloneItems(items) {
  return JSON.parse(JSON.stringify(items));
}

export function renumber(items) {
  return items.map((item, index) => ({ ...item, rank: index + 1 }));
}

const MUTATING = new Set([
  "REORDER", "TOGGLE_STAR", "UPDATE_NOTE", "ADD_ITEM", "REMOVE_ITEM",
  "SET_TIER", "REMOVE_TIER", "RENAME_ITEM",
]);

export function dispatch(state, action) {
  if (MUTATING.has(action.type)) {
    state.history.undo.push(cloneItems(state.items));
    state.history.redo = [];
  }

  switch (action.type) {
    case "REORDER":
      state.items = renumber(action.payload);
      break;
    case "TOGGLE_STAR":
      state.items = renumber(state.items.map((item) =>
        item.id === action.payload ? { ...item, starred: !item.starred } : item));
      break;
    case "UPDATE_NOTE":
      state.items = renumber(state.items.map((item) =>
        item.id === action.payload.id ? { ...item, note: action.payload.note } : item));
      break;
    case "RENAME_ITEM":
      state.items = renumber(state.items.map((item) =>
        item.id === action.payload.id ? { ...item, name: action.payload.name } : item));
      break;
    case "ADD_ITEM":
      state.items = renumber([...state.items, action.payload]);
      break;
    case "REMOVE_ITEM":
      state.items = renumber(state.items.filter((item) => item.id !== action.payload));
      break;
    case "SET_TIER":
      state.items = renumber(state.items.map((item) =>
        item.id === action.payload ? { ...item, tiersAbove: true } : item));
      break;
    case "REMOVE_TIER":
      state.items = renumber(state.items.map((item) =>
        item.id === action.payload ? { ...item, tiersAbove: false } : item));
      break;
    case "SET_TIER_LABEL":
      state.tierLabels[action.payload.id] = action.payload.label;
      break;
    case "SET_FILTERS":
      Object.assign(state.filters, action.payload);
      break;
    case "SET_SORT":
      Object.assign(state.sort, action.payload);
      break;
    case "SET_VIEW":
      state.view = action.payload;
      break;
    case "UNDO":
      if (state.history.undo.length) {
        state.history.redo.push(cloneItems(state.items));
        state.items = renumber(state.history.undo.pop());
      }
      break;
    case "REDO":
      if (state.history.redo.length) {
        state.history.undo.push(cloneItems(state.items));
        state.items = renumber(state.history.redo.pop());
      }
      break;
    case "REPLACE_ITEMS":
      state.items = renumber(action.payload);
      state.history.undo = [];
      state.history.redo = [];
      break;
    default:
      break;
  }

  state.isDirty = JSON.stringify(state.items) !== state.lastSavedSerialized;
  ENGINE_EVENTS.dispatchEvent(new CustomEvent("state:change", { detail: { action } }));
}

export function markSaved(state) {
  state.lastSavedSerialized = JSON.stringify(state.items);
  state.isDirty = false;
}

export function isFilterActive(state) {
  const f = state.filters;
  if (f.search.trim()) return true;
  if (Object.values(f.enums).some((values) => values.length > 0)) return true;
  if (Object.values(f.numbers).some((range) => range.min !== "" || range.max !== "")) return true;
  return false;
}

export function isSortActive(state) {
  return state.sort.key !== null;
}

export function applyFilters(state) {
  const f = state.filters;
  const query = f.search.trim().toLowerCase();
  return state.items.filter((item) => {
    if (query && !item.name.toLowerCase().includes(query)) return false;
    for (const [key, values] of Object.entries(f.enums)) {
      if (values.length && !values.includes(item.attrs[key])) return false;
    }
    for (const [key, range] of Object.entries(f.numbers)) {
      const value = Number(item.attrs[key]) || 0;
      if (range.min !== "" && value < Number(range.min)) return false;
      if (range.max !== "" && value > Number(range.max)) return false;
    }
    return true;
  });
}

export function applySort(state, items) {
  if (!state.sort.key) return items;
  const { key, direction } = state.sort;
  const factor = direction === "asc" ? 1 : -1;
  return [...items].sort((a, b) => {
    const av = key === "name" ? a.name : a.attrs[key];
    const bv = key === "name" ? b.name : b.attrs[key];
    if (typeof av === "number" && typeof bv === "number") return (av - bv) * factor;
    return String(av).localeCompare(String(bv)) * factor;
  });
}

export function moveItem(state, fromId, toId, position) {
  if (!fromId || !toId || fromId === toId) return;
  const items = [...state.items];
  const fromIndex = items.findIndex((item) => item.id === fromId);
  const toIndex = items.findIndex((item) => item.id === toId);
  if (fromIndex === -1 || toIndex === -1) return;
  const [moved] = items.splice(fromIndex, 1);
  const targetAfterRemoval = items.findIndex((item) => item.id === toId);
  const finalIndex = position === "above" ? targetAfterRemoval : targetAfterRemoval + 1;
  items.splice(finalIndex, 0, moved);
  dispatch(state, { type: "REORDER", payload: items });
}

// Tier grouping: the ordered list splits into groups at every tiersAbove flag.
export function tierGroups(state) {
  const groups = [];
  let current = { start: 0, items: [] };
  state.items.forEach((item, index) => {
    if (item.tiersAbove && current.items.length) {
      groups.push(current);
      current = { start: index, items: [] };
    }
    current.items.push(item);
  });
  if (current.items.length) groups.push(current);
  return groups;
}

// Enum color assignment: stable per template, 8-color cycle.
export const ENUM_PALETTE = [
  "var(--cat-1)", "var(--cat-2)", "var(--cat-3)", "var(--cat-4)",
  "var(--cat-5)", "var(--cat-6)", "var(--cat-7)", "var(--cat-8)",
];

export function enumColors(template) {
  const colors = {};
  for (const field of template.schema) {
    if (field.type !== "enum") continue;
    const values = field.values || [];
    values.forEach((value, index) => {
      colors[`${field.key}:${value}`] = ENUM_PALETTE[index % ENUM_PALETTE.length];
    });
  }
  return colors;
}

export function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

export function track(eventName, props) {
  try {
    if (Array.isArray(window.dataLayer)) {
      window.dataLayer.push({ event: eventName, ...props });
    }
  } catch (e) { /* no-op */ }
}
