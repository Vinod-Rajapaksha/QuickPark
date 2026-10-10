import { Page, Locator } from "@playwright/test";
import { BasePage } from "./BasePage";

export class LoginPage extends BasePage {
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly registerLink: Locator;

  constructor(page: Page) {
    super(page);
    this.emailInput = page.locator('input[type="email"], input[name="email"]');
    this.passwordInput = page.locator(
      'input[type="password"], input[name="password"]',
    );
    this.submitButton = page.locator('button[type="submit"]');
    this.registerLink = page.locator('a[href*="register"]');
  }

  async goto() {
    await this.navigateTo("/login");
  }

  async login(email: string, pass: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(pass);
    await this.submitButton.click();
  }
}
