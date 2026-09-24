import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { MapPin } from "lucide-react";
import Button from "../../../components/common/Button/Button";
import Input from "../../../components/common/Input/Input";
import LocationFields from "./LocationFields";
import { parkingFormSchema, type ParkingFormValues } from "../schemas/parkingSchemas";
import { toInput } from "../utils/parkingUtils";
import type { ParkingInput } from "../types/parkingTypes";

const DEFAULT_VALUES: ParkingFormValues = {
  name: "",
  address: "",
  city: "",
  province: "",
  district: "",
  landAreaPerches: 0,
  openingTime: "08:00",
  closingTime: "20:00",
  hasEvCharging: false,
};

interface ParkingFormProps {
  defaultValues?: Partial<ParkingFormValues>;
  isSubmitting?: boolean;
  disabled?: boolean;
  serverError?: string | null;
  submitLabel?: string;
  onSubmit: (input: ParkingInput) => void | Promise<unknown>;
  onCancel?: () => void;
}

export const ParkingForm: React.FC<ParkingFormProps> = ({
  defaultValues,
  isSubmitting = false,
  disabled = false,
  serverError = null,
  submitLabel = "Submit for review",
  onSubmit,
  onCancel,
}) => {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ParkingFormValues>({
    resolver: zodResolver(parkingFormSchema),
    defaultValues: { ...DEFAULT_VALUES, ...defaultValues },
  });

  const province = watch("province");
  const district = watch("district");

  const submit = handleSubmit((values) => onSubmit(toInput(values)));

  return (
    <form onSubmit={submit} className="space-y-6" aria-disabled={disabled}>
      <fieldset disabled={disabled} className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label="Property name"
          placeholder="ABC Parking"
          required
          error={errors.name?.message}
          {...register("name")}
        />
        <Input
          label="City"
          placeholder="Colombo"
          required
          error={errors.city?.message}
          {...register("city")}
        />
      </div>

      <Input
        label="Address"
        placeholder="No 123, Galle Road, Colombo 03"
        required
        error={errors.address?.message}
        {...register("address")}
      />

      <div>
        <p className="mb-2 flex items-center gap-1.5 text-sm font-medium text-slate-700">
          <MapPin size={16} className="text-slate-400" />
          Location
        </p>
        <LocationFields
          province={province}
          district={district}
          onProvinceChange={(value) => {
            setValue("province", value, { shouldValidate: true });
            setValue("district", "", { shouldValidate: true });
          }}
          onDistrictChange={(value) =>
            setValue("district", value, { shouldValidate: true })
          }
          provinceError={errors.province?.message}
          districtError={errors.district?.message}
          disabled={isSubmitting}
        />
      </div>

      <div>
        <Input
          label="Land area (perches)"
          type="number"
          min="0"
          step="0.01"
          placeholder="15.5"
          required
          error={errors.landAreaPerches?.message}
          {...register("landAreaPerches", { valueAsNumber: true })}
        />
        <p className="mt-1 text-xs text-slate-400">
          Total land area of the property, measured in perches.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label="Opening time"
          type="time"
          required
          error={errors.openingTime?.message}
          {...register("openingTime")}
        />
        <Input
          label="Closing time"
          type="time"
          required
          error={errors.closingTime?.message}
          {...register("closingTime")}
        />
      </div>

      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input
          type="checkbox"
          className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600"
          {...register("hasEvCharging")}
        />
        EV charging available
      </label>

      {serverError && (
        <p className="text-sm text-red-600" role="alert">
          {serverError}
        </p>
      )}

      <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-5">
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
        )}
        <Button type="submit" variant="primary" isLoading={isSubmitting}>
          {submitLabel}
        </Button>
      </div>
      </fieldset>
    </form>
  );
};

export default ParkingForm;
