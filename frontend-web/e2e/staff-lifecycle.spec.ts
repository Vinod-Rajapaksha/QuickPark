import { test, expect, type Page, type Response } from "@playwright/test";

const FRONTEND_URL = "http://localhost:5173";

const STAFF_ROUTE = process.env.E2E_STAFF_ROUTE || "/provider/staff";

const STAFF_EMAIL =
  process.env.E2E_EXISTING_STAFF_EMAIL || "quickpark.staff.qa01@example.com";

const FACILITY_NAME = process.env.E2E_FACILITY_NAME || "QuickPark Ampara";

const STAFF_STATUS_ENDPOINT =
  /\/api\/provider\/staff\/[^/]+\/status(?:\?.*)?$/i;

// Login as Parking Owner
async function loginAsProvider(page: Page) {
  const email = process.env.E2E_PROVIDER_EMAIL;
  const password = process.env.E2E_PROVIDER_PASSWORD;

  if (!email || !password) {
    throw new Error("Missing E2E_PROVIDER_EMAIL or E2E_PROVIDER_PASSWORD.");
  }

  await page.goto(`${FRONTEND_URL}/login`);

  await expect(page.getByText("Welcome back")).toBeVisible();

  await page.getByPlaceholder("Enter your email").fill(email);

  await page.locator('input[name="password"]').fill(password);

  const loginPromise = page.waitForResponse(
    (response) =>
      response.request().method() === "POST" &&
      response.url().includes("/api/auth/login"),
    { timeout: 30000 },
  );

  await page
    .getByRole("button", {
      name: /sign in/i,
    })
    .click();

  const loginResponse = await loginPromise;

  console.log("Provider login status:", loginResponse.status());

  expect(
    loginResponse.ok(),
    `Provider login failed: HTTP ${loginResponse.status()}`,
  ).toBeTruthy();

  await expect(page).not.toHaveURL(/\/login(?:\?|$)/, {
    timeout: 20000,
  });
}

// Click a status button, accept confirmation,
// and verify the actual backend PATCH request.
async function changeStaffStatus(
  page: Page,
  staffEmail: string,
  action: "Activate" | "Deactivate",
  expectedActive: boolean,
): Promise<Response> {
  const staffRow = page.locator("tbody tr").filter({
    hasText: staffEmail,
  });

  await expect(staffRow).toBeVisible({
    timeout: 20000,
  });

  const actionButton = staffRow.getByRole("button", {
    name: action,
    exact: true,
  });

  await expect(actionButton).toBeVisible();

  // IMPORTANT:
  // QuickPark uses window.confirm().
  // Register this handler BEFORE clicking the button.
  page.once("dialog", async (dialog) => {
    console.log("Confirmation dialog:", dialog.message());

    expect(dialog.type()).toBe("confirm");

    expect(dialog.message().toLowerCase()).toContain(action.toLowerCase());

    await dialog.accept();

    console.log("Confirmation accepted");
  });

  // Wait for the real PATCH response.
  const responsePromise = page.waitForResponse(
    (response) =>
      response.request().method() === "PATCH" &&
      STAFF_STATUS_ENDPOINT.test(response.url()),
    { timeout: 30000 },
  );

  console.log(`Clicking ${action}...`);

  await actionButton.click();

  const response = await responsePromise;

  console.log(`${action} API response:`, response.status());

  expect(
    response.ok(),
    `${action} failed with HTTP ${response.status()}`,
  ).toBeTruthy();

  // Verify submitted request body
  const payload = response.request().postDataJSON();

  expect(payload.isActive).toBe(expectedActive);

  console.log(`${action} payload verified:`, JSON.stringify(payload));

  return response;
}

test("E2E-ST-02: Deactivate and reactivate existing Staff", async ({
  page,
}) => {
  test.setTimeout(120000);

  // STEP 1: Login
  await loginAsProvider(page);

  // STEP 2: Navigate to Staff Management
  await page.goto(`${FRONTEND_URL}${STAFF_ROUTE}`);

  await expect(
    page.getByRole("heading", {
      name: "Staff Management",
      exact: true,
    }),
  ).toBeVisible({ timeout: 20000 });

  // STEP 3: Locate existing Staff
  let staffRow = page.locator("tbody tr").filter({
    hasText: STAFF_EMAIL,
  });

  await expect(staffRow).toBeVisible({
    timeout: 20000,
  });

  console.log("Staff found:", STAFF_EMAIL);

  await expect(staffRow).toContainText(FACILITY_NAME);

  // STEP 4: Ensure Staff starts Active
  const inactiveStatus = staffRow.getByRole("button", {
    name: "Activate",
    exact: true,
  });

  if (await inactiveStatus.isVisible()) {
    console.log("Staff initially inactive. Restoring Active.");

    await changeStaffStatus(page, STAFF_EMAIL, "Activate", true);

    await expect(staffRow).toContainText("Active", {
      timeout: 20000,
    });
  }

  // STEP 5: Deactivate
  await changeStaffStatus(page, STAFF_EMAIL, "Deactivate", false);

  await expect(staffRow).toContainText("Inactive", {
    timeout: 20000,
  });

  console.log("PASS: Staff deactivated");

  await page.screenshot({
    path: "test-results/staff-deactivated.png",
    fullPage: true,
  });

  // STEP 6: Reload and verify inactive status
  await page.reload();

  staffRow = page.locator("tbody tr").filter({
    hasText: STAFF_EMAIL,
  });

  await expect(staffRow).toBeVisible({
    timeout: 20000,
  });

  await expect(staffRow).toContainText("Inactive");

  console.log("PASS: Inactive status persisted");

  // STEP 7: Reactivate
  await changeStaffStatus(page, STAFF_EMAIL, "Activate", true);

  await expect(staffRow).toContainText("Active", {
    timeout: 20000,
  });

  console.log("PASS: Staff reactivated");

  // STEP 8: Reload and verify active status
  await page.reload();

  staffRow = page.locator("tbody tr").filter({
    hasText: STAFF_EMAIL,
  });

  await expect(staffRow).toBeVisible({
    timeout: 20000,
  });

  await expect(staffRow).toContainText("Active");

  await expect(staffRow).toContainText(FACILITY_NAME);

  await page.screenshot({
    path: "test-results/staff-reactivated.png",
    fullPage: true,
  });

  console.log("PASS: Staff status lifecycle verified after reload.");
});
