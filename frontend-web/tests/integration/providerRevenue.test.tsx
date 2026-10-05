// @vitest-environment jsdom
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import EarningsPage from "../../src/pages/provider/EarningsPage";
import FacilityRevenuePage from "../../src/pages/provider/FacilityRevenuePage";
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
const OTHER_ID = "44444444-4444-4444-4444-444444444444";

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
  pendingCashConfirmations: 3,
  byMethod: [],
  trend: [],
  byProperty: [],
  byVehicleType: [],
  ...overrides,
});

const owned = (facilityId: string, name: string): ParkingFacility =>
  ({ facilityId, name, slotCount: 12 }) as unknown as ParkingFacility;

const PathProbe: React.FC = () => <p data-testid="path">{useLocation().pathname}</p>;

const renderRevenue = (): void => {
  render(
    <MemoryRouter initialEntries={["/revenue"]}>
      <Routes>
        <Route path="/revenue" element={<EarningsPage />} />
      </Routes>
    </MemoryRouter>,
  );
};

const renderPropertyRevenue = (facilityId = FACILITY_ID): void => {
  render(
    <MemoryRouter initialEntries={[`/facilities/${facilityId}/revenue`]}>
      <Routes>
        <Route path="/facilities/:facilityId/revenue" element={<FacilityRevenuePage />} />
        <Route path="/facilities/:facilityId/slots" element={<PathProbe />} />
      </Routes>
    </MemoryRouter>,
  );
};

// Every period reads twice: the one on screen and the equal one straight before it.
const loadPair = (current: RevenueOverview | null, before: RevenueOverview | null): void => {
  api.getProviderRevenue
    .mockResolvedValueOnce(current as RevenueOverview)
    .mockResolvedValueOnce(before as RevenueOverview);
};

const loadBoth = (same: RevenueOverview | null): void => {
  api.getProviderRevenue.mockResolvedValue(same as RevenueOverview);
};

