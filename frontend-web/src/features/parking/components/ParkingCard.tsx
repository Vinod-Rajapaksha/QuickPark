import React from "react";
import { Clock, FileText, MapPin, Zap } from "lucide-react";
import Button from "../../../components/common/Button/Button";
import Card from "../../../components/common/Card/Card";
import ParkingStatusBadge from "./ParkingStatusBadge";
import PricingHoursPanel from "./PricingHoursPanel";
import {
  formatLandArea,
  formatOperatingHours,
  STATUS_HELP_TEXT,
} from "../utils/parkingUtils";
import type {
  AllocationInput,
  ParkingFacility,
  ParkingInput,
  VehicleTypeOption,
} from "../types/parkingTypes";

interface ParkingCardProps {
  facility: ParkingFacility;
  vehicleTypes?: VehicleTypeOption[];
  onOpenSetup?: (facility: ParkingFacility) => void;
  onOpenSlots?: (facility: ParkingFacility) => void;
  onSaveHours?: (input: ParkingInput) => Promise<boolean>;
  onSaveRates?: (allocations: AllocationInput[]) => Promise<boolean>;
  onDelete?: (facility: ParkingFacility) => void;
}

export const ParkingCard: React.FC<ParkingCardProps> = ({
  facility,
  vehicleTypes = [],
  onOpenSetup,
  onOpenSlots,
  onSaveHours,
  onSaveRates,
  onDelete,
}) => {
  const canDelete = facility.status === "DRAFT" || facility.status === "REJECTED";

  // Only an approved property is open to live retuning, and nothing is repricable without an allocated type.
  const canManageLive =
    facility.status === "APPROVED" &&
    facility.allocations.length > 0 &&
    Boolean(onSaveHours && onSaveRates);

  return (
    <Card className="border-slate-200" padding="md">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="truncate font-semibold text-slate-900">{facility.name}</h3>
          <p className="mt-0.5 truncate text-sm text-slate-500">{facility.address}</p>
        </div>
        <ParkingStatusBadge status={facility.status} />
      </div>

      <p className="mt-3 flex items-center gap-1.5 text-sm text-slate-700">
        <MapPin size={16} className="text-slate-400" />
        {facility.district}, {facility.province} Province
      </p>

      <div
        className={`mt-3 grid grid-cols-1 gap-3 text-sm ${
          canManageLive ? "sm:grid-cols-2" : "sm:grid-cols-3"
        }`}
      >
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400">Land area</p>
          <p className="mt-1 text-slate-700">
            {formatLandArea(facility.landAreaPerches)}
          </p>
        </div>
        {!canManageLive && (
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">Hours</p>
            <p className="mt-1 flex items-center gap-1.5 text-slate-700">
              <Clock size={14} className="text-slate-400" />
              {formatOperatingHours(facility)}
            </p>
          </div>
        )}
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400">Slots</p>
          <p className="mt-1 flex items-center gap-1.5 text-slate-700">
            {facility.hasEvCharging && (
              <span className="inline-flex items-center gap-1 text-emerald-600">
                <Zap size={14} />
                EV
              </span>
            )}
            {facility.slotCount}
          </p>
        </div>
      </div>

      <p
        className={`mt-4 flex items-start gap-1.5 text-sm ${
          facility.missingRequirements.length === 0 ? "text-emerald-700" : "text-amber-700"
        }`}
      >
        <FileText size={14} className="mt-0.5 shrink-0" />
        {facility.missingRequirements.length === 0
          ? facility.readyForSubmission
            ? "Ready for admin review"
            : "All required documents and bays are in place."
          : `Still needed: ${facility.missingRequirements.join(", ")}.`}
      </p>

      {canManageLive && onSaveHours && onSaveRates && (
        <PricingHoursPanel
          facility={facility}
          vehicleTypes={vehicleTypes}
          onSaveHours={onSaveHours}
          onSaveRates={onSaveRates}
        />
      )}

      {(onOpenSetup || onOpenSlots || (canDelete && onDelete)) && (
        <div className="mt-4 flex flex-wrap gap-2">
          {onOpenSetup && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenSetup(facility)}
            >
              {facility.readyForSubmission
                ? "Review & submit"
                : facility.status === "APPROVED" || facility.status === "PENDING_APPROVAL"
                  ? "Manage property"
                  : "Continue setup"}
            </Button>
          )}
          {onOpenSlots && facility.slotCount > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onOpenSlots(facility)}
            >
              Bays & bookings
            </Button>
          )}
          {canDelete && onDelete && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-red-600 hover:bg-red-50"
              onClick={() => onDelete(facility)}
            >
              Delete
            </Button>
          )}
        </div>
      )}

      <p className="mt-4 text-xs text-slate-500">{STATUS_HELP_TEXT[facility.status]}</p>
    </Card>
  );
};

export default ParkingCard;
