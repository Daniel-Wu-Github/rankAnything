#!/usr/bin/env node
// Builds site/templates/fantasy-football-2026.json by merging two legitimate,
// build-time-fetchable sources into one schema-driven template:
//   - FantasyPros consensus rank (FantasyPros_2026_Draft_ALL_Rankings.csv,
//     already embedded as big-board.html's default data)
//   - Fantasy Football Calculator community ADP (site/data/adp-<format>-<year>.json,
//     produced by scripts/fetch-adp.mjs — run that first)
//
// This is the real, available version of "toggle between ranking sources":
// ESPN and Yahoo were ruled out because both sites' robots.txt explicitly
// disallow Anthropic's crawlers by name, and Sleeper has no rankings/ADP
// product at all — see the chat history / docs/FOOTBALL_V1_LAUNCH_GAPS.md
// item 4 for the full source survey.
//
// Output feeds site/'s generic schema-driven engine (NOT big-board.html,
// which is frozen and would treat this as a new feature, against its own
// rule). The board's "Sort by" control (added to site/src/js/app.js) lets a
// user flip between Consensus Rank and ADP order live.
//
// Run: node scripts/fetch-adp.mjs && node scripts/build-fantasy-football-template.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const YEAR = process.argv[2] || "2026";
const FORMAT = process.argv[3] || "ppr";

const TEAM_CODE_FROM_ADP = { JAX: "JAC" };
const POSITION_FROM_ADP = { PK: "K", DEF: "D/ST" };

const NAME_ALIASES = {
  "kenny gainwell": "kenneth gainwell",
  "eddy pineiro": "eddy piñeiro",
};

function stripDiacritics(value) {
  return value.normalize("NFKD").replace(/[̀-ͯ]/g, "");
}

function normalizeName(name) {
  const lower = stripDiacritics(name.toLowerCase()).replace(/[.']/g, "");
  const aliased = NAME_ALIASES[lower] || lower;
  return aliased.replace(/\b(jr|sr|ii|iii|iv|v)\b/g, "").replace(/[^a-z0-9]+/g, " ").trim();
}

function parseCsv(text) {
  const [headerLine, ...lines] = text.trim().split("\n");
  const headers = headerLine.split(",").map((h) => h.replace(/^"|"$/g, ""));
  return lines.map((line) => {
    const cells = [];
    let cur = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') inQuotes = !inQuotes;
      else if (ch === "," && !inQuotes) { cells.push(cur); cur = ""; }
      else cur += ch;
    }
    cells.push(cur);
    const row = {};
    headers.forEach((h, i) => { row[h] = cells[i]; });
    return row;
  });
}

function main() {
  const csvText = readFileSync(join(repoRoot, "FantasyPros_2026_Draft_ALL_Rankings.csv"), "utf8");
  const csvRows = parseCsv(csvText);

  const csvByName = new Map();
  const csvDstByTeam = new Map();
  for (const row of csvRows) {
    const position = row.POS.replace(/\d+$/, "");
    csvByName.set(normalizeName(row["PLAYER NAME"]), row);
    if (position === "D/ST") csvDstByTeam.set(row.TEAM, row);
  }

  const adpPath = join(repoRoot, "site/data", `adp-${FORMAT}-${YEAR}.json`);
  const adpSnapshot = JSON.parse(readFileSync(adpPath, "utf8"));

  let matched = 0;
  let sentinelRank = 900;
  const items = adpSnapshot.players.map((p) => {
    const team = TEAM_CODE_FROM_ADP[p.team] || p.team;
    const position = POSITION_FROM_ADP[p.position] || p.position;

    let csvRow = position === "D/ST" ? csvDstByTeam.get(team) : csvByName.get(normalizeName(p.name));
    let name = p.name;
    let consensusRank;
    if (csvRow) {
      matched++;
      name = csvRow["PLAYER NAME"];
      consensusRank = Number(csvRow.RK);
    } else {
      sentinelRank += 1;
      consensusRank = sentinelRank;
    }

    return { name, position, team, consensusRank, adp: p.adp };
  });

  items.sort((a, b) => a.consensusRank - b.consensusRank);

  const positions = ["QB", "RB", "WR", "TE", "K", "D/ST"];
  const teams = [...new Set(items.map((i) => i.team))].sort();

  const template = {
    slug: "fantasy-football-2026",
    title: "2026 Fantasy Football Rankings",
    description: "Toggle between expert consensus and live community draft data, then drag to make it yours.",
    schema: [
      { key: "position", label: "Position", type: "enum", filter: true, values: positions },
      { key: "team", label: "Team", type: "enum", filter: false, values: teams },
      { key: "consensusRank", label: "Consensus Rank", type: "number", filter: false },
      { key: "adp", label: "ADP", type: "number", filter: false },
    ],
    defaultView: "board",
    items,
  };

  const outPath = join(repoRoot, "site/templates/fantasy-football-2026.json");
  writeFileSync(outPath, JSON.stringify(template, null, 1));
  console.log(`Wrote ${items.length} players to ${outPath} (${matched} matched to FantasyPros consensus, ${items.length - matched} unranked there — sentinel-ordered to the bottom of Consensus Rank).`);
}

main();
