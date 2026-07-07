// Minimal, correct CSV: quoted-field aware parse + RFC-4180 stringify.
// Zero dependencies by design — the generic app must not need a CDN.

export function stringifyCsv(rows, headers) {
  const escapeCell = (value) => {
    let text = value === null || value === undefined ? "" : String(value);
    // Formula injection guard (matches the big board's escapeFormulae).
    if (/^[=+\-@]/.test(text)) text = `'${text}`;
    if (/[",\n\r]/.test(text)) text = `"${text.replace(/"/g, '""')}"`;
    return text;
  };
  const lines = [headers.map(escapeCell).join(",")];
  for (const row of rows) {
    lines.push(headers.map((header) => escapeCell(row[header])).join(","));
  }
  return lines.join("\r\n");
}

export function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') { cell += '"'; i += 1; }
        else inQuotes = false;
      } else cell += char;
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(cell); cell = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && text[i + 1] === "\n") i += 1;
      row.push(cell); cell = "";
      if (row.some((value) => value !== "")) rows.push(row);
      row = [];
    } else {
      cell += char;
    }
  }
  row.push(cell);
  if (row.some((value) => value !== "")) rows.push(row);
  if (rows.length === 0) return { headers: [], records: [] };

  const headers = rows[0].map((header) => header.trim().toLowerCase());
  const records = rows.slice(1).map((cells) => {
    const record = {};
    headers.forEach((header, index) => { record[header] = cells[index] ?? ""; });
    return record;
  });
  return { headers, records };
}
