import React from "react";
import { Inbox, LayoutList, RefreshCw, ShieldCheck } from "lucide-react";
import Button from "../../components/common/Button/Button";
import Input from "../../components/common/Input/Input";
import Select from "../../components/common/Select/Select";
import Spinner from "../../components/common/Spinner/Spinner";
import OwnerGroupCard from "../../features/parking/components/OwnerGroupCard";
import PropertyTable from "../../features/parking/components/PropertyTable";
import { useFacilityQueue } from "../../features/parking/hooks/useFacilityReviews";
import {
  GROUP_OPTIONS,
  STATUS_OPTIONS,
} from "../../features/parking/utils/facilityQueueOptions";
import {
  QueueGrouping,
  groupByOwner,
  openSections,
} from "../../features/parking/utils/parkingUtils";

export const ParkingFacilitiesPage: React.FC = () => {
  const {
    rows,
    status,
    provider,
    grouping,
    setStatus,
    setProvider,
    setGrouping,
    queryString,
    isLoading,
    loadError,
    refresh,
  } = useFacilityQueue();

  const ownerCount = new Set(rows.map((row) => row.providerId)).size;
  const awaitingCount = rows.reduce((sum, row) => sum + openSections(row.facility).length, 0);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
            <ShieldCheck size={24} className="text-slate-400" />
            Property approvals
          </h1>
          <p className="mt-1 max-w-2xl text-slate-500">
            A registration is four separate checks — the basic information, the property
            location, the documents and photos, and the vehicle types and pricing. Open a
            property to decide each one next to the details it is about; it goes live only once
            all four are approved.
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

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[14rem_1fr_auto] lg:items-end">
          <Select
            label="Status"
            options={STATUS_OPTIONS}
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          />
          <Input
            label="Provider"
            value={provider}
            placeholder="Name, account email or company"
            onChange={(event) => setProvider(event.target.value)}
          />
          <div>
            <p className="mb-1 text-sm font-medium text-slate-700">Arrange by</p>
            <div
              role="group"
              aria-label="Arrange the queue by property or by provider"
              className="inline-flex rounded-lg border border-slate-200 p-0.5"
            >
              {GROUP_OPTIONS.map((option) => {
                const isActive = option.value === grouping;
                return (
                  <button
                    key={option.value}
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => setGrouping(option.value)}
                    className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition ${
                      isActive
                        ? "bg-primary-50 text-primary-700"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    {option.icon}
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        <p className="mt-3 flex flex-wrap items-center gap-2 text-sm text-slate-500">
          <LayoutList size={16} className="text-slate-400" />
          {rows.length} propert{rows.length === 1 ? "y" : "ies"} · {ownerCount} provider
          {ownerCount === 1 ? "" : "s"} ·{" "}
          {awaitingCount === 0
            ? "nothing awaiting a decision"
            : `${awaitingCount} section${awaitingCount === 1 ? "" : "s"} awaiting your decision`}
        </p>
      </div>

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
      ) : rows.length === 0 ? (
        <p className="flex items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 px-4 py-12 text-sm text-slate-500">
          <Inbox size={16} />
          Nothing matches these filters.
        </p>
      ) : grouping === QueueGrouping.PROPERTY ? (
        <PropertyTable rows={rows} search={queryString} />
      ) : (
        <div className="space-y-4">
          {groupByOwner(rows).map((group) => (
            <OwnerGroupCard key={group.providerId} group={group} search={queryString} />
          ))}
        </div>
      )}
    </div>
  );
};

export default ParkingFacilitiesPage;
