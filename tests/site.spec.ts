import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { mapsLink, scrollThrough } from "./content";

test("all supported widths have readable content without page overflow", async ({
  page,
}) => {
  const errors: string[] = [];
  await page.emulateMedia({ reducedMotion: "reduce" });
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  for (const width of [320, 375, 430, 768, 1024, 1280, 1440, 1920]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.locator("#location").scrollIntoViewIfNeeded();
    await page.locator("#home").scrollIntoViewIfNeeded();
    await expect(
      page.getByRole("heading", {
        name: "Wake your senses.",
      }),
    ).toBeVisible();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    );
    expect(overflow, `Page overflow at ${width}px`).toBe(false);
    const cta = await page
      .getByRole("link", { name: "Explore Menu" })
      .boundingBox();
    expect(cta!.x).toBeGreaterThanOrEqual(0);
    expect(cta!.x + cta!.width).toBeLessThanOrEqual(width);
  }
  expect(errors).toEqual([]);
});

test("menu filtering, empty state, product detail and ordering explanation work", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Search menu", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  const products = dialog.locator(".dialog-product");
  const total = await products.count();
  test.skip(total === 0, "Add products in the dashboard to test the menu.");
  const filters = dialog
    .getByRole("group", { name: "Filter by category" })
    .getByRole("button");
  const category = (await filters.nth(1).innerText()).trim();
  await filters.nth(1).click();
  await expect(filters.nth(1)).toHaveAttribute("aria-pressed", "true");
  // The category name, without the offer badge some products carry.
  const labels = await products
    .locator(".dialog-product-category")
    .evaluateAll((elements) =>
      elements.map((element) => element.firstChild?.textContent?.trim() ?? ""),
    );
  expect(labels.length).toBeGreaterThan(0);
  for (const label of labels)
    expect(label.toLowerCase()).toBe(category.toLowerCase());
  await dialog.getByRole("searchbox").fill("zzz not on the menu");
  await expect(dialog.getByText("No matching favorites.")).toBeVisible();
  await dialog.getByRole("button", { name: "Show all favorites" }).click();
  await expect(products).toHaveCount(total);
  const name = (await products.first().locator("h3").innerText()).trim();
  await products.first().click();
  await expect(
    dialog.getByRole("heading", { name, exact: true }),
  ).toBeVisible();
  await dialog.getByRole("button", { name: "Enjoy it in café" }).click();
  await expect(dialog.getByText(/Orders are taken in our café/)).toBeVisible();
  const find = dialog.getByRole("link", { name: /^Find / });
  if (await find.count()) await expect(find).toHaveAttribute("href", mapsLink);
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(
    page.getByRole("button", { name: "Search menu", exact: true }),
  ).toBeFocused();
});

test("mobile navigation traps focus, follows anchors and closes", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/");
  await page.getByRole("button", { name: "Open navigation" }).click();
  const dialog = page.getByRole("dialog", { name: "Navigation" });
  await expect(dialog).toBeVisible();
  for (let index = 0; index < 8; index++) {
    await page.keyboard.press("Tab");
    expect(
      await dialog.evaluate((element) =>
        element.contains(document.activeElement),
      ),
    ).toBe(true);
  }
  await dialog.getByRole("link", { name: "Our Story" }).click();
  await expect(dialog).not.toBeVisible();
  await expect(page).toHaveURL(/#story$/);
  await expect(
    page.getByRole("button", { name: "Open navigation" }),
  ).toHaveAttribute("aria-expanded", "false");
});

test("homepage and open menu pass automated WCAG checks", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze()
    ).violations,
  ).toEqual([]);
  await page.getByRole("button", { name: "Search menu", exact: true }).click();
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze()
    ).violations,
  ).toEqual([]);
});

test("imagery loads and reduced motion leaves all content usable", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  for (const section of ["#menu", "#story", "#location", "footer"]) {
    await scrollThrough(page, section);
    // Dashboard photos are optimized on first request, which takes a moment.
    await expect
      .poll(
        () =>
          page
            .locator(`${section} img:visible`)
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
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});
