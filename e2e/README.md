# QuickPark End-to-End (E2E) Testing Subsystem

This directory contains the Playwright End-to-End (E2E) test suite for the QuickPark integrated platform.

## Prerequisites

- Node.js (v18 or higher)
- QuickPark React Web Application dependencies installed in `../frontend-web`

## Installation

```bash
# Navigate to e2e directory
cd e2e

# Install dependencies
npm install

# Install Playwright browser binaries
npx playwright install chromium
```

## Running Tests

```bash
# Run all E2E tests in headless mode (automatically launches dev web server)
npx playwright test

# Run tests in headed browser mode (visible browser window)
npx playwright test --headed

# Run tests with interactive Playwright UI Mode
npx playwright test --ui

# Open the HTML test execution report
npx playwright show-report
```

## Folder Structure

```
e2e/
├── pages/                   # Page Object Model (POM) classes
│   ├── BasePage.ts          # Common page actions & helpers
│   └── LoginPage.ts         # Login form page objects
├── tests/                   # E2E Test specifications
│   ├── 01_auth.spec.ts      # Authentication & route protection tests
│   └── 02_booking_workflow.spec.ts # Facility booking & AI widget tests
├── playwright.config.ts     # Playwright configuration
├── E2E_TEST_PLAN.md         # Comprehensive E2E Test Strategy & Assignment Document
└── package.json
```
