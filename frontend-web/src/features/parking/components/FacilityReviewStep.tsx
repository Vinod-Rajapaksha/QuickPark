import React from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Circle,
  Send,
} from "lucide-react";
import Button from "../../../components/common/Button/Button";
import SectionReviews from "./SectionReviews";
import type { ParkingFacility } from "../types/parkingTypes";
import {
  bayLabel,
  documentTabsFor,
  formatCoordinates,
  formatLandArea,
  formatMoney,
  formatOperatingHours,
  formatPercent,
} from "../utils/parkingUtils";

export const FacilityReviewStep: React.FC<{
  facility: ParkingFacility;
  isSubmitting: boolean;
  serverError: string | null;
  onSubmit: () => void;
}> = ({ facility, isSubmitting, serverError, onSubmit }) => {
  const tabs = documentTabsFor(facility.documentRequirements);
  const isEditable = facility.isEditable;
  const noSlots = facility.slotCount === 0;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400">Property</p>
          <p className="mt-1 font-medium text-slate-800">{facility.name}</p>
          <p className="text-sm text-slate-600">{facility.address}</p>
          <p className="text-sm text-slate-600">
            {facility.city}, {facility.district}, {facility.province} Province
          </p>
        </div>
        <div className="space-y-1 text-sm text-slate-600">
          <p>{formatLandArea(facility.landAreaPerches)}</p>
          <p>
            Location point:{" "}
            <span className="font-medium text-slate-800">
              {formatCoordinates(facility) ?? "not entered"}
            </span>
          </p>
          <p>Open {formatOperatingHours(facility)}</p>
          <p>EV charging: {facility.hasEvCharging ? "Yes" : "No"}</p>
          <p>{facility.slotCount} parking slots</p>
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-slate-800">Documents</p>
        <ul className="space-y-1 text-sm">
          {tabs.map((tab) => (
            <li key={tab.type} className="flex items-center gap-2">
              {tab.satisfied ? (
                <CheckCircle2 size={16} className="text-emerald-600" />
              ) : (
                <Circle size={16} className="text-slate-300" />
              )}
              <span className="text-slate-700">{tab.label}</span>
              <span className="text-xs text-slate-400">
                {tab.minRequired > 0
                  ? `${tab.count}/${tab.minRequired}`
                  : `${tab.count} uploaded`}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-slate-800">Slots & pricing</p>
        {facility.allocations.length === 0 ? (
          <p className="text-sm text-slate-500">
            No vehicle types allocated yet.
          </p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th className="py-1 font-medium">Vehicle type</th>
                <th className="py-1 font-medium">Standard bay</th>
                <th className="py-1 font-medium">Slots</th>
                <th className="py-1 font-medium">Your price</th>
                <th className="py-1 font-medium">Commission (admin)</th>
              </tr>
            </thead>
            <tbody className="text-slate-700">
              {facility.allocations.map((allocation) => (
                <tr key={allocation.vehicleTypeId} className="border-t border-slate-100">
                  <td className="py-1.5">{allocation.vehicleTypeName}</td>
                  <td className="py-1.5">
                    {bayLabel(allocation.bayLengthMeters, allocation.bayWidthMeters)}
                  </td>
                  <td className="py-1.5">{allocation.numberOfSlots}</td>
                  <td className="py-1.5">{formatMoney(allocation.hourlyRate)}</td>
                  <td className="py-1.5">{formatPercent(allocation.commissionRate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-slate-800">
          Admin review, section by section
        </p>
        <SectionReviews sections={facility.sections} />
      </div>

      {facility.status === "APPROVED" ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          This property is approved and live — drivers can find and book it now.
        </p>
      ) : facility.missingRequirements.length > 0 ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {facility.missingRequirements.length} thing
          {facility.missingRequirements.length === 1 ? " is" : "s are"} still outstanding
          before this can go to the admin — each one is listed against its section above.
        </p>
      ) : noSlots ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          At least one parking slot is required before submitting the facility for approval.
        </p>
      ) : null}

      {serverError && (
        <p className="text-sm text-red-600" role="alert">
          {serverError}
        </p>
      )}

      {facility.status === "APPROVED" ? (
        <p className="flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <span>
            There is nothing to submit here. Saving a layout or detail change sends this property
            back to the admin queue by itself.
          </span>
        </p>
      ) : (
        <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-5">
          <Button
            type="button"
            variant="primary"
            isLoading={isSubmitting}
            disabled={!isEditable || !facility.readyForSubmission || noSlots}
            leftIcon={<Send size={16} />}
            onClick={onSubmit}
          >
            {facility.status === "REJECTED" ? "Submit for review again" : "Submit for admin review"}
          </Button>
        </div>
      )}
    </div>
  );
};

export default FacilityReviewStep;
