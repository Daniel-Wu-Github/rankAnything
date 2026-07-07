// Canvas PNG export — hand-drawn, deterministic for a given state.
import { tierGroups } from "./engine.js";

function cssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

export function exportImage(state, enumColorMap) {
  const items = state.items;
  const width = 800;
  const rowHeight = 30;
  const headerHeight = 72;
  const footerHeight = 44;
  const tierHeight = 26;
  const groups = tierGroups(state);
  const tierCount = Math.max(0, groups.length - 1);
  const height = headerHeight + items.length * rowHeight + tierCount * tierHeight + footerHeight;

  const canvas = document.createElement("canvas");
  const scale = 2;
  canvas.width = width * scale;
  canvas.height = height * scale;
  const ctx = canvas.getContext("2d");
  ctx.scale(scale, scale);

  ctx.fillStyle = cssVar("--bg") || "#0d1017";
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = cssVar("--text") || "#edf1f7";
  ctx.font = "700 24px 'DM Sans', sans-serif";
  ctx.fillText(state.template.title, 24, 40);
  ctx.fillStyle = cssVar("--muted") || "#8a96b0";
  ctx.font = "400 12px 'DM Sans', sans-serif";
  ctx.fillText(new Date().toISOString().slice(0, 10), 24, 58);

  const enumField = state.template.schema.find((field) => field.type === "enum");

  let y = headerHeight;
  let tierNumber = 0;
  groups.forEach((group) => {
    tierNumber += 1;
    if (tierNumber > 1) {
      const first = group.items[0];
      const label = (state.tierLabels[first.id] || `TIER ${tierNumber}`).toUpperCase();
      ctx.fillStyle = cssVar("--amber") || "#f59e0b";
      ctx.font = "600 12px 'DM Mono', monospace";
      ctx.fillText(label, 24, y + 16);
      ctx.strokeStyle = cssVar("--amber") || "#f59e0b";
      ctx.globalAlpha = 0.45;
      ctx.beginPath();
      ctx.moveTo(24 + ctx.measureText(label).width + 12, y + 12);
      ctx.lineTo(width - 24, y + 12);
      ctx.stroke();
      ctx.globalAlpha = 1;
      y += tierHeight;
    }

    group.items.forEach((item) => {
      ctx.fillStyle = cssVar("--muted") || "#8a96b0";
      ctx.font = "500 13px 'DM Mono', monospace";
      ctx.textAlign = "right";
      ctx.fillText(String(item.rank), 52, y + 20);
      ctx.textAlign = "left";

      let nameX = 76;
      if (enumField) {
        const value = item.attrs[enumField.key];
        const varRef = enumColorMap[`${enumField.key}:${value}`];
        const color = varRef ? cssVar(varRef.slice(4, -1)) : "";
        ctx.fillStyle = color || cssVar("--muted") || "#8a96b0";
        ctx.fillRect(64, y + 8, 4, 16);
        ctx.font = "600 10px 'DM Mono', monospace";
        ctx.fillText(String(value ?? "").slice(0, 10).toUpperCase(), 76, y + 20);
        nameX = 160;
      }

      ctx.fillStyle = cssVar("--text") || "#edf1f7";
      ctx.font = `${item.starred ? "700" : "500"} 14px 'DM Sans', sans-serif`;
      ctx.fillText(`${item.starred ? "★ " : ""}${item.name}`, nameX, y + 20);
      y += rowHeight;
    });
  });

  ctx.fillStyle = cssVar("--muted") || "#8a96b0";
  ctx.font = "400 11px 'DM Sans', sans-serif";
  ctx.fillText("Made with Rank Anything — rank it, tier it, share it", 24, height - 18);

  canvas.toBlob((blob) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${state.template.slug}-ranking.png`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }, "image/png");
}
