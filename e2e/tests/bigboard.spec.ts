// P0 gate for the frozen football board (served at /football/): keyboard
// reorder, share-URL round-trip, undo depth, CSV export, image export.
// Note: this page loads SortableJS/PapaParse from CDN — the one non-hermetic
// dependency in the suite (documented in e2e/README.md).
import { test, expect, type Page } from "@playwright/test";

const BOARD = "/football/";

async function ready(page: Page): Promise<void> {
	await page.waitForFunction(() => document.documentElement.dataset.appReady === "true");
}

async function names(page: Page, count: number): Promise<string[]> {
	return page.$$eval("tr.player-row .name-cell", (nodes, limit) =>
		nodes.slice(0, limit as number).map((node) => (node.childNodes[0]?.textContent ?? "").trim()),
		count);
}

test.beforeEach(async ({ page }) => {
	// Clear only on the FIRST load of the tab: the autosave test reloads and
	// must find its saved board still in localStorage.
	await page.addInitScript(() => {
		if (!sessionStorage.getItem("__e2e_cleared")) {
			localStorage.clear();
			sessionStorage.setItem("__e2e_cleared", "1");
		}
	});
});

test("keyboard-only reorder with aria-live announcements and single undo entry", async ({ page }) => {
	await page.goto(BOARD);
	await ready(page);
	const before = await names(page, 5);

	await page.locator("tr.player-row").nth(1).focus();
	await page.keyboard.press("Space");
	await page.keyboard.press("ArrowUp");
	await page.keyboard.press("Space");

	const after = await names(page, 5);
	expect(after[0]).toBe(before[1]);
	expect(await page.textContent("#kb-live")).toContain("dropped at rank 1");

	// The whole lift-move-drop is ONE undo entry.
	await page.click("#undo-btn");
	expect(await names(page, 5)).toEqual(before);
	await expect(page.locator("#undo-btn")).toBeDisabled();
});

test("share URL round-trips the full board including stars and tiers", async ({ page, context }) => {
	await page.goto(BOARD);
	await ready(page);

	// Distinctive state: star row 0, tier break above row 2.
	await page.locator('tr.player-row').nth(0).locator('button[data-action="star"]').click();
	await page.locator('tr.player-row').nth(2).locator('button[data-action="add-tier"]').click({ force: true });
	const before = await names(page, 10);

	await context.grantPermissions(["clipboard-read", "clipboard-write"]);
	await page.click("#share-btn");
	const url = await page.evaluate(() => navigator.clipboard.readText());
	expect(url).toContain("#b=");

	const fresh = await context.newPage();
	await fresh.addInitScript(() => localStorage.clear());
	await fresh.goto(url);
	await fresh.waitForFunction(() => document.documentElement.dataset.appReady === "true");
	expect(await names(fresh, 10)).toEqual(before);
	await expect(fresh.locator('tr.player-row').nth(0).locator('button[data-action="star"]')).toHaveAttribute("aria-pressed", "true");
	await expect(fresh.locator("#banner")).toContainText("shared board");
	await fresh.close();
});

test("CSV and image exports download", async ({ page }) => {
	await page.goto(BOARD);
	await ready(page);

	let downloadPromise = page.waitForEvent("download");
	await page.click("#export-csv-btn");
	expect((await downloadPromise).suggestedFilename()).toBe("big-board-export.csv");

	downloadPromise = page.waitForEvent("download");
	await page.click("#image-btn");
	expect((await downloadPromise).suggestedFilename()).toBe("big-board.png");
});

test("autosave restores the board after reload", async ({ page }) => {
	await page.goto(BOARD);
	await ready(page);

	await page.locator("tr.player-row").nth(1).focus();
	await page.keyboard.press("Space");
	await page.keyboard.press("ArrowUp");
	await page.keyboard.press("Space");
	const after = await names(page, 3);

	// Force the autosave path directly (interval is 30s).
	await page.evaluate(() => {
		localStorage.setItem("bb_saved_players", JSON.stringify((window as never as { APP_STATE: { players: unknown } }).APP_STATE.players));
	});
	await page.reload();
	await ready(page);
	expect(await names(page, 3)).toEqual(after);
});
