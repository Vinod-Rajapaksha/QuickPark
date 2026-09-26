// Mirrors the admin vehicle-type master row from /admin/parking-configuration/vehicle-types.
export interface VehicleTypeConfig {
  id: string;
  name: string;
  slotCode: string;
  sortOrder: number;
  isActive: boolean;
  // Both null means the type has no standard bay yet, so nothing of it can be allocated.
  bayLengthMeters: number | null;
  bayWidthMeters: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface SaveVehicleTypeInput {
  name: string;
  slotCode: string;
  sortOrder: number;
  isActive: boolean;
  bayLengthMeters: number | null;
  bayWidthMeters: number | null;
}

// Mirrors /admin/parking-configuration/pricing: the window a provider must price inside.
export interface VehiclePricingConfig {
  id: string;
  vehicleTypeId: string;
  vehicleTypeName: string;
  vehicleTypeCode: string;
  minimumPrice: number;
  maximumPrice: number;
  commissionRate: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SaveVehiclePricingInput {
  minimumPrice: number;
  maximumPrice: number;
  commissionRate: number;
  isActive: boolean;
}

// Every column of the configuration tables is a text input, so a row stays raw until the save parses it.
export interface VehicleTypeDraft {
  name: string;
  slotCode: string;
  sortOrder: string;
  isActive: boolean;
  bayLengthMeters: string;
  bayWidthMeters: string;
}

export interface PricingDraft {
  minimumPrice: string;
  maximumPrice: string;
  commissionRate: string;
  isActive: boolean;
}

export type VehicleTypeDraftErrors = Partial<Record<keyof VehicleTypeDraft, string>>;

export type PricingDraftErrors = Partial<Record<keyof PricingDraft, string>>;
