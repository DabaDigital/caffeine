import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

// Nothing here saves a review: sends either fail validation or are filtered
// as a bot by the hidden "website" field.

const wcag = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

test.beforeEach(async ({ page }) => {
  await page.route("**/api/google-reviews", (route) =>
    route.fulfill({ status: 503, json: { available: false } }),
  );
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/#reviews");
});

test("guests open the review form and mistakes are explained in place", async ({
  page,
}) => {
  const open = page
    .locator("#reviews")
    .getByRole("button", { name: "Write a review" })
    .first();
  await open.click();
  const dialog = page.getByRole("dialog", { name: /Share your moment/ });
  await expect(dialog).toBeVisible();
  await expect(
    dialog.getByRole("button", { name: "Close review form" }),
  ).toBeFocused();
  const { violations } = await new AxeBuilder({ page })
    .include("dialog[open]")
    .withTags(wcag)
    .analyze();
  expect(violations).toEqual([]);

  await dialog.getByRole("button", { name: "Send review" }).click();
  await expect(dialog.getByRole("alert")).toContainText(
    "Please fix the highlighted fields.",
  );
  await expect(dialog.getByText("Choose a rating from 1 to 5.")).toBeVisible();
  await expect(dialog.getByText("Name is required.")).toBeVisible();
  await expect(dialog.getByText("Review is required.")).toBeVisible();
  await expect(dialog.getByRole("radio", { name: "1 star" })).toBeFocused();

  // The stars are a radio group: arrow keys choose the rating.
  await page.keyboard.press("ArrowRight");
  await expect(dialog.getByRole("radio", { name: "2 stars" })).toBeChecked();
  await dialog.getByLabel("Your name").fill("Salma");

  // Escape closes without losing what was typed, and focus returns.
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(open).toBeFocused();
  await open.click();
  await expect(dialog.getByLabel("Your name")).toHaveValue("Salma");
});

test("a sent review is acknowledged in the dialog", async ({ page }) => {
  await page
    .locator("#reviews")
    .getByRole("button", { name: "Write a review" })
    .first()
    .click();
  const dialog = page.getByRole("dialog", { name: /Share your moment/ });
  await dialog.getByRole("radio", { name: "5 stars" }).check();
  await dialog.getByLabel("Your name").fill("Test");
  await dialog.getByLabel("Your review").fill("Test");
  // Filled in, the hidden field marks the send as a bot's: thanked, not saved.
  await dialog
    .locator('input[name="website"]')
    .evaluate(
      (input: HTMLInputElement) => (input.value = "https://example.com"),
    );
  await dialog.getByRole("button", { name: "Send review" }).click();
  const thanks = page.getByRole("dialog", { name: /on its way/ });
  await expect(
    thanks.getByRole("heading", { name: /on its way/ }),
  ).toBeFocused();
  await thanks.getByRole("button", { name: "Close", exact: true }).click();
  await expect(thanks).toBeHidden();
});
