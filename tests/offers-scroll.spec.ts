import { test, expect, type Page } from "@playwright/test";

/** Scrolls to a point of the offers' scroll-driven pass: 0 starts, 1 ends. */
async function scrollPass(page: Page, at: number) {
  await page.locator("#offers [data-horizontal]").evaluate((runway, at) => {
    const stage = runway.firstElementChild as HTMLElement;
    const start =
      runway.getBoundingClientRect().top +
      window.scrollY -
      parseFloat(getComputedStyle(stage).top);
    const hold = parseFloat(runway.style.getPropertyValue("--hold"));
    window.scrollTo({ top: start + hold * at, behavior: "instant" });
  }, at);
}

/** Where the stage sits, and the first and last tickets against the heading's edges. */
const layout = (page: Page) =>
  page.locator("#offers").evaluate((section) => {
    const heading = section.querySelector("header")!.getBoundingClientRect();
    const tickets = [...section.querySelectorAll("[data-ticket]")].map(
      (ticket) => ticket.getBoundingClientRect(),
    );
    return {
      stage: Math.round(
        section.querySelector("[data-horizontal] > *")!.getBoundingClientRect()
          .top,
      ),
      first: Math.round(tickets[0].left - heading.left),
      last: Math.round(tickets.at(-1)!.right - heading.right),
    };
  });

async function openOffers(page: Page) {
  await page.goto("/");
  const offers = page.locator("#offers");
  test.skip((await offers.count()) === 0, "Publish an offer first.");
  const row = offers.getByRole("region", { name: "Offers" });
  test.skip(
    await row.evaluate((element) => element.scrollWidth <= element.clientWidth),
    "Publish more offers than fit on screen first.",
  );
  return offers;
}

for (const viewport of [
  { width: 1440, height: 900 },
  { width: 390, height: 844 },
]) {
  test(`the offers hold still and glide sideways as the page scrolls at ${viewport.width}px`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    const offers = await openOffers(page);
    await expect(offers.locator("[data-horizontal]")).toHaveCount(1);

    // The first ticket starts flush with the heading…
    await scrollPass(page, 0.02);
    await expect.poll(async () => (await layout(page)).first).toBe(0);
    const pinned = (await layout(page)).stage;
    await expect(offers.getByText(/^Scroll to discover/)).toBeInViewport();

    // …and the last one ends flush with it, while the stage stays put.
    await scrollPass(page, 0.98);
    await expect
      .poll(async () => Math.abs((await layout(page)).last))
      .toBeLessThanOrEqual(1);
    expect((await layout(page)).stage).toBe(pinned);
    const slider = offers.getByRole("slider", { name: "Browse offers" });
    await expect(slider).toHaveAttribute(
      "aria-valuetext",
      /^Offer page (\d+) of \1$/,
    );

    // Past the pass, the section scrolls away as usual.
    await scrollPass(page, 1.3);
    await expect
      .poll(async () => (await layout(page)).stage)
      .toBeLessThan(pinned);
  });
}

test("keys, the slider and a sideways swipe move the offers along", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const offers = await openOffers(page);
  await scrollPass(page, 0.02);
  await expect.poll(async () => (await layout(page)).first).toBe(0);

  const row = offers.getByRole("region", { name: "Offers" });
  const slider = offers.getByRole("slider", { name: "Browse offers" });
  await row.focus();
  await page.keyboard.press("End");
  await expect(slider).toHaveAttribute(
    "aria-valuetext",
    /^Offer page (\d+) of \1$/,
  );
  await expect
    .poll(async () => Math.abs((await layout(page)).last))
    .toBeLessThanOrEqual(1);
  await page.keyboard.press("Home");
  await expect(slider).toHaveAttribute("aria-valuetext", /^Offer page 1 of/);
  await expect.poll(async () => (await layout(page)).first).toBe(0);

  await slider.fill((await slider.getAttribute("max")) ?? "1");
  await expect
    .poll(async () => Math.abs((await layout(page)).last))
    .toBeLessThanOrEqual(1);
  await slider.fill("0");
  await expect.poll(async () => (await layout(page)).first).toBe(0);

  // A sideways trackpad swipe over the tickets scrolls the page, which moves
  // the row, rather than being ignored.
  const ticket = await offers.locator("[data-ticket]").first().boundingBox();
  await page.mouse.move(
    ticket!.x + ticket!.width / 2,
    ticket!.y + ticket!.height / 2,
  );
  for (let step = 0; step < 8; step++) await page.mouse.wheel(60, 0);
  await expect.poll(async () => (await layout(page)).first).toBeLessThan(-100);
});

test("with reduced motion the offers row scrolls sideways on its own", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 390, height: 844 });
  const offers = await openOffers(page);
  await expect(offers.locator("[data-horizontal]")).toHaveCount(0);
  await expect(offers.getByText(/^Swipe to discover/)).toBeVisible();
  const row = offers.getByRole("region", { name: "Offers" });
  await row.evaluate((element) =>
    element.scrollTo({ left: element.scrollWidth, behavior: "instant" }),
  );
  await expect(
    offers.getByRole("slider", { name: "Browse offers" }),
  ).toHaveAttribute("aria-valuetext", /^Offer page (\d+) of \1$/);
});
