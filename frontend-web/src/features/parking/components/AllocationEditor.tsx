import React, { useState } from "react";
import { Save, Layers, AlertTriangle } from "lucide-react";
import Button from "../../../components/common/Button/Button";
import Input from "../../../components/common/Input/Input";
import Spinner from "../../../components/common/Spinner/Spinner";
import type {
  AllocationInput,
  FacilityAllocation,
  VehicleTypeOption,
} from "../types/parkingTypes";
import {
  formatMoney,
  formatPercent,
  hasBaySize,
  isPricedByAdmin,
  priceRangeHint,
  splitAmount,
  standardBayLabel,
  validateAllocationRows,
  type AllocationRowErrors,
} from "../utils/parkingUtils";

interface AllocationDraft {
  vehicleTypeId: string;
  included: boolean;
  numberOfSlots: string;
  hourlyRate: string;
}

interface AllocationEditorProps {
  vehicleTypes: VehicleTypeOption[];
  existing: FacilityAllocation[];
  disabled?: boolean;
  warnReApproval?: boolean;
  isSaving?: boolean;
  serverError?: string | null;
  onSave: (allocations: AllocationInput[]) => void | Promise<unknown>;
}

const toDraft = (
  vehicleType: VehicleTypeOption,
  existing?: FacilityAllocation,
): AllocationDraft => ({
  vehicleTypeId: vehicleType.id,
  included: Boolean(existing),
  numberOfSlots: existing ? String(existing.numberOfSlots) : "1",
  hourlyRate: existing ? String(existing.hourlyRate) : "",
});

const asNumber = (value: string): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const toAllocationInput = (draft: AllocationDraft): AllocationInput => ({
  vehicleTypeId: draft.vehicleTypeId,
  numberOfSlots: asNumber(draft.numberOfSlots),
  hourlyRate: asNumber(draft.hourlyRate),
});

