// Admin master-data shapes for the parking configuration screen. They mirror
// VehicleTypeAdminResponse / VehiclePricingAdminResponse, which — unlike the owner-facing
// registration options — also return deactivated rows so the admin can switch them back on.

export interface VehicleTypeConfig {
  id: string;
  name: string;
  slotCode: string;
  sortOrder: number;
  isActive: boolean;
  // The bay every provider builds to for this type. Either side can still be missing, which
  // keeps the type out of the owner's allocation form.
  bayLengthMeters: number | null;
  bayWidthMeters: number | null;
}

export interface VehiclePricingConfig {
  id: string;
  vehicleTypeId: string;
  vehicleTypeName: string;
  vehicleTypeCode: string;
  minimumPrice: number;
  maximumPrice: number;
  commissionRate: number;
  isActive: boolean;
}

export interface SaveVehiclePricingInput {
  minimumPrice: number;
  maximumPrice: number;
  commissionRate: number;
  isActive: boolean;
}

export interface SaveVehicleTypeInput {
  name: string;
  slotCode: string;
  sortOrder: number;
  isActive: boolean;
  bayLengthMeters: number | null;
  bayWidthMeters: number | null;
}

// Number inputs hold strings so an empty box stays empty instead of snapping to 0.
export interface PricingDraft {
  minimumPrice: string;
  maximumPrice: string;
  commissionRate: string;
  isActive: boolean;
}

export interface VehicleTypeDraft {
  name: string;
  slotCode: string;
  sortOrder: string;
  isActive: boolean;
  bayLengthMeters: string;
  bayWidthMeters: string;
}

export type PricingField = keyof Omit<PricingDraft, "isActive">;

export type FieldErrors<T> = Partial<Record<keyof T, string>>;
