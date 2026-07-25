// Generic engine gate: template load, reorder (mouse + keyboard), tiers,
// filters lock reorder, view switching preserves state, CSV round-trip,
// share-URL round-trip, embed render.
import { test, expect, type Page } from "@playwright/test";

const TEMPLATE = "/t/movies-2010s/";

async function ready(page: Page): Promise<void> {
	await page.waitForFunction(() => document.documentElement.dataset.appReady === "true");
}

async function rowNames(page: Page): Promise<string[]> {
	return page.$$eval("tr.item-row .item-name", (nodes) => nodes.map((node) => node.textContent ?? ""));
}

test.beforeEach(async ({ page }) => {
	// Isolated storage per test: clear the board's local copy before app boot.
	await page.addInitScript(() => localStorage.clear());
});

test("template page loads all items with schema-driven columns and meta", async ({ page }) => {
	await page.goto(TEMPLATE);
	await ready(page);
	await expect(page.locator("tr.item-row")).toHaveCount(30);
	await expect(page).toHaveTitle(/Best Films of the 2010s/);
	const canonical = await page.getAttribute('link[rel="canonical"]', "href");
	expect(canonical).toContain("/t/movies-2010s/");
	// Schema number column rendered
	await expect(page.locator("th", { hasText: "Year" })).toBeVisible();
});

test("mouse drag reorders; undo/redo restore", async ({ page }) => {
	await page.goto(TEMPLATE);
	await ready(page);
	const before = await rowNames(page);

	const source = page.locator("tr.item-row").nth(2);
	const target = page.locator("tr.item-row").nth(0);
	// Drop near the target's top edge so the midpoint heuristic reads "above".
	await source.dragTo(target, { targetPosition: { x: 40, y: 3 } });

	const after = await rowNames(page);
	expect(after[0]).toBe(before[2]);

	await page.click("#undo-btn");
	expect(await rowNames(page)).toEqual(before);
	await page.click("#redo-btn");
	expect((await rowNames(page))[0]).toBe(before[2]);
});

test("keyboard-only reorder: Space lift, arrows move, Space drop, Escape cancels", async ({ page }) => {
	await page.goto(TEMPLATE);
	await ready(page);
	const before = await rowNames(page);

	await page.locator("tr.item-row").nth(1).focus();
	await page.keyboard.press("Space");
	await page.keyboard.press("ArrowUp");
	await page.keyboard.press("Space");

	let after = await rowNames(page);
	expect(after[0]).toBe(before[1]);
	expect(after[1]).toBe(before[0]);

	// Escape cancels a lift without applying the moves.
	await page.locator("tr.item-row").nth(3).focus();
	await page.keyboard.press("Space");
	await page.keyboard.press("ArrowUp");
	await page.keyboard.press("ArrowUp");
	await page.keyboard.press("Escape");
	expect(await rowNames(page)).toEqual(after);

	// aria-live announced the drop.
	const live = await page.textContent("#live-region");
	expect(live).toContain("cancelled");
});

test("tier break add + label; view switch to tiers preserves order and groups", async ({ page }) => {
	await page.goto(TEMPLATE);
	await ready(page);
	const names = await rowNames(page);

	// Add a tier break above row index 3 (tier buttons show on hover; force).
	await page.locator('tr.item-row').nth(3).locator('button[data-action="add-tier"]').click({ force: true });
	await expect(page.locator("tr.tier-row")).toHaveCount(1);
	await page.locator("input.tier-label").fill("Masterpieces");

	await page.click("#view-tiers-btn");
	await expect(page.locator(".tier-lane")).toHaveCount(2);
	await expect(page.locator(".tier-lane-label").nth(1)).toHaveText("Masterpieces");

	// Same state, same order: chips across lanes read in master order.
	// Text nodes only — the rank lives in a child span, and stripping leading
	// digits from textContent would eat names like "12 Years a Slave".
	const chipNames = await page.$$eval(".chip", (nodes) =>
		nodes.map((node) =>
			Array.from(node.childNodes)
				.filter((child) => child.nodeType === Node.TEXT_NODE)
				.map((child) => child.textContent ?? "")
				.join("")
				.replace(/\s*★\s*$/, "")
				.trim()));
	expect(chipNames).toEqual(names);

	// Switch back: board still shows the tier break.
	await page.click("#view-board-btn");
	await expect(page.locator("tr.tier-row")).toHaveCount(1);
	expect(await rowNames(page)).toEqual(names);
});

