// @vitest-environment node
import { describe, expect, it } from "vitest";
import type {
  FacilityQueueRow,
  FacilitySectionReview,
  ParkingFacility,
} from "../../../src/features/parking/types/parkingTypes";
import {
  detailsInputOf,
  formatCoordinates,
  groupByOwner,
  ownerLabelOf,
  parseCoordinate,
  roundCoordinate,
  toInput,
  validateCoordinatePair,
} from "../../../src/features/parking/utils/parkingUtils";

const facility = (over: Partial<ParkingFacility> = {}): ParkingFacility => ({
  facilityId: "33333333-3333-3333-3333-333333333333",
  providerId: "44444444-4444-4444-4444-444444444444",
  name: "Galle Road Parking",
  address: "No 123, Galle Road",
  city: "Colombo",
  province: "Western",
  district: "Colombo",
  latitude: 6.9271,
  longitude: 79.8612,
  distanceKm: null,
  landAreaPerches: 15.5,
  openingTime: "08:00:00",
  closingTime: "20:00:00",
  hasEvCharging: false,
  status: "DRAFT",
  slotCount: 0,
  documents: [],
  documentsComplete: false,
  documentRequirements: [],
  sections: [],
  allocations: [],
  slotGroups: [],
  missingRequirements: [],
  readyForSubmission: false,
  isEditable: true,
  rejectionReason: null,
  submittedAt: null,
  reviewedAt: null,
  createdAt: "2026-09-22T00:00:00Z",
  updatedAt: "2026-09-22T00:00:00Z",
  ...over,
});

describe("parseCoordinate", () => {
  it("treats a blank field as no location rather than zero", () => {
    expect(parseCoordinate("")).toBeNull();
    expect(parseCoordinate("   ")).toBeNull();
  });

  it("reads a decimal degree", () => {
    expect(parseCoordinate(" 6.927079 ")).toBe(6.927079);
    expect(parseCoordinate("-1.5")).toBe(-1.5);
  });

  it("returns NaN for text that is not a number", () => {
    // A comma decimal separator is what a localised map app hands back, and it is not a number here.
    expect(Number.isNaN(parseCoordinate("6,927"))).toBe(true);
    expect(Number.isNaN(parseCoordinate("north"))).toBe(true);
    expect(Number.isNaN(parseCoordinate("1e999"))).toBe(true);
  });
});

describe("roundCoordinate", () => {
  it("keeps the six decimals the column stores", () => {
    expect(roundCoordinate(6.9270791234)).toBe(6.927079);
    expect(roundCoordinate(6.9270795)).toBe(6.92708);
    expect(roundCoordinate(80.5)).toBe(80.5);
  });
});

describe("validateCoordinatePair", () => {
  it("accepts a pair inside Sri Lanka, including the edges of the box", () => {
    expect(validateCoordinatePair("6.927079", "79.861243")).toEqual({});
    expect(validateCoordinatePair("5.9", "79.4")).toEqual({});
    expect(validateCoordinatePair("10.2", "82.1")).toEqual({});
  });

  it("accepts two blanks, which clears a saved location", () => {
    expect(validateCoordinatePair("", "  ")).toEqual({});
  });

  it("names a value that is not a number", () => {
    const errors = validateCoordinatePair("abc", "80.5");
    expect(errors.latitude).toBe("Latitude must be a number.");
    expect(errors.longitude).toBeUndefined();
  });

  it("puts the range message on every value that is outside the country", () => {
    const errors = validateCoordinatePair("1.2", "99.9");
    expect(errors.latitude).toBe("These coordinates are outside Sri Lanka.");
    expect(errors.longitude).toBe("These coordinates are outside Sri Lanka.");
  });

  it("keeps the valid half clean and asks for the other number", () => {
    const missingLongitude = validateCoordinatePair("6.927079", "");
    expect(missingLongitude.latitude).toBeUndefined();
    expect(missingLongitude.longitude).toBe(
      "Enter the longitude too — a location needs both numbers.",
    );

    const missingLatitude = validateCoordinatePair("", "79.861243");
    expect(missingLatitude.latitude).toBe(
      "Enter the latitude too — a location needs both numbers.",
    );
    expect(missingLatitude.longitude).toBeUndefined();
  });

  it("reports only the half that is actually wrong when one value is out of range", () => {
    const errors = validateCoordinatePair("", "1.5");
    expect(errors.latitude).toBeUndefined();
    expect(errors.longitude).toBe("These coordinates are outside Sri Lanka.");
  });
});

describe("formatCoordinates", () => {
  it("shows six decimals so a saved point can be read back and retyped", () => {
    expect(formatCoordinates(facility({ latitude: 6.9, longitude: 79.86 }))).toBe(
      "6.900000, 79.860000",
    );
  });

  it("shows nothing without a complete pair", () => {
    expect(formatCoordinates(facility({ longitude: null }))).toBeNull();
    expect(formatCoordinates(facility({ latitude: null, longitude: null }))).toBeNull();
  });
});

