import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, RefreshCw, Wallet } from "lucide-react";
import Button from "../../components/common/Button/Button";
import Spinner from "../../components/common/Spinner/Spinner";
import Select from "../../features/parking/components/FormSelect";
import ReportFilters from "../../features/reports/components/ReportFilters";
import RevenueBreakdown from "../../features/reports/components/RevenueBreakdown";
import RevenueSummary from "../../features/reports/components/RevenueSummary";
import RevenueTrend from "../../features/reports/components/RevenueTrend";
import { useReports } from "../../features/reports/hooks/useReports";
import {
  describeWindow,
  methodRows,
  vehicleTypeRows,
} from "../../features/reports/utils/reportUtils";
import { useParkings } from "../../features/parking/hooks/useParkings";
import { ROUTES } from "../../app/routes/routeConstants";

export const FacilityRevenuePage: React.FC = () => {
  const { facilityId } = useParams<{ facilityId: string }>();
  const navigate = useNavigate();
  const { facilities, isLoading: isLoadingFacilities } = useParkings();

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
  } = useReports(facilityId);

  const facility = facilities.find((item) => item.facilityId === facilityId);
  const periodLabel = describeWindow(bounds);

  if (isLoadingFacilities) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <button
            type="button"
            className="mb-1 flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700"
            onClick={() => navigate(ROUTES.FACILITIES)}
          >
            <ArrowLeft size={15} />
            My properties
          </button>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
            <Wallet size={24} className="text-slate-400" />
            {facility?.name ?? "Property"} revenue
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Counted over {periodLabel}. Only bookings paid at this property are included.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            leftIcon={<RefreshCw size={15} />}
            isLoading={isLoading}
            onClick={() => void refresh()}
          >
            Reload
          </Button>
        </div>
      </div>

      {facilities.length > 1 && (
        <div className="max-w-sm">
          <Select
            label="Show revenue of"
            options={facilities.map((item) => ({
              value: item.facilityId,
              label: item.name,
            }))}
            value={facilityId ?? ""}
            onChange={(event) =>
              navigate(ROUTES.facilityRevenuePath(event.target.value))
            }
          />
        </div>
      )}

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
          <p className="text-slate-600">Nothing came back for this property.</p>
          <Button className="mt-4" variant="outline" onClick={() => void refresh()}>
            Try again
          </Button>
        </div>
      ) : overview ? (
        overview.paidPayments === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center">
            <p className="font-medium text-slate-700">
              No paid bookings here in {periodLabel}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Choose another period, or open the bays to see how they are held.
            </p>
            <Button
              className="mt-4"
              size="sm"
              variant="outline"
              onClick={() => navigate(ROUTES.facilitySlotsPath(facilityId ?? ""))}
            >
              Manage bays
            </Button>
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
                <h2 className="font-semibold text-slate-900">By vehicle type</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Bay hours are the time each category held a bay.
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
                <h2 className="font-semibold text-slate-900">By payment method</h2>
              </div>
              <RevenueBreakdown
                rows={methodRows(overview)}
                nameHeader="Method"
                emptyMessage="No paid booking by any method yet in this period."
                total={overview.totalRevenue}
              />
            </section>
          </div>
        )
      ) : null}
    </div>
  );
};

export default FacilityRevenuePage;