export const AllocationEditor: React.FC<AllocationEditorProps> = ({
  vehicleTypes,
  existing,
  disabled = false,
  warnReApproval = false,
  isSaving = false,
  serverError = null,
  onSave,
}) => {
  const [drafts, setDrafts] = useState<AllocationDraft[]>(() =>
    vehicleTypes.map((vehicleType) =>
      toDraft(vehicleType, existing.find((item) => item.vehicleTypeId === vehicleType.id)),
    ),
  );
  const [showErrors, setShowErrors] = useState(false);
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});

  const selected = drafts.filter((draft) => draft.included);
  const errors: Record<string, AllocationRowErrors> = validateAllocationRows(
    selected.map(toAllocationInput),
    vehicleTypes,
  );

  const totalSlots = selected.reduce(
    (sum, draft) => sum + asNumber(draft.numberOfSlots),
    0,
  );

  const update = (vehicleTypeId: string, patch: Partial<AllocationDraft>) => {
    setTouchedFields((current) => {
      const next = { ...current };
      for (const field of Object.keys(patch)) {
        next[`${vehicleTypeId}:${field}`] = true;
      }
      return next;
    });
    setDrafts((current) =>
      current.map((draft) =>
        draft.vehicleTypeId === vehicleTypeId ? { ...draft, ...patch } : draft,
      ),
    );
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setShowErrors(true);
    if (selected.length === 0 || Object.keys(errors).length > 0) return;
    void onSave(selected.map(toAllocationInput));
  };

  const errorFor = (vehicleTypeId: string, field: keyof AllocationRowErrors) =>
    showErrors || touchedFields[`${vehicleTypeId}:${field}`]
      ? errors[vehicleTypeId]?.[field]
      : undefined;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <p className="text-sm text-slate-500">
        Tick every vehicle type you can park, say how many slots each one gets and set your
        price within the window the platform admin allows. The bay size is fixed by the
        system for each vehicle type, so it is shown but not chosen here. Saving rebuilds
        the slot list for this property.
      </p>

      {vehicleTypes.length === 0 ? (
        <p className="rounded-lg border border-dashed border-slate-300 px-4 py-6 text-center text-sm text-slate-500">
          No vehicle types are available yet. Ask the platform admin to configure them.
        </p>
      ) : (
        <ul className="space-y-3">
          {drafts.map((draft) => {
            const vehicleType = vehicleTypes.find((item) => item.id === draft.vehicleTypeId)!;
            const priced = isPricedByAdmin(vehicleType);
            const allocatable = priced && hasBaySize(vehicleType);
            const priceHint = priceRangeHint(vehicleType);
            const hourlyRate = asNumber(draft.hourlyRate);
            const split =
              vehicleType.commissionRate === null
                ? null
                : splitAmount(hourlyRate, vehicleType.commissionRate);

            return (
              <li
                key={draft.vehicleTypeId}
                className={`rounded-xl border px-4 py-3 ${
                  draft.included ? "border-slate-200 bg-white" : "border-slate-100 bg-slate-50"
                }`}
              >
                <label className="flex items-center gap-2 text-sm font-medium text-slate-800">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600"
                    checked={draft.included}
                    disabled={disabled || !allocatable}
                    onChange={(event) =>
                      update(draft.vehicleTypeId, { included: event.target.checked })
                    }
                  />
                  {vehicleType.name}
                  <span className="text-xs font-normal text-slate-400">{vehicleType.code}</span>
                  <span
                    className={`ml-auto text-xs font-normal ${
                      allocatable ? "text-slate-500" : "text-amber-600"
                    }`}
                  >
                    {allocatable
                      ? priceHint
                      : !priced
                        ? "The admin has not set pricing for this type yet."
                        : "The admin has not set this type's bay size yet."}
                  </span>
                </label>

                {draft.included && (
                  <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                      <p className="text-xs font-medium text-slate-500">
                        Standard bay (set by the system)
                      </p>
                      <p className="text-sm font-semibold text-slate-800">
                        {standardBayLabel(vehicleType)}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        Every {vehicleType.name.toLowerCase()} slot here is built to this size.
                      </p>
                    </div>
                    <Input
                      label="Slots"
                      type="number"
                      min="1"
                      step="1"
                      disabled={disabled}
                      value={draft.numberOfSlots}
                      onChange={(event) =>
                        update(draft.vehicleTypeId, { numberOfSlots: event.target.value })
                      }
                      error={errorFor(draft.vehicleTypeId, "numberOfSlots")}
                    />
                    <Input
                      label="Your price per hour (LKR)"
                      type="number"
                      min={vehicleType.minPrice ?? "0"}
                      max={vehicleType.maxPrice ?? undefined}
                      step="0.01"
                      disabled={disabled}
                      value={draft.hourlyRate}
                      onChange={(event) =>
                        update(draft.vehicleTypeId, { hourlyRate: event.target.value })
                      }
                      error={errorFor(draft.vehicleTypeId, "hourlyRate")}
                    />
                    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                      <p className="text-xs font-medium text-slate-500">
                        Commission (set by the admin)
                      </p>
                      <p className="text-sm font-semibold text-slate-800">
                        {vehicleType.commissionRate === null
                          ? "Not set"
                          : formatPercent(vehicleType.commissionRate)}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {split && hourlyRate > 0
                          ? `${formatMoney(split.commission)} to the platform · you keep ${formatMoney(split.providerAmount)}`
                          : "Enter a price to see your share."}
                      </p>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {warnReApproval && (
        <p className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <span>
            Saving a new price keeps this property live. Adding or removing a vehicle type, or
            changing a slot count, rebuilds the slot list and sends it back to the admin queue.
          </span>
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
        <p className="flex items-center gap-1.5 text-sm text-slate-600">
          <Layers size={16} className="text-slate-400" />
          {selected.length} vehicle type{selected.length === 1 ? "" : "s"} · {totalSlots} slot
          {totalSlots === 1 ? "" : "s"}
        </p>
        <Button
          type="submit"
          variant="primary"
          size="sm"
          leftIcon={<Save size={16} />}
          isLoading={isSaving}
          disabled={disabled || selected.length === 0}
        >
          {isSaving
            ? "Saving…"
            : warnReApproval
              ? "Save & send for review"
              : "Save layout"}
        </Button>
      </div>

      {showErrors && selected.length === 0 && (
        <p className="text-sm text-red-600" role="alert">
          Select at least one vehicle type.
        </p>
      )}
      {serverError && (
        <p className="text-sm text-red-600" role="alert">
          {serverError}
        </p>
      )}
      {isSaving && <Spinner size="sm" />}
    </form>
  );
};

export default AllocationEditor;
