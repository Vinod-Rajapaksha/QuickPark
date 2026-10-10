import { Page } from "@playwright/test";

export class BasePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async navigateTo(path: string) {
    await this.page.goto(path);
  }

  async getToastMessage(): Promise<string | null> {
    const toast = this.page
      .locator('[role="status"], .toast, [data-testid="toast-notification"]')
      .first();
    await toast.waitFor({ state: "visible", timeout: 5000 }).catch(() => null);
    return toast.textContent();
  }
}
