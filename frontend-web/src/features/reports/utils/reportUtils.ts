import type { SelectOption } from "../../../components/common/Select/Select";
import type {
  RevenueBucket,
  RevenueOverview,
  RevenueOverviewPayload,
} from "../types/reportTypes";

export const ReportPeriod = {
  TODAY: "TODAY",
  THIS_WEEK: "THIS_WEEK",
  THIS_MONTH: "THIS_MONTH",
  LAST_MONTH: "LAST_MONTH",
  LAST_3_MONTHS: "LAST_3_MONTHS",
  CUSTOM: "CUSTOM",
} as const;

export type ReportPeriodKey = (typeof ReportPeriod)[keyof typeof ReportPeriod];

export const PERIOD_OPTIONS: SelectOption[] = [
  { value: ReportPeriod.TODAY, label: "Today" },
  { value: ReportPeriod.THIS_WEEK, label: "This week" },
  { value: ReportPeriod.THIS_MONTH, label: "This month" },
  { value: ReportPeriod.LAST_MONTH, label: "Last month" },
  { value: ReportPeriod.LAST_3_MONTHS, label: "Last 3 months" },
  { value: ReportPeriod.CUSTOM, label: "Custom range" },
];

export interface CustomRange {
  from?: string;
  to?: string;
}

export interface PeriodWindow {
  from?: string;
  to?: string;
}

const startOfDay = (at: Date): Date =>
  new Date(at.getFullYear(), at.getMonth(), at.getDate());

const endOfDay = (at: Date): Date =>
  new Date(at.getFullYear(), at.getMonth(), at.getDate(), 23, 59, 59, 999);

const firstOfMonth = (at: Date): Date => new Date(at.getFullYear(), at.getMonth(), 1);

const lastOfMonth = (at: Date): Date =>
  new Date(at.getFullYear(), at.getMonth() + 1, 0);

const addDays = (at: Date, days: number): Date =>
  new Date(at.getFullYear(), at.getMonth(), at.getDate() + days);

// Monday-based, the week an owner counts their takings over.
const startOfWeek = (at: Date): Date => {
  const sinceMonday = at.getDay() === 0 ? 6 : at.getDay() - 1;
  return startOfDay(addDays(at, -sinceMonday));
};

const asInstant = (at: Date): string => at.toISOString();

// A date-only input is the owner's calendar day, so it is read as wall clock, never as UTC midnight.
const parseDateOnly = (value: string | undefined): Date | null => {
  if (!value) return null;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
};

export const periodWindow = (
  period: ReportPeriodKey,
  custom: CustomRange = {},
  now: Date = new Date(),
): PeriodWindow => {
  switch (period) {
    case ReportPeriod.TODAY:
      return { from: asInstant(startOfDay(now)), to: asInstant(endOfDay(now)) };
    case ReportPeriod.THIS_WEEK: {
      const monday = startOfWeek(now);
      return { from: asInstant(monday), to: asInstant(endOfDay(addDays(monday, 6))) };
    }
    case ReportPeriod.THIS_MONTH:
      return {
        from: asInstant(firstOfMonth(now)),
        to: asInstant(endOfDay(lastOfMonth(now))),
      };
    case ReportPeriod.LAST_MONTH: {
      const previous = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      return {
        from: asInstant(firstOfMonth(previous)),
        to: asInstant(endOfDay(lastOfMonth(previous))),
      };
    }
    case ReportPeriod.LAST_3_MONTHS:
      return {
        from: asInstant(new Date(now.getFullYear(), now.getMonth() - 2, 1)),
        to: asInstant(endOfDay(lastOfMonth(now))),
      };
    case ReportPeriod.CUSTOM: {
      const from = parseDateOnly(custom.from);
      const to = parseDateOnly(custom.to);
      return {
        from: from ? asInstant(startOfDay(from)) : undefined,
        to: to ? asInstant(endOfDay(to)) : undefined,
      };
    }
  }
};

