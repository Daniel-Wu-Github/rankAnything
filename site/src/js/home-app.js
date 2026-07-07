// Home page: paste-a-list -> instant board (time-to-first-ranking < 10s).
// The gallery itself is prerendered static HTML from build.mjs.
import { CUSTOM_TEMPLATE, createState, nextId, track } from "./engine.js";
import { encodeToHash } from "./share.js";

export function bootHomeApp() {
  const textarea = document.getElementById("paste-input");
  const button = document.getElementById("paste-go");

  async function go() {
    const names = textarea.value
      .split("\n")
      .map((line) => line.replace(/^\s*(?:\d+[.)]\s*|[-*•]\s*)?/, "").trim())
      .filter((line) => line.length > 0);
    if (names.length < 2) {
      textarea.focus();
      textarea.setAttribute("aria-invalid", "true");
      return;
    }
    const state = createState(CUSTOM_TEMPLATE);
    state.items = names.map((name, index) => ({
      id: nextId(), rank: index + 1, name, attrs: {}, starred: false, note: "", tiersAbove: false,
    }));
    const hash = await encodeToHash(state);
    track("board_created", { source: "paste", items: names.length });
    window.location.href = `/b/${hash}`;
  }

  button.addEventListener("click", go);
  textarea.addEventListener("keydown", (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key === "Enter") go();
  });
  document.documentElement.dataset.appReady = "true";
}
