import { test, expect } from "@playwright/test";
import { LoginPage } from "../pages/LoginPage";

test.describe("E2E-ADMIN-USABILITY: Admin Dashboard Usability & Accessibility", () => {
  test.beforeEach(async ({ page }) => {
    let isAuth = false;

    await page.route("**/auth/login", async (route) => {
      isAuth = true;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          token: "fake-admin-token",
          user: { id: "1", email: "admin@quickpark.com", role: 3 },
        }),
      });
    });

    await page.route("**/auth/me", async (route) => {
      if (isAuth) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            id: "1",
            email: "admin@quickpark.com",
            role: 3,
          }),
        });
      } else {
        await route.fulfill({ status: 401 });
      }
    });

    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login("admin@quickpark.com", "AdminPass123!");
    await expect(page).toHaveURL(/.*\/admin.*/);
  });

  test("should support complete keyboard navigation for accessibility", async ({
    page,
  }) => {
    await expect(page.locator("body")).toBeVisible();

    await page.keyboard.press("Tab");

    let isFocusableElement = false;
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press("Tab");

      const activeElementTagName = await page.evaluate(() =>
        document.activeElement?.tagName.toLowerCase(),
      );

      if (
        ["a", "button", "input", "select", "textarea"].includes(
          activeElementTagName as string,
        )
      ) {
        isFocusableElement = true;
      }
    }

    expect(isFocusableElement).toBeTruthy();
  });

  test("should remain fully responsive and readable on iPad Mini viewport", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 768, height: 1024 });

    const isScrollable = await page.evaluate(() => {
      return (
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth
      );
    });

    expect(isScrollable).toBeFalsy();

    const usersLink = page
      .locator('a[href*="users"], button:has-text("Manage Users")')
      .first();
    await expect(usersLink).toBeAttached();
  });
});
