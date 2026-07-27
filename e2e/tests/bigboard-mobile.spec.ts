// Mobile-UX gate for the frozen football board (served at /football/).
// Covers the launch-gap #1 mobile pass: no horizontal page scroll, a dense
// single-line row (not a tall labeled card) so ~10 players are visible
// without scrolling, a collapsible filters drawer so the toolbar stays to
// roughly a third of the screen, touch reorder gated behind the drag handle
// (a plain body swipe scrolls instead of reordering), the "more actions"
// modal for secondary fields (team/age/bye/draft/note/tier/delete), and
// 44px touch targets throughout. See docs/MOBILE_UX_PLAN.md.
import { test, expect, type Page } from "@playwright/test";

const BOARD = "/football/";

test.use({ hasTouch: true });

async function ready(page: Page): Promise<void> {
	await page.waitForFunction(() => document.documentElement.dataset.appReady === "true");
}

async function names(page: Page, count: number): Promise<string[]> {
	return page.$$eval("tr.player-row .name-cell", (nodes, limit) =>
		nodes.slice(0, limit as number).map((node) => (node.childNodes[0]?.textContent ?? "").trim()),
		count);
}

// Dispatch a synthetic vertical touch drag. `startOnSelector` is the element
// the finger first lands on (touchstart target); intermediate moves hit-test
// via elementFromPoint like a real finger.
async function touchDrag(page: Page, startOnSelector: string, toRowIndex: number): Promise<void> {
	await page.evaluate(({ startOnSelector, toRowIndex }) => {
		const from = document.querySelector(startOnSelector)!;
		const rows = [...document.querySelectorAll("tr.player-row")];
		const fb = from.getBoundingClientRect();
		const tb = rows[toRowIndex].getBoundingClientRect();
		const x = fb.left + fb.width / 2;
		const startY = fb.top + fb.height / 2;
		const endY = tb.top + tb.height / 2 + 6;
		const mk = (target: Element, type: string, y: number) => {
			const t = new Touch({ identifier: 1, target, clientX: x, clientY: y, pageX: x, pageY: y });
			target.dispatchEvent(new TouchEvent(type, { cancelable: true, bubbles: true,
				touches: type === "touchend" ? [] : [t], targetTouches: type === "touchend" ? [] : [t], changedTouches: [t] }));
		};
		mk(from, "touchstart", startY);
		for (let i = 1; i <= 6; i++) {
			const y = startY + ((endY - startY) * i) / 6;
			mk(document.elementFromPoint(x, y) || from, "touchmove", y);
		}
		mk(document.elementFromPoint(x, endY) || from, "touchend", endY);
	}, { startOnSelector, toRowIndex });
	await page.waitForTimeout(80);
}

for (const width of [320, 375, 414]) {
	test(`no horizontal page scroll at ${width}px`, async ({ page }) => {
		await page.setViewportSize({ width, height: 812 });
		await page.goto(BOARD);
		await ready(page);
		const m = await page.evaluate(() => ({ body: document.body.scrollWidth, win: window.innerWidth }));
		expect(m.body, `body should not be wider than the viewport at ${width}px`).toBe(m.win);
	});
}

test("dense row layout: ~10 players visible, toolbar ~30-40% of viewport, no x-scroll", async ({ page }) => {
	await page.setViewportSize({ width: 375, height: 812 });
	await page.goto(BOARD);
	await ready(page);

	await expect(page.locator("table thead")).toBeHidden();

	const m = await page.evaluate(() => {
		const toolbar = document.querySelector(".toolbar")!.getBoundingClientRect();
		const rows = [...document.querySelectorAll("tr.player-row")];
		const viewportH = window.innerHeight;
		const fullyVisible = rows.filter((r) => {
			const b = r.getBoundingClientRect();
			return b.top >= 0 && b.bottom <= viewportH;
		}).length;
		const first = rows[0].getBoundingClientRect();
		return {
			toolbarPct: (toolbar.height / viewportH) * 100,
			fullyVisibleRows: fullyVisible,
			rowHeight: first.height,
			rowRight: first.right,
		};
	});

	// The old multi-line labeled card ran 80-140px tall and showed ~1.5
	// players per screen; the dense single-line row is a binary regression
	// guard against reverting to that.
	expect(m.rowHeight, "row should be a single dense line, not a tall card").toBeLessThan(60);
	expect(m.toolbarPct, "toolbar should be roughly 30-40% of the viewport").toBeLessThanOrEqual(42);
	expect(m.fullyVisibleRows, "~10 players should be visible without scrolling").toBeGreaterThanOrEqual(8);
	expect(m.rowRight, "row must not overflow the viewport").toBeLessThanOrEqual(375);
});

