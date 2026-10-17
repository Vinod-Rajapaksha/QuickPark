/// <reference types="node" />
import { test, expect } from "@playwright/test";

const FRONTEND = "http://localhost:5173";
const API = "http://localhost:8080/api";

test("E2E-FB-01: Driver submits system feedback", async ({ page, request }) => {
  test.setTimeout(90000);

  const email = process.env.E2E_DRIVER_EMAIL;
  const password = process.env.E2E_DRIVER_PASSWORD;
  const feedbackRoute = process.env.E2E_FEEDBACK_ROUTE;

  if (!email || !password || !feedbackRoute) {
    throw new Error("Missing Driver email, password or feedback route.");
  }

  // STEP 1: Check backend connection
  const backend = await request.get(`${API}/auth/me`, {
    failOnStatusCode: false,
    timeout: 10000,
  });

  console.log("Backend response:", backend.status());

  // STEP 2: Login as Driver
  await page.goto(`${FRONTEND}/login`);

  await expect(page.getByText("Welcome back")).toBeVisible();

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
  console.log("Driver login status:", login.status());

  expect(
    login.ok(),
    `Driver login failed: HTTP ${login.status()}`,
  ).toBeTruthy();

  await expect(page).not.toHaveURL(/\/login(?:\?|$)/, {
    timeout: 20000,
  });

  // STEP 3: Open Driver Feedback page
  await page.goto(`${FRONTEND}${feedbackRoute}`);

  await expect(
    page.getByRole("heading", {
      name: "Your Parking Feedback",
    }),
  ).toBeVisible({ timeout: 20000 });

  // STEP 4: Open System Feedback form
  await page
    .getByRole("button", {
      name: "Give System Feedback",
    })
    .click();

  await expect(page.getByText("Share your QuickPark experience")).toBeVisible();

  // STEP 5: Choose rating
  await page
    .getByRole("button", {
      name: "5 stars",
    })
    .click();

  // STEP 6: Enter unique feedback comment
  const comment = `QuickPark E2E Feedback ${Date.now()}`;

  await page
    .getByPlaceholder("Tell us about your QuickPark experience...")
    .fill(comment);

  // STEP 7: Submit and monitor real backend API
  const feedbackPromise = page.waitForResponse(
    (r) =>
      r.request().method() === "POST" &&
      /\/api\/Feedback(?:\?.*)?$/i.test(r.url()),
    { timeout: 30000 },
  );

  await page
    .getByRole("button", {
      name: "Submit Feedback",
    })
    .click();

  const feedbackResponse = await feedbackPromise;

  console.log("Feedback submission status:", feedbackResponse.status());

  expect(
    feedbackResponse.ok(),
    `Feedback submission failed: HTTP ${feedbackResponse.status()}`,
  ).toBeTruthy();

  // STEP 8: Verify API request
  const body = feedbackResponse.request().postDataJSON();

  expect(body.type).toBe(1);
  expect(body.rating).toBe(5);
  expect(body.comment).toBe(comment);
  expect(body.parkingId).toBeNull();
  expect(body.reservationId).toBeNull();

  // STEP 9: Verify success confirmation
  await expect(page.getByText("Thank you for your feedback")).toBeVisible({
    timeout: 15000,
  });

  await expect(
    page.getByText(/waiting for approval before appearing publicly/i),
  ).toBeVisible();

  // STEP 10: Capture evidence
  await page.screenshot({
    path: "test-results/feedback-e2e-success.png",
    fullPage: true,
  });

  console.log("PASS: Driver submitted system feedback.");
});
