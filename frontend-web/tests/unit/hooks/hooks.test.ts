import { describe, expect, it, vi } from "vitest";
import { reportApi } from "../../../src/features/reports/api/reportApi";
import { vehicleTypeRows } from "../../../src/features/reports/utils/reportUtils";
import type { RevenueOverview } from "../../../src/features/reports/types/reportTypes";

const http = vi.hoisted(() => ({ get: vi.fn() }));

vi.mock("../../../src/services/api/axiosClient", () => ({ axiosClient: http }));

// The scalars every build of the endpoint sends; only the lists are in question here.
const scalars = {
  totalRevenue: 125000,
  totalCommission: 15000,
  totalProviderAmount: 110000,
  cashCommissionDue: 2000,
  paidPayments: 50,
  cardPayments: 30,
  cashPayments: 20,
  failedPayments: 0,
  cancelledPayments: 0,
  refundedPayments: 0,
  pendingCashConfirmations: 0,
};

// An API built before the vehicle-type list existed answers with exactly this shape.
const withoutLists = () => ({ data: { ...scalars } });

const sentQuery = () => http.get.mock.calls[0][1].params;

describe("reports api response shape", () => {
  it("reads the provider report from the reports endpoint with only the chosen params", async () => {
    http.get.mockResolvedValue(withoutLists());

    await reportApi.getProviderRevenue({ from: "2026-09-01T00:00:00.000Z", byProperty: true });

    expect(http.get.mock.calls[0][0]).toBe("/reports/provider");
    expect(sentQuery()).toEqual({ from: "2026-09-01T00:00:00.000Z", byProperty: true });
  });

  it("gives every list its empty shape when the server answers without any of them", async () => {
    http.get.mockResolvedValue(withoutLists());

    const overview = await reportApi.getProviderRevenue();

    expect(overview.byVehicleType).toEqual([]);
    expect(overview.byMethod).toEqual([]);
    expect(overview.byProperty).toEqual([]);
    expect(overview.trend).toEqual([]);
    expect(vehicleTypeRows(overview)).toEqual([]);
  });

  it("keeps an empty list empty and a populated one whole", async () => {
    const vehicleTypes = [
      {
        vehicleTypeId: "vt-1",
        vehicleTypeName: "Car",
        amount: 125000,
        commission: 15000,
        providerAmount: 110000,
        payments: 50,
        bookedHours: 260,
      },
    ];

    http.get.mockResolvedValue({ data: { ...scalars, byVehicleType: [] } });
    expect((await reportApi.getProviderRevenue()).byVehicleType).toEqual([]);

    http.get.mockResolvedValue({
      data: { ...scalars, byVehicleType: vehicleTypes },
    } as unknown as { data: RevenueOverview });
    const overview = await reportApi.getProviderRevenue();

    expect(overview.byVehicleType).toEqual(vehicleTypes);
    expect(vehicleTypeRows(overview)).toEqual([
      {
        id: "vt-1",
        name: "Car",
        amount: 125000,
        commission: 15000,
        providerAmount: 110000,
        payments: 50,
        bookedHours: 260,
      },
    ]);
  });
});
