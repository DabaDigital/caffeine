import { test, expect } from "@playwright/test";

const place = {
  displayName: { text: "Caffeine store casa" },
  rating: 5,
  userRatingCount: 32,
  googleMapsUri: "https://maps.google.com/?cid=17024445823181626945",
};

test("configured server fetches Google data without exposing credentials", async ({
  request,
}) => {
  test.skip(
    process.env.TEST_GOOGLE_PLACES_LIVE !== "1",
    "Live Google requests are opt-in.",
  );
  const response = await request.get("/api/google-reviews");
  expect(response.status()).toBe(200);
  expect(response.headers()["cache-control"]).toContain("no-store");
  const data = await response.json();
  expect(data.displayName.text).toBe("Caffeine store casa");
  expect(data.userRatingCount).toBeGreaterThan(0);
  expect(JSON.stringify(data)).not.toContain("AIza");
});

test("Google rating remains useful when review text is omitted", async ({
  page,
}) => {
  await page.route("**/api/google-reviews", (route) =>
    route.fulfill({ json: place }),
  );
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/#reviews");
  const section = page.locator("#reviews");
  await expect(section.getByText(/from 32 reviews$/)).toBeVisible();
  await expect(section.getByText("Rating breakdown")).toHaveCount(0);
  const guests = section.getByRole("region", {
    name: "Caffeine guest reviews",
  });
  await expect(guests).toBeVisible();
  await expect(guests.locator("blockquote").first()).toBeVisible();
  await expect(
    section.getByRole("region", { name: "Google Maps reviews" }),
  ).toHaveCount(0);
});

test("Google reviews preserve author and source links", async ({ page }) => {
  await page.route("**/api/google-reviews", (route) =>
    route.fulfill({
      json: {
        ...place,
        reviews: [
          {
            name: "places/test/reviews/test",
            rating: 5,
            text: { text: "A lovely coffee break." },
            authorAttribution: {
              displayName: "Test guest",
              uri: "https://www.google.com/maps/contrib/123",
            },
            googleMapsUri: "https://www.google.com/maps/reviews/test",
          },
        ],
      },
    }),
  );
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/#reviews");
  const section = page.locator("#reviews");
  await expect(
    section
      .getByRole("region", { name: "Caffeine guest reviews" })
      .locator("blockquote")
      .first(),
  ).toBeVisible();
  await expect(
    section.getByRole("region", { name: "Google Maps reviews" }),
  ).toBeVisible();
  await expect(section.getByText("A lovely coffee break.")).toBeVisible();
  await expect(
    section.getByRole("link", { name: "Test guest" }),
  ).toHaveAttribute("href", "https://www.google.com/maps/contrib/123");
  await expect(
    section.getByRole("link", { name: /View review/ }),
  ).toHaveAttribute("href", "https://www.google.com/maps/reviews/test");
});

test("Google failures leave the guest review section usable", async ({
  page,
}) => {
  await page.route("**/api/google-reviews", (route) =>
    route.fulfill({ status: 503, json: { available: false } }),
  );
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/#reviews");
  await expect(
    page.locator("#reviews").getByRole("heading", { name: /Warm cups/ }),
  ).toBeVisible();
  await expect(
    page.locator("#reviews").getByText("About Google reviews"),
  ).toHaveCount(0);
});
