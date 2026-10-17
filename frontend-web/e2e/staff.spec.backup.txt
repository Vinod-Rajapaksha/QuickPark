/// <reference types="node" />
import { test, expect } from "@playwright/test";

const FRONTEND = "http://localhost:5173";
const API = "http://localhost:8080/api";

test("E2E-ST-01: Provider creates staff and assigns a facility", async ({
  page,
  request,
}) => {
  test.setTimeout(120000);

  const email = process.env.E2E_PROVIDER_EMAIL;
  const password = process.env.E2E_PROVIDER_PASSWORD;
  const facilityName = process.env.E2E_FACILITY_NAME;
  const staffRoute = process.env.E2E_STAFF_ROUTE || "/provider/staff";

  if (!email || !password || !facilityName) {
    throw new Error("Missing Provider email, password or facility name.");
  }

  // STEP 1: Check backend connection
  const backend = await request.get(`${API}/auth/me`, {
    failOnStatusCode: false,
    timeout: 10000,
  });

  console.log("Backend response:", backend.status());

  // STEP 2: Login as Provider
  await page.goto(`${FRONTEND}/login`);

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

  const login = await loginPromise;
  console.log("Provider login status:", login.status());

  expect(login.ok(), "Provider login failed").toBeTruthy();

  await expect(page).not.toHaveURL(/\/login(?:\?|$)/, {
    timeout: 20000,
  });

  // STEP 3: Open Staff Management
  await page.goto(`${FRONTEND}${staffRoute}`);

  await expect(
    page.getByRole("heading", {
      name: "Staff Management",
      exact: true,
    }),
  ).toBeVisible({ timeout: 20000 });

  // STEP 4: Open Add Staff modal
  await page
    .getByRole("button", {
      name: "Add Staff Member",
      exact: true,
    })
    .click();

  await expect(
    page.getByRole("heading", {
      name: "Add Staff Member",
    }),
  ).toBeVisible();

  // STEP 5: Generate test data
  const unique = Date.now();
  const staffName = `QA Staff ${unique}`;
  const staffEmail = `qa.staff.${unique}@example.com`;

  // STEP 6: Assign facility
  const facilitySelect = page.locator('select[name="facilityId"]');

  await expect(
    facilitySelect.locator("option", {
      hasText: facilityName,
    }),
  ).toHaveCount(1, { timeout: 20000 });

  await facilitySelect.selectOption({
    label: facilityName,
  });

  const facilityId = await facilitySelect.inputValue();
  expect(facilityId).not.toBe("");

  // STEP 7: Fill Staff form
  await page.locator('input[name="fullName"]').fill(staffName);
  await page.locator('input[name="email"]').fill(staffEmail);
  await page.locator('input[name="password"]').fill("TestStaff@123456");
  await page.locator('input[name="phone"]').fill("0761234567");
  await page.locator('input[name="nic"]').fill("200012345678");

  await page.locator('select[name="type"]').selectOption("STANDARD");
  await page.locator('input[name="position"]').fill("Parking Assistant");

  // STEP 8: Submit through real backend
  const creationPromise = page.waitForResponse(
    (r) =>
      r.request().method() === "POST" &&
      /\/api\/provider\/staff(?:\?.*)?$/i.test(r.url()),
    { timeout: 30000 },
  );

  await page
    .getByRole("button", {
      name: "Create Staff",
      exact: true,
    })
    .click();

  const creation = await creationPromise;

  console.log("Staff creation status:", creation.status());

  expect(
    creation.ok(),
    `Staff creation failed: HTTP ${creation.status()}`,
  ).toBeTruthy();

  // STEP 9: Verify submitted data
  const payload = creation.request().postDataJSON();

  expect(payload.fullName).toBe(staffName);
  expect(payload.email).toBe(staffEmail);
  expect(payload.facilityId).toBe(facilityId);

  // STEP 10: Verify staff displayed
  let staffRow = page.locator("tbody tr").filter({
    hasText: staffEmail,
  });

  await expect(staffRow).toBeVisible({ timeout: 20000 });
  await expect(staffRow).toContainText(staffName);
  await expect(staffRow).toContainText(facilityName);

  // STEP 11: Reload to verify persistence
  await page.reload();

  staffRow = page.locator("tbody tr").filter({
    hasText: staffEmail,
  });

  await expect(staffRow).toBeVisible({ timeout: 20000 });
  await expect(staffRow).toContainText(staffName);
  await expect(staffRow).toContainText(facilityName);

  // STEP 12: Save evidence
  await page.screenshot({
    path: "test-results/staff-e2e-success.png",
    fullPage: true,
  });

  console.log("PASS: Staff created and facility verified.");
});
