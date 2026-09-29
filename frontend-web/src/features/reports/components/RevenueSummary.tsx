import React from "react";
import { formatMoney, formatPercent } from "../../parking/utils/parkingUtils";
import { averageBookingValue } from "../utils/reportUtils";
import type { RevenueOverview } from "../types/reportTypes";

export interface RevenueSummaryProps {
  overview: RevenueOverview;
  previous: RevenueOverview | null;
  previousLabel: string | null;
}

interface Tile {
  label: string;
  value: string;
  hint: string;
}

const tilesOf = (overview: RevenueOverview): Tile[] => [
  {
    label: "Collected",
    value: formatMoney(overview.totalRevenue),
    hint: `${overview.bookingsPaid} paid booking${overview.bookingsPaid === 1 ? "" : "s"}`,
  },
  {
    label: "Your share",
    value: formatMoney(overview.totalProviderAmount),
    hint: "After the platform fee",
  },
  {
    label: "Platform fee",
    value: formatMoney(overview.totalCommission),
    hint: "What the platform took on these bookings",
  },
  {
    label: "Average per booking",
    value: formatMoney(averageBookingValue(overview)),
    hint: "Collected divided by paid bookings",
  },
  {
    label: "Cash fee owing",
    value: formatMoney(overview.cashCommissionDue),
    hint: "Not yet settled with the platform",
  },
  {
    label: "Waiting on staff",
    value: String(overview.pendingCashConfirmations),
    hint: "Cash bookings no one has confirmed yet",
  },
];

const changeOf = (
  overview: RevenueOverview,
  previous: RevenueOverview,
): { text: string; up: boolean } | null => {
  if (previous.totalRevenue <= 0) return null;
  const percent =
    ((overview.totalRevenue - previous.totalRevenue) / previous.totalRevenue) * 100;
  return {
    text: `${percent >= 0 ? "+" : ""}${formatPercent(percent)}`,
    up: percent >= 0,
  };
};

const RevenueSummary: React.FC<RevenueSummaryProps> = ({
  overview,
  previous,
  previousLabel,
}) => {
  const change = previous ? changeOf(overview, previous) : null;
  const [first, ...rest] = tilesOf(overview);

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
          {first.label}
        </p>
        <p className="mt-1 text-3xl font-bold text-slate-900">{first.value}</p>
        <p className="mt-1 text-sm text-slate-500">{first.hint}</p>
        {change && previousLabel && (
          <p
            className={`mt-2 text-sm font-medium ${
              change.up ? "text-emerald-600" : "text-red-600"
            }`}
          >
            {change.text} against {previousLabel}
          </p>
        )}
        {!change && previous && previousLabel && (
          <p className="mt-2 text-sm text-slate-500">
            Nothing was paid in {previousLabel}, so there is nothing to compare yet.
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {rest.map((tile) => (
          <div key={tile.label} className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              {tile.label}
            </p>
            <p className="mt-1 text-xl font-bold text-slate-900">{tile.value}</p>
            <p className="mt-1 text-xs text-slate-500">{tile.hint}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RevenueSummary;
