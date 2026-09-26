import React from "react";
import ParkingStatusBadge from "./ParkingStatusBadge";
import QueueLink from "./QueueLink";
import type { FacilityQueueRow } from "../types/parkingTypes";
import { awaitingLabel } from "../utils/parkingUtils";

// One row per property. The queue's default arrangement.
export const PropertyTable: React.FC<{ rows: FacilityQueueRow[]; search: string }> = ({
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

export default PropertyTable;
