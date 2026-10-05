import React, { useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X } from "lucide-react";
import Button from "../../../components/common/Button/Button";
import Input from "../../../components/common/Input/Input";
import Select from "../../parking/components/FormSelect";
import {
  providerBookingEditSchema,
  providerBookingSchema,
  type ProviderBookingValues,
} from "../schemas/reservationSchemas";
import { formatMoney } from "../../parking/utils/parkingUtils";
import { bookingHours, defaultStartValue } from "../utils/reservationUtils";

export interface ReservationFormVehicleType {
  value: string;
  label: string;
  hourlyRate: number;
}

export interface ReservationFormSlot {
  value: string;
  label: string;
  vehicleTypeId: string;
}

interface ReservationFormProps {
  open: boolean;
  isEditing?: boolean;
  facilities?: { value: string; label: string }[];
  vehicleTypes: ReservationFormVehicleType[];
  slots?: ReservationFormSlot[];
  defaultValues?: Partial<ProviderBookingValues>;
  isSaving?: boolean;
  serverError?: string | null;
  // A caller that loads the bays of the chosen property needs to know when it changes, since a
  // bay of one property cannot take a booking made at another.
  onFacilityChange?: (facilityId: string) => void;
  onClose: () => void;
  onSubmit: (values: ProviderBookingValues) => void | Promise<unknown>;
}

// §13/§14: the owner books a bay for a driver at the gate or over the phone, and moves a booking
// already on the board. The figures shown here are read from the property's own per-vehicle type
// rate; the server stamps the final ones, commission included (§8/§19).
export const ReservationForm: React.FC<ReservationFormProps> = ({
  open,
  isEditing = false,
  facilities,
  vehicleTypes,
  slots = [],
  defaultValues,
  isSaving = false,
  serverError = null,
  onFacilityChange,
  onClose,
  onSubmit,
}) => {
  // Built from primitives so reopening the dialog for another booking re-seeds the form without
  // an object identity from the page sending it back into a loop.
  const initialValues = useMemo<ProviderBookingValues>(
    () => ({
      facilityId: defaultValues?.facilityId ?? facilities?.[0]?.value ?? "",
      vehicleTypeId:
        defaultValues?.vehicleTypeId ?? vehicleTypes[0]?.value ?? "",
      slotId: defaultValues?.slotId ?? "",
      driverEmail: defaultValues?.driverEmail ?? "",
      startTime: defaultValues?.startTime ?? defaultStartValue(),
      endTime: defaultValues?.endTime ?? defaultStartValue(75),
    }),
    [
      defaultValues?.facilityId,
      defaultValues?.vehicleTypeId,
      defaultValues?.slotId,
      defaultValues?.driverEmail,
      defaultValues?.startTime,
      defaultValues?.endTime,
      facilities,
      vehicleTypes,
    ],
  );

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<ProviderBookingValues>({
    resolver: zodResolver(isEditing ? providerBookingEditSchema : providerBookingSchema),
    defaultValues: initialValues,
  });

  useEffect(() => {
    if (open) reset(initialValues);
  }, [open, initialValues, reset]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  // Watched before the early return: a hook cannot sit after one, and the page needs to hear
  // about a property switch to reload the bays that belong to it.
  const facilityId = watch("facilityId");
  useEffect(() => {
    if (open) onFacilityChange?.(facilityId);
  }, [open, facilityId, onFacilityChange]);

  if (!open) return null;

  const vehicleTypeId = watch("vehicleTypeId");
  const startTime = watch("startTime");
  const endTime = watch("endTime");

  const rate = vehicleTypes.find((type) => type.value === vehicleTypeId)?.hourlyRate ?? 0;
  const hours = bookingHours(startTime, endTime);
  const baysForType = slots.filter((slot) => slot.vehicleTypeId === vehicleTypeId);

  const submit = handleSubmit((values) => onSubmit(values));

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={isEditing ? "Edit booking" : "Add booking"}
        className="max-h-[90vh] w-full max-w-xl overflow-auto rounded-xl bg-white shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
          <h4 className="font-semibold text-slate-900">
            {isEditing ? "Move this booking" : "Add a booking"}
          </h4>
          <Button type="button" variant="ghost" size="icon" aria-label="Close" onClick={onClose}>
            <X size={18} />
          </Button>
        </div>

        <form onSubmit={submit} className="space-y-4 px-5 py-4">
          {facilities && facilities.length > 1 ? (
            <Select
              label="Property"
              required
              options={facilities}
              error={errors.facilityId?.message}
              {...register("facilityId")}
            />
          ) : (
            <input type="hidden" {...register("facilityId")} />
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Select
              label="Vehicle type"
              required
              options={vehicleTypes}
              error={errors.vehicleTypeId?.message}
              {...register("vehicleTypeId")}
            />

            <Select
              label="Bay"
              placeholder="Assign the lowest free bay"
              options={baysForType}
              hint={
                baysForType.length === 0
                  ? "No bay of this type is free for the period you picked."
                  : "Leave it to the system unless the driver asked for a bay."
              }
              {...register("slotId")}
            />
          </div>

          <Input
            label="Driver's registered email"
            type="email"
            placeholder={isEditing ? "Leave empty to keep the driver" : "driver@example.com"}
            required={!isEditing}
            error={errors.driverEmail?.message}
            {...register("driverEmail")}
          />
          {isEditing && !errors.driverEmail && (
            <p className="-mt-2 text-xs text-slate-400">
              Type an address only to hand this booking to another driver's account.
            </p>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Starts"
              type="datetime-local"
              required
              error={errors.startTime?.message}
              {...register("startTime")}
            />
            <Input
              label="Ends"
              type="datetime-local"
              required
              error={errors.endTime?.message}
              {...register("endTime")}
            />
          </div>

          <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
            {hours > 0
              ? `${hours} hour${hours === 1 ? "" : "s"} × ${formatMoney(
                  rate,
                )} = about ${formatMoney(rate * hours)} for the driver.`
              : "Choose a period to see what the driver pays."}
            <span className="mt-1 block text-xs text-slate-400">
              Your share is this amount minus the commission the platform set.
            </span>
          </p>

          {serverError && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{serverError}</p>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Discard
            </Button>
            <Button type="submit" size="sm" isLoading={isSaving}>
              {isEditing ? "Save booking" : "Create booking"}
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
};

export default ReservationForm;