test("row shows more-info (left) and drag handle (right), not two identical icons", async ({ page }) => {
	await page.setViewportSize({ width: 375, height: 812 });
	await page.goto(BOARD);
	await ready(page);

	const row = page.locator("tr.player-row").first();
	const moreBox = await row.locator(".more-btn").boundingBox();
	const handleBox = await row.locator(".drag-handle").boundingBox();
	expect(moreBox!.x, "more-info button should be left of the drag handle").toBeLessThan(handleBox!.x);

	// Distinct glyphs: the handle's own text is hidden in favor of a
	// hamburger icon (::after) so it doesn't read as a second "more" button.
	const handleFontSize = await row.locator(".drag-handle").evaluate((el) => getComputedStyle(el).fontSize);
	expect(handleFontSize).toBe("0px");
});

test("filters drawer: collapsed by default on mobile, expands on tap; desktop stays always-open", async ({ page }) => {
	await page.setViewportSize({ width: 375, height: 812 });
	await page.goto(BOARD);
	await ready(page);

	expect(await page.locator("#filters-drawer").evaluate((el: any) => el.open)).toBe(false);
	await expect(page.locator("#position-filters")).toBeHidden();

	await page.locator("#filters-drawer > summary").click();
	expect(await page.locator("#filters-drawer").evaluate((el: any) => el.open)).toBe(true);
	await expect(page.locator("#position-filters")).toBeVisible();
	await expect(page.locator("#age-min")).toBeVisible();
});

test("filters drawer badge shows the active filter-group count", async ({ page }) => {
	await page.setViewportSize({ width: 375, height: 812 });
	await page.goto(BOARD);
	await ready(page);

	await expect(page.locator("#filters-count")).toBeHidden();
	await page.locator("#filters-drawer > summary").click();
	await page.locator("#age-min").fill("25");
	await page.locator("#age-min").dispatchEvent("change");
	await expect(page.locator("#filters-count")).toBeVisible();
	await expect(page.locator("#filters-count")).toHaveText("1");
});

test("age/bye min and max labels are vertically aligned on mobile", async ({ page }) => {
	await page.setViewportSize({ width: 375, height: 812 });
	await page.goto(BOARD);
	await ready(page);
	await page.locator("#filters-drawer > summary").click();

	for (const [minId, maxId] of [["age-min", "age-max"], ["bye-min", "bye-max"]]) {
		const minTop = await page.locator(`#${minId}`).evaluate((el) => el.getBoundingClientRect().top);
		const maxTop = await page.locator(`#${maxId}`).evaluate((el) => el.getBoundingClientRect().top);
		expect(Math.abs(minTop - maxTop), `${minId}/${maxId} should sit on the same row`).toBeLessThan(1);
	}
});

test("desktop: filters toggle is hidden and the filter row is always visible", async ({ page }) => {
	await page.setViewportSize({ width: 1440, height: 900 });
	await page.goto(BOARD);
	await ready(page);

	const summaryDisplay = await page.locator("#filters-drawer > summary").evaluate((el) => getComputedStyle(el).display);
	expect(summaryDisplay).toBe("none");
	await expect(page.locator("#position-filters")).toBeVisible();
	await expect(page.locator("#age-min")).toBeVisible();

	// The desktop table body/row structure is unaffected by the mobile pass.
	await expect(page.locator("table thead")).toBeVisible();
	const rowDisplay = await page.locator("tr.player-row").first().evaluate((el) => getComputedStyle(el).display);
	expect(rowDisplay).toBe("table-row");
});

