// @vitest-environment node
import { describe, expect, it } from "vitest";
import {
  BOARD_STATUS_OPTIONS,
  describeCounts,
  nextOwnerStates,
  OWNER_SLOT_STATES,
  SLOT_STATE_BADGE,
  SLOT_STATE_HINT,
  SLOT_STATE_LABEL,
  slotReasonIsAllowed,
  slotStateIsLocked,
} from "../../../src/features/parking-slots/utils/parkingSlotUtils";
import { slotStatusSchema } from "../../../src/features/parking-slots/schemas/parkingSlotSchemas";
import type {
  ParkingSlotRow,
  SlotBoardCounts,
} from "../../../src/features/parking-slots/types/parkingSlotTypes";

const bay = (over: Partial<ParkingSlotRow> = {}): ParkingSlotRow => ({
  slotId: "55555555-5555-5555-5555-555555555555",
  facilityId: "33333333-3333-3333-3333-333333333333",
  slotNumber: "CAR-001",
  vehicleTypeId: "66666666-6666-6666-6666-666666666666",
  vehicleTypeName: "Car",
  bayLabel: "5 m × 2.5 m",
  status: "AVAILABLE",
  effectiveStatus: "AVAILABLE",
  bookable: true,
  hourlyRate: 300,
  busyFrom: null,
  busyUntil: null,
  current: null,
  ...over,
});

const counts = (over: Partial<SlotBoardCounts> = {}): SlotBoardCounts => ({
  total: 5,
  available: 2,
  reserved: 1,
  occupied: 1,
  maintenance: 1,
  disabled: 0,
  byVehicleType: [],
  ...over,
});

describe("a bay's state is split from its booking state (§6)", () => {
  it("has a label, a colour and an explanation for every state the board can show", () => {
    for (const state of ["AVAILABLE", "RESERVED", "OCCUPIED", "MAINTENANCE", "DISABLED"] as const) {
      expect(SLOT_STATE_LABEL[state]).toBeTruthy();
      expect(SLOT_STATE_BADGE[state]).toBeTruthy();
      expect(SLOT_STATE_HINT[state]).toBeTruthy();
    }
  });

  it("only ever offers the owner the three states a bay can be set to", () => {
    expect(OWNER_SLOT_STATES).toEqual(["AVAILABLE", "MAINTENANCE", "DISABLED"]);
    expect(BOARD_STATUS_OPTIONS).toHaveLength(5);
  });

  it("leaves a bay the bookings are speaking for alone", () => {
    expect(slotStateIsLocked(bay({ status: "AVAILABLE" }))).toBe(false);
    expect(slotStateIsLocked(bay({ status: "RESERVED" }))).toBe(true);
    expect(slotStateIsLocked(bay({ status: "OCCUPIED" }))).toBe(true);
    expect(nextOwnerStates(bay({ status: "OCCUPIED" }))).toEqual([]);
    expect(nextOwnerStates(bay({ status: "AVAILABLE" }))).toEqual(["MAINTENANCE", "DISABLED"]);
    expect(nextOwnerStates(bay({ status: "MAINTENANCE" }))).toEqual(["AVAILABLE", "DISABLED"]);
  });
});

describe("the board's totals (§11)", () => {
  it("say what a driver can still book and what the owner took away", () => {
    expect(describeCounts(counts())).toBe(
      "5 bays · 2 available · 1 reserved · 1 occupied · 1 maintenance",
    );
    expect(describeCounts(counts({ reserved: 0, occupied: 0, maintenance: 0, disabled: 3 }))).toBe(
      "5 bays · 2 available · 3 retired",
    );
  });
});

describe("§16 refuses a state the server would reject", () => {
  it("accepts only the three owner states", () => {
    expect(slotStatusSchema.safeParse({ status: "MAINTENANCE", reason: "Boom gate broken" }).success)
      .toBe(true);
    expect(slotStatusSchema.safeParse({ status: "RESERVED", reason: "" }).success).toBe(false);
    expect(slotStatusSchema.safeParse({ status: "OCCUPIED" }).success).toBe(false);
    expect(slotStatusSchema.safeParse({ status: "" }).success).toBe(false);
  });

  it("keeps the note within the column the server writes it to", () => {
    expect(slotReasonIsAllowed("x".repeat(300))).toBe(true);
    expect(slotReasonIsAllowed("x".repeat(301))).toBe(false);
  });
});
