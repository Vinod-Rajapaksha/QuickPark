// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import EarningsPage from "../../src/pages/provider/EarningsPage";
import FacilityRevenuePage from "../../src/pages/provider/FacilityRevenuePage";
import ProviderAnalyticsPage from "../../src/pages/provider/ProviderAnalyticsPage";
import type { ParkingFacility } from "../../src/features/parking/types/parkingTypes";
import type { RevenueOverview } from "../../src/features/reports/types/reportTypes";

const api = vi.hoisted(() => ({
  getProviderRevenue: vi.fn(),
  getMyFacilities: vi.fn(),
}));

vi.mock("../../src/features/reports/api/reportApi", () => ({
  reportApi: { getProviderRevenue: api.getProviderRevenue },
}));

vi.mock("../../src/features/parking/api/parkingApi", () => ({
  parkingApi: { getMyFacilities: api.getMyFacilities },
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

const overview = (overrides: Partial<RevenueOverview> = {}): RevenueOverview => ({
  totalRevenue: 125000,
  totalCommission: 15000,
  totalProviderAmount: 110000,
  cashCommissionDue: 2000,
  paidPayments: 50,
  bookingsPaid: 50,
  cardPayments: 30,
  cashPayments: 20,
  failedPayments: 0,
  cancelledPayments: 0,
  refundedPayments: 0,
  pendingCashConfirmations: 0,
  byMethod: [],
  trend: [],
  byProperty: [],
  byVehicleType: [],
  ...overrides,
});

const owned = {
  facilityId: FACILITY_ID,
  name: "Fort Clock",
  slotCount: 12,
} as unknown as ParkingFacility;

// The period reads on a two-call fetch: the chosen one and the equal period before it.
const revenueCalls = () => api.getProviderRevenue.mock.calls.map(([query]) => query);

const renderRevenue = () =>
  render(
    <MemoryRouter initialEntries={["/revenue"]}>
      <Routes>
        <Route path="/revenue" element={<EarningsPage />} />
      </Routes>
    </MemoryRouter>,
  );

const renderPropertyRevenue = () =>
  render(
    <MemoryRouter initialEntries={[`/facilities/${FACILITY_ID}/revenue`]}>
      <Routes>
        <Route path="/facilities/:facilityId/revenue" element={<FacilityRevenuePage />} />
      </Routes>
    </MemoryRouter>,
  );

const renderAnalytics = () =>
  render(
    <MemoryRouter initialEntries={["/analytics"]}>
      <Routes>
        <Route path="/analytics" element={<ProviderAnalyticsPage />} />
      </Routes>
    </MemoryRouter>,
  );

beforeEach(() => {
  api.getMyFacilities.mockResolvedValue([owned]);
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("provider revenue page", () => {
  it("sends the whole current month to the server rather than filtering rows here", async () => {
    api.getProviderRevenue.mockResolvedValue(overview());

    renderRevenue();

    await screen.findByText("125,000 LKR");
    const [period, before] = revenueCalls();
    const now = new Date();
    const from = new Date(period.from);
    const to = new Date(period.to);

    expect(from.getDate()).toBe(1);
    expect(from.getHours()).toBe(0);
    expect(from.getMinutes()).toBe(0);
    expect(from.getMilliseconds()).toBe(0);
    expect(to.getMonth()).toBe(now.getMonth());
    expect(to.getDate()).toBe(new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate());
    expect(to.getHours()).toBe(23);
    expect(to.getMinutes()).toBe(59);
    expect(to.getSeconds()).toBe(59);
    expect(to.getMilliseconds()).toBe(999);
    // The comparison period sits immediately behind the one on screen, and holds just as long.
    expect(new Date(before.to).getTime()).toBeLessThan(from.getTime());
    expect(to.getTime() - from.getTime()).toBe(
      new Date(before.to).getTime() - new Date(before.from).getTime(),
    );
    expect(period.byProperty).toBe(true);
    expect(period.facilityId).toBeUndefined();
  });

  it("shows what the platform counted, split by property", async () => {
    api.getProviderRevenue.mockResolvedValue(
      overview({
        byProperty: [
          {
            facilityId: FACILITY_ID,
            facilityName: "Fort Clock",
            amount: 125000,
            commission: 15000,
            providerAmount: 110000,
            payments: 50,
          },
        ],
        trend: [
          {
            period: "2026-09",
            amount: 125000,
            commission: 15000,
            providerAmount: 110000,
            cardAmount: 90000,
            cashAmount: 35000,
            payments: 50,
          },
        ],
      }),
    );

    renderRevenue();

    expect(await screen.findByText("Fort Clock")).toBeTruthy();
    expect(screen.getByText("100%")).toBeTruthy();
    expect(screen.getByTestId("revenue-trend")).toBeTruthy();
  });

  it("says so plainly when the chosen period holds no paid booking", async () => {
    api.getProviderRevenue.mockResolvedValue(overview({ totalRevenue: 0, paidPayments: 0 }));

    renderRevenue();

    expect(await screen.findByText(/No paid bookings in/)).toBeTruthy();
  });

  it("carries the server's refusal when a period cannot be read", async () => {
    api.getProviderRevenue.mockRejectedValue({
      response: { status: 401, data: { message: "Your account is not a parking provider." } },
    });

    renderRevenue();

    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toContain("Your account is not a parking provider.");
  });

  it("re-reads the server with the new period when the owner picks another one", async () => {
    api.getProviderRevenue.mockResolvedValue(overview());

    renderRevenue();

    await screen.findByText("125,000 LKR");
    fireEvent.change(screen.getByLabelText("Reporting period"), {
      target: { value: "TODAY" },
    });

    await waitFor(() => expect(revenueCalls().length).toBeGreaterThan(2));
    const [latest] = revenueCalls().slice(-2);
    const now = new Date();
    const from = new Date(latest.from);

    expect(from.getFullYear()).toBe(now.getFullYear());
    expect(from.getMonth()).toBe(now.getMonth());
    expect(from.getDate()).toBe(now.getDate());
    expect(from.getTime()).toBe(new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime());
  });
});

describe("property revenue page", () => {
  it("narrows the same report to the property in the address", async () => {
    api.getProviderRevenue.mockResolvedValue(
      overview({
        byVehicleType: [
          {
            vehicleTypeId: "vt-1",
            vehicleTypeName: "Car",
            amount: 125000,
            commission: 15000,
            providerAmount: 110000,
            payments: 50,
            bookedHours: 260,
          },
        ],
      }),
    );

    renderPropertyRevenue();

    await screen.findByText("Car");
    const [period] = revenueCalls();

    expect(period.facilityId).toBe(FACILITY_ID);
    expect(period.byProperty).toBe(false);
    expect(screen.getByText("260")).toBeTruthy();
    expect(await screen.findByText(/Fort Clock revenue/)).toBeTruthy();
  });

  it("shows the ownership refusal the server answers a foreign property with", async () => {
    api.getProviderRevenue.mockRejectedValue({
      response: {
        status: 401,
        data: { message: "You can only read reports for your own parking properties." },
      },
    });

    renderPropertyRevenue();

    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toContain(
      "You can only read reports for your own parking properties.",
    );
  });

  it("drops the dates it was holding when the owner resets the period", async () => {
    api.getProviderRevenue.mockResolvedValue(overview());

    renderRevenue();
    await screen.findByText("125,000 LKR");

    const select = screen.getByLabelText("Reporting period");
    fireEvent.change(select, { target: { value: "CUSTOM" } });
    fireEvent.change(screen.getByLabelText("From"), { target: { value: "2026-09-01" } });
    fireEvent.click(screen.getByRole("button", { name: "Apply" }));

    await waitFor(() => expect(revenueCalls().length).toBeGreaterThan(2));
    fireEvent.click(screen.getByRole("button", { name: "Reset" }));
    fireEvent.change(select, { target: { value: "CUSTOM" } });

    expect((screen.getByLabelText("From") as HTMLInputElement).value).toBe("");
  });
});

describe("provider analytics page", () => {
  it("aggregates every owned property, the same way the revenue page does", async () => {
    api.getProviderRevenue.mockResolvedValue(overview());

    renderAnalytics();

    await screen.findByText("125,000 LKR");
    const [period] = revenueCalls();

    expect(period.byProperty).toBe(true);
    expect(period.facilityId).toBeUndefined();
  });

  it("reads as its own business review, not a second copy of the revenue page", async () => {
    api.getProviderRevenue.mockResolvedValue(
      overview({
        byProperty: [
          {
            facilityId: FACILITY_ID,
            facilityName: "Fort Clock",
            amount: 125000,
            commission: 15000,
            providerAmount: 110000,
            payments: 50,
          },
        ],
        byVehicleType: [
          {
            vehicleTypeId: "vt-1",
            vehicleTypeName: "Car",
            amount: 125000,
            commission: 15000,
            providerAmount: 110000,
            payments: 50,
            bookedHours: 260,
          },
        ],
        byMethod: [
          {
            paymentMethod: "CARD",
            amount: 90000,
            commission: 12000,
            providerAmount: 78000,
            payments: 30,
          },
        ],
        failedPayments: 2,
        cancelledPayments: 1,
        refundedPayments: 3,
      }),
    );

    renderAnalytics();

    expect(await screen.findByText("Bookings in the period")).toBeTruthy();
    expect(screen.getByText("Property performance")).toBeTruthy();
    expect(screen.getByText("Vehicle type performance")).toBeTruthy();
    expect(screen.getByText("Payment methods")).toBeTruthy();
    expect(screen.getByText("260")).toBeTruthy();
    expect(screen.queryByText("Revenue by property")).toBeNull();
    expect(
      await screen.findByText(/Bay occupancy over time and peak hours are not shown/),
    ).toBeTruthy();
  });
});
