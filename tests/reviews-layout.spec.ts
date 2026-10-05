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