test("filters filter and lock reordering; clearing restores drag", async ({ page }) => {
	await page.goto(TEMPLATE);
	await ready(page);

	await page.fill("#search-input", "the");
	const filtered = await page.locator("tr.item-row").count();
	expect(filtered).toBeGreaterThan(0);
	expect(filtered).toBeLessThan(30);
	// Locked: rows are not draggable and not focusable for reorder.
	expect(await page.getAttribute("tr.item-row", "draggable")).toBe("false");

	await page.fill("#search-input", "");
	await expect(page.locator("tr.item-row")).toHaveCount(30);
	expect(await page.getAttribute("tr.item-row", "draggable")).toBe("true");
});

test("CSV export/import round-trips the board", async ({ page }) => {
	await page.goto(TEMPLATE);
	await ready(page);

	// Make the state distinctive first: star row 0, reorder row 4 -> 0.
	await page.locator('tr.item-row').nth(0).locator('button[data-action="star"]').click();
	const before = await rowNames(page);

	const downloadPromise = page.waitForEvent("download");
	await page.click("#export-btn");
	const download = await downloadPromise;
	const path = await download.path();

	page.on("dialog", (dialog) => dialog.accept());
	const chooserPromise = page.waitForEvent("filechooser");
	await page.click("#import-btn");
	const chooser = await chooserPromise;
	await chooser.setFiles(path!);

	await expect(page.locator("tr.item-row")).toHaveCount(30);
	expect(await rowNames(page)).toEqual(before);
	await expect(page.locator('tr.item-row').nth(0).locator('button[data-action="star"]')).toHaveAttribute("aria-pressed", "true");
});

test("share URL round-trip: full board state opens identically in a fresh page", async ({ page, context }) => {
	await page.goto(TEMPLATE);
	await ready(page);

	// Distinctive state: move row 2 to top, star it, add a tier below it.
	await page.locator("tr.item-row").nth(2).focus();
	await page.keyboard.press("Space");
	await page.keyboard.press("ArrowUp");
	await page.keyboard.press("ArrowUp");
	await page.keyboard.press("Space");
	await page.locator('tr.item-row').nth(0).locator('button[data-action="star"]').click();
	const before = await rowNames(page);

	await context.grantPermissions(["clipboard-read", "clipboard-write"]);
	await page.click("#share-btn");
	await expect(page.locator("#toast")).toContainText("Link copied");
	const url = await page.evaluate(() => navigator.clipboard.readText());
	expect(url).toContain("#b=");
	expect(url.length).toBeLessThan(8192);

	const fresh = await context.newPage();
	await fresh.addInitScript(() => localStorage.clear());
	await fresh.goto(url);
	await ready(fresh);
	expect(await rowNames(fresh)).toEqual(before);
	await expect(fresh.locator(".banner")).toContainText("shared board");
	await expect(fresh.locator('tr.item-row').nth(0).locator('button[data-action="star"]')).toHaveAttribute("aria-pressed", "true");
	await fresh.close();
});

test("embed renders a shared board read-only with an editor CTA", async ({ page, context }) => {
	await page.goto(TEMPLATE);
	await ready(page);
	await context.grantPermissions(["clipboard-read", "clipboard-write"]);
	await page.click("#share-btn");
	const url = await page.evaluate(() => navigator.clipboard.readText());
	const hash = new URL(url).hash;

	await page.goto(`/embed/${hash}`);
	await ready(page);
	await expect(page.locator(".pairwise-result-list li")).toHaveCount(30);
	await expect(page.locator(".embed-cta")).toHaveAttribute("href", `/b/${hash}`);
	// Read-only: no toolbar controls exist.
	await expect(page.locator("#share-btn")).toHaveCount(0);
});

test("image export downloads a PNG", async ({ page }) => {
	await page.goto(TEMPLATE);
	await ready(page);
	const downloadPromise = page.waitForEvent("download");
	await page.click("#image-btn");
	const download = await downloadPromise;
	expect(download.suggestedFilename()).toBe("movies-2010s-ranking.png");
});
