#!/usr/bin/env node
// One-off/rerunnable data refresh for big-board.html's DEFAULT_PLAYERS.
//
// big-board.html is a frozen, buildless single file — this script does NOT
// run at request time or as part of any build. It's dev tooling: run it by
// hand whenever team/age data needs a refresh (e.g. before a season, after
// a wave of free-agency signings), and it rewrites DEFAULT_PLAYERS in place
// with the same compact literal format already in the file.
//
// Sources:
//   - Sleeper's public player dump (api.sleeper.app/v1/players/nfl) for
//     current team + age. Confirmed CORS-open and free; has no ADP, but
//     does have per-player team/age, which is what's missing here.
//   - A hand-maintained BYE_WEEKS_2026 table (derived from the NFL's own
//     2026 schedule release) — bye week is a deterministic function of
//     team, not something to fetch per player.
//
// Run: node scripts/refresh-bigboard-data.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const boardPath = join(repoRoot, "big-board.html");

// 2026 NFL bye weeks, by team code (matching the abbreviations already used
// in DEFAULT_PLAYERS/FantasyPros_2026_Draft_ALL_Rankings.csv, e.g. "JAC" not
// "JAX", "WAS" not "WSH"). Source: nfl.com's 2026 schedule release.
const BYE_WEEKS_2026 = {
  CAR: 5, KC: 5,
  CIN: 6, DET: 6, MIA: 6, MIN: 6,
  BUF: 7, JAC: 7, LAC: 7, WAS: 7,
  HOU: 8, NO: 8, NYG: 8, SF: 8,
  PIT: 9, TEN: 9,
  CHI: 10, DEN: 10, PHI: 10, TB: 10,
  ATL: 11, CLE: 11, GB: 11, LAR: 11, NE: 11, SEA: 11,
  BAL: 13, IND: 13, LV: 13, NYJ: 13,
  ARI: 14, DAL: 14,
  FA: null,
};

// Sleeper's full_name doesn't always carry the suffix FantasyPros uses, and
// a handful of players are indexed under a different first name entirely
// (common nickname vs. legal/draft name). Verified by hand against the
// live Sleeper dump — add to this list if a future refresh reports new
// unmatched names that are actually just a naming mismatch.
const NAME_ALIASES = {
  "hollywood brown": "marquise brown",
  "bam knight": "zonovan knight",
  "kenneth gainwell": "kenny gainwell",
  "nick singleton": "nicholas singleton",
};

// Sleeper uses different team codes than this codebase's convention (which
// matches FantasyPros_2026_Draft_ALL_Rankings.csv and the D/ST entries
// already embedded in DEFAULT_PLAYERS). Map Sleeper's code to ours before
// ever writing it back, or team + bye-week lookups silently diverge.
const TEAM_CODE_FROM_SLEEPER = {
  JAX: "JAC",
};

function normalizeTeamCode(code) {
  return TEAM_CODE_FROM_SLEEPER[code] || code;
}

function normalizeName(name) {
  const lower = name.toLowerCase().replace(/[.']/g, "");
  const aliased = NAME_ALIASES[lower] || lower;
  return aliased
    .replace(/\b(jr|sr|ii|iii|iv|v)\b/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

async function fetchSleeperPlayers() {
  const response = await fetch("https://api.sleeper.app/v1/players/nfl");
  if (!response.ok) {
    throw new Error(`Sleeper API returned ${response.status}`);
  }
  return response.json();
}

function buildSleeperLookup(sleeperPlayers) {
  const lookup = new Map();
  for (const player of Object.values(sleeperPlayers)) {
    if (!player.full_name) continue;
    const key = normalizeName(player.full_name);
    if (!lookup.has(key)) lookup.set(key, []);
    lookup.get(key).push(player);
  }
  return lookup;
}

function pickCandidate(candidates, position) {
  const posMatch = candidates.find((c) => c.position === position);
  return posMatch || candidates.find((c) => c.team) || candidates[0];
}

function extractDefaultPlayers(html) {
  const start = html.indexOf("const DEFAULT_PLAYERS = [");
  if (start === -1) throw new Error("DEFAULT_PLAYERS not found in big-board.html");
  const arrayStart = html.indexOf("[", start);
  let depth = 0;
  let end = -1;
  for (let i = arrayStart; i < html.length; i++) {
    if (html[i] === "[") depth++;
    else if (html[i] === "]") {
      depth--;
      if (depth === 0) { end = i; break; }
    }
  }
  if (end === -1) throw new Error("Could not find matching close bracket for DEFAULT_PLAYERS");
  const arrayText = html.slice(arrayStart, end + 1);
  const players = new Function(`return ${arrayText};`)();
  return { players, rangeStart: arrayStart, rangeEnd: end + 1 };
}

function serializePlayers(players) {
  const lines = [];
  for (let i = 0; i < players.length; i += 10) {
    const chunk = players.slice(i, i + 10);
    lines.push(chunk.map((p) => `{id:${JSON.stringify(p.id)},rank:${p.rank},name:${JSON.stringify(p.name)},team:${JSON.stringify(p.team)},position:${JSON.stringify(p.position)},age:${p.age},byeWeek:${p.byeWeek},starred:${p.starred},note:${JSON.stringify(p.note)},tiersAbove:${p.tiersAbove}}`).join(","));
  }
  return `[\n        ${lines.join(",\n        ")},\n      ]`;
}

async function main() {
  const html = readFileSync(boardPath, "utf8");
  const { players, rangeStart, rangeEnd } = extractDefaultPlayers(html);

  console.log(`Loaded ${players.length} players from DEFAULT_PLAYERS.`);
  console.log("Fetching Sleeper player data...");
  const sleeperPlayers = await fetchSleeperPlayers();
  const lookup = buildSleeperLookup(sleeperPlayers);

  let ageUpdated = 0;
  let teamUpdated = 0;
  const unmatched = [];

  for (const player of players) {
    if (player.position === "D/ST") {
      player.byeWeek = BYE_WEEKS_2026[player.team] ?? 0;
      continue;
    }

    const key = normalizeName(player.name);
    const candidates = lookup.get(key);
    if (!candidates || candidates.length === 0) {
      unmatched.push(`${player.name} (${player.position}, ${player.team})`);
      player.byeWeek = BYE_WEEKS_2026[player.team] ?? 0;
      continue;
    }

    const match = pickCandidate(candidates, player.position);
    if (typeof match.age === "number" && match.age !== player.age) {
      player.age = match.age;
      ageUpdated++;
    }
    const matchTeam = match.team ? normalizeTeamCode(match.team) : null;
    if (matchTeam && matchTeam !== player.team) {
      player.team = matchTeam;
      teamUpdated++;
    }
    player.byeWeek = BYE_WEEKS_2026[player.team] ?? 0;
  }

  const newArrayText = serializePlayers(players);
  const newHtml = html.slice(0, rangeStart) + newArrayText + html.slice(rangeEnd);
  writeFileSync(boardPath, newHtml);

  console.log(`Age updated: ${ageUpdated}. Team updated (trades/signings): ${teamUpdated}.`);
  console.log(`Unmatched (${unmatched.length}) — left with byeWeek derived from existing team, age untouched:`);
  for (const name of unmatched) console.log(`  - ${name}`);
}

main();
