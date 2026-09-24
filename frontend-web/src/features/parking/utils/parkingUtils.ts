import type { SelectOption } from "../../../components/common/Select/Select";
import {
  SRI_LANKA_PROVINCES,
  getDistrictsForProvince,
} from "../../../app/config/constants";
import type {
  AllocationInput,
  DocumentRequirement,
  FacilityDocumentType,
  FacilityQueueRow,
  FacilitySectionReview,
  FacilitySectionStatus,
  ParkingFacility,
  ParkingInput,
  ParkingStatus,
  VehicleTypeOption,
} from "../types/parkingTypes";
import type { BadgeVariant } from "../../../components/common/Badge/Badge";

export const STATUS_BADGE_VARIANT: Record<ParkingStatus, BadgeVariant> = {
  DRAFT: "default",
  PENDING_APPROVAL: "warning",
  APPROVED: "success",
  REJECTED: "error",
  SUSPENDED: "default",
};

export const STATUS_LABEL: Record<ParkingStatus, string> = {
  DRAFT: "Draft",
  PENDING_APPROVAL: "Pending admin review",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  SUSPENDED: "Suspended",
};

export const STATUS_HELP_TEXT: Record<ParkingStatus, string> = {
  DRAFT: "Nothing has been sent to the admin yet. Finish every tab, then submit this property for review.",
  PENDING_APPROVAL:
    "Your property is queued for admin review. It stays hidden from drivers until it is approved.",
  APPROVED:
    "This property is live and searchable by drivers. Prices and operating hours apply as soon as you save them; changing the name, address, land area, location, vehicle types or slot counts sends it back for approval.",
  REJECTED:
    "An admin rejected this property. Fix the reported issue and submit it again.",
  SUSPENDED: "An admin suspended this property. It is hidden from drivers.",
};

// The owner sees four verdicts, not one blanket answer.
export const SECTION_STATUS_LABEL: Record<FacilitySectionStatus, string> = {
  NOT_SUBMITTED: "Not submitted",
  PENDING: "Awaiting admin",
  APPROVED: "Approved",
  REJECTED: "Needs fixing",
};

export const SECTION_STATUS_BADGE_VARIANT: Record<FacilitySectionStatus, BadgeVariant> = {
  NOT_SUBMITTED: "default",
  PENDING: "warning",
  APPROVED: "success",
  REJECTED: "error",
};

// Everything the property still owes before it goes live, in the server's section order.
export const openSections = (facility: ParkingFacility): FacilitySectionReview[] =>
  facility.sections.filter((section) => section.status !== "APPROVED");

// The queue is arranged per property or per owner by a URL parameter, so it survives opening a record.
export type QueueGrouping = "property" | "provider";

export const ownerLabelOf = (
  row: Pick<FacilityQueueRow, "providerName" | "providerEmail">,
): string => row.providerName.trim() || row.providerEmail.trim() || "Unknown owner";

export interface OwnerGroup {
  providerId: string;
  label: string;
  email: string;
  businessName: string | null;
  verificationStatus: string;
  rows: FacilityQueueRow[];
  awaitingSections: number;
}

// Groups by owner alphabetically; rows keep the server's order so the newest submission leads.
export const groupByOwner = (rows: readonly FacilityQueueRow[]): OwnerGroup[] => {
  const groups = new Map<string, OwnerGroup>();

  for (const row of rows) {
    const open = openSections(row.facility).length;
    const existing = groups.get(row.providerId);
    if (existing) {
      existing.rows.push(row);
      existing.awaitingSections += open;
      continue;
    }
    groups.set(row.providerId, {
      providerId: row.providerId,
      label: ownerLabelOf(row),
      email: row.providerEmail,
      businessName: row.providerBusinessName,
      verificationStatus: row.providerVerificationStatus,
      rows: [row],
      awaitingSections: open,
    });
  }

  return [...groups.values()].sort((a, b) => a.label.localeCompare(b.label));
};

// Wording only — which types are required, how many and whether an upload replaces comes from the server.
const DOCUMENT_HINTS: Record<FacilityDocumentType, string> = {
  VERIFIED_DEED: "Deed image verified by a notary for this land.",
  LAND_OWNER_NIC: "Front side NIC image of the registered land owner.",
  PROPERTY_PHOTO:
    "Four clear photos of the property: the front, the entrance, the parking area and a street view.",
  SLOT_SKETCH: "Sketch of the parking layout showing how the slots are arranged.",
  LAND_DOCUMENT: "Survey plan or land valuation proof for this property.",
};

export interface DocumentTab {
  type: FacilityDocumentType;
  label: string;
  hint: string;
  count: number;
  minRequired: number;
  maxAllowed: number | null;
  replacesExisting: boolean;
  satisfied: boolean;
}

export const documentTabsFor = (
  requirements: readonly DocumentRequirement[],
): DocumentTab[] =>
  requirements.map((requirement) => ({
    type: requirement.type,
    label: requirement.label,
    hint:
      DOCUMENT_HINTS[requirement.type] ??
      `Upload the ${requirement.label.toLowerCase()}.`,
    count: requirement.count,
    minRequired: requirement.minRequired,
    maxAllowed: requirement.maxAllowed,
    replacesExisting: requirement.replacesExisting,
    satisfied: requirement.satisfied,
  }));

