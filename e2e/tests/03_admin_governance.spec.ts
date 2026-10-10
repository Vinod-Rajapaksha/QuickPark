import { test, expect } from "@playwright/test";
import { LoginPage } from "../pages/LoginPage";

test.describe("E2E-ADMIN-03: Platform Admin & Governance Workflows", () => {
  test("should allow platform admin to view users and manage roles", async ({
    page,
  }) => {
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

    const usersLink = page
      .locator('a[href*="users"], button:has-text("Manage Users")')
      .first();
    await expect(usersLink).toBeVisible();
    await usersLink.dispatchEvent("click");
    await expect(page.locator("table, .user-list").first()).toBeVisible();
  });

  test("should prevent non-admin from accessing admin endpoints", async ({
    page,
  }) => {
    let isAuth = false;
    await page.route("**/auth/login", async (route) => {
      isAuth = true;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          token: "fake-driver-token",
          user: { id: "2", email: "driver@quickpark.com", role: 0 },
        }),
      });
    });

    await page.route("**/auth/me", async (route) => {
      if (isAuth) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            id: "2",
            email: "driver@quickpark.com",
            role: 0,
          }),
        });
      } else {
        await route.fulfill({ status: 401 });
      }
    });

    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login("driver@quickpark.com", "DriverPass123!");

    await expect(page).toHaveURL(/.*\/dashboard/);

    await page.goto("/admin/dashboard");
    await expect(page.locator('text="Unauthorized"')).toBeVisible();
  });
});
