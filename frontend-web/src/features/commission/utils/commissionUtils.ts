import type {
  FieldErrors,
  PricingDraft,
  SaveVehicleTypeInput,
  VehiclePricingConfig,
  VehicleTypeConfig,
  VehicleTypeDraft,
  PricingField,
} from "../types/commissionTypes";
import { bayLabel, formatMoney } from "../../parking/utils/parkingUtils";

// The same ceilings ParkingService enforces, so the admin sees the rule before posting.
// The server stays the authority: it re-checks every one of these.
export const MAX_PRICE_AMOUNT = 100000;
export const MAX_COMMISSION_PERCENT = 100;
export const MAX_BAY_DIMENSION_METERS = 20;
export const MAX_CODE_LENGTH = 10;

export const PRICE_FIELDS: readonly PricingField[] = [
  "minimumPrice",
  "maximumPrice",
  "commissionRate",
];

// "1 200abc" -> "1200ABC", exactly what NormalizeCode stores on the server.
export const normaliseCode = (value: string): string =>
  value
    .replace(/[^a-z0-9]/gi, "")
    .toUpperCase();

const toAmount = (value: string): number | null => {
  const trimmed = value.trim();
  if (trimmed === "") return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
};

const validateAmount = (
  value: string,
  label: string,
  ceiling: number,
): string | undefined => {
  const amount = toAmount(value);
  if (amount === null) return `Enter the ${label.toLowerCase()}.`;
  if (amount < 0 || amount > ceiling) {
    return `${label} must be between 0 and ${ceiling.toLocaleString("en-LK")}.`;
  }
  return undefined;
};

export const validatePricingDraft = (draft: PricingDraft): FieldErrors<PricingDraft> => {
  const errors: FieldErrors<PricingDraft> = {};

  const minimum = validateAmount(draft.minimumPrice, "Minimum price", MAX_PRICE_AMOUNT);
  const maximum = validateAmount(draft.maximumPrice, "Maximum price", MAX_PRICE_AMOUNT);
  // The server labels both bounds "Hourly rate" in one message, so a bad pair is reported
  // against the maximum, which is where the contradiction is visible.
  if (!minimum && !maximum && toAmount(draft.minimumPrice)! > toAmount(draft.maximumPrice)!) {
    errors.maximumPrice = "Maximum price cannot be lower than the minimum.";
  } else if (minimum) {
    errors.minimumPrice = minimum;
  } else if (maximum) {
    errors.maximumPrice = maximum;
  }

  const commission = toAmount(draft.commissionRate);
  if (commission === null) {
    errors.commissionRate = "Enter the commission percentage.";
  } else if (commission < 0 || commission > MAX_COMMISSION_PERCENT) {
    errors.commissionRate = `Commission must be between 0 and ${MAX_COMMISSION_PERCENT} percent.`;
  }

  return errors;
};

const validateCode = (value: string, label: string): string | undefined => {
  const code = normaliseCode(value);
  if (code.length === 0) return `${label} is required.`;
  if (code.length > MAX_CODE_LENGTH) {
    return `${label} must be 1-${MAX_CODE_LENGTH} letters or digits, e.g. CAR.`;
  }
  if (!/^[A-Z]/.test(code)) {
    return `${label} must start with a letter, e.g. CAR.`;
  }
  return undefined;
};

export const validateVehicleTypeDraft = (
  draft: VehicleTypeDraft,
): FieldErrors<VehicleTypeDraft> => {
  const errors: FieldErrors<VehicleTypeDraft> = {};

  if (draft.name.trim() === "") errors.name = "Vehicle type name is required.";
  const code = validateCode(draft.slotCode, "Slot code");
  if (code) errors.slotCode = code;

  const sortOrder = Number(draft.sortOrder);
  if (!Number.isInteger(sortOrder) || sortOrder < 0) {
    errors.sortOrder = "Sort order cannot be negative.";
  }

  for (const field of ["bayLengthMeters", "bayWidthMeters"] as const) {
    const value = toAmount(draft[field]);
    if (value === null) continue; // optional: a type can be created before its bay is agreed
    if (value <= 0 || value > MAX_BAY_DIMENSION_METERS) {
      errors[field] = `${field === "bayLengthMeters" ? "Bay length" : "Bay width"} must be between 0 and ${MAX_BAY_DIMENSION_METERS} meters.`;
    }
  }

  const length = toAmount(draft.bayLengthMeters);
  const width = toAmount(draft.bayWidthMeters);
  if ((length === null) !== (width === null)) {
    errors.bayWidthMeters = "Enter both sides of the bay, or leave both empty.";
  }

  return errors;
};

export const hasErrors = (errors: FieldErrors<unknown>): boolean =>
  Object.keys(errors).length > 0;

export const toPricingInput = (draft: PricingDraft) => ({
  minimumPrice: Number(draft.minimumPrice),
  maximumPrice: Number(draft.maximumPrice),
  commissionRate: Number(draft.commissionRate),
  isActive: draft.isActive,
});

export const toVehicleTypeInput = (draft: VehicleTypeDraft): SaveVehicleTypeInput => ({
  name: draft.name.trim(),
  slotCode: normaliseCode(draft.slotCode),
  sortOrder: Number(draft.sortOrder),
  isActive: draft.isActive,
  bayLengthMeters: toAmount(draft.bayLengthMeters),
  bayWidthMeters: toAmount(draft.bayWidthMeters),
});

export const pricingDraft = (
  pricing?: VehiclePricingConfig,
): PricingDraft => ({
  minimumPrice: pricing ? String(pricing.minimumPrice) : "",
  maximumPrice: pricing ? String(pricing.maximumPrice) : "",
  commissionRate: pricing ? String(pricing.commissionRate) : "",
  isActive: pricing ? pricing.isActive : true,
});

export const vehicleTypeDraft = (type: VehicleTypeConfig): VehicleTypeDraft => ({
  name: type.name,
  slotCode: type.slotCode,
  sortOrder: String(type.sortOrder),
  isActive: type.isActive,
  bayLengthMeters: type.bayLengthMeters != null ? String(type.bayLengthMeters) : "",
  bayWidthMeters: type.bayWidthMeters != null ? String(type.bayWidthMeters) : "",
});

// What a provider is shown the moment the admin saves: the window, the cut and the bay.
export const providerSummary = (
  pricing: VehiclePricingConfig | undefined,
  type: VehicleTypeConfig,
): string => {
  const bay = bayLabel(type.bayLengthMeters, type.bayWidthMeters);
  if (!pricing || !pricing.isActive) {
    return `Providers cannot allocate this type until pricing is set. Bays built to ${bay}.`;
  }
  return `Allowed ${formatMoney(pricing.minimumPrice)} - ${formatMoney(pricing.maximumPrice)} per hour · platform takes ${pricing.commissionRate}% · bays built to ${bay}`;
};

export const getApiErrorMessage = (error: unknown, fallback: string): string => {
  const message = (error as { response?: { data?: { message?: string } } })
    ?.response?.data?.message;
  return message || fallback;
};
