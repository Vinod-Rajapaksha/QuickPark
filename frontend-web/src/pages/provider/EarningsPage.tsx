import React from "react";
import { useNavigate } from "react-router-dom";
import { RefreshCw, Wallet } from "lucide-react";
import Button from "../../components/common/Button/Button";
import Spinner from "../../components/common/Spinner/Spinner";
import RevenueBreakdown from "../../features/reports/components/RevenueBreakdown";
import RevenueSummary from "../../features/reports/components/RevenueSummary";
import RevenueTrend from "../../features/reports/components/RevenueTrend";
import ReportFilters from "../../features/reports/components/ReportFilters";
import { useReports } from "../../features/reports/hooks/useReports";
import {
  describeWindow,
  propertyRows,
} from "../../features/reports/utils/reportUtils";
import { ROUTES } from "../../app/routes/routeConstants";

export const EarningsPage: React.FC = () => {
  const navigate = useNavigate();
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
            <Wallet size={24} className="text-slate-400" />
            Revenue
          </h1>
          <p className="mt-1 text-slate-500">
            Every property you own, counted over {periodLabel}.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
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
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => navigate(ROUTES.FACILITIES)}
          >
            My properties
          </Button>
        </div>
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
        overview.paidPayments === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center">
            <p className="font-medium text-slate-700">No paid bookings in {periodLabel}</p>
            <p className="mt-1 text-sm text-slate-500">
              Pick another period, or check whether staff confirmed the cash bookings.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <RevenueSummary
              overview={overview}
              previous={previous}
              previousLabel={previousBounds ? describeWindow(previousBounds) : null}
            />
            <RevenueTrend trend={overview.trend} />
            <section className="rounded-xl border border-slate-200 bg-white">
              <div className="border-b border-slate-100 p-4">
                <h2 className="font-semibold text-slate-900">Revenue by property</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Only properties you own are listed.
                </p>
              </div>
              <RevenueBreakdown
                rows={propertyRows(overview)}
                nameHeader="Property"
                emptyMessage="No paid booking on a property yet in this period."
                total={overview.totalRevenue}
              />
            </section>
          </div>
        )
      ) : null}
    </div>
  );
};

export default EarningsPage;
