import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { mapsLink, menuItem, menuItemNames, scrollThrough } from "./content";

test("the design lives at the homepage with the supplied branding", async ({
  page,
}) => {
  await page.goto("/ui-ux");
  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator("header img")).toHaveAttribute(
    "src",
    /brand-mark.png/,
  );
  await expect(
    page.locator('#story img[src*="brand-mark"]').first(),
  ).toHaveAttribute("src", /brand-mark.png/);
  await expect(
    page.locator('link[rel="icon"][type="image/png"]'),
  ).toHaveAttribute("href", /icon.png/);
});

test("reference page fits mobile, tablet and desktop and loads its imagery", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  for (const width of [320, 375, 600, 768, 1024, 1280, 1440, 1920]) {
    await page.setViewportSize({ width, height: 900 });
    await expect(page.getByRole("heading", { level: 1 })).toHaveAccessibleName(
      "Wake your senses.",
    );
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
      `Overflow at ${width}px`,
    ).toBe(true);
    const cta = await page
      .getByRole("link", { name: "Explore Menu", exact: true })
      .boundingBox();
    expect(cta!.x).toBeGreaterThanOrEqual(0);
    expect(cta!.x + cta!.width).toBeLessThanOrEqual(width);
  }
  for (const id of ["home", "menu", "story", "location"]) {
    await scrollThrough(page, `#${id}`);
    await expect
      .poll(
        () =>
          page
            .locator(`#${id} img:visible`)
            .evaluateAll((images) =>
              images.every(
                (image) =>
                  (image as HTMLImageElement).complete &&
                  (image as HTMLImageElement).naturalWidth > 0,
              ),
            ),
        { timeout: 15000 },
      )
      .toBe(true);
  }
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: "test-results/caffeine-desktop.png",
    fullPage: true,
  });
  await page.screenshot({ path: "test-results/caffeine-hero.png" });
  await page.setViewportSize({ width: 375, height: 812 });
  await page.screenshot({
    path: "test-results/caffeine-mobile.png",
    fullPage: true,
  });
  expect(errors).toEqual([]);
});

test("menu search, product prices, story and ordering actions work", async ({
  page,
}) => {
  await page.goto("/");
  const names = await menuItemNames(page);
  test.skip(
    names.length < 2,
    "Publish at least two products in the dashboard.",
  );
  await page.getByRole("button", { name: "Search menu", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("searchbox").fill(names[0]);
  const match = dialog.locator(".dialog-product", {
    has: page.getByRole("heading", { name: names[0], exact: true }),
  });
  await expect(match).toHaveCount(1);
  await match.click();
  await expect(
    dialog.getByRole("heading", { name: names[0], exact: true }),
  ).toBeVisible();
  await dialog.getByRole("button", { name: "Enjoy it in café" }).click();
  await expect(dialog.getByText(/Orders are taken in our café/)).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("button", { name: "Search menu", exact: true }),
  ).toBeFocused();
  await menuItem(page, names[1]).click();
  await expect(
    dialog.getByRole("heading", { name: names[1], exact: true }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Discover Our Story" }).click();
  await expect(
    dialog.getByRole("heading", {
      name: "A little place for the good moments.",
    }),
  ).toBeVisible();
  await dialog.getByRole("link", { name: "Come say hello" }).click();
  await expect(dialog).not.toBeVisible();
  await expect(page).toHaveURL(/#location$/);
  const directions = page.getByRole("link", { name: "Get Directions" });
  if (await directions.count())
    await expect(directions).toHaveAttribute("href", mapsLink);
});

test("reference mobile navigation and dialogs are keyboard accessible", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.getByRole("button", { name: "Open navigation" }).click();
  const nav = page.getByRole("dialog", { name: "Navigation" });
  await expect(nav).toBeVisible();
  for (let index = 0; index < 8; index++) {
    await page.keyboard.press("Tab");
    expect(
      await nav.evaluate((element) => element.contains(document.activeElement)),
    ).toBe(true);
  }
  await nav.getByRole("link", { name: "Our Story" }).click();
  await expect(nav).not.toBeVisible();
  await expect(page).toHaveURL(/#story$/);
  await expect(
    page.getByRole("button", { name: "Open navigation" }),
  ).toHaveAttribute("aria-expanded", "false");
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze()
    ).violations,
  ).toEqual([]);
  await page.getByRole("button", { name: "Discover Our Story" }).click();
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze()
    ).violations,
  ).toEqual([]);
});
