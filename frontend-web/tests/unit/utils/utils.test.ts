import { describe, expect, it } from "vitest";
import type {
  AllocationInput,
  DocumentRequirement,
  VehicleTypeOption,
} from "../../../src/features/parking/types/parkingTypes";
import {
  MAX_ALLOCATED_SLOTS,
  bayLabel,
  documentProgress,
  documentTabsFor,
  formatMoney,
  formatOperatingHours,
  hasBaySize,
  isPricedByAdmin,
  priceRangeHint,
  splitAmount,
  standardBayLabel,
  toApiTime,
  toInput,
  validateAllocationRows,
} from "../../../src/features/parking/utils/parkingUtils";
import type {
  PricingDraft,
  VehiclePricingConfig,
  VehicleTypeConfig,
  VehicleTypeDraft,
} from "../../../src/features/commission/types/commissionTypes";
import {
  normaliseCode,
  pricingDraft,
  providerSummary,
  toVehicleTypeInput,
  validatePricingDraft,
  validateVehicleTypeDraft,
  vehicleTypeDraft,
} from "../../../src/features/commission/utils/commissionUtils";
import type { AppNotification } from "../../../src/features/notifications/types/notificationTypes";
import {
  bellLabel,
  formatNotificationTime,
  unreadCountFor,
} from "../../../src/features/notifications/utils/notificationUtils";

const vehicleType = (overrides: Partial<VehicleTypeOption> = {}): VehicleTypeOption => ({
  id: "vt-car",
  name: "Car",
  code: "CAR",
  sortOrder: 1,
  bayLengthMeters: 5,
  bayWidthMeters: 2.5,
  minPrice: null,
  maxPrice: null,
  commissionRate: null,
  ...overrides,
});

const allocation = (overrides: Partial<AllocationInput> = {}): AllocationInput => ({
  vehicleTypeId: "vt-car",
  numberOfSlots: 4,
  hourlyRate: 500,
  ...overrides,
});

const requirement = (
  overrides: Partial<DocumentRequirement> = {},
): DocumentRequirement => ({
  type: "VERIFIED_DEED",
  label: "Verified deed",
  count: 0,
  minRequired: 1,
  maxAllowed: 1,
  replacesExisting: true,
  satisfied: false,
  ...overrides,
});

describe("validateAllocationRows", () => {
  // The Car row from the admin's pricing table.
  const carPricing = { minPrice: 300, maxPrice: 1500, commissionRate: 12 };
  const types = [vehicleType(carPricing)];

  it("accepts a row that already matches the server rules", () => {
    expect(validateAllocationRows([allocation()], types)).toEqual({});
  });

  it("rejects a zero or fractional slot count", () => {
    const twoTypes = [vehicleType({ id: "a" }), vehicleType({ id: "b" })];
    const errors = validateAllocationRows(
      [
        allocation({ vehicleTypeId: "a", numberOfSlots: 0 }),
        allocation({ vehicleTypeId: "b", numberOfSlots: 2.5 }),
      ],
      twoTypes,
    );
    expect(errors["a"].numberOfSlots).toBe("Slot count must be greater than 0.");
    expect(errors["b"].numberOfSlots).toBe("Slot count must be greater than 0.");
  });

  it("applies the 500 slot ceiling to the whole property, not one row", () => {
    const twoTypes = [vehicleType({ id: "a" }), vehicleType({ id: "b" })];
    const overHalf = MAX_ALLOCATED_SLOTS / 2 + 1;
    const errors = validateAllocationRows(
      [
        allocation({ vehicleTypeId: "a", numberOfSlots: overHalf }),
        allocation({ vehicleTypeId: "b", numberOfSlots: overHalf }),
      ],
      twoTypes,
    );
    expect(errors["a"].numberOfSlots).toBe(
      `A property can have at most ${MAX_ALLOCATED_SLOTS} slots.`,
    );
    expect(errors["b"].numberOfSlots).toBe(
      `A property can have at most ${MAX_ALLOCATED_SLOTS} slots.`,
    );
  });

  it("enforces the admin price window", () => {
    const bounded = [vehicleType({ ...carPricing, minPrice: 100, maxPrice: 1000 })];
    expect(
      validateAllocationRows([allocation({ hourlyRate: 50 })], bounded)["vt-car"].hourlyRate,
    ).toBe("Must be at least 100 LKR.");
    expect(
      validateAllocationRows([allocation({ hourlyRate: 1001 })], bounded)["vt-car"].hourlyRate,
    ).toBe("Must be at most 1,000 LKR.");
    expect(
      validateAllocationRows([allocation({ hourlyRate: 0 })], bounded)["vt-car"].hourlyRate,
    ).toBe("Hourly rate must be greater than 0.");
  });

  it("refuses a vehicle type the admin has not priced yet", () => {
    expect(
      validateAllocationRows([allocation()], [vehicleType()])["vt-car"].hourlyRate,
    ).toBe("No pricing is set for Car yet, so it cannot be allocated.");
    expect(isPricedByAdmin(vehicleType(carPricing))).toBe(true);
    expect(isPricedByAdmin(vehicleType({ ...carPricing, commissionRate: null }))).toBe(false);
  });

  it("still checks the count and price rules on an unpriced vehicle type", () => {
    expect(
      validateAllocationRows([allocation({ numberOfSlots: 0 })], [vehicleType()])["vt-car"],
    ).toEqual({
      numberOfSlots: "Slot count must be greater than 0.",
      hourlyRate: "No pricing is set for Car yet, so it cannot be allocated.",
    });
  });
});

