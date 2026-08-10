// Mobile gate for the generic engine (site/), mirroring bigboard-mobile.spec.ts
// for the frozen football board. Guards the class of bug this suite was added
// for: native HTML5 drag-and-drop is a mouse-events spec and never fires on
// touch, so the board looked drag-capable while being dead to a finger.
import { test, expect, type Page } from "@playwright/test";

const TEMPLATE = "/t/nba-goats/";
const WIDE_TEMPLATE = "/t/fantasy-football-2026/"; // most columns = worst case

// Every shipped template, so a new one can't silently reintroduce overflow.
const ALL_TEMPLATES = [
	"fantasy-football-2026", "nba-goats", "movies-2010s", "cereal",
	"albums-90s", "fast-food", "kpop-groups", "marvel-mcu", "nfl-qbs-alltime",
	"pokemon-gen1", "programming-languages", "sitcoms", "video-game-consoles",
];

// hasTouch without a device preset: the device presets pull in WebKit, which
// this suite doesn't install (see bigboard-mobile.spec.ts, same approach).
test.use({ hasTouch: true, viewport: { width: 375, height: 780 } });

async function ready(page: Page): Promise<void> {
	await page.waitForFunction(() => document.documentElement.dataset.appReady === "true");
}

async function rowNames(page: Page, limit = 4): Promise<string[]> {
	return page.$$eval("tr.item-row .item-name", (nodes, l) =>
		nodes.slice(0, l as number).map((n) => (n.textContent ?? "").trim()), limit);
}

/** Dispatches a real touch drag from `fromSelector` down to `toY`. */
async function touchDrag(page: Page, fromSelector: string, toY: number): Promise<void> {
	const box = await page.locator(fromSelector).boundingBox();
	if (!box) throw new Error(`no bounding box for ${fromSelector}`);
	await page.evaluate(async ({ sel, sx, sy, dy }) => {
		const el = document.querySelector(sel as string) as HTMLElement;
		const fire = (type: string, x: number, y: number) => {
			const t = new Touch({ identifier: 1, target: el, clientX: x, clientY: y });
			el.dispatchEvent(new TouchEvent(type, {
				bubbles: true, cancelable: true,
				touches: type === "touchend" ? [] : [t],
				targetTouches: type === "touchend" ? [] : [t],
				changedTouches: [t],
			}));
		};
		fire("touchstart", sx as number, sy as number);
		await new Promise((r) => setTimeout(r, 30));
		for (let i = 1; i <= 10; i++) {
			fire("touchmove", sx as number, (sy as number) + (((dy as number) - (sy as number)) * i) / 10);
			await new Promise((r) => setTimeout(r, 15));
		}
		fire("touchend", sx as number, dy as number);
	}, { sel: fromSelector, sx: box.x + box.width / 2, sy: box.y + box.height / 2, dy: toY });
	await page.waitForTimeout(200);
}

test.beforeEach(async ({ page }) => {
	await page.addInitScript(() => localStorage.clear());
});

test("touch drag on the handle reorders (native HTML5 DnD does not fire on touch)", async ({ page }) => {
	await page.goto(TEMPLATE);
	await ready(page);
	const before = await rowNames(page);

	const target = await page.locator("tr.item-row").nth(0).boundingBox();
	await touchDrag(page, "tr.item-row:nth-of-type(3) .drag-handle", target!.y + 4);

	const after = await rowNames(page);
	expect(after).not.toEqual(before);
	// The row that was 3rd is now 1st.
	expect(after[0]).toBe(before[2]);
});

test("touch drag on the row body does NOT reorder — a plain swipe must still scroll", async ({ page }) => {
	await page.goto(TEMPLATE);
	await ready(page);
	const before = await rowNames(page);

	const target = await page.locator("tr.item-row").nth(0).boundingBox();
	await touchDrag(page, "tr.item-row:nth-of-type(3) .col-name", target!.y + 4);

	expect(await rowNames(page)).toEqual(before);
});

test("no horizontal page scroll on any template at 320/375/414", async ({ page }) => {
	for (const width of [320, 375, 414]) {
		await page.setViewportSize({ width, height: 760 });
		for (const slug of ALL_TEMPLATES) {
			await page.goto(`/t/${slug}/`);
			await ready(page);
			const { scrollWidth, clientWidth } = await page.evaluate(() => ({
				scrollWidth: document.body.scrollWidth,
				clientWidth: document.documentElement.clientWidth,
			}));
			expect(scrollWidth, `${slug} overflows at ${width}px`).toBeLessThanOrEqual(clientWidth);
		}
	}
});

test("interactive controls meet the 44px touch-target minimum", async ({ page }) => {
	await page.setViewportSize({ width: 375, height: 780 });
	await page.goto(WIDE_TEMPLATE);
	await ready(page);

	const undersized = await page.$$eval(
		".toolbar button, .toolbar select, .toolbar input, tr.item-row button, .filter-chip",
		(els) => els.map((el) => {
			const r = el.getBoundingClientRect();
			return { sel: el.id || el.className, w: Math.round(r.width), h: Math.round(r.height) };
		}).filter((x) => x.w > 0 && (x.w < 44 || x.h < 44)),
	);
	expect(undersized).toEqual([]);
});

test("attribute cells collapse into labeled key/value rows on phone widths", async ({ page }) => {
	await page.goto(WIDE_TEMPLATE);
	await ready(page);
	// Header row is hidden in card mode; labels come from data-label instead.
	await expect(page.locator(".board-table thead")).toBeHidden();
	const labels = await page.$$eval("tr.item-row:first-of-type td[data-label]",
		(tds) => tds.map((td) => td.getAttribute("data-label")));
	expect(labels).toContain("Position");
	expect(labels).toContain("Team");
});
