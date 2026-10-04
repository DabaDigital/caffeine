import { test, expect, type Page } from "@playwright/test";

const title = (page: Page) =>
  page.getByRole("heading", { level: 1, name: "Wake your senses." });

const menuPosition = (page: Page) =>
  page.locator("#menu").evaluate((element) => {
    return element.getBoundingClientRect().top + window.scrollY;
  });

function captureErrors(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  return errors;
}

test("scroll changes the opening scene and native navigation still reaches the menu", async ({
  page,
}) => {
  const errors = captureErrors(page);
  await page.setViewportSize({ width: 1280, height: 900 });
  // Arriving at an anchor skips the entrance, as a returning visitor would.
  await page.goto("/#home");
  const explore = page.getByRole("link", { name: "Explore Menu", exact: true });
  const favorite = page.getByRole("link", { name: "Find your favorite" });
  await expect(explore).toBeVisible();
  await expect(favorite).toBeHidden();

  await page.mouse.wheel(0, 900);
  await expect
    .poll(() => page.evaluate(() => window.scrollY))
    .toBeGreaterThan(800);
  await expect(favorite).toBeInViewport();
  await expect(explore).toBeHidden();
  // The second scene remains on screen while the document itself advances.
  await expect
    .poll(async () => (await title(page).boundingBox())?.y)
    .toBeCloseTo(0, 0);

  await page
    .getByRole("navigation", { name: "Main navigation" })
    .getByRole("link", { name: "Our Menu", exact: true })
    .click();
  await expect(page).toHaveURL(/#menu$/);
  await expect(page.locator("#menu h2").first()).toBeInViewport();

  await page.getByRole("link", { name: "Caffeine home" }).click();
  await expect(page).toHaveURL(/#home$/);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeLessThan(2);
  await expect(explore).toBeInViewport();
  await expect(favorite).toBeHidden();
  expect(errors).toEqual([]);
});

test("reduced motion lets the opening scroll away in normal document flow", async ({
  page,
}) => {
  const errors = captureErrors(page);
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(title(page)).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Replay opening animation" }),
  ).toBeHidden();
  await page.mouse.wheel(0, 600);
  await expect
    .poll(() => page.evaluate(() => window.scrollY))
    .toBeGreaterThan(500);
  await expect
    .poll(async () => (await title(page).boundingBox())?.y)
    .toBeLessThan(-500);
  await expect(page.locator("#menu h2").first()).toBeInViewport();
  await page.getByRole("link", { name: "Caffeine home" }).click();
  await expect(
    page.getByRole("link", { name: "Explore Menu", exact: true }),
  ).toBeInViewport();
  expect(errors).toEqual([]);
});

for (const viewport of [
  { width: 320, height: 568 },
  { width: 375, height: 667 },
  { width: 390, height: 844 },
]) {
  test(`the opening CTA fits the initial viewport at ${viewport.width}×${viewport.height}`, async ({
    page,
  }) => {
    const errors = captureErrors(page);
    await page.setViewportSize(viewport);
    await page.goto("/");
    await expect(
      page.getByText("A GOOD DAY STARTS HERE.", { exact: true }),
    ).toBeHidden({ timeout: 10_000 });
    const explore = page.getByRole("link", {
      name: "Explore Menu",
      exact: true,
    });
    await expect(explore).toBeInViewport({ ratio: 1 });
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
    const cta = (await explore.boundingBox())!;
    await expect(
      page.getByRole("navigation", { name: "Quick navigation" }),
    ).toHaveCount(0);
    expect(cta.y + cta.height).toBeLessThanOrEqual(viewport.height);
    expect(cta.x).toBeGreaterThanOrEqual(0);
    expect(cta.x + cta.width).toBeLessThanOrEqual(viewport.width);
    await explore.click();
    await expect(page).toHaveURL(/#menu$/);
    await expect(page.locator("#menu h2").first()).toBeInViewport();
    expect(errors).toEqual([]);
  });
}

test("replay and repeated pause cycles preserve one opening and stable page spacing", async ({
  page,
}) => {
  const errors = captureErrors(page);
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/#home");
  const replay = page.getByRole("button", { name: "Replay opening animation" });
  await expect(replay).toBeEnabled();
  await page.mouse.wheel(0, 850);
  await expect(
    page.getByRole("link", { name: "Find your favorite" }),
  ).toBeVisible();
  const originalMenuPosition = await menuPosition(page);

  for (let cycle = 0; cycle < 2; cycle++) {
    if (cycle > 0) {
      await page.mouse.wheel(0, 850);
      await expect(
        page.getByRole("link", { name: "Find your favorite" }),
      ).toBeVisible();
    }
    await replay.click();
    await expect
      .poll(() => page.evaluate(() => window.scrollY))
      .toBeLessThan(2);
    await expect(
      page.getByText("A GOOD DAY STARTS HERE.", { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText("A GOOD DAY STARTS HERE.", { exact: true }),
    ).toBeHidden({ timeout: 10_000 });
    await expect(
      page.getByRole("link", { name: "Explore Menu", exact: true }),
    ).toBeInViewport();

    await page
      .getByRole("button", { name: "Pause animations", exact: true })
      .click();
    await expect(replay).toBeDisabled();
    await expect
      .poll(() => menuPosition(page))
      .toBeLessThan(originalMenuPosition - 500);
    await page
      .getByRole("button", { name: "Play animations", exact: true })
      .click();
    await expect(replay).toBeEnabled();
    await expect
      .poll(() => menuPosition(page))
      .toBeCloseTo(originalMenuPosition, 0);
    await expect(title(page)).toHaveCount(1);
  }

  expect(errors).toEqual([]);
});