describe("documentTabsFor / documentProgress", () => {
  it("keeps the server order and adds the wording on top", () => {
    const tabs = documentTabsFor([
      requirement(),
      requirement({
        type: "PROPERTY_PHOTO",
        label: "Property photos",
        minRequired: 4,
        maxAllowed: 4,
        replacesExisting: false,
      }),
    ]);
    expect(tabs.map((tab) => tab.type)).toEqual(["VERIFIED_DEED", "PROPERTY_PHOTO"]);
    expect(tabs[0].hint).toBe("Deed image verified by a notary for this land.");
    expect(tabs[1].hint).toContain("Four clear photos");
  });

  it("word a replaceable requirement as Required, then Uploaded", () => {
    expect(documentProgress(documentTabsFor([requirement()])[0])).toBe("Required");
    expect(
      documentProgress(documentTabsFor([requirement({ count: 1, satisfied: true })])[0]),
    ).toBe("Uploaded");
  });

  it("mark an optional requirement Optional whatever it holds", () => {
    const optional = { type: "LAND_DOCUMENT" as const, minRequired: 0, maxAllowed: null };
    expect(documentProgress(documentTabsFor([requirement(optional)])[0])).toBe("Optional");
    expect(
      documentProgress(documentTabsFor([requirement({ ...optional, count: 2 })])[0]),
    ).toBe("Optional");
  });

  it("count a fixed set such as the four property photos as a fraction", () => {
    const tab = documentTabsFor([
      requirement({
        type: "PROPERTY_PHOTO",
        label: "Property photos",
        count: 2,
        minRequired: 4,
        maxAllowed: 4,
        replacesExisting: false,
      }),
    ])[0];
    expect(documentProgress(tab)).toBe("2 of 4 uploaded");
  });
});

describe("standardBayLabel", () => {
  it("word the vehicle type's bay with its dimensions", () => {
    expect(standardBayLabel(vehicleType())).toBe("5 m × 2.5 m");
  });

  it("say so when the admin left the bay blank", () => {
    expect(standardBayLabel(vehicleType({ bayLengthMeters: null, bayWidthMeters: null }))).toBe(
      "no size set",
    );
    expect(bayLabel(5, null)).toBe("no size set");
  });

  it("refuse a vehicle type whose bay the admin never typed", () => {
    expect(hasBaySize(vehicleType())).toBe(true);
    expect(hasBaySize(vehicleType({ bayWidthMeters: null }))).toBe(false);
    expect(
      validateAllocationRows(
        [allocation()],
        [vehicleType({ minPrice: 300, maxPrice: 1500, commissionRate: 12, bayWidthMeters: null })],
      )["vt-car"].hourlyRate,
    ).toBe("No bay size is set for Car yet, so it cannot be allocated.");
  });
});

