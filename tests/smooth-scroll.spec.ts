import { test, expect } from "@playwright/test";

test("smooth scrolling respects motion settings and resumes after dialogs", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/#menu");
  const html = page.locator("html");
  await expect(html).toHaveClass(/lenis/);
  await page.getByRole("button", { name: "Search menu", exact: true }).click();
  await expect(html).toHaveClass(/lenis-stopped/);
  const position = await page.evaluate(() => window.scrollY);
  await page.mouse.move(10, 450);
  await page.mouse.wheel(0, 500);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(position);
  await page.getByRole("button", { name: "Close menu", exact: true }).click();
  await expect(html).not.toHaveClass(/lenis-stopped/);
  await page.mouse.wheel(0, 400);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(position + 200);

  await page.getByRole("button", { name: "Pause animations", exact: true }).click();
  await expect(html).not.toHaveClass(/lenis/);
  await page.getByRole("button", { name: "Play animations", exact: true }).click();
  await expect(html).toHaveClass(/lenis/);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(html).not.toHaveClass(/lenis/);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect(html).toHaveClass(/lenis/);
});

test("mobile navigation unlocks smooth scrolling before following an anchor", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/#home");
  await expect(page.locator("html")).toHaveClass(/lenis/);
  await page.getByRole("button", { name: "Open navigation" }).click();
  await expect(page.locator("html")).toHaveClass(/lenis-stopped/);
  await page.getByRole("navigation", { name: "Mobile navigation" })
    .getByRole("link", { name: "Our Menu", exact: true }).click();
  await expect(page).toHaveURL(/#menu$/);
  await expect(page.locator("html")).not.toHaveClass(/lenis-stopped/);
  await expect(page.locator("#menu h2").first()).toBeInViewport();
});
