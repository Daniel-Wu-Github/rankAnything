// Share codec v2: the whole board rides the URL fragment. Schema-aware —
// custom boards carry their schema inline so any link is self-contained.
// gzip via CompressionStream (#b=), raw base64url fallback (#r=).

const SHARE_VERSION = 2;

function bytesToBase64Url(bytes) {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlToBytes(encoded) {
  const base64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export function packBoard(state) {
  const keys = state.template.schema.map((field) => field.key);
  return {
    v: SHARE_VERSION,
    t: state.template.slug,
    title: state.template.title,
    schema: state.template.schema,
    items: state.items.map((item) => [
      item.name,
      ...keys.map((key) => item.attrs[key]),
      item.starred ? 1 : 0,
      item.note,
      item.tiersAbove ? 1 : 0,
    ]),
    tierLabels: state.tierLabels,
  };
}

export function unpackBoard(payload) {
  if (!payload || payload.v !== SHARE_VERSION || !Array.isArray(payload.items)) return null;
  const schema = Array.isArray(payload.schema) ? payload.schema : [];
  const keys = schema.map((field) => field.key);
  const items = payload.items.map((row, index) => {
    const attrs = {};
    keys.forEach((key, keyIndex) => { attrs[key] = row[1 + keyIndex]; });
    const tail = 1 + keys.length;
    return {
      id: `s${index + 1}`,
      rank: index + 1,
      name: String(row[0] ?? ""),
      attrs,
      starred: row[tail] === 1,
      note: String(row[tail + 1] ?? ""),
      tiersAbove: row[tail + 2] === 1,
    };
  }).filter((item) => item.name.length > 0);
  if (!items.length) return null;
  return {
    template: {
      slug: payload.t || "custom",
      title: String(payload.title || "Shared Board"),
      description: "",
      schema,
      items: [],
    },
    items,
    tierLabels: payload.tierLabels && typeof payload.tierLabels === "object" ? payload.tierLabels : {},
  };
}

export async function encodeToHash(state) {
  const raw = new TextEncoder().encode(JSON.stringify(packBoard(state)));
  if (typeof CompressionStream === "function") {
    const stream = new Blob([raw]).stream().pipeThrough(new CompressionStream("gzip"));
    const compressed = new Uint8Array(await new Response(stream).arrayBuffer());
    return `#b=${bytesToBase64Url(compressed)}`;
  }
  return `#r=${bytesToBase64Url(raw)}`;
}

export async function decodeFromHash(hash) {
  try {
    if (hash.startsWith("#b=") && typeof DecompressionStream === "function") {
      const bytes = base64UrlToBytes(hash.slice(3));
      const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip"));
      return unpackBoard(JSON.parse(await new Response(stream).text()));
    }
    if (hash.startsWith("#r=")) {
      return unpackBoard(JSON.parse(new TextDecoder().decode(base64UrlToBytes(hash.slice(3)))));
    }
  } catch (e) { /* malformed hash -> null */ }
  return null;
}