beforeEach(() => {
  api.getMyFacilities.mockResolvedValue([owned(FACILITY_ID, "Fort Clock")]);
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("the tiles a provider is shown", () => {
  it("separates what came in, what the owner keeps and what the platform took", async () => {
    loadPair(overview(), overview({ totalRevenue: 100000 }));
    renderRevenue();

    expect(await screen.findByText("125,000 LKR")).toBeTruthy();
    expect(screen.getByText("110,000 LKR")).toBeTruthy();
    expect(screen.getByText("15,000 LKR")).toBeTruthy();
    // Collected divided by paid bookings, worked out here rather than taken on trust.
    expect(screen.getByText("2,500 LKR")).toBeTruthy();
    expect(screen.getByText("Collected divided by paid bookings")).toBeTruthy();
    expect(screen.getByText("50 paid bookings")).toBeTruthy();
    expect(screen.getByText("After the platform fee")).toBeTruthy();
    expect(screen.getByText("What the platform took on these bookings")).toBeTruthy();
    expect(screen.getAllByText("Your share")).toHaveLength(2);
    expect(screen.getAllByText("Platform fee")).toHaveLength(2);
  });

  it("keeps the fee the platform has not been paid and the cash staff have not confirmed", async () => {
    loadPair(
      overview({
        totalRevenue: 8000,
        totalProviderAmount: 7000,
        totalCommission: 1000,
        cashCommissionDue: 600,
        bookingsPaid: 4,
        paidPayments: 4,
        pendingCashConfirmations: 3,
      }),
      overview({ totalRevenue: 8000 }),
    );
    renderRevenue();

    expect(await screen.findByText("Waiting on staff")).toBeTruthy();
    expect(screen.getByText("Cash fee owing")).toBeTruthy();
    expect(screen.getByText("Not yet settled with the platform")).toBeTruthy();
    expect(screen.getByText("Cash bookings no one has confirmed yet")).toBeTruthy();
    // An owner's own share and the unpaid fee sit in the same grid, so each is read on its own.
    expect(screen.getByText("600 LKR")).toBeTruthy();
    expect(screen.getByText("3")).toBeTruthy();
    expect(screen.getByText("4 paid bookings")).toBeTruthy();
    expect(screen.getByText("7,000 LKR")).toBeTruthy();
    expect(screen.getByText("1,000 LKR")).toBeTruthy();
  });

  it("says how much better the period went than the one straight before it", async () => {
    loadPair(overview({ totalRevenue: 125000 }), overview({ totalRevenue: 100000 }));
    renderRevenue();

    const line = await screen.findByText(/^\+25% against /);
    expect(line.className).toContain("text-emerald-600");
  });

  it("counts a fall in the same breath as a rise", async () => {
    loadPair(overview({ totalRevenue: 100000 }), overview({ totalRevenue: 200000 }));
    renderRevenue();

    const line = await screen.findByText(/^-50% against /);
    expect(line.className).toContain("text-red-600");
  });

  it("refuses to compare against a period in which nothing was paid", async () => {
    loadPair(overview(), overview({ totalRevenue: 0 }));
    renderRevenue();

    expect(
      await screen.findByText(/^Nothing was paid in .+, so there is nothing to compare yet\.$/),
    ).toBeTruthy();
    expect(screen.queryByText(/ against /)).toBeNull();
  });

  it("holds nothing to show when the report comes back without an answer", async () => {
    loadBoth(null);
    renderRevenue();

    expect(await screen.findByText("Nothing came back for this period.")).toBeTruthy();
    expect(screen.queryByText("Waiting on staff")).toBeNull();

    const reads = api.getProviderRevenue.mock.calls.length;
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    await waitFor(() => expect(api.getProviderRevenue.mock.calls.length).toBe(reads + 2));
  });
});

describe("one property's revenue", () => {
  it("keeps an empty property within reach of its bays", async () => {
    loadBoth(overview({ totalRevenue: 0, bookingsPaid: 0, paidPayments: 0 }));
    renderPropertyRevenue();

    await screen.findByText(/No paid bookings here in /);
    expect(
      screen.getByText("Choose another period, or open the bays to see how they are held."),
    ).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Manage bays" }));
    expect(screen.getByTestId("path").textContent).toBe(`/facilities/${FACILITY_ID}/slots`);
    expect(api.getMyFacilities).toHaveBeenCalled();
  });

  it("names each payment method the way the owner reads it, and keeps the hours each type held", async () => {
    loadBoth(
      overview({
        byMethod: [
          {
            paymentMethod: "CARD",
            amount: 90000,
            commission: 12000,
            providerAmount: 78000,
            payments: 30,
          },
          {
            paymentMethod: "CASH",
            amount: 35000,
            commission: 3000,
            providerAmount: 32000,
            payments: 20,
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
      }),
    );
    renderPropertyRevenue();

    expect(await screen.findByText("By payment method")).toBeTruthy();
    expect(screen.getByText("Card")).toBeTruthy();
    expect(screen.getByText("Cash")).toBeTruthy();
    expect(screen.getByText("90,000 LKR")).toBeTruthy();
    expect(screen.getByText("72%")).toBeTruthy();
    expect(screen.getByText("By vehicle type")).toBeTruthy();
    expect(screen.getByText("Bay hours")).toBeTruthy();
    expect(screen.getByText("260")).toBeTruthy();
    expect(screen.getByText("Bay hours are the time each category held a bay.")).toBeTruthy();
  });

  it("moves the report to another property the owner holds", async () => {
    api.getMyFacilities.mockResolvedValue([
      owned(FACILITY_ID, "Fort Clock"),
      owned(OTHER_ID, "Kandy Yard"),
    ]);
    loadBoth(overview());
    renderPropertyRevenue();

    expect((await screen.findByText("Fort Clock revenue")).textContent).toBe("Fort Clock revenue");

    fireEvent.change(screen.getByLabelText(/^Show revenue of/), { target: { value: OTHER_ID } });

    await waitFor(() =>
      expect(api.getProviderRevenue.mock.calls.at(-1)?.[0]).toEqual(
        expect.objectContaining({ facilityId: OTHER_ID, byProperty: false }),
      ),
    );
    expect(await screen.findByText("Kandy Yard revenue")).toBeTruthy();
  });

  it("says so when the property's own report comes back without an answer", async () => {
    loadBoth(null);
    renderPropertyRevenue();

    expect(await screen.findByText("Nothing came back for this property.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Try again" })).toBeTruthy();
  });
});