describe("pricing hints", () => {
  it("stay empty when the admin set no price window", () => {
    expect(priceRangeHint(vehicleType())).toBe("");
  });

  it("show a one-sided bound as a floor or a ceiling", () => {
    expect(priceRangeHint(vehicleType({ minPrice: 300 }))).toBe(
      "Allowed: 300 or more per hour",
    );
  });

  it("show both bounds as a window", () => {
    expect(priceRangeHint(vehicleType({ minPrice: 300, maxPrice: 900 }))).toBe(
      "Allowed: 300 - 900 per hour",
    );
  });
});

describe("splitAmount", () => {
  it("take the admin's commission out of the provider's price", () => {
    expect(splitAmount(800, 12)).toEqual({ commission: 96, providerAmount: 704 });
  });

  it("round the commission to two decimals like the server does", () => {
    expect(splitAmount(100.55, 12.5)).toEqual({ commission: 12.57, providerAmount: 87.98 });
  });

  it("leave everything with the provider when the admin set no commission", () => {
    expect(splitAmount(500, 0)).toEqual({ commission: 0, providerAmount: 500 });
  });
});

describe("payload formatting", () => {
  it("send TimeOnly with seconds and trim the text fields", () => {
    expect(toApiTime("08:00")).toBe("08:00:00");
    expect(toApiTime("08:00:00")).toBe("08:00:00");
    expect(
      toInput({
        name: "  ABC Parking ",
        address: " 123 Galle Road ",
        city: " Colombo ",
        province: "Western",
        district: "Colombo",
        landAreaPerches: 15.5,
        openingTime: "08:00",
        closingTime: "20:00",
        hasEvCharging: false,
      }),
    ).toEqual({
      name: "ABC Parking",
      address: "123 Galle Road",
      city: "Colombo",
      province: "Western",
      district: "Colombo",
      landAreaPerches: 15.5,
      openingTime: "08:00:00",
      closingTime: "20:00:00",
      hasEvCharging: false,
    });
  });

  it("show stored hours and money without the extra precision", () => {
    expect(
      formatOperatingHours({ openingTime: "08:00:00", closingTime: "20:00:00" } as never),
    ).toBe("08:00 - 20:00");
    expect(formatMoney(1500)).toBe("1,500 LKR");
    expect(formatMoney(500.5)).toBe("500.5 LKR");
  });
});

const adminPricing = (
  overrides: Partial<PricingDraft> = {},
): PricingDraft => ({
  minimumPrice: "300",
  maximumPrice: "1500",
  commissionRate: "12",
  isActive: true,
  ...overrides,
});

const adminVehicleType = (
  overrides: Partial<VehicleTypeConfig> = {},
): VehicleTypeConfig => ({
  id: "vt-car",
  name: "Car",
  slotCode: "CAR",
  sortOrder: 1,
  isActive: true,
  bayLengthMeters: 5,
  bayWidthMeters: 2.5,
  ...overrides,
});

const savedPricing = (
  overrides: Partial<VehiclePricingConfig> = {},
): VehiclePricingConfig => ({
  id: "price-car",
  vehicleTypeId: "vt-car",
  vehicleTypeName: "Car",
  vehicleTypeCode: "CAR",
  minimumPrice: 300,
  maximumPrice: 1500,
  commissionRate: 12,
  isActive: true,
  ...overrides,
});

describe("normaliseCode", () => {
  it("keep only letters and digits and upper-case them like the server does", () => {
    expect(normaliseCode(" truck ")).toBe("TRUCK");
    expect(normaliseCode("1 200abc")).toBe("1200ABC");
    expect(normaliseCode("a_-b")).toBe("AB");
  });
});

