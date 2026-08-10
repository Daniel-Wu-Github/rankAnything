// Zero-dep static server for site/dist (test tier).
// Applies dist/_headers the way Cloudflare Pages does, so the e2e gate
// actually exercises the production CSP — a CSP that blocked our own inline
// bootstrap would white-screen prod, and that must fail here, not there.
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { readFileSync, existsSync } from "node:fs";
import { extname, join, normalize } from "node:path";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "site", "dist");
const port = Number(process.env.PORT ?? 4300);

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".xml": "application/xml",
  ".txt": "text/plain",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webmanifest": "application/manifest+json",
};

// Parse the Pages _headers format: unindented path pattern, indented
// "Name: value" lines beneath it.
function loadHeaderRules() {
  const file = join(root, "_headers");
  if (!existsSync(file)) return [];
  const rules = [];
  let current = null;
  for (const line of readFileSync(file, "utf8").split("\n")) {
    if (!line.trim() || line.trim().startsWith("#")) continue;
    if (!/^\s/.test(line)) {
      current = { pattern: line.trim(), headers: [] };
      rules.push(current);
    } else if (current) {
      const idx = line.indexOf(":");
      if (idx > 0) current.headers.push([line.slice(0, idx).trim(), line.slice(idx + 1).trim()]);
    }
  }
  return rules;
}

const headerRules = loadHeaderRules();

function headersFor(pathname) {
  const out = {};
  for (const rule of headerRules) {
    const re = new RegExp("^" + rule.pattern.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*") + "$");
    if (re.test(pathname)) {
      for (const [name, value] of rule.headers) out[name] = value;
    }
  }
  return out;
}

createServer(async (request, response) => {
  try {
    const url = new URL(request.url ?? "/", "http://localhost");
    let path = normalize(url.pathname).replace(/^([.]{2}[/\\])+/, "");
    if (path.endsWith("/")) path += "index.html";
    let file;
    try {
      file = await readFile(join(root, path));
    } catch {
      file = await readFile(join(root, path, "index.html"));
      path += "/index.html";
    }
    response.writeHead(200, {
      "content-type": MIME[extname(path)] ?? "application/octet-stream",
      ...headersFor(url.pathname),
    });
    response.end(file);
  } catch {
    // Pages serves 404.html for unmatched paths.
    try {
      const notFound = await readFile(join(root, "404.html"));
      response.writeHead(404, { "content-type": MIME[".html"], ...headersFor("/404.html") });
      response.end(notFound);
    } catch {
      response.writeHead(404, { "content-type": "text/plain" });
      response.end("not found");
    }
  }
}).listen(port, "127.0.0.1", () => {
  console.log(`static site on http://127.0.0.1:${port}`);
});
