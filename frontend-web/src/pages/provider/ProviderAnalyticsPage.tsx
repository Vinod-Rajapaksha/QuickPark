import React from "react";
import { BarChart3, RefreshCw } from "lucide-react";
import Button from "../../components/common/Button/Button";
import Spinner from "../../components/common/Spinner/Spinner";
import ReportFilters from "../../features/reports/components/ReportFilters";
import RevenueBreakdown from "../../features/reports/components/RevenueBreakdown";
import RevenueSummary from "../../features/reports/components/RevenueSummary";
import RevenueTrend from "../../features/reports/components/RevenueTrend";
import { useReports } from "../../features/reports/hooks/useReports";
import {
  describeWindow,
  methodRows,
  propertyRows,
  vehicleTypeRows,
} from "../../features/reports/utils/reportUtils";

export const ProviderAnalyticsPage: React.FC = () => {
  const {
    period,
    custom,
    bounds,
    previousBounds,
    overview,
    previous,
    isLoading,
    loadError,
    refresh,
    changePeriod,
    changeCustom,
    reset,
  } = useReports();

  const periodLabel = describeWindow(bounds);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
            <BarChart3 size={24} className="text-slate-400" />
            Analytics
          </h1>
          <p className="mt-1 text-slate-500">
            Your whole business over {periodLabel}.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          leftIcon={<RefreshCw size={16} />}
          isLoading={isLoading}
          onClick={() => void refresh()}
        >
          Refresh
        </Button>
      </div>

      <ReportFilters
        period={period}
        custom={custom}
        bounds={bounds}
        onChangePeriod={changePeriod}
        onApplyCustom={changeCustom}
        onReset={reset}
      />

      {loadError && (
        <p
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          role="alert"
        >
          {loadError}
        </p>
      )}

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      ) : !overview && !loadError ? (
        <div className="py-16 text-center">
          <p className="text-slate-600">Nothing came back for this period.</p>
          <Button className="mt-4" variant="outline" onClick={() => void refresh()}>
            Try again
          </Button>
        </div>
      ) : overview ? (
        <div className="space-y-6">
          <RevenueSummary
            overview={overview}
            previous={previous}
            previousLabel={previousBounds ? describeWindow(previousBounds) : null}
          />

          <RevenueTrend trend={overview.trend} />

          <section className="rounded-xl border border-slate-200 bg-white p-4">
            <h2 className="font-semibold text-slate-900">Bookings in the period</h2>
            <p className="mt-1 text-sm text-slate-500">
              Counts read from every payment the period touched, not only the paid ones.
            </p>
            <dl className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              {[
                { label: "Paid", value: overview.paidPayments, hint: "Counted in the totals" },
                { label: "By card", value: overview.cardPayments, hint: "Among the paid" },
                { label: "By cash", value: overview.cashPayments, hint: "Among the paid" },
                {
                  label: "Refunded",
                  value: overview.refundedPayments,
                  hint: "Already out of the totals",
                },
                {
                  label: "Cancelled",
                  value: overview.cancelledPayments,
                  hint: "Never paid for",
                },
                { label: "Failed", value: overview.failedPayments, hint: "Did not go through" },
              ].map((item) => (
                <div key={item.label}>
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    {item.label}
                  </dt>
                  <dd className="mt-1 text-xl font-bold text-slate-900">{item.value}</dd>
                  <dd className="text-xs text-slate-500">{item.hint}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white">
            <div className="border-b border-slate-100 p-4">
              <h2 className="font-semibold text-slate-900">Property performance</h2>
              <p className="mt-1 text-sm text-slate-500">
                Your properties ranked by what they collected.
              </p>
            </div>
            <RevenueBreakdown
              rows={propertyRows(overview)}
              nameHeader="Property"
              emptyMessage="No paid booking on a property yet in this period."
              total={overview.totalRevenue}
            />
          </section>

          <section className="rounded-xl border border-slate-200 bg-white">
            <div className="border-b border-slate-100 p-4">
              <h2 className="font-semibold text-slate-900">Vehicle type performance</h2>
              <p className="mt-1 text-sm text-slate-500">
                Bay hours are the time each category held a bay, summed over the period.
              </p>
            </div>
            <RevenueBreakdown
              rows={vehicleTypeRows(overview)}
              nameHeader="Vehicle type"
              emptyMessage="No paid booking for a vehicle type yet in this period."
              total={overview.totalRevenue}
              withBookedHours
            />
          </section>

          <section className="rounded-xl border border-slate-200 bg-white">
            <div className="border-b border-slate-100 p-4">
              <h2 className="font-semibold text-slate-900">Payment methods</h2>
            </div>
            <RevenueBreakdown
              rows={methodRows(overview)}
              nameHeader="Method"
              emptyMessage="No paid booking by any method yet in this period."
              total={overview.totalRevenue}
            />
          </section>

          <p className="text-xs text-slate-500">
            Bay occupancy over time and peak hours are not shown: the platform stores no
            capacity per hour, so any figure here would be a guess.
          </p>
        </div>
      ) : null}
    </div>
  );
};

export default ProviderAnalyticsPage;
