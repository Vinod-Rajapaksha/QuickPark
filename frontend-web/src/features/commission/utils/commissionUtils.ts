import { bayLabel, formatMoney, formatPercent } from "../../parking/utils/parkingUtils";
import type {
  PricingDraft,
  PricingDraftErrors,
  SaveVehiclePricingInput,
  SaveVehicleTypeInput,
  VehiclePricingConfig,
  VehicleTypeConfig,
  VehicleTypeDraft,
  VehicleTypeDraftErrors,
} from "../types/commissionTypes";

export const MAX_SLOT_CODE_LENGTH = 10;
export const MAX_BAY_METERS = 20;
export const MAX_PRICE = 100000;
export const MAX_COMMISSION_PERCENT = 100;

export const normaliseCode = (value: string): string =>
  value.replace(/[^a-z0-9]/gi, "").toUpperCase();

export const hasErrors = <T extends Record<string, string | undefined>>(
  errors: T,
): boolean => Object.values(errors).some((message) => Boolean(message));

const parseNumber = (raw: string): number => Number(raw.trim());

const parseBaySide = (raw: string): number | null => {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const value = parseNumber(trimmed);
  return Number.isFinite(value) && value > 0 && value <= MAX_BAY_METERS ? value : Number.NaN;
};

const parsePrice = (raw: string): number | null => {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const value = parseNumber(trimmed);
  if (!Number.isFinite(value)) return null;
  return value >= 0 && value <= MAX_PRICE ? value : Number.NaN;
};

export const validateVehicleTypeDraft = (
  draft: VehicleTypeDraft,
): VehicleTypeDraftErrors => {
  const errors: VehicleTypeDraftErrors = {};

  if (!draft.name.trim()) errors.name = "Name is required.";

  const slotCode = normaliseCode(draft.slotCode);
  if (!slotCode) errors.slotCode = "Slot code is required.";
  else if (slotCode.length > MAX_SLOT_CODE_LENGTH)
    errors.slotCode = `Slot code must be 1-${MAX_SLOT_CODE_LENGTH} letters or digits, e.g. CAR.`;
  else if (!/^[A-Z]/.test(slotCode))
    errors.slotCode = "Slot code must start with a letter, e.g. CAR.";

  const sortOrder = parseNumber(draft.sortOrder);
  if (!draft.sortOrder.trim() || !Number.isFinite(sortOrder))
    errors.sortOrder = "Sort order must be a number.";
  else if (sortOrder < 0) errors.sortOrder = "Sort order cannot be negative.";

  const length = parseBaySide(draft.bayLengthMeters);
  const width = parseBaySide(draft.bayWidthMeters);
  if (Number.isNaN(length))
    errors.bayLengthMeters = `Bay length must be between 0 and ${MAX_BAY_METERS} meters.`;
  if (Number.isNaN(width))
    errors.bayWidthMeters = `Bay width must be between 0 and ${MAX_BAY_METERS} meters.`;
  // A slot needs both sides, so half a bay is worth nothing to the allocation screen.
  if (length === null && width !== null && !Number.isNaN(width))
    errors.bayLengthMeters = "Enter both sides of the bay, or leave both empty.";
  if (width === null && length !== null && !Number.isNaN(length))
    errors.bayWidthMeters = "Enter both sides of the bay, or leave both empty.";

  return errors;
};

export const validatePricingDraft = (draft: PricingDraft): PricingDraftErrors => {
  const errors: PricingDraftErrors = {};

  const minimum = parsePrice(draft.minimumPrice);
  const maximum = parsePrice(draft.maximumPrice);
  const commission = parseNumber(draft.commissionRate);

  const ceiling = MAX_PRICE.toLocaleString("en-LK");
  if (minimum === null || Number.isNaN(minimum))
    errors.minimumPrice =
      minimum === null
        ? "Enter the minimum price."
        : `Minimum price must be between 0 and ${ceiling}.`;
  if (maximum === null || Number.isNaN(maximum))
    errors.maximumPrice =
      maximum === null
        ? "Enter the maximum price."
        : `Maximum price must be between 0 and ${ceiling}.`;

  if (!draft.commissionRate.trim() || !Number.isFinite(commission))
    errors.commissionRate = "Enter the commission percentage.";
  else if (commission < 0 || commission > MAX_COMMISSION_PERCENT)
    errors.commissionRate = `Commission must be between 0 and ${MAX_COMMISSION_PERCENT} percent.`;

  if (
    !errors.minimumPrice &&
    !errors.maximumPrice &&
    (maximum as number) < (minimum as number)
  )
    errors.maximumPrice = "Maximum price cannot be lower than the minimum.";

  return errors;
};

export const vehicleTypeDraft = (type: VehicleTypeConfig): VehicleTypeDraft => ({
  name: type.name,
  slotCode: type.slotCode,
  sortOrder: String(type.sortOrder),
  isActive: type.isActive,
  bayLengthMeters: type.bayLengthMeters === null ? "" : String(type.bayLengthMeters),
  bayWidthMeters: type.bayWidthMeters === null ? "" : String(type.bayWidthMeters),
});

export const pricingDraft = (pricing?: VehiclePricingConfig): PricingDraft => ({
  minimumPrice: pricing ? String(pricing.minimumPrice) : "",
  maximumPrice: pricing ? String(pricing.maximumPrice) : "",
  commissionRate: pricing ? String(pricing.commissionRate) : "",
  isActive: pricing?.isActive ?? true,
});

export const toVehicleTypeInput = (draft: VehicleTypeDraft): SaveVehicleTypeInput => {
  const length = parseBaySide(draft.bayLengthMeters);
  const width = parseBaySide(draft.bayWidthMeters);
  const sortOrder = parseNumber(draft.sortOrder);
  return {
    name: draft.name.trim(),
    slotCode: normaliseCode(draft.slotCode),
    sortOrder: Number.isFinite(sortOrder) && sortOrder >= 0 ? Math.trunc(sortOrder) : 0,
    isActive: draft.isActive,
    bayLengthMeters: Number.isNaN(length) ? null : length,
    bayWidthMeters: Number.isNaN(width) ? null : width,
  };
};

export const toPricingInput = (draft: PricingDraft): SaveVehiclePricingInput => ({
  minimumPrice: Number(draft.minimumPrice),
  maximumPrice: Number(draft.maximumPrice),
  commissionRate: Number(draft.commissionRate),
  isActive: draft.isActive,
});

export const providerSummary = (
  pricing: VehiclePricingConfig | undefined,
  type: VehicleTypeConfig,
): string => {
  const bay = bayLabel(type.bayLengthMeters, type.bayWidthMeters);
  if (!pricing || !pricing.isActive)
    return `Providers cannot allocate this type until pricing is set. Bays built to ${bay}.`;
  return `Allowed ${formatMoney(pricing.minimumPrice)} - ${formatMoney(
    pricing.maximumPrice,
  )} per hour · platform takes ${formatPercent(pricing.commissionRate)} · bays built to ${bay}`;
};
