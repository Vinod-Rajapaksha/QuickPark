// @vitest-environment jsdom
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import ProviderAnalyticsPage from "../../src/pages/provider/ProviderAnalyticsPage";
import type { RevenueOverview } from "../../src/features/reports/types/reportTypes";

const api = vi.hoisted(() => ({
  getProviderRevenue: vi.fn(),
}));

vi.mock("../../src/features/reports/api/reportApi", () => ({
  reportApi: { getProviderRevenue: api.getProviderRevenue },
}));

// A chart needs a measured box, and jsdom measures nothing; the block's presence is what is asserted.
vi.mock("recharts", () => ({
  AreaChart: () => <div data-testid="revenue-trend" />,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Area: () => null,
  CartesianGrid: () => null,
  Legend: () => null,
  Tooltip: () => null,
  XAxis: () => null,
  YAxis: () => null,
}));

const FACILITY_ID = "11111111-1111-1111-1111-111111111111";
const OTHER_ID = "44444444-4444-4444-4444-444444444444";

const overview = (overrides: Partial<RevenueOverview> = {}): RevenueOverview => ({
  totalRevenue: 100000,
  totalCommission: 10000,
  totalProviderAmount: 90000,
  cashCommissionDue: 1200,
  paidPayments: 20,
  bookingsPaid: 20,
  cardPayments: 12,
  cashPayments: 8,
  failedPayments: 0,
  cancelledPayments: 0,
  refundedPayments: 0,
  pendingCashConfirmations: 5,
  byMethod: [],
  trend: [],
  byProperty: [],
  byVehicleType: [],
  ...overrides,
});

const revenueCalls = (): Record<string, unknown>[] =>
  api.getProviderRevenue.mock.calls.map(([query]) => query);

const renderAnalytics = (): void => {
  render(
    <MemoryRouter initialEntries={["/analytics"]}>
      <Routes>
        <Route path="/analytics" element={<ProviderAnalyticsPage />} />
      </Routes>
    </MemoryRouter>,
  );
};

// Every period is read twice on this page too: the one on screen and the equal one before it.
const loadBoth = (report: RevenueOverview): void => {
  api.getProviderRevenue.mockResolvedValue(report);
};

const heading = (name: string): HTMLElement =>
  screen.getByRole("heading", { level: 2, name });

const sectionOf = (name: string): HTMLElement => {
  const section = heading(name).closest("section");
  if (!section) throw new Error(`"${name}" does not head a section.`);
  return section as HTMLElement;
};

// The label is the dt and the number the dd written under it, so a count is read through its name.
const countFor = (label: string): string => {
  const term = within(sectionOf("Bookings in the period")).getByText(label, { selector: "dt" });
  const value = term.parentElement?.querySelector("dd");
  if (!value) throw new Error(`No count written under "${label}".`);
  return (value.textContent ?? "").trim();
};

const cellsOf = (name: string): string[] => {
  const row = screen.getByText(name).closest("tr");
  if (!row) throw new Error(`No row for ${name}.`);
  return within(row)
    .getAllByRole("cell")
    .map((cell) => (cell.textContent ?? "").trim());
};

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("the counts a provider's review keeps", () => {
  it("counts every payment the period touched, not only the ones the money rests on", async () => {
    loadBoth(
      overview({
        totalRevenue: 80000,
        totalProviderAmount: 64000,
        totalCommission: 8000,
        bookingsPaid: 20,
        paidPayments: 40,
        cardPayments: 25,
        cashPayments: 15,
        refundedPayments: 4,
        cancelledPayments: 6,
        failedPayments: 9,
      }),
    );
    renderAnalytics();

    expect(await screen.findByText("Bookings in the period")).toBeTruthy();
    expect(
      screen.getByText("Counts read from every payment the period touched, not only the paid ones."),
    ).toBeTruthy();
    expect(countFor("Paid")).toBe("40");
    expect(countFor("By card")).toBe("25");
    expect(countFor("By cash")).toBe("15");
    expect(countFor("Refunded")).toBe("4");
    expect(countFor("Cancelled")).toBe("6");
    expect(countFor("Failed")).toBe("9");
    expect(screen.getByText("Counted in the totals")).toBeTruthy();
    expect(screen.getAllByText("Among the paid")).toHaveLength(2);
    expect(screen.getByText("Already out of the totals")).toBeTruthy();
    expect(screen.getByText("Never paid for")).toBeTruthy();
    expect(screen.getByText("Did not go through")).toBeTruthy();
    // The money tiles count the bookings that carry them, which the payment rows need not match.
    expect(screen.getByText("20 paid bookings")).toBeTruthy();
  });

  it("keeps a kind of payment the period never saw on the page as a zero", async () => {
    loadBoth(
      overview({
        paidPayments: 30,
        cardPayments: 30,
        cashPayments: 0,
        refundedPayments: 0,
        cancelledPayments: 0,
        failedPayments: 0,
      }),
    );
    renderAnalytics();

    await screen.findByText("Bookings in the period");
    const section = sectionOf("Bookings in the period");
    expect(within(section).getAllByText("0")).toHaveLength(4);
    expect(countFor("Paid")).toBe("30");
    expect(countFor("By cash")).toBe("0");
    // Nothing here is a dash or a missing row: the owner reads the absence as a number.
    expect(within(section).queryByText("—")).toBeNull();
  });
});

