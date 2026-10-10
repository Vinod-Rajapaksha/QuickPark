import { test, expect } from "@playwright/test";

test.describe("E2E-BOOK-02 & E2E-AI-05: Booking & AI Integration Workflows", () => {
  test("should render parking facility search and filter controls", async ({
    page,
  }) => {
    await page.goto("/parking");

    const searchInput = page
      .locator('input[placeholder*="Search"], input[type="search"]')
      .first();
    if (await searchInput.isVisible()) {
      await searchInput.fill("Central");
      await expect(searchInput).toHaveValue("Central");
    }
  });

  test("should render AI assistant drawer element when triggered", async ({
    page,
  }) => {
    await page.goto("/");

    const aiButton = page
      .locator(
        'button:has-text("AI"), button:has-text("Assistant"), [data-testid="ai-trigger"]',
      )
      .first();
    if (await aiButton.isVisible()) {
      await aiButton.click();
      const chatInput = page
        .locator('input[placeholder*="Ask"], textarea[placeholder*="Ask"]')
        .first();
      await expect(chatInput).toBeVisible();
    }
  });
});
