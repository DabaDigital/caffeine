import { test, expect } from "@playwright/test";

test("reviews stay readable on desktop and mobile and long text expands", async ({ page }) => {
  await page.route("**/api/google-reviews", (route) => route.fulfill({ status: 503, json: { available: false } }));
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/#reviews");
  const section = page.locator("#reviews");
  await expect(section.getByRole("heading", { name: /Warm cups/ })).toBeVisible();
  const expand = section.getByRole("button", { name: /^Read full/ }).first();
  if (await expand.count()) {
    await expand.click();
    await expect(section.getByRole("button", { name: /^Show less of/ }).first()).toHaveAttribute("aria-expanded", "true");
    await section.getByRole("button", { name: /^Show less of/ }).first().click();
    await expect(section.getByRole("button", { name: /^Read full/ }).first()).toHaveAttribute("aria-expanded", "false");
  }
  await section.screenshot({ path: "test-results/reviews-desktop.png" });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await section.screenshot({ path: "test-results/reviews-mobile.png" });
});

test("guest reviews show two to a page and the pager turns them in place", async ({ page }) => {
  await page.route("**/api/google-reviews", (route) => route.fulfill({ status: 503, json: { available: false } }));
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/#reviews");
  const guests = page.getByRole("region", { name: "Caffeine guest reviews" });
  const pager = guests.getByRole("navigation", { name: "Review pages" });
  test.skip(!(await pager.count()), "Needs more than three published reviews.");
  // What the live region announces; the padded counter beside it is visual.
  const status = guests.locator("[aria-live] .sr-only");
  // Review pages are lists too, but only the current one is exposed.
  const shown = guests.locator("ul").getByRole("listitem");
  await expect(status).toHaveText(/^Page 1 of \d+$/);
  await expect(shown).toHaveCount(2);
  const pages = Number((await status.textContent())!.match(/of (\d+)$/)![1]);
  const first = (await shown.first().textContent())!;
  const before = (await pager.boundingBox())!;
  for (let turn = 2; turn <= pages; turn++) {
    await pager.getByRole("button", { name: "Next page" }).click();
    await expect(status).toHaveText(`Page ${turn} of ${pages}`);
    // The open slot on a short last page invites the next review.
    await expect(shown).toHaveCount(2);
    // Pages share one height, so the pager never moves under the pointer.
    expect((await pager.boundingBox())!.y).toBeCloseTo(before.y, 0);
  }
  await expect(pager.getByRole("button", { name: "Next page" })).toBeDisabled();
  await pager.getByRole("button", { name: "Page 1" }).click();
  await expect(shown.first()).toHaveText(first);
});
