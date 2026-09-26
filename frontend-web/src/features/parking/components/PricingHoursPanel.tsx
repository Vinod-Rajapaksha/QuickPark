import React, { useState } from "react";
import { Save } from "lucide-react";
import Button from "../../../components/common/Button/Button";
import Input from "../../../components/common/Input/Input";
import type {
  AllocationInput,
  ParkingFacility,
  ParkingInput,
  VehicleTypeOption,
} from "../types/parkingTypes";
import {
  detailsInputOf,
  priceRangeHint,
  toApiTime,
  validateAllocationRows,
} from "../utils/parkingUtils";

// <input type="time"> uses HH:MM while the API sends HH:MM:SS.
const toFormTime = (value: string): string => value.slice(0, 5);

const asNumber = (value: string): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

interface HoursDraft {
  opening: string;
  closing: string;
}

interface PricingHoursPanelProps {
  facility: ParkingFacility;
  vehicleTypes: VehicleTypeOption[];
  onSaveHours: (input: ParkingInput) => Promise<boolean>;
  onSaveRates: (allocations: AllocationInput[]) => Promise<boolean>;
}

// Quick edit for a live property: hours plus one price per allocated type. Slot counts are deliberately absent, and each half keeps its own draft.
export const PricingHoursPanel: React.FC<PricingHoursPanelProps> = ({
  facility,
  vehicleTypes,
  onSaveHours,
  onSaveRates,
}) => {
  const [hoursDraft, setHoursDraft] = useState<HoursDraft | null>(null);
  const [rateDrafts, setRateDrafts] = useState<Record<string, string>>({});
  const [pending, setPending] = useState<"hours" | "rates" | null>(null);
  const [hoursFailed, setHoursFailed] = useState(false);
  const [showRateErrors, setShowRateErrors] = useState(false);

  const savedHours = {
    opening: toFormTime(facility.openingTime),
    closing: toFormTime(facility.closingTime),
  };
  const hours = hoursDraft ?? savedHours;
  const hoursDirty =
    hoursDraft !== null &&
    (hours.opening !== savedHours.opening || hours.closing !== savedHours.closing);
  const hoursMissing = hours.opening === "" || hours.closing === "";
  // Both values are HH:MM, so the text order is the time order.
  const hoursMisordered = !hoursMissing && hours.closing <= hours.opening;

  const rows: AllocationInput[] = facility.allocations.map((allocation) => ({
    vehicleTypeId: allocation.vehicleTypeId,
    numberOfSlots: allocation.numberOfSlots,
    hourlyRate: asNumber(rateDrafts[allocation.vehicleTypeId] ?? String(allocation.hourlyRate)),
  }));
  const rateErrors = validateAllocationRows(rows, vehicleTypes);
  const ratesDirty = facility.allocations.some((allocation) => {
    const draft = rateDrafts[allocation.vehicleTypeId];
    return draft !== undefined && asNumber(draft) !== allocation.hourlyRate;
  });

  const submitHours = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!hoursDirty || hoursMissing || hoursMisordered || pending) return;
    setPending("hours");
    const saved = await onSaveHours({
      ...detailsInputOf(facility),
      openingTime: toApiTime(hours.opening),
      closingTime: toApiTime(hours.closing),
    });
    setPending(null);
    setHoursFailed(!saved);
    if (saved) setHoursDraft(null);
  };

  const submitRates = async (event: React.FormEvent) => {
    event.preventDefault();
    setShowRateErrors(true);
    if (!ratesDirty || Object.keys(rateErrors).length > 0 || pending) return;
    setPending("rates");
    const saved = await onSaveRates(rows);
    setPending(null);
    if (saved) setRateDrafts({});
  };

  return (
    <div className="mt-4 space-y-5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-4">
      <div>
        <p className="text-sm font-semibold text-slate-800">Pricing &amp; operating hours</p>
        <p className="mt-0.5 text-xs text-slate-500">
          Both apply as soon as you save, and this property stays live and bookable.
        </p>
      </div>

      <form onSubmit={submitHours} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Opens at"
            type="time"
            value={hours.opening}
            onChange={(event) => {
              setHoursFailed(false);
              setHoursDraft({ opening: event.target.value, closing: hours.closing });
            }}
          />
          <Input
            label="Closes at"
            type="time"
            value={hours.closing}
            onChange={(event) => {
              setHoursFailed(false);
              setHoursDraft({ opening: hours.opening, closing: event.target.value });
            }}
          />
        </div>
        {hoursMissing && (
          <p className="text-sm text-red-600" role="alert">
            Enter both an opening and a closing time.
          </p>
        )}
        {hoursMisordered && (
          <p className="text-sm text-red-600" role="alert">
            Closing time must be later than opening time.
          </p>
        )}
        {hoursFailed && (
          <p className="text-sm text-red-600" role="alert">
            Not saved — the reason is shown above your property list.
          </p>
        )}
        <Button
          type="submit"
          variant="outline"
          size="sm"
          leftIcon={<Save size={16} />}
          isLoading={pending === "hours"}
          disabled={!hoursDirty || hoursMissing || hoursMisordered}
        >
          Save hours
        </Button>
      </form>

      <form onSubmit={submitRates} className="space-y-3">
        <ul className="space-y-3">
          {facility.allocations.map((allocation) => {
            const option = vehicleTypes.find(
              (vehicleType) => vehicleType.id === allocation.vehicleTypeId,
            );
            return (
              <li key={allocation.vehicleTypeId} className="space-y-1">
                <Input
                  label={`${allocation.vehicleTypeName} per hour (LKR)`}
                  type="number"
                  min={option?.minPrice ?? 0}
                  max={option?.maxPrice ?? undefined}
                  step="0.01"
                  value={
                    rateDrafts[allocation.vehicleTypeId] ?? String(allocation.hourlyRate)
                  }
                  onChange={(event) =>
                    setRateDrafts((current) => ({
                      ...current,
                      [allocation.vehicleTypeId]: event.target.value,
                    }))
                  }
                  error={
                    showRateErrors
                      ? rateErrors[allocation.vehicleTypeId]?.hourlyRate
                      : undefined
                  }
                />
                <p className="text-xs text-slate-400">
                  {allocation.numberOfSlots} bay
                  {allocation.numberOfSlots === 1 ? "" : "s"}
                  {option ? ` · ${priceRangeHint(option)}` : ""}
                </p>
              </li>
            );
          })}
        </ul>
        <Button
          type="submit"
          variant="outline"
          size="sm"
          leftIcon={<Save size={16} />}
          isLoading={pending === "rates"}
          disabled={!ratesDirty}
        >
          Save prices
        </Button>
      </form>
    </div>
  );
};

export default PricingHoursPanel;
