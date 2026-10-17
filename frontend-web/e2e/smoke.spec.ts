/// <reference types="node" />
import { test, expect } from "@playwright/test";

test("E2E-01: QuickPark frontend loads successfully", async ({ page }) => {
  const response = await page.goto("/");

  expect(response).not.toBeNull();
  expect(response!.status()).toBeLessThan(400);

  await expect(page.locator("body")).toBeVisible();

  await page.screenshot({
    path: "test-results/quickpark-home.png",
    fullPage: true,
  });
});