describe("the tables under a provider's review", () => {
  it("keeps the hours bays were held beside the vehicle types alone", async () => {
    loadBoth(
      overview({
        byProperty: [
          {
            facilityId: FACILITY_ID,
            facilityName: "Fort Clock",
            amount: 60000,
            commission: 6000,
            providerAmount: 54000,
            payments: 12,
          },
        ],
        byVehicleType: [
          {
            vehicleTypeId: "vt-1",
            vehicleTypeName: "Car",
            amount: 30000,
            commission: 3000,
            providerAmount: 27000,
            payments: 6,
            bookedHours: 210,
          },
        ],
        byMethod: [
          {
            paymentMethod: "CARD",
            amount: 10000,
            commission: 1000,
            providerAmount: 9000,
            payments: 3,
          },
        ],
      }),
    );
    renderAnalytics();

    await screen.findByText("Property performance");
    expect(screen.getAllByText("Bay hours")).toHaveLength(1);
    expect(
      screen.getByText("Bay hours are the time each category held a bay, summed over the period."),
    ).toBeTruthy();
    expect(cellsOf("Car")).toHaveLength(7);
    expect(cellsOf("Fort Clock")).toHaveLength(6);
    expect(cellsOf("Card")).toHaveLength(6);
    expect(within(screen.getByText("Car").closest("tr") as HTMLElement).getByText("210")).toBeTruthy();
  });

  it("shows what each property put in and how much of the period it was", async () => {
    loadBoth(
      overview({
        totalRevenue: 100000,
        byProperty: [
          {
            facilityId: FACILITY_ID,
            facilityName: "Fort Clock",
            amount: 90000,
            commission: 9000,
            providerAmount: 81000,
            payments: 18,
          },
          {
            facilityId: OTHER_ID,
            facilityName: "Kandy Yard",
            amount: 10000,
            commission: 1000,
            providerAmount: 9000,
            payments: 2,
          },
        ],
      }),
    );
    renderAnalytics();

    await screen.findByText("Property performance");
    const table = sectionOf("Property performance");
    expect(
      within(table).getAllByRole("columnheader").map((cell) => cell.textContent?.trim()),
    ).toEqual(["Property", "Collected", "Your share", "Platform fee", "Bookings", "Share"]);
    expect(cellsOf("Fort Clock")).toEqual([
      "Fort Clock",
      "90,000 LKR",
      "81,000 LKR",
      "9,000 LKR",
      "18",
      "90%",
    ]);
    expect(cellsOf("Kandy Yard")).toEqual([
      "Kandy Yard",
      "10,000 LKR",
      "9,000 LKR",
      "1,000 LKR",
      "2",
      "10%",
    ]);
    // The order the server ranked the properties in survives the trip onto the page.
    expect(
      [...table.querySelectorAll("tbody tr td:first-child")].map((cell) => cell.textContent?.trim()),
    ).toEqual(["Fort Clock", "Kandy Yard"]);
  });

  it("leaves each table its own words when the period holds no paid booking", async () => {
    loadBoth(overview({ totalRevenue: 5000, paidPayments: 5, bookingsPaid: 5 }));
    renderAnalytics();

    expect(await screen.findByText("No paid booking on a property yet in this period.")).toBeTruthy();
    expect(
      screen.getByText("No paid booking for a vehicle type yet in this period."),
    ).toBeTruthy();
    expect(screen.getByText("No paid booking by any method yet in this period.")).toBeTruthy();
    // Three tables, three separate admissions; none of them claims the others are empty too.
    expect(screen.getAllByRole("table")).toHaveLength(3);
  });
});

describe("reading a provider's review again", () => {
  it("re-reads the period it is showing and the one it is compared against", async () => {
    loadBoth(overview());
    renderAnalytics();

    await screen.findByText("100,000 LKR");
    const first = revenueCalls();
    expect(first).toHaveLength(2);

    fireEvent.click(screen.getByRole("button", { name: "Refresh" }));

    await waitFor(() => expect(revenueCalls()).toHaveLength(4));
    const after = revenueCalls();
    expect(after[2]).toEqual(after[0]);
    expect(after[3]).toEqual(after[1]);
  });

  it("moves its own sentence with the period the owner picks", async () => {
    loadBoth(overview());
    renderAnalytics();

    const sentence = await screen.findByText(/^Your whole business over /);
    expect(sentence.textContent).toMatch(/^Your whole business over .+ — .+\.$/);
    const window = sentence.textContent;

    fireEvent.change(screen.getByLabelText("Reporting period"), { target: { value: "TODAY" } });

    await waitFor(() => expect(revenueCalls()).toHaveLength(4));
    expect(screen.getByText(/^Your whole business over /).textContent).not.toBe(window);
    // The review stays a whole-business read: no period switch narrows it to one property.
    for (const query of revenueCalls().slice(-2)) {
      expect(query.byProperty).toBe(true);
      expect(query.facilityId).toBeUndefined();
    }
  });

  it("speaks for itself when the server refuses without a reason", async () => {
    api.getProviderRevenue.mockRejectedValue(new Error("The line dropped out mid-read."));
    renderAnalytics();

    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toBe("Your revenue for this period could not be read.");
    // A failed read leaves no half-built review behind: the tiles are simply not there.
    expect(screen.queryByText("Waiting on staff")).toBeNull();
    expect(screen.queryByText("Bookings in the period")).toBeNull();
  });
});