describe("validatePricingDraft", () => {
  it("accepts the window the admin was given", () => {
    expect(validatePricingDraft(adminPricing())).toEqual({});
  });

  it("refuse a blank or unparseable bound", () => {
    expect(validatePricingDraft(adminPricing({ minimumPrice: "" })).minimumPrice).toBe(
      "Enter the minimum price.",
    );
    expect(validatePricingDraft(adminPricing({ maximumPrice: "abc" })).maximumPrice).toBe(
      "Enter the maximum price.",
    );
  });

  it("refuse the server's ceilings of 100,000 and 100 percent", () => {
    expect(
      validatePricingDraft(adminPricing({ maximumPrice: "100001" })).maximumPrice,
    ).toBe("Maximum price must be between 0 and 100,000.");
    expect(
      validatePricingDraft(adminPricing({ commissionRate: "101" })).commissionRate,
    ).toBe("Commission must be between 0 and 100 percent.");
    expect(validatePricingDraft(adminPricing({ commissionRate: "-1" })).commissionRate).toBe(
      "Commission must be between 0 and 100 percent.",
    );
  });

  it("report an inverted window against the maximum, even for an inactive row", () => {
    const inverted = "Maximum price cannot be lower than the minimum.";
    expect(validatePricingDraft(adminPricing({ minimumPrice: "900", maximumPrice: "300" })))
      .toEqual({ maximumPrice: inverted });
    expect(
      validatePricingDraft(
        adminPricing({ minimumPrice: "900", maximumPrice: "300", isActive: false }),
      ).maximumPrice,
    ).toBe(inverted);
  });
});

describe("validateVehicleTypeDraft", () => {
  const draft = (overrides: Partial<VehicleTypeDraft> = {}): VehicleTypeDraft => ({
    name: "Truck",
    slotCode: "TRK",
    sortOrder: "6",
    isActive: true,
    bayLengthMeters: "6",
    bayWidthMeters: "3",
    ...overrides,
  });

  it("accepts a complete row", () => {
    expect(validateVehicleTypeDraft(draft())).toEqual({});
  });

  it("let a type be saved before its bay is agreed", () => {
    expect(validateVehicleTypeDraft(draft({ bayLengthMeters: "", bayWidthMeters: "" }))).toEqual(
      {},
    );
  });

  it("refuse half a bay, because a slot needs both sides", () => {
    expect(validateVehicleTypeDraft(draft({ bayWidthMeters: "" }))).toEqual({
      bayWidthMeters: "Enter both sides of the bay, or leave both empty.",
    });
  });

  it("range-check each side against the server's 20 meter ceiling", () => {
    expect(validateVehicleTypeDraft(draft({ bayLengthMeters: "0" })).bayLengthMeters).toBe(
      "Bay length must be between 0 and 20 meters.",
    );
    expect(validateVehicleTypeDraft(draft({ bayWidthMeters: "25" })).bayWidthMeters).toBe(
      "Bay width must be between 0 and 20 meters.",
    );
  });

  it("reject a code that cannot prefix a slot number and a negative order", () => {
    expect(validateVehicleTypeDraft(draft({ slotCode: "1234" })).slotCode).toBe(
      "Slot code must start with a letter, e.g. CAR.",
    );
    expect(validateVehicleTypeDraft(draft({ slotCode: " " })).slotCode).toBe(
      "Slot code is required.",
    );
    expect(validateVehicleTypeDraft(draft({ slotCode: "ABCDEFGHIJKLMNOP" })).slotCode).toBe(
      "Slot code must be 1-10 letters or digits, e.g. CAR.",
    );
    expect(validateVehicleTypeDraft(draft({ sortOrder: "-1" })).sortOrder).toBe(
      "Sort order cannot be negative.",
    );
  });
});

