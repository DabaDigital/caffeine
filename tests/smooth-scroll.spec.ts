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

test.describe("on a touch phone", () => {
  test.use({
    viewport: { width: 375, height: 830 },
    isMobile: true,
    hasTouch: true,
  });

  test("a flick keeps gliding after the finger lifts", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("html")).toHaveClass(/lenis/);
    await page.evaluate(() => window.scrollTo({ top: 2000, behavior: "instant" }));
    const { released, settled } = await page.evaluate(async () => {
      const frame = () => new Promise((resolve) => requestAnimationFrame(resolve));
      const fire = (type: string, y: number) => {
        const touch = new Touch({ identifier: 1, target: document.body, clientX: 187, clientY: y });
        const touches = type === "touchend" ? [] : [touch];
        window.dispatchEvent(
          new TouchEvent(type, {
            touches,
            targetTouches: touches,
            changedTouches: [touch],
            bubbles: true,
            cancelable: true,
          }),
        );
      };
      const start = window.scrollY;
      fire("touchstart", 600);
      for (let y = 560; y >= 360; y -= 40) {
        await frame();
        fire("touchmove", y);
      }
      await frame();
      fire("touchend", 360);
      const released = window.scrollY - start;
      for (let i = 0; i < 60; i++) await frame();
      return { released, settled: window.scrollY - start };
    });
    expect(released).toBeGreaterThan(150);
    expect(settled).toBeGreaterThan(released + 150);
  });

  test("the centred polaroid fills the screen inside a frame", async ({ page }) => {
    await page.goto("/");
    const runway = page.locator("#story [data-horizontal]");
    await expect(runway).toHaveCount(1);
    // Halfway through the gallery the middle photo rests at the centre.
    await runway.evaluate((element: HTMLElement) => {
      const top = element.getBoundingClientRect().top + window.scrollY;
      const stage = element.firstElementChild as HTMLElement;
      const start = top - 78;
      const end = top + element.offsetHeight - 78 - stage.clientHeight;
      window.scrollTo({ top: (start + end) / 2, behavior: "instant" });
    });
    const card = page.locator("#story [data-card]").nth(1);
    // 28px from each side, and from the 78px header to the bottom.
    await expect
      .poll(async () => {
        const box = await card.boundingBox();
        return box && [box.x, box.y, box.width, box.height].map(Math.round);
      })
      .toEqual([28, 106, 319, 696]);
  });
});