test("touch reorder is gated behind the drag handle", async ({ page }) => {
	await page.setViewportSize({ width: 375, height: 812 });
	await page.goto(BOARD);
	await ready(page);

	// Scroll the board to the top of the viewport so the rows being dragged
	// are actually on-screen (elementFromPoint hit-testing needs in-viewport
	// coordinates).
	await page.locator("tr.player-row").first().scrollIntoViewIfNeeded();
	await page.evaluate(() => {
		const r = document.querySelector("tr.player-row")!.getBoundingClientRect();
		window.scrollBy(0, r.top - 8);
	});

	const before = await names(page, 3);

	// A swipe that begins on the row body (the name) must NOT reorder — it
	// falls through to native scrolling.
	await touchDrag(page, "tr.player-row .name-cell", 2);
	expect(await names(page, 3), "body swipe should not reorder").toEqual(before);

	// A drag that begins on the handle DOES reorder.
	await touchDrag(page, "tr.player-row .drag-handle", 2);
	const after = await names(page, 3);
	expect(after, "handle drag should reorder").not.toEqual(before);
	expect(after[0]).toBe(before[1]); // first row moved down
});

test("more-actions modal exposes team/age/bye, draft, note, tier, and delete", async ({ page }) => {
	await page.setViewportSize({ width: 375, height: 812 });
	await page.goto(BOARD);
	await ready(page);

	const firstName = (await names(page, 1))[0];
	await page.locator("tr.player-row").first().locator(".more-btn").click();
	await expect(page.locator(".modal-title")).toHaveText(firstName);
	await expect(page.locator(".player-actions-stats")).toContainText("Team");
	await expect(page.locator(".player-actions-stats")).toContainText("Age");
	await expect(page.locator(".player-actions-stats")).toContainText("Bye");
	await expect(page.locator('#modal-content button[data-action="draft"]')).toBeVisible();
	await expect(page.locator('#modal-content button[data-action="note"]')).toBeVisible();
	await expect(page.locator('#modal-content button[data-action="add-tier"]')).toBeVisible();
	await expect(page.locator('#modal-content button[data-action="delete"]')).toBeVisible();

	// Mark drafted closes the modal and the row reflects the new state.
	await page.locator('#modal-content button[data-action="draft"]').click();
	await expect(page.locator(".modal-backdrop")).not.toHaveClass(/open/);
	await expect(page.locator("tr.player-row").first()).toHaveClass(/drafted/);
});

test("tier break add/remove round-trips through the more-actions modal", async ({ page }) => {
	await page.setViewportSize({ width: 375, height: 812 });
	await page.goto(BOARD);
	await ready(page);

	const row = page.locator("tr.player-row").nth(2);
	await row.locator(".more-btn").click();
	await page.locator('#modal-content button[data-action="add-tier"]').click();
	await expect(row).toHaveClass(/has-tier-above/);

	await row.locator(".more-btn").click();
	await expect(page.locator('#modal-content button[data-action="remove-tier"]')).toBeVisible();
	await page.locator('#modal-content button[data-action="remove-tier"]').click();
	await expect(row).not.toHaveClass(/has-tier-above/);
});

test("interactive controls meet the 44px touch-target minimum at 375px", async ({ page }) => {
	await page.setViewportSize({ width: 375, height: 812 });
	await page.goto(BOARD);
	await ready(page);

	const targets = [
		"#theme-toggle",
		".actions-zone .btn",
		"tr.player-row .icon-btn[data-action=star]",
		"tr.player-row .drag-handle",
		"tr.player-row .more-btn",
	];
	for (const sel of targets) {
		const box = await page.locator(sel).first().boundingBox();
		expect(box, `${sel} should exist`).not.toBeNull();
		expect(box!.width, `${sel} width`).toBeGreaterThanOrEqual(44);
		expect(box!.height, `${sel} height`).toBeGreaterThanOrEqual(44);
	}

	// Position chips and the more-actions modal's buttons are behind the
	// filters drawer / a tap respectively — check them in their open state.
	await page.locator("#filters-drawer > summary").click();
	const chipBox = await page.locator(".position-btn").first().boundingBox();
	expect(chipBox!.height).toBeGreaterThanOrEqual(44);

	await page.locator("tr.player-row").first().locator(".more-btn").click();
	const modalBtnBox = await page.locator("#modal-content .player-actions-buttons .btn").first().boundingBox();
	expect(modalBtnBox!.height).toBeGreaterThanOrEqual(44);
});
