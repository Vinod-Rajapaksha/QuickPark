import React from "react";
import ParkingStatusBadge from "./ParkingStatusBadge";
import QueueLink from "./QueueLink";
import type { OwnerGroup } from "../utils/parkingUtils";
import { awaitingLabel } from "../utils/parkingUtils";

// One owner's block in the by-provider arrangement: their identity above their properties.
export const OwnerGroupCard: React.FC<{ group: OwnerGroup; search: string }> = ({
  group,
  search,
}) => (
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

export default OwnerGroupCard;
