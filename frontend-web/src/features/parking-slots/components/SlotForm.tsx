import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle, X } from "lucide-react";
import Button from "../../../components/common/Button/Button";
import Input from "../../../components/common/Input/Input";
import Select from "../../parking/components/FormSelect";
import { slotStatusSchema, type SlotStatusValues } from "../schemas/parkingSlotSchemas";
import {
  OwnerSlotState,
  type ParkingSlotRow,
  type SlotStatusInput,
} from "../types/parkingSlotTypes";
import {
  formatPeriod,
  nextOwnerStates,
  OWNER_SLOT_STATE_HELP,
  OWNER_SLOT_STATE_LABEL,
  SLOT_STATE_LABEL,
} from "../utils/parkingSlotUtils";

interface SlotFormProps {
  slot: ParkingSlotRow | null;
  open: boolean;
  isSaving?: boolean;
  serverError?: string | null;
  onClose: () => void;
  onSubmit: (input: SlotStatusInput) => void | Promise<unknown>;
}

// A bay with an open booking cannot move, so the form names what holds it.
export const SlotForm: React.FC<SlotFormProps> = ({
  slot,
  open,
  isSaving = false,
  serverError = null,
  onClose,
  onSubmit,
}) => {
  const states = slot ? nextOwnerStates(slot) : [];
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<SlotStatusValues>({
    resolver: zodResolver(slotStatusSchema),
    defaultValues: { status: states[0] ?? OwnerSlotState.AVAILABLE, reason: "" },
  });

  useEffect(() => {
    if (!open || !slot) return;
    reset({
      status: nextOwnerStates(slot)[0] ?? OwnerSlotState.AVAILABLE,
      reason: "",
    });
  }, [open, slot, reset]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open || !slot) return null;

  const target = watch("status");
  const heldByBooking = slot.current !== null;
  const wouldStrandDriver = heldByBooking && target !== OwnerSlotState.AVAILABLE;

  const submit = handleSubmit((values) =>
    onSubmit({ status: values.status, reason: values.reason?.trim() || undefined }),
  );

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Change bay ${slot.slotNumber}`}
        className="w-full max-w-lg overflow-hidden rounded-xl bg-white shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
          <h4 className="font-semibold text-slate-900">
            Bay {slot.slotNumber} · {slot.vehicleTypeName}
          </h4>
          <Button type="button" variant="ghost" size="icon" aria-label="Close" onClick={onClose}>
            <X size={18} />
          </Button>
        </div>

        <form onSubmit={submit} className="space-y-4 px-5 py-4">
          <p className="text-sm text-slate-500">
            This bay reads as{" "}
            <span className="font-medium text-slate-700">
              {SLOT_STATE_LABEL[slot.effectiveStatus]}
            </span>
            . {slot.current ? `Held for ${formatPeriod(slot.current.startTime, slot.current.endTime)}.` : ""}
          </p>

          {states.length === 0 ? (
            <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
              A booking decides this bay's state while it is on the calendar. Cancel or end the
              booking first.
            </p>
          ) : (
            <>
              <Select
                label="New state"
                required
                error={errors.status?.message}
                options={states.map((state) => ({
                  value: state,
                  label: OWNER_SLOT_STATE_LABEL[state],
                }))}
                hint={OWNER_SLOT_STATE_HELP[target]}
                {...register("status")}
              />

              <Input
                label="Note (optional)"
                placeholder="Why this bay is going out of service"
                error={errors.reason?.message}
                {...register("reason")}
              />

              {wouldStrandDriver && (
                <p className="flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
                  <AlertTriangle size={15} className="mt-0.5 shrink-0" />
                  <span>
                    {slot.current?.driverName} has a booking here that has not ended. Move or
                    cancel it before taking this bay out of service.
                  </span>
                </p>
              )}
            </>
          )}

          {serverError && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{serverError}</p>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Keep as is
            </Button>
            <Button
              type="submit"
              size="sm"
              isLoading={isSaving}
              disabled={states.length === 0 || wouldStrandDriver}
            >
              Save bay
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
};

export default SlotForm;