describe("detailsInputOf", () => {
  it("sends a complete property, because the details PUT replaces it", () => {
    expect(detailsInputOf(facility())).toEqual({
      name: "Galle Road Parking",
      address: "No 123, Galle Road",
      city: "Colombo",
      province: "Western",
      district: "Colombo",
      latitude: 6.9271,
      longitude: 79.8612,
      landAreaPerches: 15.5,
      openingTime: "08:00:00",
      closingTime: "20:00:00",
      hasEvCharging: false,
    });
  });

  it("carries an unsaved location through as null instead of dropping it", () => {
    const input = detailsInputOf(facility({ latitude: null, longitude: null }));
    expect(input.latitude).toBeNull();
    expect(input.longitude).toBeNull();
  });
});

describe("toInput", () => {
  it("trims the text fields and expands the times to HH:mm:ss", () => {
    const input = toInput({
      name: "  Nugegala Street Lot  ",
      address: "No 43, Kandy Road",
      city: " Nugegoda ",
      province: "Western",
      district: "Colombo",
      landAreaPerches: 8,
      openingTime: "08:00",
      closingTime: "20:00",
      hasEvCharging: true,
    });
    expect(input.name).toBe("Nugegala Street Lot");
    expect(input.address).toBe("No 43, Kandy Road");
    expect(input.city).toBe("Nugegoda");
    expect(input.openingTime).toBe("08:00:00");
    expect(input.closingTime).toBe("20:00:00");
    expect(input.hasEvCharging).toBe(true);
  });

  it("leaves the coordinates to the caller, since the details form has no fields for them", () => {
    const input = toInput({
      name: "Nugegala Street Lot",
      address: "No 43, Kandy Road",
      city: "Nugegoda",
      province: "Western",
      district: "Colombo",
      landAreaPerches: 8,
      openingTime: "08:00",
      closingTime: "20:00",
      hasEvCharging: false,
    });
    expect(input.latitude).toBeUndefined();
    expect(input.longitude).toBeUndefined();
  });
});

const section = (over: Partial<FacilitySectionReview> = {}): FacilitySectionReview => ({
  section: "DOCUMENTS",
  label: "Documents and photos",
  description: "",
  status: "PENDING",
  remarks: null,
  reviewedBy: null,
  reviewedAt: null,
  missingRequirements: [],
  ...over,
});

const queueRow = (over: Partial<FacilityQueueRow> = {}): FacilityQueueRow => ({
  facility: facility(),
  providerId: "44444444-4444-4444-4444-444444444444",
  providerName: "Kamal Perera",
  providerEmail: "kamal@example.com",
  providerBusinessName: null,
  providerVerificationStatus: "APPROVED",
  ...over,
});

// Provider-side grouping derives from the identity the server stamps on every row, so it cannot disagree with the filter.
describe("groupByOwner", () => {
  it("gathers each provider's properties under one header, alphabetically", () => {
    const groups = groupByOwner([
      queueRow({
        providerId: "p-zimal",
        providerName: "Zimal Finance",
        facility: facility({ name: "Fort Street Lot", providerId: "p-zimal" }),
      }),
      queueRow({
        providerId: "p-anura",
        providerName: "Anura Holdings",
        facility: facility({ name: "Galle Road Parking", providerId: "p-anura" }),
      }),
      queueRow({
        providerId: "p-anura",
        providerName: "Anura Holdings",
        facility: facility({ name: "Kandy Road Yard", providerId: "p-anura" }),
      }),
    ]);

    expect(groups.map((group) => group.label)).toEqual(["Anura Holdings", "Zimal Finance"]);
    expect(groups[0].rows.map((row) => row.facility.name)).toEqual([
      "Galle Road Parking",
      "Kandy Road Yard",
    ]);
  });

  it("counts the sections still awaiting a decision across a provider's properties", () => {
    const [group] = groupByOwner([
      queueRow({
        facility: facility({
          sections: [section(), section({ section: "PRICING", status: "APPROVED" })],
        }),
      }),
      queueRow({
        facility: facility({
          sections: [section({ status: "APPROVED" }), section({ section: "PRICING" })],
        }),
      }),
    ]);

    expect(group.awaitingSections).toBe(2);
  });

  it("labels a provider by their account email when no name was saved", () => {
    const row = queueRow({ providerName: "   ", providerEmail: "owner@example.com" });
    expect(ownerLabelOf(row)).toBe("owner@example.com");
    expect(groupByOwner([row])[0].label).toBe("owner@example.com");
    expect(ownerLabelOf(queueRow({ providerName: "", providerEmail: "" }))).toBe(
      "Unknown owner",
    );
  });
});
