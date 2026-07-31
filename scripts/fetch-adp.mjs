#!/usr/bin/env node
// Build-time ADP snapshot fetch — zero-dep, same philosophy as site/build.mjs.
//
// Source: Fantasy Football Calculator's public ADP API. Verified (2026-07):
// free for personal AND commercial use with attribution, no API key, JSON,
// aggregated from real mock/live drafts, updates continuously. It's the
// only free/no-auth/commercial-safe ADP source found — Sleeper has no ADP
// endpoint, ESPN/Yahoo/Underdog need a backend or login, FantasyPros'
// free tier is personal-use-only and their commercial tier is sales-gated,
// FantasyCalc is dynasty trade values not redraft ADP, and Fantasy Nerds'
// API requires a paid ($74.95/yr) plan for real (non-TEST-key) commercial
// use. See docs/FOOTBALL_V1_LAUNCH_GAPS.md item 4 for the full survey.
//
// This has NO CORS headers, so it can't be fetched from the deployed site's
// browser — it must run here, at build/deploy time, writing a static JSON
// file that ships as a normal same-origin asset.
//
// Run: node scripts/fetch-adp.mjs [format] [teams] [year]
//   format: ppr | half-ppr | standard | 2qb | dynasty-ppr | ... (FFC's format slugs)
//   teams:  8 | 10 | 12 | 14 | 16
//   year:   defaults to the current site's target season
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(repoRoot, "site/data");

const FORMAT = process.argv[2] || "ppr";
const TEAMS = process.argv[3] || "12";
const YEAR = process.argv[4] || "2026";

async function fetchAdp(format, teams, year) {
  const url = `https://fantasyfootballcalculator.com/api/v1/adp/${format}?teams=${teams}&year=${year}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Fantasy Football Calculator API returned ${response.status} for ${url}`);
  }
  const body = await response.json();
  if (body.status !== "Success") {
    throw new Error(`Unexpected API response: ${JSON.stringify(body).slice(0, 200)}`);
  }
  return body;
}

async function main() {
  console.log(`Fetching ${FORMAT} ADP, ${TEAMS}-team, ${YEAR}...`);
  const raw = await fetchAdp(FORMAT, TEAMS, YEAR);

  const snapshot = {
    source: "Fantasy Football Calculator (fantasyfootballcalculator.com)",
    format: raw.meta.type,
    teams: raw.meta.teams,
    year: YEAR,
    totalDrafts: raw.meta.total_drafts,
    draftDateRange: [raw.meta.start_date, raw.meta.end_date],
    generatedAt: new Date().toISOString(),
    players: raw.players
      .map((p) => ({
        name: p.name,
        position: p.position,
        team: p.team,
        adp: p.adp,
        adpFormatted: p.adp_formatted,
        timesDrafted: p.times_drafted,
        byeWeek: p.bye ?? null,
      }))
      .sort((a, b) => a.adp - b.adp),
  };

  mkdirSync(outDir, { recursive: true });
  const outPath = join(outDir, `adp-${FORMAT}-${YEAR}.json`);
  writeFileSync(outPath, JSON.stringify(snapshot, null, 2));
  console.log(`Wrote ${snapshot.players.length} players to ${outPath} (${snapshot.totalDrafts} drafts aggregated, ${snapshot.draftDateRange[0]} to ${snapshot.draftDateRange[1]}).`);
}

main();
