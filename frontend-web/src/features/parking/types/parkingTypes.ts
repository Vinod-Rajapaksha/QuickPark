export type ParkingStatus =
  | "DRAFT"
  | "PENDING_APPROVAL"
  | "APPROVED"
  | "REJECTED"
  | "SUSPENDED";

export type FacilityDocumentType =
  | "LAND_DOCUMENT"
  | "LAND_OWNER_NIC"
  | "VERIFIED_DEED"
  | "PROPERTY_PHOTO"
  | "SLOT_SKETCH";

// Document counts only — URLs never travel in a driver-facing listing.
export interface ParkingFacilityDocumentSummary {
  type: FacilityDocumentType;
  count: number;
  latestUploadedAt: string | null;
}

// The admin's document rules, sent with every facility so the tabs are not hardcoded.
export interface DocumentRequirement {
  type: FacilityDocumentType;
  label: string;
  count: number;
  minRequired: number;
  maxAllowed: number | null;
  replacesExisting: boolean;
  satisfied: boolean;
}

export interface FacilityAllocation {
  vehicleTypeId: string;
  vehicleTypeName: string;
  vehicleTypeCode: string;
  bayLengthMeters: number | null;
  bayWidthMeters: number | null;
  numberOfSlots: number;
  hourlyRate: number;
  commissionRate: number;
}

// How the auto-generated slots of a property are grouped per vehicle type.
export interface FacilitySlotGroup {
  vehicleTypeId: string;
  vehicleTypeName: string;
  vehicleTypeCode: string;
  bayLabel: string;
  hourlyRate: number;
  total: number;
  available: number;
}

// The four parts of a registration the admin approves one at a time.
export type FacilitySectionName =
  | "BASIC_INFORMATION"
  | "PROPERTY_LOCATION"
  | "DOCUMENTS"
  | "PRICING";

// NOT_SUBMITTED until first submission; after that each section settles APPROVED or REJECTED, and editing it reopens it.
export type FacilitySectionStatus = "NOT_SUBMITTED" | "PENDING" | "APPROVED" | "REJECTED";

export interface FacilitySectionReview {
  section: FacilitySectionName;
  label: string;
  description: string;
  status: FacilitySectionStatus;
  remarks: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  missingRequirements: string[];
}

export interface ParkingFacility {
  facilityId: string;
  providerId: string;
  name: string;
  address: string;
  city: string;
  province: string;
  district: string;
  // The owner's pin; null until the location tab fills it, and submitting without it is refused.
  latitude: number | null;
  longitude: number | null;
  // Kilometres from the search's reference point; null without one or without coordinates.
  distanceKm: number | null;
  landAreaPerches: number;
  openingTime: string;
  closingTime: string;
  hasEvCharging: boolean;
  status: ParkingStatus;
  slotCount: number;
  documents: ParkingFacilityDocumentSummary[];
  documentsComplete: boolean;
  documentRequirements: DocumentRequirement[];
  // One row per registration section with the admin's decision; empty on the driver-facing view.
  sections: FacilitySectionReview[];
  allocations: FacilityAllocation[];
  slotGroups: FacilitySlotGroup[];
  missingRequirements: string[];
  readyForSubmission: boolean;
  isEditable: boolean;
  rejectionReason: string | null;
  submittedAt: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// Full document record, returned by the owner-only documents endpoint.
export interface ParkingFacilityDocument {
  documentId: string;
  facilityId: string;
  type: FacilityDocumentType;
  url: string;
  fileName: string | null;
  contentType: string | null;
  sizeBytes: number;
  uploadedAt: string;
}

// Create/update payload. A PUT is a full replace, so callers re-send what they are not editing.
export interface ParkingInput {
  name: string;
  address: string;
  city: string;
  province: string;
  district: string;
  latitude?: number | null;
  longitude?: number | null;
  landAreaPerches: number;
  openingTime: string;
  closingTime: string;
  hasEvCharging: boolean;
}

// A pair typed by the owner or taken from a driver's location. Both or neither.
export interface CoordinateInput {
  latitude: number | null;
  longitude: number | null;
}

export interface ParkingLocationFilter extends Partial<CoordinateInput> {
  province?: string;
  district?: string;
  // Only meaningful with a reference point; the server sorts by distance when it gets one.
  radiusKm?: number;
}

// One row of the owner's slot layout; saving the list regenerates the slots. Bay size and commission are stamped server-side.
export interface AllocationInput {
  vehicleTypeId: string;
  numberOfSlots: number;
  hourlyRate: number;
}

// Master data with the admin's pricing for the type; all null until configured, so the type cannot be priced yet.
export interface VehicleTypeOption {
  id: string;
  name: string;
  code: string;
  sortOrder: number;
  // The admin's standard bay for this type; both null means the type cannot be allocated.
  bayLengthMeters: number | null;
  bayWidthMeters: number | null;
  minPrice: number | null;
  maxPrice: number | null;
  commissionRate: number | null;
}

export interface RegistrationOptions {
  vehicleTypes: VehicleTypeOption[];
}

// Admin review queue row: the property plus its owner, so the screen can group either way.
export interface FacilityQueueRow {
  facility: ParkingFacility;
  providerId: string;
  providerName: string;
  providerEmail: string;
  providerBusinessName: string | null;
  providerVerificationStatus: string;
}

// Admin-only review payload: property, owner identity and document URLs.
export interface FacilityReview {
  facility: ParkingFacility;
  providerUserId: string;
  providerName: string;
  providerEmail: string;
  providerPhone: string;
  businessName: string | null;
  providerVerificationStatus: string;
  reviewedBy: string | null;
  documents: ParkingFacilityDocument[];
}
