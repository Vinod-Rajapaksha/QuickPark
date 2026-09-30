export interface RevenueOverview {
  totalRevenue: number;
  totalCommission: number;
  totalProviderAmount: number;
  cashCommissionDue: number;
  paidPayments: number;
  bookingsPaid: number;
  cardPayments: number;
  cashPayments: number;
  failedPayments: number;
  cancelledPayments: number;
  refundedPayments: number;
  pendingCashConfirmations: number;
  byMethod: RevenueMethod[];
  trend: RevenueBucket[];
  byProperty: RevenueProperty[];
  byVehicleType: RevenueVehicleType[];
}

export interface RevenueMethod {
  paymentMethod: string;
  amount: number;
  commission: number;
  providerAmount: number;
  payments: number;
}

export interface RevenueBucket {
  period: string;
  amount: number;
  commission: number;
  providerAmount: number;
  cardAmount: number;
  cashAmount: number;
  payments: number;
}

export interface RevenueProperty {
  facilityId: string;
  facilityName: string;
  amount: number;
  commission: number;
  providerAmount: number;
  payments: number;
}

export interface RevenueVehicleType {
  vehicleTypeId: string;
  vehicleTypeName: string;
  amount: number;
  commission: number;
  providerAmount: number;
  payments: number;
  bookedHours: number;
}

export interface RevenueQuery {
  from?: string;
  to?: string;
  byProperty?: boolean;
  facilityId?: string;
}

export type RevenueOverviewPayload = Omit<
  RevenueOverview,
  "byMethod" | "trend" | "byProperty" | "byVehicleType"
> &
  Partial<Pick<RevenueOverview, "byMethod" | "trend" | "byProperty" | "byVehicleType">>;
