import type { Page } from "@playwright/test";

// The menu is managed in the dashboard, so tests read what is published
// instead of expecting specific products or prices.

const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Product rows in the full menu (not the house favorites above it). */
export const menuItems = (page: Page) =>
  page.locator('#menu section[id^="menu-"] li button');

/** Product names in menu order. */
export async function menuItemNames(page: Page) {
  const names = await menuItems(page).locator('[id$="-name"]').allInnerTexts();
  return names.map((name) => name.trim());
}

/** The menu row for one product. */
export const menuItem = (page: Page, name: string) =>
  menuItems(page).filter({
    has: page.locator('[id$="-name"]', {
      hasText: new RegExp(`^${escape(name)}$`),
    }),
  });

/** Scrolls through a long section (like the full menu) so lazy photos load. */
export async function scrollThrough(page: Page, selector: string) {
  await page.locator(selector).evaluate(async (section) => {
    const end = section.getBoundingClientRect().bottom + window.scrollY;
    let y = section.getBoundingClientRect().top + window.scrollY;
    for (; y < end; y += window.innerHeight * 0.8) {
      window.scrollTo(0, y);
      await new Promise((resolve) => setTimeout(resolve, 150));
    }
  });
}

export const mapsLink = /google\.com\/maps|maps\.app\.goo\.gl|goo\.gl\/maps/;