export const documentProgress = (tab: DocumentTab): string => {
  if (tab.minRequired === 0) return "Optional";
  if (tab.replacesExisting) return tab.count > 0 ? "Uploaded" : "Required";
  if (tab.maxAllowed === tab.minRequired && tab.maxAllowed !== null) {
    return `${tab.count} of ${tab.maxAllowed} uploaded`;
  }
  return `${tab.count} uploaded`;
};

export const toProvinceOptions = (allLabel = "All Provinces"): SelectOption[] => [
  { value: "", label: allLabel },
  ...SRI_LANKA_PROVINCES.map((province) => ({ value: province, label: province })),
];

export const toDistrictOptions = (
  province?: string,
  allLabel = "All Districts",
): SelectOption[] => {
  const districts = getDistrictsForProvince(province);
  if (districts.length === 0) return [{ value: "", label: allLabel }];
  return [
    { value: "", label: allLabel },
    ...districts.map((district) => ({ value: district, label: district })),
  ];
};

export const toRequiredDistrictOptions = (province?: string): SelectOption[] =>
  getDistrictsForProvince(province).map((district) => ({
    value: district,
    label: district,
  }));

// The admin's standard bay for the type, shown to the provider read-only. Mirrors the server's wording.
export const bayLabel = (lengthMeters: number | null, widthMeters: number | null): string =>
  lengthMeters && widthMeters
    ? `${lengthMeters} m × ${widthMeters} m`
    : "no size set";

export const standardBayLabel = (option: VehicleTypeOption): string =>
  bayLabel(option.bayLengthMeters, option.bayWidthMeters);

export const formatLandArea = (perches: number): string =>
  `${perches.toLocaleString("en-LK", { maximumFractionDigits: 2 })} perches`;

// The server keeps the authority; these mirror its rules so the owner sees them before saving.
export const COORDINATE_BOUNDS = {
  minLatitude: 5.9,
  maxLatitude: 10.2,
  minLongitude: 79.4,
  maxLongitude: 82.1,
} as const;

// A typed field is empty text until the owner writes something; blank means "no location".
export const parseCoordinate = (text: string): number | null => {
  const trimmed = text.trim();
  if (trimmed === "") return null;
  const value = Number(trimmed);
  return Number.isFinite(value) ? value : Number.NaN;
};

export const roundCoordinate = (value: number): number =>
  Math.round(value * 1e6) / 1e6;

export interface CoordinateErrors {
  latitude?: string;
  longitude?: string;
}

// Same three checks the facilities endpoint runs: both numbers, a number at all, inside the box.
export const validateCoordinatePair = (
  latitudeText: string,
  longitudeText: string,
): CoordinateErrors => {
  const latitude = parseCoordinate(latitudeText);
  const longitude = parseCoordinate(longitudeText);
  const errors: CoordinateErrors = {};

  if (Number.isNaN(latitude)) errors.latitude = "Latitude must be a number.";
  if (Number.isNaN(longitude)) errors.longitude = "Longitude must be a number.";

  const hasLatitude = latitude !== null && !Number.isNaN(latitude);
  const hasLongitude = longitude !== null && !Number.isNaN(longitude);
  const invalidLatitude = hasLatitude && (latitude < COORDINATE_BOUNDS.minLatitude || latitude > COORDINATE_BOUNDS.maxLatitude);
  const invalidLongitude = hasLongitude && (longitude < COORDINATE_BOUNDS.minLongitude || longitude > COORDINATE_BOUNDS.maxLongitude);

  if (invalidLatitude || invalidLongitude) {
    const message = "These coordinates are outside Sri Lanka.";
    if (hasLatitude) errors.latitude ??= message;
    if (hasLongitude) errors.longitude ??= message;
  }

  if (hasLatitude !== hasLongitude && !errors.latitude && !errors.longitude) {
    const half = hasLatitude ? "longitude" : "latitude";
    if (half === "longitude") errors.longitude = "Enter the longitude too — a location needs both numbers.";
    else errors.latitude = "Enter the latitude too — a location needs both numbers.";
  }

  return errors;
};

export const formatCoordinates = (facility: {
  latitude: number | null;
  longitude: number | null;
}): string | null =>
  facility.latitude === null || facility.longitude === null
    ? null
    : `${facility.latitude.toFixed(6)}, ${facility.longitude.toFixed(6)}`;

// The API returns TimeOnly as "HH:mm:ss"; the UI shows HH:mm.
const asDisplayTime = (value: string): string => value.slice(0, 5);

export const formatOperatingHours = (facility: ParkingFacility): string =>
  `${asDisplayTime(facility.openingTime)} - ${asDisplayTime(facility.closingTime)}`;

export const formatMoney = (amount: number): string =>
  `${amount.toLocaleString("en-LK", { maximumFractionDigits: 2 })} LKR`;

export const formatPercent = (value: number): string =>
  `${value.toLocaleString("en-LK", { maximumFractionDigits: 2 })}%`;

