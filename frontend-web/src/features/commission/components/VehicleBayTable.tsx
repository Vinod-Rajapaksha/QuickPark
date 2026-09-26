import React, { useState } from "react";
import Button from "../../../components/common/Button/Button";
import Input from "../../../components/common/Input/Input";
import type {
  SaveVehicleTypeInput,
  VehicleTypeConfig,
  VehicleTypeDraft,
} from "../types/commissionTypes";
import { bayLabel } from "../../parking/utils/parkingUtils";
import {
  hasErrors,
  toVehicleTypeInput,
  validateVehicleTypeDraft,
  vehicleTypeDraft,
} from "../utils/commissionUtils";

interface VehicleBayTableProps {
  vehicleTypes: VehicleTypeConfig[];
  busyKey: string | null;
  onSave: (input: SaveVehicleTypeInput, vehicleTypeId?: string) => Promise<boolean>;
}

const BLANK: VehicleTypeDraft = {
  name: "",
  slotCode: "",
  sortOrder: "0",
  isActive: true,
  bayLengthMeters: "",
  bayWidthMeters: "",
};

export const VehicleBayTable: React.FC<VehicleBayTableProps> = ({
  vehicleTypes,
  busyKey,
  onSave,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<VehicleTypeDraft>(BLANK);
  const [submitted, setSubmitted] = useState(false);

  const errors = validateVehicleTypeDraft(draft);
  const isCreating = editingId === "new";

  const startEdit = (type: VehicleTypeConfig) => {
    setEditingId(type.id);
    setSubmitted(false);
    setDraft(vehicleTypeDraft(type));
  };

  const patch = (next: Partial<VehicleTypeDraft>) => {
    setDraft((current) => ({ ...current, ...next }));
  };

  const submit = async () => {
    setSubmitted(true);
    if (hasErrors(errors)) return;
    const ok = await onSave(toVehicleTypeInput(draft), isCreating ? undefined : (editingId ?? undefined));
    if (ok) {
      setEditingId(null);
      setDraft(BLANK);
      setSubmitted(false);
    }
  };

  const cellError = (field: keyof VehicleTypeDraft) =>
    submitted ? errors[field] : undefined;

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[72rem] text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
              <th className="w-56 py-2 pr-3 font-medium">Vehicle type</th>
              <th className="w-36 py-2 pr-3 font-medium">Slot code</th>
              <th className="w-28 py-2 pr-3 font-medium">Order</th>
              <th className="w-80 py-2 pr-3 font-medium">Standard bay</th>
              <th className="py-2 font-medium" />
            </tr>
          </thead>
          <tbody>
            {vehicleTypes.map((type) => {
              const editing = editingId === type.id;
              const busy = busyKey === `type:${type.id}`;

              return (
                <tr key={type.id} className="border-b border-slate-100 align-top">
                  <td className="py-3 pr-3">
                    {editing ? (
                      <Input
                        label="Name"
                        value={draft.name}
                        disabled={busy}
                        onChange={(event) => patch({ name: event.target.value })}
                        error={cellError("name")}
                      />
                    ) : (
                      <>
                        <p className="font-medium text-slate-800">
                          {type.name}
                          {!type.isActive && (
                            <span className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-500">
                              deactivated
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-slate-500">
                          Slots numbered {type.slotCode}-01, {type.slotCode}-02…
                        </p>
                      </>
                    )}
                  </td>
                  <td className="py-3 pr-3">
                    {editing ? (
                      <Input
                        label="Slot code"
                        value={draft.slotCode}
                        maxLength={10}
                        disabled={busy}
                        onChange={(event) => patch({ slotCode: event.target.value })}
                        error={cellError("slotCode")}
                      />
                    ) : (
                      <p className="font-mono text-slate-700">{type.slotCode}</p>
                    )}
                  </td>
                  <td className="py-3 pr-3">
                    {editing ? (
                      <Input
                        label="Order"
                        type="number"
                        min="0"
                        step="1"
                        value={draft.sortOrder}
                        disabled={busy}
                        onChange={(event) => patch({ sortOrder: event.target.value })}
                        error={cellError("sortOrder")}
                      />
                    ) : (
                      <p className="text-slate-700">{type.sortOrder}</p>
                    )}
                  </td>
                  <td className="py-3 pr-3">
                    {editing ? (
                      <div className="flex gap-2">
                        <Input
                          label="Bay length (m)"
                          type="number"
                          min="0"
                          step="0.05"
                          value={draft.bayLengthMeters}
                          disabled={busy}
                          onChange={(event) => patch({ bayLengthMeters: event.target.value })}
                          error={cellError("bayLengthMeters")}
                        />
                        <Input
                          label="Bay width (m)"
                          type="number"
                          min="0"
                          step="0.05"
                          value={draft.bayWidthMeters}
                          disabled={busy}
                          onChange={(event) => patch({ bayWidthMeters: event.target.value })}
                          error={cellError("bayWidthMeters")}
                        />
                      </div>
                    ) : (
                      <p className="font-medium text-slate-800">
                        {bayLabel(type.bayLengthMeters, type.bayWidthMeters)}
                      </p>
                    )}
                  </td>
                  <td className="py-3">
                    {editing ? (
                      <div className="flex items-center justify-end gap-3">
                        <label className="flex items-center gap-1.5 text-xs text-slate-600">
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600"
                            checked={draft.isActive}
                            disabled={busy}
                            onChange={(event) => patch({ isActive: event.target.checked })}
                          />
                          Active
                        </label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={busy}
                          onClick={() => {
                            setEditingId(null);
                            setDraft(BLANK);
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="button"
                          variant="primary"
                          size="sm"
                          isLoading={busy}
                          onClick={() => void submit()}
                        >
                          Save
                        </Button>
                      </div>
                    ) : (
                      <div className="flex justify-end">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={editingId !== null}
                          onClick={() => startEdit(type)}
                        >
                          Edit
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {isCreating ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4">
          <p className="mb-3 text-sm font-medium text-slate-700">New vehicle type</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <Input
              label="Name"
              required
              value={draft.name}
              onChange={(event) => patch({ name: event.target.value })}
              error={cellError("name")}
            />
            <Input
              label="Slot code"
              required
              maxLength={10}
              value={draft.slotCode}
              onChange={(event) => patch({ slotCode: event.target.value })}
              error={cellError("slotCode")}
            />
            <Input
              label="Order"
              type="number"
              min="0"
              step="1"
              value={draft.sortOrder}
              onChange={(event) => patch({ sortOrder: event.target.value })}
              error={cellError("sortOrder")}
            />
            <Input
              label="Bay length (m)"
              type="number"
              min="0"
              step="0.05"
              placeholder="e.g. 5"
              value={draft.bayLengthMeters}
              onChange={(event) => patch({ bayLengthMeters: event.target.value })}
              error={cellError("bayLengthMeters")}
            />
            <Input
              label="Bay width (m)"
              type="number"
              min="0"
              step="0.05"
              placeholder="e.g. 2.5"
              value={draft.bayWidthMeters}
              onChange={(event) => patch({ bayWidthMeters: event.target.value })}
              error={cellError("bayWidthMeters")}
            />
          </div>
          <div className="mt-3 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setEditingId(null);
                setDraft(BLANK);
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              isLoading={busyKey === "type:new"}
              onClick={() => void submit()}
            >
              Create type
            </Button>
          </div>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={editingId !== null}
          onClick={() => {
            setEditingId("new");
            setDraft(BLANK);
            setSubmitted(false);
          }}
        >
          Add vehicle type
        </Button>
      )}
    </div>
  );
};

export default VehicleBayTable;
