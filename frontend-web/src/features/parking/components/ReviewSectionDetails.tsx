import React from "react";
import { CheckCircle2, Circle, ExternalLink } from "lucide-react";
import type {
  FacilityReview,
  FacilitySectionName,
} from "../types/parkingTypes";
import {
  bayLabel,
  documentProgress,
  documentTabsFor,
  formatCoordinates,
  formatLandArea,
  formatMoney,
  formatOperatingHours,
  formatPercent,
} from "../utils/parkingUtils";

const Row: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div className="flex flex-wrap gap-x-3 gap-y-0.5 sm:col-span-2 lg:col-span-1">
    <dt className="w-36 shrink-0 text-slate-500">{label}</dt>
    <dd className="text-slate-800">{value || "—"}</dd>
  </div>
);

const Grid: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <dl className="grid gap-y-1 text-sm sm:grid-cols-2">{children}</dl>
);

const when = (value: string | null): string =>
  value ? new Date(value).toLocaleString() : "—";

// The details for the section being judged sit above its decision control.
export const ReviewSectionDetails: React.FC<{
  review: FacilityReview;
  section: FacilitySectionName;
}> = ({ review, section }) => {
  const facility = review.facility;

  if (section === "BASIC_INFORMATION") {
    return (
      <Grid>
        <Row label="Property name" value={facility.name} />
        <Row label="Address" value={facility.address} />
        <Row label="City" value={facility.city} />
        <Row label="District" value={facility.district} />
        <Row label="Province" value={facility.province} />
        <Row label="Land area" value={formatLandArea(facility.landAreaPerches)} />
        <Row label="Opening time" value={facility.openingTime.slice(0, 5)} />
        <Row label="Closing time" value={facility.closingTime.slice(0, 5)} />
        <Row label="EV charging" value={facility.hasEvCharging ? "Yes" : "No"} />
        <Row label="Registered on" value={when(facility.createdAt)} />
        <Row label="Last changed" value={when(facility.updatedAt)} />
        <Row label="Submitted on" value={when(facility.submittedAt)} />
      </Grid>
    );
  }

  if (section === "PROPERTY_LOCATION") {
    const coordinates = formatCoordinates(facility);
    return (
      <div className="space-y-3">
        <Grid>
          <Row label="Location point" value={coordinates ?? "No coordinates entered"} />
          <Row label="City" value={facility.city} />
          <Row label="District" value={facility.district} />
          <Row label="Province" value={facility.province} />
          <Row label="Street address" value={facility.address} />
          <Row label="Land area" value={formatLandArea(facility.landAreaPerches)} />
        </Grid>
        <p className="text-sm text-slate-500">
          {coordinates
            ? "Drivers search from this point, so the pin has to stand on the property itself."
            : "Without a location point drivers cannot find this property by distance."}
        </p>
      </div>
    );
  }

  if (section === "DOCUMENTS") {
    const tabs = documentTabsFor(facility.documentRequirements);
    const byType = new Map<string, typeof review.documents>();
    for (const document of review.documents) {
      const list = byType.get(document.type) ?? [];
      list.push(document);
      byType.set(document.type, list);
    }

    return (
      <div className="space-y-4">
        {tabs.length === 0 ? (
          <p className="text-sm text-slate-500">
            The server has not sent the document rules for this property.
          </p>
        ) : (
          <ul className="space-y-3">
            {tabs.map((tab) => (
              <li
                key={tab.type}
                className="rounded-lg border border-slate-200 px-3 py-2"
              >
                <div className="flex flex-wrap items-center gap-2">
                  {tab.satisfied ? (
                    <CheckCircle2 size={16} className="text-emerald-600" />
                  ) : (
                    <Circle size={16} className="text-slate-300" />
                  )}
                  <span className="font-medium text-slate-800">{tab.label}</span>
                  <span className="text-sm text-slate-500">
                    {documentProgress(tab)}
                  </span>
                </div>
                <p className="mt-0.5 text-sm text-slate-500">{tab.hint}</p>
                <ul className="mt-1.5 space-y-1 text-sm">
                  {(byType.get(tab.type) ?? []).map((document) => (
                    <li key={document.documentId}>
                      <a
                        href={document.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-primary-700 underline hover:text-primary-800"
                      >
                        <ExternalLink size={14} />
                        {document.fileName || document.documentId}
                        <span className="text-slate-400">
                          · {new Date(document.uploadedAt).toLocaleString()}
                        </span>
                      </a>
                    </li>
                  ))}
                  {(byType.get(tab.type) ?? []).length === 0 && (
                    <li className="text-slate-400">Nothing uploaded.</li>
                  )}
                </ul>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {facility.allocations.length === 0 ? (
        <p className="text-sm text-slate-500">Nothing allocated yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th className="py-1 pr-4 font-medium">Vehicle type</th>
                <th className="py-1 pr-4 font-medium">Bay</th>
                <th className="py-1 pr-4 font-medium">Bays</th>
                <th className="py-1 pr-4 font-medium">Price/hr</th>
                <th className="py-1 pr-4 font-medium">Commission</th>
                <th className="py-1 font-medium">Provider takes</th>
              </tr>
            </thead>
            <tbody className="text-slate-700">
              {facility.allocations.map((allocation) => (
                <tr key={allocation.vehicleTypeId} className="border-t border-slate-100">
                  <td className="py-1.5 pr-4">{allocation.vehicleTypeName}</td>
                  <td className="py-1.5 pr-4">
                    {bayLabel(allocation.bayLengthMeters, allocation.bayWidthMeters)}
                  </td>
                  <td className="py-1.5 pr-4">{allocation.numberOfSlots}</td>
                  <td className="py-1.5 pr-4">{formatMoney(allocation.hourlyRate)}</td>
                  <td className="py-1.5 pr-4">
                    {formatPercent(allocation.commissionRate)}
                  </td>
                  <td className="py-1.5">
                    {formatMoney(
                      Math.round(
                        (allocation.hourlyRate * (100 - allocation.commissionRate)),
                      ) / 100,
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
        <Row label="Total bays" value={facility.slotCount} />
        <Row label="Open hours" value={formatOperatingHours(facility)} />
      </div>

      {facility.slotGroups.length > 0 && (
        <div>
          <p className="mb-1 text-sm font-medium text-slate-800">Generated bays</p>
          <ul className="space-y-0.5 text-sm text-slate-600">
            {facility.slotGroups.map((group) => (
              <li key={group.vehicleTypeId}>
                {group.vehicleTypeName}: {group.total} bays · {group.available} free ·{" "}
                {group.bayLabel}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ReviewSectionDetails;
