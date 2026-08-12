// Accessibility gate: 0 critical/serious axe violations on every shipped
// generic surface. (The frozen /football/ page is exempt by design — it
// predates the gate and is feature-frozen; its keyboard path is covered
// functionally in bigboard.spec.ts.)
import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

async function ready(page: Page): Promise<void> {
	await page.waitForFunction(() => document.documentElement.dataset.appReady === "true");
}

async function gate(page: Page): Promise<void> {
	const results = await new AxeBuilder({ page }).analyze();
	const blocking = results.violations.filter(
		(violation) => violation.impact === "critical" || violation.impact === "serious",
	);
	expect(
		blocking.map((violation) => ({
			id: violation.id,
			impact: violation.impact,
			targets: violation.nodes.map((node) => node.target.join(" ")),
		})),
	).toEqual([]);
}

test("home has no critical/serious violations", async ({ page }) => {
	await page.goto("/");
	await ready(page);
	await gate(page);
});

test("template board has no critical/serious violations", async ({ page }) => {
	await page.addInitScript(() => localStorage.clear());
	await page.goto("/t/movies-2010s/");
	await ready(page);
	await gate(page);
});

test("tier view has no critical/serious violations", async ({ page }) => {
	await page.addInitScript(() => localStorage.clear());
	await page.goto("/t/movies-2010s/");
	await ready(page);
	await page.click("#view-tiers-btn");
	await gate(page);
});

test("pairwise page has no critical/serious violations", async ({ page }) => {
	await page.goto("/sort/nba-goats/");
	await ready(page);
	await gate(page);
});

// The board collapses row->card at phone widths (display:table-* becomes
// flex), which drops implicit table semantics — so mobile needs its own axe
// pass, not just the desktop one above.
for (const width of [320, 375]) {
	test(`board at ${width}px has no critical/serious violations`, async ({ page }) => {
		await page.addInitScript(() => localStorage.clear());
		await page.setViewportSize({ width, height: 780 });
		await page.goto("/t/movies-2010s/");
		await ready(page);
		await gate(page);
	});
}
