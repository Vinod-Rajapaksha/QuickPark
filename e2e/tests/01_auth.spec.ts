import { test, expect } from "@playwright/test";
import { LoginPage } from "../pages/LoginPage";

test.describe("E2E-AUTH-01: Authentication & Protection Workflows", () => {
  test("should display validation errors or prevent empty submission", async ({
    page,
  }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    await loginPage.submitButton.click();
    await expect(loginPage.emailInput).toBeVisible();
  });

  test("should navigate to register screen from login link", async ({
    page,
  }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    await loginPage.registerLink.click();
    await expect(page).toHaveURL(/.*register/);
  });

  test("should redirect unauthenticated users accessing protected routes", async ({
    page,
  }) => {
    await page.goto("/dashboard");

    await expect(page).toHaveURL(/.*login/);
  });
});
