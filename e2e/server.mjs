// Zero-dep static server for site/dist (test tier).
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
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
};

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
    response.writeHead(200, { "content-type": MIME[extname(path)] ?? "application/octet-stream" });
    response.end(file);
  } catch {
    response.writeHead(404, { "content-type": "text/plain" });
    response.end("not found");
  }
}).listen(port, "127.0.0.1", () => {
  console.log(`static site on http://127.0.0.1:${port}`);
});
