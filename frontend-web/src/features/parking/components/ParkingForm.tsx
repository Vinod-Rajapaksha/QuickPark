import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Button from "../../../components/common/Button/Button";
import Input from "../../../components/common/Input/Input";
import LocationFields from "./LocationFields";
import { parkingFormSchema, type ParkingFormValues } from "../schemas/parkingSchemas";
import type { ParkingInput } from "../types/parkingTypes";
import { toInput } from "../utils/parkingUtils";

interface ParkingFormProps {
  defaultValues?: Partial<ParkingFormValues>;
  isSubmitting?: boolean;
  serverError?: string | null;
  disabled?: boolean;
  submitLabel?: string;
  // The caller saves a whole property, so the form hands over a ready ParkingInput.
  onSubmit?: (input: ParkingInput) => void | Promise<unknown>;
  onCancel?: () => void;
}

const ParkingForm: React.FC<ParkingFormProps> = ({
  defaultValues,
  isSubmitting = false,
  serverError = null,
  disabled = false,
  submitLabel = "Save details",
  onSubmit,
  onCancel,
}) => {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ParkingFormValues>({
    resolver: zodResolver(parkingFormSchema),
    defaultValues,
  });

  const province = watch("province");
  const district = watch("district");
  const readOnly = disabled || isSubmitting;

  const submit = handleSubmit((values) => onSubmit?.(toInput(values)));

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <Input
        label="Property name"
        placeholder="Central Tower Parking"
        required
        maxLength={150}
        disabled={readOnly}
        error={errors.name?.message}
        {...register("name")}
      />

      <Input
        label="Address"
        placeholder="No. 42, Galle Road, Colombo 03"
        required
        maxLength={300}
        disabled={readOnly}
        error={errors.address?.message}
        {...register("address")}
      />

      <Input
        label="City"
        placeholder="Colombo"
        required
        maxLength={100}
        disabled={readOnly}
        error={errors.city?.message}
        {...register("city")}
      />

      <LocationFields
        province={province}
        district={district}
        // LocationFields clears the district itself when the province changes.
        onProvinceChange={(value) => setValue("province", value, { shouldValidate: true })}
        onDistrictChange={(value) => setValue("district", value, { shouldValidate: true })}
        provinceError={errors.province?.message}
        districtError={errors.district?.message}
        disabled={readOnly}
      />

      <Input
        label="Land area (perches)"
        type="number"
        min={0}
        step="0.01"
        required
        disabled={readOnly}
        error={errors.landAreaPerches?.message}
        {...register("landAreaPerches", { valueAsNumber: true })}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label="Opening time"
          type="time"
          required
          disabled={readOnly}
          error={errors.openingTime?.message}
          {...register("openingTime")}
        />
        <Input
          label="Closing time"
          type="time"
          required
          disabled={readOnly}
          error={errors.closingTime?.message}
          {...register("closingTime")}
        />
      </div>

      <label className="flex items-center gap-2 text-sm font-medium text-slate-800">
        <input
          type="checkbox"
          className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600"
          disabled={readOnly}
          {...register("hasEvCharging")}
        />
        EV charging available
      </label>

      {serverError && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {serverError}
        </p>
      )}

      <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
        {onCancel && (
          <Button type="button" variant="outline" size="sm" disabled={isSubmitting} onClick={onCancel}>
            Discard
          </Button>
        )}
        <Button type="submit" size="sm" isLoading={isSubmitting} disabled={disabled}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
};

export default ParkingForm;
