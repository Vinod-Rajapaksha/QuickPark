import { test, expect, type Page } from "@playwright/test";

const BASE = "http://localhost:5173";

const staffRoute = process.env.E2E_STAFF_ROUTE || "/provider/staff";

const staffEmail =
  process.env.E2E_EXISTING_STAFF_EMAIL || "quickpark.staff.qa01@example.com";

async function loginAsProvider(page: Page) {
  const email = process.env.E2E_PROVIDER_EMAIL;
  const password = process.env.E2E_PROVIDER_PASSWORD;

  if (!email || !password) {
    throw new Error("Missing Provider E2E credentials");
  }

  await page.goto(`${BASE}/login`);

  await page.getByPlaceholder("Enter your email").fill(email);
  await page.locator('input[name="password"]').fill(password);

  const loginPromise = page.waitForResponse(
    (r) =>
      r.request().method() === "POST" && r.url().includes("/api/auth/login"),
    { timeout: 30000 },
  );

  await page
    .getByRole("button", {
      name: /sign in/i,
    })
    .click();

  const response = await loginPromise;
  expect(response.ok()).toBeTruthy();

  await expect(page).not.toHaveURL(/\/login(?:\?|$)/, { timeout: 20000 });
}

test("E2E-ST-04: Edit Staff and restore original details", async ({ page }) => {
  test.setTimeout(120000);

  await loginAsProvider(page);

  await page.goto(`${BASE}${staffRoute}`);

  const staffRow = page.locator("tbody tr").filter({
    hasText: staffEmail,
  });

  await expect(staffRow).toBeVisible({
    timeout: 20000,
  });

  // Open Edit Staff modal
  await staffRow
    .getByRole("button", {
      name: "Edit",
      exact: true,
    })
    .click();

  await expect(
    page.getByRole("heading", {
      name: "Edit Staff Member",
    }),
  ).toBeVisible();

  const form = page.locator("form").filter({
    has: page.locator('input[name="position"]'),
  });

  const positionInput = form.locator('input[name="position"]');

  const originalPosition = await positionInput.inputValue();

  const newPosition = `QA Supervisor ${Date.now()}`;

  // Verify the Staff email is not editable
  await expect(form.locator('input[name="email"]')).toBeDisabled();

  // Modify position
  await positionInput.fill(newPosition);

  const updatePromise = page.waitForResponse(
    (r) =>
      r.request().method() === "PUT" &&
      /\/api\/provider\/staff\/[^/]+(?:\?.*)?$/i.test(r.url()),
    { timeout: 30000 },
  );

  await form
    .getByRole("button", {
      name: "Save Changes",
    })
    .click();

  const updateResponse = await updatePromise;

  console.log("Staff update HTTP:", updateResponse.status());

  expect(updateResponse.ok()).toBeTruthy();

  const updatePayload = updateResponse.request().postDataJSON();

  expect(updatePayload.position).toBe(newPosition);

  // Verify updated position
  await expect(staffRow).toContainText(newPosition, { timeout: 20000 });

  await page.reload();

  await expect(staffRow).toContainText(newPosition, { timeout: 20000 });

  await page.screenshot({
    path: "test-results/staff-edit-passed.png",
    fullPage: true,
  });

  console.log("PASS: Staff position update persisted");

  // Restore original Staff position
  await staffRow
    .getByRole("button", {
      name: "Edit",
      exact: true,
    })
    .click();

  const restoreForm = page.locator("form").filter({
    has: page.locator('input[name="position"]'),
  });

  await restoreForm.locator('input[name="position"]').fill(originalPosition);

  const restorePromise = page.waitForResponse(
    (r) =>
      r.request().method() === "PUT" &&
      /\/api\/provider\/staff\/[^/]+(?:\?.*)?$/i.test(r.url()),
    { timeout: 30000 },
  );

  await restoreForm
    .getByRole("button", {
      name: "Save Changes",
    })
    .click();

  const restoreResponse = await restorePromise;

  expect(restoreResponse.ok()).toBeTruthy();

  await page.reload();

  await expect(staffRow).toContainText(originalPosition, { timeout: 20000 });

  console.log("PASS: Original Staff position restored");
});