const DAY_MS = 86_400_000;

export const previousWindow = (window: PeriodWindow): PeriodWindow | null => {
  if (!window.from || !window.to) return null;
  const from = new Date(window.from).getTime();
  const to = new Date(window.to).getTime();
  if (!Number.isFinite(from) || !Number.isFinite(to) || to < from) return null;

  const days = Math.ceil((to - from + 1) / DAY_MS);
  const start = startOfDay(new Date(from - days * DAY_MS));
  return {
    from: asInstant(start),
    to: asInstant(endOfDay(addDays(start, days - 1))),
  };
};

const dateFormatter = new Intl.DateTimeFormat("en-LK", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const formatDate = (iso: string | undefined): string | null => {
  if (!iso) return null;
  const at = new Date(iso);
  return Number.isNaN(at.getTime()) ? null : dateFormatter.format(at);
};

export const describeWindow = (window: PeriodWindow): string => {
  const from = formatDate(window.from);
  const to = formatDate(window.to);
  if (from && to) return `${from} — ${to}`;
  if (from) return `From ${from}`;
  if (to) return `Until ${to}`;
  return "All time";
};

const bucketLabel = (period: string): string => {
  const [year, month, day] = period.split("-").map(Number);
  if (!year || !month) return period;
  const at = new Date(year, month - 1, day ?? 1);
  return new Intl.DateTimeFormat("en-LK", {
    day: "2-digit",
    month: "short",
  }).format(at);
};

const monthLabel = (period: string): string => {
  const [year, month] = period.split("-").map(Number);
  if (!year || !month) return period;
  return new Intl.DateTimeFormat("en-LK", { month: "short", year: "numeric" }).format(
    new Date(year, month - 1, 1),
  );
};

export type TrendPoint = RevenueBucket & { label: string };

export const trendPoints = (trend: RevenueBucket[]): TrendPoint[] => {
  const perMonth = trend.some((point) => point.period.length === 7);
  return trend.map((point) => ({
    ...point,
    label: perMonth ? monthLabel(point.period) : bucketLabel(point.period),
  }));
};

export const averageBookingValue = (overview: RevenueOverview): number =>
  overview.bookingsPaid > 0 ? overview.totalRevenue / overview.bookingsPaid : 0;

export interface RevenueBreakdownRow {
  id: string;
  name: string;
  amount: number;
  commission: number;
  providerAmount: number;
  payments: number;
  bookedHours: number | null;
}

const breakdownOf = (
  id: string,
  name: string,
  row: { amount: number; commission: number; providerAmount: number; payments: number },
  bookedHours: number | null = null,
): RevenueBreakdownRow => ({
  id,
  name,
  amount: row.amount,
  commission: row.commission,
  providerAmount: row.providerAmount,
  payments: row.payments,
  bookedHours,
});

export const normaliseOverview = (overview: RevenueOverviewPayload): RevenueOverview => ({
  ...overview,
  byMethod: overview.byMethod ?? [],
  trend: overview.trend ?? [],
  byProperty: overview.byProperty ?? [],
  byVehicleType: overview.byVehicleType ?? [],
});

export const propertyRows = (overview: RevenueOverview): RevenueBreakdownRow[] =>
  overview.byProperty.map((row) => breakdownOf(row.facilityId, row.facilityName, row));
export const vehicleTypeRows = (overview: RevenueOverview): RevenueBreakdownRow[] =>
  overview.byVehicleType.map((row) =>
    breakdownOf(row.vehicleTypeId, row.vehicleTypeName, row, row.bookedHours),
  );

export const METHOD_LABEL: Record<string, string> = {
  CARD: "Card",
  CASH: "Cash",
};

export const methodRows = (overview: RevenueOverview): RevenueBreakdownRow[] =>
  overview.byMethod.map((row) =>
    breakdownOf(row.paymentMethod, METHOD_LABEL[row.paymentMethod] ?? row.paymentMethod, row),
  );
