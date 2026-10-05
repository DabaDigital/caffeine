import { test, expect } from "@playwright/test";

test.use({ viewport: { width: 375, height: 830 }, isMobile: true, hasTouch: true });

test("gallery maps scroll linearly, stops, reverses, and survives resize and motion toggles", async ({ page }) => {
  await page.goto("/");
  const gallery = page.locator("#story [data-horizontal]");
  await expect(gallery).toHaveCount(1);
  await page.evaluate(() => document.fonts.ready);

  async function verify() {
    for (const progress of [0, 0.25, 0.75, 0.5, 1, 0.1]) {
      const result = await gallery.evaluate(async (element: HTMLElement, progress) => {
        const stage = element.firstElementChild as HTMLElement;
        const rail = element.querySelector("ul")!;
        const card = rail.firstElementChild as HTMLElement;
        const step = card.offsetWidth + parseFloat(getComputedStyle(rail).gap);
        const travel = step * (rail.children.length - 1);
        const top = element.getBoundingClientRect().top + window.scrollY - 78;
        window.scrollTo({ top: top + travel * progress, behavior: "instant" });
        await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
        const x = () => new DOMMatrix(getComputedStyle(rail).transform).m41;
        const immediate = x();
        const actualProgress = (window.scrollY - top) / travel;
        await new Promise(resolve => setTimeout(resolve, 180));
        return {
          immediate,
          settled: x(),
          expected: (element.clientWidth - card.offsetWidth) / 2 - travel * actualProgress,
          runway: element.offsetHeight - stage.clientHeight,
          travel,
          stageTop: stage.getBoundingClientRect().top,
        };
      }, progress);
      expect(Math.abs(result.immediate - result.expected)).toBeLessThan(2);
      expect(Math.abs(result.settled - result.immediate)).toBeLessThan(1);
      expect(Math.abs(result.runway - result.travel)).toBeLessThan(1);
      expect(Math.abs(result.stageTop - 78)).toBeLessThan(2);
    }
  }

  await verify();
  await page.setViewportSize({ width: 430, height: 900 });
  // ScrollTrigger and ResizeObserver debounce layout measurements.
  await page.waitForTimeout(500);
  await verify();
  for (let i = 0; i < 2; i++) {
    await page.getByRole("button", { name: "Pause animations", exact: true }).click();
    await expect(gallery).toHaveCount(0);
    await page.getByRole("button", { name: "Play animations", exact: true }).click();
    await expect(gallery).toHaveCount(1);
  }
  await verify();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(gallery).toHaveCount(0);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect(gallery).toHaveCount(1);
  await verify();
});
