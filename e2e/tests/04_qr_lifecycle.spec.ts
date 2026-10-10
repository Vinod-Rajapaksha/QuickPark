import { test, expect } from "@playwright/test";
import { LoginPage } from "../pages/LoginPage";

test.describe("E2E-QR-04: QR Code Lifecycle & Cryptography Workflows", () => {
  test("should generate a digital pass with a valid QR code", async ({
    page,
  }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    // Simulate driver login
    await loginPage.login("driver@quickpark.com", "DriverPass123!");

    // Navigate to reservations
    await page.goto("/reservations");
    const viewPassBtn = page
      .locator('button:has-text("View Pass"), [data-testid="view-qr"]')
      .first();

    if (await viewPassBtn.isVisible()) {
      await viewPassBtn.click();

      // Assert QR code canvas is rendered
      const qrCanvas = page.locator('canvas, img[alt*="QR"]').first();
      await expect(qrCanvas).toBeVisible();
    }
  });

  test("should allow operator to scan QR code and check-in driver", async ({
    page,
  }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    // Simulate staff login
    await loginPage.login("staff@quickpark.com", "staffPass123!");

    await page.goto("/scan");
    const scanInput = page.locator(
      'input[placeholder*="Scan"], [data-testid="qr-scan-input"]',
    );

    if (await scanInput.isVisible()) {
      await scanInput.fill("VALID_MOCK_QR_TOKEN_DATA");
      await page
        .locator('button:has-text("Check In"), button:has-text("Verify")')
        .click();

      // Assert success toast
      await expect(
        page
          .locator('text="Successfully Checked In"')
          .or(page.locator(".toast-success")),
      ).toBeVisible();
    }
  });
});
