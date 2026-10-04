import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const wcag = ["wcag2a", "wcag2aa", "wcag21aa"];
const formAlert = (page: Page) => page.locator("[role=alert][class*=alert]");

test("the dashboard sends signed-out visitors to the login page", async ({
  page,
}) => {
  await page.goto("/admin/products");
  await expect(page).toHaveURL(/\/login\?next=%2Fadmin%2Fproducts$/);
  await expect(
    page.getByRole("heading", { name: "Caffeine dashboard" }),
  ).toBeVisible();
  expect(
    (await new AxeBuilder({ page }).withTags(wcag).analyze()).violations,
  ).toEqual([]);
});

test("wrong credentials are refused", async ({ page }) => {
  await page.goto("/login");
  const email = page.getByLabel("Email");
  test.skip(!(await email.count()), "Connect Supabase to test signing in.");
  await email.fill("nobody@example.com");
  await page.getByLabel("Password").fill("not-the-password");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(formAlert(page)).toBeVisible();
  await expect(page).toHaveURL(/\/login/);
});

// Read-only checks against a real project: nothing is created or deleted.
const adminEmail = process.env.E2E_ADMIN_EMAIL;
const adminPassword = process.env.E2E_ADMIN_PASSWORD;

test.describe("signed in as an admin", () => {
  test.skip(
    !adminEmail || !adminPassword,
    "Set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD to test the dashboard.",
  );

  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill(adminEmail!);
    await page.getByLabel("Password").fill(adminPassword!);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/admin$/);
  });

  test("every section loads and passes WCAG checks", async ({ page }) => {
    const sections: [string, string | RegExp][] = [
      ["/admin", /^Hello/],
      ["/admin/products", "Products"],
      ["/admin/products/new", "Add a product"],
      ["/admin/categories", "Categories"],
      ["/admin/promotions", "Promotions"],
      ["/admin/locations", "Locations"],
      ["/admin/locations/new", "Add a location"],
      ["/admin/social-links", "Social links"],
      ["/admin/contacts", "Contact"],
      ["/admin/reviews", "Reviews"],
      ["/admin/reviews/new", "Add a review"],
      ["/admin/team", "Team & roles"],
    ];
    for (const [path, title] of sections) {
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(title);
      const { violations } = await new AxeBuilder({ page })
        .withTags(wcag)
        .analyze();
      expect(violations, path).toEqual([]);
    }
  });

  test("forms explain problems next to each field without saving", async ({
    page,
  }) => {
    await page.goto("/admin/products/new");
    await page.getByLabel("Price (MAD)").fill("-1");
    await page.getByRole("button", { name: "Add product" }).click();
    await expect(formAlert(page)).toContainText(
      "Please fix the highlighted fields.",
    );
    await expect(page.getByText("Name is required.")).toBeVisible();
    await expect(page.getByText("Price can't be negative.")).toBeVisible();
    await expect(page.getByLabel("Name")).toBeFocused();

    await page.goto("/admin/contacts/new");
    await page.getByRole("combobox", { name: "Type" }).click();
    await page.getByRole("option", { name: "Email" }).click();
    await page.getByLabel("Email address").fill("not-an-email");
    await page.getByRole("button", { name: "Add contact" }).click();
    await expect(page.getByText("Enter a valid email address.")).toBeVisible();
  });

  test("dropdowns and the date picker work with the keyboard", async ({
    page,
  }) => {
    await page.goto("/admin/reviews/new");
    const date = page.getByRole("combobox", { name: "Date" });
    await date.click();
    const calendar = page.getByRole("dialog");
    await expect(calendar).toBeVisible();
    await expect(page.locator("[data-date][tabindex='0']")).toBeFocused();
    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("Enter");
    await expect(calendar).toBeHidden();
    await expect(date).toBeFocused();
    await expect(date).not.toContainText("When was it written?");

    await page.goto("/admin/social-links/new");
    const platform = page.getByRole("combobox", { name: "Platform" });
    await platform.focus();
    await page.keyboard.press("ArrowDown");
    await expect(page.getByRole("listbox")).toBeVisible();
    await page.keyboard.press("End");
    await page.keyboard.press("Enter");
    await expect(platform).toContainText("Website");
    await expect(platform).toBeFocused();
  });

  test("the mobile dashboard uses a drawer and fits the screen", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/admin/products");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    await page.getByRole("button", { name: "Open dashboard menu" }).click();
    const drawer = page.getByRole("dialog", { name: "Dashboard menu" });
    await drawer.getByRole("link", { name: "Reviews" }).click();
    await expect(page).toHaveURL(/\/admin\/reviews$/);
    await expect(drawer).toBeHidden();
  });

  test("signing out ends the session", async ({ page }) => {
    await page.getByRole("button", { name: "Sign out" }).click();
    await expect(page).toHaveURL(/\/login$/);
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/login\?next=%2Fadmin$/);
  });
});
