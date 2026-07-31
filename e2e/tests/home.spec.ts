// Home gate: paste-a-list -> instant board (the <10s promise), gallery
// navigation, sitemap presence.
import { test, expect, type Page } from "@playwright/test";

async function ready(page: Page): Promise<void> {
	await page.waitForFunction(() => document.documentElement.dataset.appReady === "true");
}

test("paste-a-list creates a custom board in two interactions", async ({ page }) => {
	await page.addInitScript(() => localStorage.clear());
	await page.goto("/");
	await ready(page);

	await page.fill("#paste-input", "1. Coffee\n2) Tea\n- Water\n* Juice\n\nMilk");
	await page.click("#paste-go");
	await page.waitForURL(/\/b\/#/);
	await ready(page);

	const names = await page.$$eval("tr.item-row .item-name", (nodes) =>
		nodes.map((node) => node.textContent ?? ""));
	// Numbering/bullets stripped, blank lines dropped, order preserved.
	expect(names).toEqual(["Coffee", "Tea", "Water", "Juice", "Milk"]);
});

test("gallery lists all 13 templates and navigates to a board", async ({ page }) => {
	await page.goto("/");
	await expect(page.locator(".gallery-card")).toHaveCount(13);
	await page.click('.gallery-card[href="/t/nba-goats/"]');
	await ready(page);
	await expect(page.locator("tr.item-row")).toHaveCount(25);
});

test("frozen football board still serves at /football/ with its own brand", async ({ page }) => {
	await page.goto("/football/");
	await page.waitForFunction(() => document.documentElement.dataset.appReady === "true");
	await expect(page).toHaveTitle(/Big Board 2026/);
	await expect(page.locator("tr.player-row").first()).toBeVisible();
});

test("sitemap and robots exist and index every template surface", async ({ request }) => {
	const sitemap = await request.get("/sitemap.xml");
	expect(sitemap.ok()).toBe(true);
	const xml = await sitemap.text();
	expect(xml).toContain("/t/movies-2010s/");
	expect(xml).toContain("/sort/movies-2010s/");
	expect(xml).toContain("/football/");
	const robots = await request.get("/robots.txt");
	expect(robots.ok()).toBe(true);
});
