// Pairwise gate: driving every duel with a truthful alphabetical oracle must
// produce an alphabetically sorted ranking (correctness independent of the
// seeded shuffle), and the result hands off to the board editor intact.
import { test, expect, type Page } from "@playwright/test";

async function ready(page: Page): Promise<void> {
	await page.waitForFunction(() => document.documentElement.dataset.appReady === "true");
}

test("truthful choices produce a correctly sorted ranking, then open in the editor", async ({ page }) => {
	await page.addInitScript(() => localStorage.clear());
	await page.goto("/sort/nba-goats/");
	await ready(page);

	// Answer every duel: alphabetically earlier name is "better".
	for (let i = 0; i < 400; i += 1) {
		const done = await page.locator(".pairwise-result-list").count();
		if (done) break;
		const a = (await page.textContent("#duel-a"))?.trim() ?? "";
		const b = (await page.textContent("#duel-b"))?.trim() ?? "";
		await page.click(a.localeCompare(b) <= 0 ? "#duel-a" : "#duel-b");
	}

	const result = await page.$$eval(".pairwise-result-list li", (nodes) =>
		nodes.map((node) => (node.textContent ?? "").trim()));
	expect(result).toHaveLength(25);
	const sorted = [...result].sort((x, y) => x.localeCompare(y));
	expect(result).toEqual(sorted);

	// Handoff: the ranking opens in the board editor in the same order.
	await page.click("#open-board-btn");
	await page.waitForURL(/\/b\/#/);
	await ready(page);
	const boardNames = await page.$$eval("tr.item-row .item-name", (nodes) =>
		nodes.map((node) => node.textContent ?? ""));
	expect(boardNames).toEqual(result);
});

test("undo steps back one duel; keyboard arrows choose", async ({ page }) => {
	await page.addInitScript(() => localStorage.clear());
	await page.goto("/sort/cereal/");
	await ready(page);

	await expect(page.locator("#undo-btn")).toBeDisabled();
	const firstA = await page.textContent("#duel-a");
	await page.keyboard.press("ArrowLeft");
	await expect(page.locator("#undo-btn")).toBeEnabled();

	await page.click("#undo-btn");
	await expect(page.locator("#undo-btn")).toBeDisabled();
	// Deterministic seeded shuffle: undo returns to the same first duel.
	expect(await page.textContent("#duel-a")).toBe(firstA);
});