const formatRange = (
  min: number | null,
  max: number | null,
  suffix: string,
): string => {
  if (min === null && max === null) return "";
  if (min !== null && max !== null) return `${min}${suffix} - ${max}${suffix}`;
  if (min !== null) return `${min}${suffix} or more`;
  return `${max}${suffix} or less`;
};

// Admin-set price window shown next to the rate field so the owner knows the allowed range.
export const priceRangeHint = (option: VehicleTypeOption): string => {
  const range = formatRange(option.minPrice, option.maxPrice, "");
  return range ? `Allowed: ${range} per hour` : "";
};

// A vehicle type the admin has not priced yet cannot be allocated, so the form says why.
export const isPricedByAdmin = (option: VehicleTypeOption): boolean =>
  option.minPrice !== null && option.maxPrice !== null && option.commissionRate !== null;

// Nor can one whose bay the admin never typed: every slot needs a size to be built to.
export const hasBaySize = (option: VehicleTypeOption): boolean =>
  Boolean(option.bayLengthMeters && option.bayWidthMeters);

// Same rounding as the server's commission split, shown per hour before saving.
export const splitAmount = (
  hourlyRate: number,
  commissionRate: number,
): { commission: number; providerAmount: number } => {
  const commission = Math.round(hourlyRate * commissionRate) / 100;
  const providerAmount = Math.round((hourlyRate - commission) * 100) / 100;
  return { commission, providerAmount };
};

// Same ceiling the server enforces when it generates the slot rows.
export const MAX_ALLOCATED_SLOTS = 500;

export type AllocationFieldError = "numberOfSlots" | "hourlyRate";

export type AllocationRowErrors = Partial<Record<AllocationFieldError, string>>;

// Mirrors the server rules so the owner sees them first; the server stays the authority.
export const validateAllocationRows = (
  rows: readonly AllocationInput[],
  vehicleTypes: readonly VehicleTypeOption[],
): Record<string, AllocationRowErrors> => {
  const optionsById = new Map(vehicleTypes.map((option) => [option.id, option]));
  const totalSlots = rows.reduce((sum, row) => sum + (row.numberOfSlots || 0), 0);
  const errors: Record<string, AllocationRowErrors> = {};

  for (const row of rows) {
    const option = optionsById.get(row.vehicleTypeId);
    if (!option) continue;

    const rowErrors: AllocationRowErrors = {};

    if (!Number.isInteger(row.numberOfSlots) || row.numberOfSlots <= 0) {
      rowErrors.numberOfSlots = "Slot count must be greater than 0.";
    } else if (totalSlots > MAX_ALLOCATED_SLOTS) {
      rowErrors.numberOfSlots = `A property can have at most ${MAX_ALLOCATED_SLOTS} slots.`;
    }

    if (!hasBaySize(option)) {
      rowErrors.hourlyRate = `No bay size is set for ${option.name} yet, so it cannot be allocated.`;
    } else if (!isPricedByAdmin(option)) {
      rowErrors.hourlyRate = `No pricing is set for ${option.name} yet, so it cannot be allocated.`;
    } else if (!(row.hourlyRate > 0)) {
      rowErrors.hourlyRate = "Hourly rate must be greater than 0.";
    } else if (option.minPrice !== null && row.hourlyRate < option.minPrice) {
      rowErrors.hourlyRate = `Must be at least ${formatMoney(option.minPrice)}.`;
    } else if (option.maxPrice !== null && row.hourlyRate > option.maxPrice) {
      rowErrors.hourlyRate = `Must be at most ${formatMoney(option.maxPrice)}.`;
    }

    if (Object.keys(rowErrors).length > 0) errors[row.vehicleTypeId] = rowErrors;
  }

  return errors;
};

export const toApiTime = (value: string): string =>
  value.length === 5 ? `${value}:00` : value;

export const toInput = (values: {
  name: string;
  address: string;
  city: string;
  province: string;
  district: string;
  landAreaPerches: number;
  openingTime: string;
  closingTime: string;
  hasEvCharging: boolean;
}): ParkingInput => ({
  name: values.name.trim(),
  address: values.address.trim(),
  city: values.city.trim(),
  province: values.province,
  district: values.district,
  landAreaPerches: values.landAreaPerches,
  openingTime: toApiTime(values.openingTime),
  closingTime: toApiTime(values.closingTime),
  hasEvCharging: values.hasEvCharging,
});

// PUT replaces the whole property, so a single-tab save re-sends everything else unchanged.
export const detailsInputOf = (facility: ParkingFacility): ParkingInput => ({
  name: facility.name,
  address: facility.address,
  city: facility.city,
  province: facility.province,
  district: facility.district,
  latitude: facility.latitude,
  longitude: facility.longitude,
  landAreaPerches: facility.landAreaPerches,
  openingTime: toApiTime(facility.openingTime),
  closingTime: toApiTime(facility.closingTime),
  hasEvCharging: facility.hasEvCharging,
});

export const getApiErrorMessage = (error: unknown, fallback: string): string => {
  const message = (error as { response?: { data?: { message?: string } } })
    ?.response?.data?.message;
  return message || fallback;
};
