import React from "react";
import { Link } from "react-router-dom";
import {
  Building2,
  ChevronRight,
  Inbox,
  LayoutList,
  RefreshCw,
  ShieldCheck,
  Users,
} from "lucide-react";
import Button from "../../components/common/Button/Button";
import Input from "../../components/common/Input/Input";
import Select from "../../components/common/Select/Select";
import Spinner from "../../components/common/Spinner/Spinner";
import ParkingStatusBadge from "../../features/parking/components/ParkingStatusBadge";
import { useFacilityQueue } from "../../features/parking/hooks/useFacilityReviews";
import type { SelectOption } from "../../components/common/Select/Select";
import type {
  FacilityQueueRow,
  ParkingFacility,
} from "../../features/parking/types/parkingTypes";
import {
  groupByOwner,
  openSections,
  type QueueGrouping,
} from "../../features/parking/utils/parkingUtils";

const STATUS_OPTIONS: SelectOption[] = [
  { value: "", label: "Any status" },
  { value: "PENDING_APPROVAL", label: "Awaiting review" },
  { value: "APPROVED", label: "Live" },
  { value: "REJECTED", label: "Rejected" },
  { value: "SUSPENDED", label: "Suspended" },
  { value: "DRAFT", label: "Draft" },
];

const GROUP_OPTIONS: Array<{ value: QueueGrouping; label: string; icon: React.ReactNode }> = [
  { value: "property", label: "By property", icon: <Building2 size={16} /> },
  { value: "provider", label: "By provider", icon: <Users size={16} /> },
];

// What one property still owes the admin, in words the reviewer can triage on.
const awaitingLabel = (facility: ParkingFacility): string => {
  if (facility.sections.length === 0) return "Not submitted yet";
  const open = openSections(facility).length;
  if (open === 0) return "All four sections approved";
  return `${open} of ${facility.sections.length} still to decide`;
};

const QueueLink: React.FC<{ row: FacilityQueueRow; search: string }> = ({
  row,
  search,
}) => (
  <Link
    to={`/admin/properties/${row.facility.facilityId}${search ? `?${search}` : ""}`}
    className="flex items-center gap-1 font-medium text-primary-700 hover:text-primary-800 hover:underline"
  >
    Review
    <ChevronRight size={16} />
  </Link>
);

const PropertyTable: React.FC<{ rows: FacilityQueueRow[]; search: string }> = ({
  rows,
  search,
}) => (
  <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
    <table className="w-full text-left text-sm">
      <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
        <tr>
          <th className="px-4 py-2.5 font-medium">Property</th>
          <th className="px-4 py-2.5 font-medium">Provider</th>
          <th className="px-4 py-2.5 font-medium">Location</th>
          <th className="px-4 py-2.5 font-medium">Bays</th>
          <th className="px-4 py-2.5 font-medium">Awaiting decision</th>
          <th className="px-4 py-2.5 font-medium" />
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr
            key={row.facility.facilityId}
            className="border-t border-slate-100 align-top hover:bg-slate-50"
          >
            <td className="px-4 py-3">
              <span className="font-medium text-slate-900">{row.facility.name}</span>
              <span className="mt-1 block">
                <ParkingStatusBadge status={row.facility.status} />
              </span>
            </td>
            <td className="px-4 py-3">
              <span className="block text-slate-800">{row.providerName || "—"}</span>
              <span className="block text-slate-500">{row.providerEmail}</span>
              {row.providerBusinessName && (
                <span className="block text-slate-500">{row.providerBusinessName}</span>
              )}
            </td>
            <td className="px-4 py-3 text-slate-600">
              {row.facility.city}, {row.facility.district}
            </td>
            <td className="px-4 py-3 text-slate-600">{row.facility.slotCount}</td>
            <td className="px-4 py-3 text-slate-600">{awaitingLabel(row.facility)}</td>
            <td className="px-4 py-3 text-right">
              <QueueLink row={row} search={search} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const OwnerGroupCard: React.FC<{
  group: ReturnType<typeof groupByOwner>[number];
  search: string;
}> = ({ group, search }) => (
  <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50 px-4 py-3">
      <div>
        <p className="font-semibold text-slate-900">{group.label}</p>
        <p className="text-sm text-slate-500">
          {group.email}
          {group.businessName ? ` · ${group.businessName}` : ""} · NIC{" "}
          {group.verificationStatus || "unknown"}
        </p>
      </div>
      <p className="text-sm text-slate-600">
        {group.rows.length} propert{group.rows.length === 1 ? "y" : "ies"} ·{" "}
        {group.awaitingSections === 0
          ? "nothing awaiting"
          : `${group.awaitingSections} section${group.awaitingSections === 1 ? "" : "s"} awaiting`}
      </p>
    </div>
    <ul className="divide-y divide-slate-100">
      {group.rows.map((row) => (
        <li
          key={row.facility.facilityId}
          className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 hover:bg-slate-50"
        >
          <div>
            <p className="font-medium text-slate-900">{row.facility.name}</p>
            <p className="text-sm text-slate-500">
              {row.facility.city} · {row.facility.slotCount} bays ·{" "}
              {awaitingLabel(row.facility)}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <ParkingStatusBadge status={row.facility.status} />
            <QueueLink row={row} search={search} />
          </div>
        </li>
      ))}
    </ul>
  </div>
);

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
      ) : grouping === "property" ? (
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