describe("configuration payload formatting", () => {
  it("trim, normalise and type the vehicle type payload", () => {
    expect(
      toVehicleTypeInput({
        name: "  Pickup Truck ",
        slotCode: "pk up",
        sortOrder: "7",
        isActive: false,
        bayLengthMeters: "6.5",
        bayWidthMeters: "3.2",
      }),
    ).toEqual({
      name: "Pickup Truck",
      slotCode: "PKUP",
      sortOrder: 7,
      isActive: false,
      bayLengthMeters: 6.5,
      bayWidthMeters: 3.2,
    });
  });

  it("send null for a bay side the admin left blank", () => {
    expect(
      toVehicleTypeInput({
        name: "Oversized",
        slotCode: "OVER",
        sortOrder: "8",
        isActive: true,
        bayLengthMeters: "9",
        bayWidthMeters: "",
      }),
    ).toEqual({
      name: "Oversized",
      slotCode: "OVER",
      sortOrder: 8,
      isActive: true,
      bayLengthMeters: 9,
      bayWidthMeters: null,
    });
  });

  it("seed a row from the saved configuration, or an empty one when there is none", () => {
    expect(pricingDraft(savedPricing())).toEqual(adminPricing());
    expect(pricingDraft(undefined)).toEqual({
      minimumPrice: "",
      maximumPrice: "",
      commissionRate: "",
      isActive: true,
    });
    expect(vehicleTypeDraft(adminVehicleType({ bayWidthMeters: null }))).toEqual({
      name: "Car",
      slotCode: "CAR",
      sortOrder: "1",
      isActive: true,
      bayLengthMeters: "5",
      bayWidthMeters: "",
    });
    expect(vehicleTypeDraft(adminVehicleType({ bayLengthMeters: null, bayWidthMeters: null })))
      .toEqual({
        name: "Car",
        slotCode: "CAR",
        sortOrder: "1",
        isActive: true,
        bayLengthMeters: "",
        bayWidthMeters: "",
      });
  });
});

describe("configuration row labels", () => {
  it("word a bay the way the server stamps it", () => {
    expect(bayLabel(5, 2.5)).toBe("5 m × 2.5 m");
    expect(bayLabel(null, null)).toBe("no size set");
  });

  it("tell the admin what providers will see", () => {
    expect(providerSummary(savedPricing(), adminVehicleType())).toBe(
      "Allowed 300 LKR - 1,500 LKR per hour · platform takes 12% · bays built to 5 m × 2.5 m",
    );
    expect(
      providerSummary(savedPricing(), adminVehicleType({ bayLengthMeters: null })),
    ).toBe("Allowed 300 LKR - 1,500 LKR per hour · platform takes 12% · bays built to no size set");
    expect(providerSummary(undefined, adminVehicleType())).toBe(
      "Providers cannot allocate this type until pricing is set. Bays built to 5 m × 2.5 m.",
    );
    expect(
      providerSummary(savedPricing({ isActive: false }), adminVehicleType()),
    ).toBe("Providers cannot allocate this type until pricing is set. Bays built to 5 m × 2.5 m.");
  });
});

describe("notification utils", () => {
  const at = (iso: string) => new Date(iso);
  const notification = (
    overrides: Partial<AppNotification> = {},
  ): AppNotification => ({
    id: "n1",
    facilityId: "f1",
    title: "Galle Road Parking was adjusted to the platform's new rules",
    body: "Your 2,000 LKR price was moved to the nearest allowed 1,500 LKR.",
    isRead: false,
    createdAt: "2026-09-22T09:00:00Z",
    ...overrides,
  });

  it("show recent messages as elapsed time", () => {
    const now = at("2026-09-22T10:00:00Z");
    expect(formatNotificationTime("2026-09-22T09:59:30Z", now)).toBe("just now");
    expect(formatNotificationTime("2026-09-22T09:55:00Z", now)).toBe("5m ago");
    expect(formatNotificationTime("2026-09-22T07:00:00Z", now)).toBe("3h ago");
  });

  it("fall back to a date once a message is older than a day", () => {
    const now = at("2026-09-22T10:00:00Z");
    const created = at("2026-09-17T10:00:00Z");
    expect(formatNotificationTime(created.toISOString(), now)).toBe(
      created.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    );
    expect(formatNotificationTime("not a date", now)).toBe("");
  });

  it("count only unread messages", () => {
    expect(
      unreadCountFor([
        notification({ isRead: false }),
        notification({ id: "n2", isRead: true }),
        notification({ id: "n3", isRead: false }),
      ]),
    ).toBe(2);
    expect(unreadCountFor([])).toBe(0);
  });

  it("phrase the bell label for none, one and many", () => {
    expect(bellLabel(0)).toBe("No unread updates");
    expect(bellLabel(1)).toBe("1 unread update");
    expect(bellLabel(4)).toBe("4 unread updates");
  });
});
