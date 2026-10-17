import { test, expect, type Request } from "@playwright/test";

const BASE_URL = "http://localhost:5173";

test("E2E-ST-03: Validate Staff creation form", async ({ page }) => {
  test.setTimeout(90000);

  const email = process.env.E2E_PROVIDER_EMAIL;
  const password = process.env.E2E_PROVIDER_PASSWORD;
  const facilityName = process.env.E2E_FACILITY_NAME || "QuickPark Ampara";

  if (!email || !password) {
    throw new Error("Provider test credentials are missing.");
  }

  // 1. Login as Provider
  await page.goto(`${BASE_URL}/login`);

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

  expect(loginResponse.ok()).toBeTruthy();

  await expect(page).not.toHaveURL(/\/login(?:\?|$)/, {
    timeout: 20000,
  });

  // 2. Open Staff Management
  await page.goto(
    `${BASE_URL}${process.env.E2E_STAFF_ROUTE || "/provider/staff"}`,
  );

  await expect(
    page.getByRole("heading", {
      name: "Staff Management",
      exact: true,
    }),
  ).toBeVisible();

  // 3. Open Staff Creation form
  await page
    .getByRole("button", {
      name: "Add Staff Member",
      exact: true,
    })
    .click();

  const form = page.locator("form").filter({
    has: page.locator('input[name="fullName"]'),
  });

  const createButton = form.getByRole("button", {
    name: "Create Staff",
    exact: true,
  });

  // 4. Verify facility is required
  await expect(createButton).toBeDisabled();

  console.log("PASS: Facility selection required");

  // 5. Select approved test facility
  await form.locator('select[name="facilityId"]').selectOption({
    label: facilityName,
  });

  await expect(createButton).toBeEnabled();

  // 6. Check which required fields have native validation
  const fieldNames = [
    "fullName",
    "email",
    "password",
    "phone",
    "nic",
    "position",
  ];

  for (const name of fieldNames) {
    const field = form.locator(`[name="${name}"]`);

    const details = await field.evaluate((element: HTMLInputElement) => ({
      required: element.required,
      valid: element.checkValidity(),
      value: element.value,
    }));

    console.log(`${name}:`, details);
  }

  // 7. Monitor any actual Staff creation attempts
  const createRequests: Request[] = [];

  page.on("request", (request) => {
    if (
      request.method() === "POST" &&
      /\/api\/provider\/staff(?:\?.*)?$/i.test(request.url())
    ) {
      createRequests.push(request);
    }
  });

  // 8. Attempt to submit blank required fields
  await createButton.click();

  // Allow pending browser validation or API handling to settle
  await expect(
    page.getByRole("heading", {
      name: "Add Staff Member",
    }),
  ).toBeVisible();

  // 9. Determine whether native validation blocked submission
  const formIsValid = await form.evaluate((element: HTMLFormElement) =>
    element.checkValidity(),
  );

  console.log("Empty form native validity:", formIsValid);
  console.log("Create API requests:", createRequests.length);

  if (!formIsValid) {
    expect(
      createRequests.length,
      "Invalid form must not send a Staff creation request",
    ).toBe(0);

    console.log("PASS: Browser validation blocked incomplete Staff creation.");
  } else {
    // If native validation allows the form, inspect the real
    // API response before concluding validation works.
    throw new Error(
      "Empty Staff form is considered valid by the browser. " +
        "Inspect the Staff create request and backend validation; " +
        `observed create requests: ${createRequests.length}.`,
    );
  }

  // 10. Save screenshot
  await page.screenshot({
    path: "test-results/staff-validation.png",
    fullPage: true,
  });

  // 11. Cancel form
  await form
    .getByRole("button", {
      name: "Cancel",
    })
    .click();

  await expect(
    page.getByRole("heading", {
      name: "Add Staff Member",
    }),
  ).not.toBeVisible();

  console.log("PASS: Staff form validation test completed.");
});
