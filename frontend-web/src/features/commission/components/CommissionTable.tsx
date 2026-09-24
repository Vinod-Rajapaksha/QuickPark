import React, { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import Button from "../../../components/common/Button/Button";
import Input from "../../../components/common/Input/Input";
import type {
  PricingDraft,
  SaveVehiclePricingInput,
  VehiclePricingConfig,
  VehicleTypeConfig,
} from "../types/commissionTypes";
import {
  hasErrors,
  pricingDraft,
  providerSummary,
  toPricingInput,
  validatePricingDraft,
} from "../utils/commissionUtils";

interface CommissionTableProps {
  vehicleTypes: VehicleTypeConfig[];
  pricingByType: Record<string, VehiclePricingConfig>;
  busyKey: string | null;
  onSave: (vehicleTypeId: string, input: SaveVehiclePricingInput) => Promise<boolean>;
  onWithdraw: (vehicleTypeId: string) => Promise<boolean>;
}

const seed = (
  vehicleTypes: readonly VehicleTypeConfig[],
  pricingByType: Record<string, VehiclePricingConfig>,
): Record<string, PricingDraft> =>
  Object.fromEntries(
    vehicleTypes.map((type) => [
      type.id,
      pricingDraft(pricingByType[type.id]),
    ]),
  );

export const CommissionTable: React.FC<CommissionTableProps> = ({
  vehicleTypes,
  pricingByType,
  busyKey,
  onSave,
  onWithdraw,
}) => {
  const [drafts, setDrafts] = useState<Record<string, PricingDraft>>(() =>
    seed(vehicleTypes, pricingByType),
  );
  // A save re-reads every row, so only the rows the admin has not touched follow the server.
  const [dirty, setDirty] = useState<Record<string, boolean>>({});
  const [showErrors, setShowErrors] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setDrafts((current) => {
      const next = seed(vehicleTypes, pricingByType);
      return Object.fromEntries(
        vehicleTypes.map((type) => [type.id, dirty[type.id] ? current[type.id] ?? next[type.id] : next[type.id]]),
      );
    });
  }, [vehicleTypes, pricingByType, dirty]);

  const update = (vehicleTypeId: string, patch: Partial<PricingDraft>) => {
    setDirty((current) => ({ ...current, [vehicleTypeId]: true }));
    setDrafts((current) => ({
      ...current,
      [vehicleTypeId]: { ...current[vehicleTypeId], ...patch },
    }));
  };

  const save = async (vehicleTypeId: string) => {
    setShowErrors((current) => ({ ...current, [vehicleTypeId]: true }));
    const draft = drafts[vehicleTypeId];
    if (!draft || hasErrors(validatePricingDraft(draft))) return;
    if (await onSave(vehicleTypeId, toPricingInput(draft))) {
      setDirty((current) => ({ ...current, [vehicleTypeId]: false }));
      setShowErrors((current) => ({ ...current, [vehicleTypeId]: false }));
    }
  };

  const withdraw = async (vehicleTypeId: string) => {
    if (await onWithdraw(vehicleTypeId)) {
      setDirty((current) => ({ ...current, [vehicleTypeId]: false }));
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[56rem] text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
            <th className="w-56 py-2 pr-3 font-medium">Vehicle type</th>
            <th className="py-2 pr-3 font-medium">Minimum (LKR)</th>
            <th className="py-2 pr-3 font-medium">Maximum (LKR)</th>
            <th className="py-2 pr-3 font-medium">Commission %</th>
            <th className="py-2 pr-3 font-medium">Active</th>
            <th className="py-2 font-medium" />
          </tr>
        </thead>
        <tbody>
          {vehicleTypes.map((type) => {
            const draft = drafts[type.id] ?? pricingDraft(pricingByType[type.id]);
            const errors = validatePricingDraft(draft);
            const saved = pricingByType[type.id];
            const busy = busyKey === `pricing:${type.id}`;
            const editable = type.isActive;

            return (
              <tr key={type.id} className="border-b border-slate-100 align-top">
                <td className="py-3 pr-3">
                  <p className="font-medium text-slate-800">{type.name}</p>
                  <p className="text-xs text-slate-500">{type.slotCode}</p>
                  <p className="mt-1 max-w-xs text-xs text-slate-500">
                    {providerSummary(saved, type)}
                  </p>
                  {saved && !saved.isActive && (
                    <p className="mt-1 text-xs text-amber-600">
                      Saved as inactive — the owner form shows no window for it.
                    </p>
                  )}
                </td>
                {(["minimumPrice", "maximumPrice", "commissionRate"] as const).map(
                  (field) => (
                    <td key={field} className="w-36 py-3 pr-3">
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={draft[field]}
                        disabled={!editable || busy}
                        onChange={(event) =>
                          update(type.id, { [field]: event.target.value })
                        }
                        error={showErrors[type.id] ? errors[field] : undefined}
                      />
                    </td>
                  ),
                )}
                <td className="w-36 py-3 pr-3">
                  <label className="flex items-center gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600"
                      checked={draft.isActive}
                      disabled={!editable || busy}
                      onChange={(event) =>
                        update(type.id, { isActive: event.target.checked })
                      }
                    />
                    <span className="text-xs text-slate-500">
                      {editable ? "Open for providers" : "Type deactivated"}
                    </span>
                  </label>
                </td>
                <td className="py-3">
                  <div className="flex items-center justify-end gap-2">
                    {saved && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        leftIcon={<Trash2 size={16} />}
                        disabled={busy}
                        onClick={() => void withdraw(type.id)}
                      >
                        Withdraw
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      isLoading={busy}
                      disabled={!editable}
                      onClick={() => void save(type.id)}
                    >
                      Save
                    </Button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default CommissionTable;
