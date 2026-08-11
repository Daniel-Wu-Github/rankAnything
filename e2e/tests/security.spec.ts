// Security-header gate. server.mjs applies site/dist/_headers the way
// Cloudflare Pages does, so these run against the real production policy.
// The point of the first test is blunt: a CSP that blocks our own inline
// bootstrap would white-screen production, so it has to fail here instead.
import { test, expect, type Page } from "@playwright/test";

async function ready(page: Page): Promise<void> {
	await page.waitForFunction(() => document.documentElement.dataset.appReady === "true");
}

const SURFACES = ["/", "/t/nba-goats/", "/sort/nba-goats/", "/football/", "/b/"];

for (const path of SURFACES) {
	test(`${path} boots with the production CSP applied and logs no CSP violations`, async ({ page }) => {
		const violations: string[] = [];
		page.on("console", (msg) => {
			const text = msg.text();
			if (/content security policy|refused to (load|execute|apply)/i.test(text)) violations.push(text);
		});
		await page.goto(path);
		await ready(page);
		expect(violations, `CSP blocked something on ${path}`).toEqual([]);
	});
}

test("baseline security headers are present on a content page", async ({ request }) => {
	const response = await request.get("/t/nba-goats/");
	const headers = response.headers();
	expect(headers["x-content-type-options"]).toBe("nosniff");
	expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
	expect(headers["strict-transport-security"]).toContain("max-age=");
	expect(headers["content-security-policy"]).toContain("object-src 'none'");
	// Framing denied everywhere except the embed widget.
	expect(headers["x-frame-options"]).toBe("DENY");
	expect(headers["content-security-policy"]).toContain("frame-ancestors 'none'");
});

test("the embed widget stays iframe-able — it exists to be embedded", async ({ request }) => {
	const response = await request.get("/embed/");
	const headers = response.headers();
	// No X-Frame-Options, and frame-ancestors must not be 'none'.
	expect(headers["x-frame-options"]).toBeUndefined();
	expect(headers["content-security-policy"]).toContain("frame-ancestors *");
	// Still hardened in every other respect.
	expect(headers["x-content-type-options"]).toBe("nosniff");
});

test("unknown paths serve the 404 page", async ({ page }) => {
	const response = await page.goto("/this-does-not-exist/");
	expect(response?.status()).toBe(404);
	await expect(page.locator("h1")).toContainText("Page not found");
});

test("ad slots are inert by default and only render under ?ads=preview", async ({ page }) => {
	await page.goto("/t/nba-goats/");
	await ready(page);
	// Markup exists (so real ads can drop in later) but must be invisible to
	// every normal visitor — the preview flag must not leak.
	await expect(page.locator(".ad-slot").first()).toBeHidden();
	expect(await page.evaluate(() => document.documentElement.dataset.ads)).toBeUndefined();

	await page.goto("/t/nba-goats/?ads=preview");
	await ready(page);
	await expect(page.locator(".ad-slot").first()).toBeVisible();
});

test("favicon and manifest resolve (no console 404 noise)", async ({ request }) => {
	expect((await request.get("/favicon.svg")).status()).toBe(200);
	const manifest = await request.get("/site.webmanifest");
	expect(manifest.status()).toBe(200);
	expect((await manifest.json()).name).toBe("Rank Anything");
});
