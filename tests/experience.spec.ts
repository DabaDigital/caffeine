import { test, expect } from "@playwright/test";
import { mapsLink, menuItem, menuItemNames, menuItems } from "./content";

test("mobile header controls fit and its navigation reaches the menu and café", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  for (const width of [320, 375, 430, 768]) {
    await page.setViewportSize({ width, height: 844 });
    for (const name of ["Pause animations", "Search menu", "Open navigation"]) {
      const box = await page
        .getByRole("button", { name, exact: true })
        .boundingBox();
      expect(box).not.toBeNull();
      expect(box!.width).toBeGreaterThanOrEqual(44);
      expect(box!.x).toBeGreaterThanOrEqual(0);
      expect(box!.x + box!.width).toBeLessThanOrEqual(width);
    }
    await expect(
      page.getByRole("link", { name: "Find your moment" }),
    ).toBeHidden();
  }
  await expect(
    page.getByRole("navigation", { name: "Quick navigation" }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Open navigation" }).click();
  await page
    .getByRole("navigation", { name: "Mobile navigation" })
    .getByRole("link", { name: "Our Menu", exact: true })
    .click();
  await expect(page).toHaveURL(/#menu$/);
  await expect(page.getByRole("dialog", { name: "Navigation" })).toBeHidden();
  await page.getByRole("button", { name: "Open navigation" }).click();
  await page
    .getByRole("navigation", { name: "Mobile navigation" })
    .getByRole("link", { name: "Locations", exact: true })
    .click();
  await expect(page).toHaveURL(/#location$/);
  await expect(page.getByRole("dialog", { name: "Navigation" })).toBeHidden();
});

test("menu category links and search work on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const menu = page.locator("#menu");
  const products = menuItems(page);
  const total = await products.count();
  test.skip(total === 0, "Publish menu products first.");
  // The last category link jumps to its section and becomes current.
  const last = menu
    .getByRole("navigation", { name: "Menu categories" })
    .getByRole("link")
    .last();
  const target = (await last.getAttribute("href"))!;
  await last.click();
  await expect(page).toHaveURL(new RegExp(`${target}$`));
  await expect(last).toHaveAttribute("aria-current", "true");
  await expect(menu.locator(`${target} h3`)).toBeInViewport();
  // The rail's search button brings back the search field.
  await menu.getByRole("button", { name: "Search the menu" }).click();
  const search = menu.getByRole("searchbox", { name: "Search the menu" });
  await expect(search).toBeFocused();
  const [first] = await menuItemNames(page);
  await search.fill(first);
  await expect(menuItem(page, first)).toBeVisible();
  await search.fill("zzzz-no-match");
  await expect(
    menu.getByRole("heading", { name: "Nothing matches “zzzz-no-match”." }),
  ).toBeVisible();
  await menu.getByRole("button", { name: "Clear search" }).last().click();
  await expect(search).toHaveValue("");
  await expect(products).toHaveCount(total);
});

test("the reviews section shows published reviews or invites the first", async ({
  page,
}) => {
  await page.route("**/api/google-reviews", (route) => route.fulfill({ status: 503, json: { available: false } }));
  await page.goto("/");
  await page
    .getByRole("navigation", { name: "Main navigation" })
    .getByRole("link", { name: "Reviews" })
    .click();
  await expect(page).toHaveURL(/#reviews$/);
  const reviews = page.locator("#reviews");
  await expect(
    reviews.getByRole("heading", { level: 2, name: /Warm cups/ }),
  ).toBeVisible();
  if (await reviews.locator("blockquote").count()) {
    await expect(reviews.getByText(/from \d+ reviews?$/)).toBeVisible();
    await reviews.getByText("Rating breakdown", { exact: false }).click();
    await expect(
      reviews
        .getByRole("list", { name: "Reviews by rating" })
        .getByRole("listitem"),
    ).toHaveCount(5);
  } else {
    await expect(
      reviews.getByRole("heading", { name: /little coffee break/ }),
    ).toBeVisible();
  }
  const maps = reviews.getByRole("link", { name: /Google Maps/ });
  if (await maps.count())
    await expect(maps.first()).toHaveAttribute("href", mapsLink);
});

test("the 3D layer renders and respects a live reduced-motion preference", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page.locator('#home [data-ready="true"] canvas')).toBeVisible({
    timeout: 15000,
  });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator("#home canvas")).toHaveCount(0);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect(page.locator('#home [data-ready="true"] canvas')).toBeVisible();
  expect(errors).toEqual([]);
});

test("menu product details return keyboard focus to their trigger", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const product = menuItems(page).first();
  test.skip((await product.count()) === 0, "Publish menu products first.");
  const name = (await product.locator('[id$="-name"]').innerText()).trim();
  await product.click();
  const dialog = page.getByRole("dialog");
  await expect(
    dialog.getByRole("heading", { name, exact: true }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(product).toBeFocused();
  // "Back to the menu" also returns to the product on the page.
  await product.click();
  await dialog.getByRole("button", { name: "Back to the menu" }).click();
  await expect(dialog).not.toBeVisible();
  await expect(product).toBeFocused();
});

test("GSAP scroll animation can be paused and content remains available", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await page.getByRole("button", { name: "Pause animations" }).click();
  await expect(page.locator('[data-motion-paused="true"]')).toBeVisible();
  for (const id of ["menu", "story", "location"]) {
    await page.locator(`#${id}`).scrollIntoViewIfNeeded();
    await expect(page.locator(`#${id} h2`).first()).toBeVisible();
  }
  await page.getByRole("button", { name: "Play animations" }).click();
  await expect(page.locator('[data-motion-paused="false"]')).toBeVisible();
  expect(errors).toEqual([]);
});
