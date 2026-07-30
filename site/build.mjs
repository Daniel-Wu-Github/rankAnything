#!/usr/bin/env node
// Rank Anything static build — zero dependencies, node >= 18.
// dist/ = assets copy + per-template prerendered pages (/t/, /sort/) with
// unique meta, plus /, /b/, /embed/, /football/ (frozen big-board.html),
// sitemap.xml, robots.txt.
import { cpSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, "..");
const dist = join(here, "dist");
const SITE_ORIGIN = process.env.SITE_ORIGIN || "https://rankanything.example.com";

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function stamp(shell, replacements) {
  let output = shell;
  for (const [key, value] of Object.entries(replacements)) {
    output = output.replaceAll(`{{${key}}}`, value);
  }
  return output;
}

rmSync(dist, { recursive: true, force: true });
mkdirSync(dist, { recursive: true });

// 1. Assets (served under /assets/) — ES modules as-is, no bundler.
cpSync(join(here, "src/js"), join(dist, "assets/js"), { recursive: true });
cpSync(join(here, "src/css"), join(dist, "assets/css"), { recursive: true });

// 1b. Root-level static assets (OG share image, etc.) — served at /<name>.
cpSync(join(here, "og-image.png"), join(dist, "og-image.png"));

// 2. Frozen football board — the original product, untouched, at /football/.
mkdirSync(join(dist, "football"), { recursive: true });
cpSync(join(repoRoot, "big-board.html"), join(dist, "football/index.html"));

// 3. Templates -> /t/<slug>/ (board) + /sort/<slug>/ (pairwise).
const boardShell = readFileSync(join(here, "src/pages/board.html"), "utf8");
const sortShell = readFileSync(join(here, "src/pages/sort.html"), "utf8");
const templates = readdirSync(join(here, "templates"))
  .filter((file) => file.endsWith(".json"))
  .map((file) => JSON.parse(readFileSync(join(here, "templates", file), "utf8")))
  .sort((a, b) => a.title.localeCompare(b.title));

const urls = [`${SITE_ORIGIN}/`, `${SITE_ORIGIN}/football/`];

for (const template of templates) {
  const json = JSON.stringify(template);
  const boardUrl = `${SITE_ORIGIN}/t/${template.slug}/`;
  const sortUrl = `${SITE_ORIGIN}/sort/${template.slug}/`;

  mkdirSync(join(dist, "t", template.slug), { recursive: true });
  writeFileSync(join(dist, "t", template.slug, "index.html"), stamp(boardShell, {
    TITLE: escapeHtml(template.title),
    DESCRIPTION: escapeHtml(template.description),
    CANONICAL: boardUrl,
    SORT_LINK: `/sort/${template.slug}/`,
    TEMPLATE_JSON: json,
  }));

  mkdirSync(join(dist, "sort", template.slug), { recursive: true });
  writeFileSync(join(dist, "sort", template.slug, "index.html"), stamp(sortShell, {
    TITLE: escapeHtml(template.title),
    DESCRIPTION: escapeHtml(template.description),
    CANONICAL: sortUrl,
    BOARD_LINK: `/t/${template.slug}/`,
    TEMPLATE_JSON: json,
  }));

  urls.push(boardUrl, sortUrl);
}

// 4. Blank board (/b/) and embed (/embed/) shells — state arrives via hash.
mkdirSync(join(dist, "b"), { recursive: true });
writeFileSync(join(dist, "b", "index.html"), stamp(boardShell, {
  TITLE: "Custom Board",
  DESCRIPTION: "Your own list, ranked — drag it, tier it, share it.",
  CANONICAL: `${SITE_ORIGIN}/b/`,
  SORT_LINK: "/",
  TEMPLATE_JSON: JSON.stringify({ slug: "custom", title: "Custom Board", description: "Your own list, ranked.", schema: [], defaultView: "board", items: [] }),
}));
mkdirSync(join(dist, "embed"), { recursive: true });
cpSync(join(here, "src/pages/embed.html"), join(dist, "embed/index.html"));

// 5. Home with prerendered gallery.
const homeShell = readFileSync(join(here, "src/pages/index.html"), "utf8");
const cards = templates.map((template) => `        <a class="gallery-card" href="/t/${template.slug}/">
          <h3>${escapeHtml(template.title)}</h3>
          <p>${escapeHtml(template.description)}</p>
          <span class="meta"><span class="count">${template.items.length}</span> items · board + this-or-that</span>
        </a>`).join("\n");
writeFileSync(join(dist, "index.html"), stamp(homeShell, {
  CANONICAL: `${SITE_ORIGIN}/`,
  GALLERY_CARDS: cards,
}));

// 6. sitemap + robots.
writeFileSync(join(dist, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((url) => `  <url><loc>${url}</loc></url>`).join("\n")}\n</urlset>\n`);
writeFileSync(join(dist, "robots.txt"), `User-agent: *\nAllow: /\nSitemap: ${SITE_ORIGIN}/sitemap.xml\n`);

console.log(`built ${templates.length} templates -> ${urls.length} indexed pages in site/dist`);
