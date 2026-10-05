import type { ParkingFacility } from "../../parking/types/parkingTypes";

export interface SlotBooking {
  reservationId: string;
  driverName: string;
  startTime: string;
  endTime: string;
}

export const SlotState = {
  AVAILABLE: "AVAILABLE",
  PENDING: "PENDING",
  RESERVED: "RESERVED",
  OCCUPIED: "OCCUPIED",
  MAINTENANCE: "MAINTENANCE",
  DISABLED: "DISABLED",
} as const;

export type SlotState = typeof SlotState[keyof typeof SlotState];

export const OwnerSlotState = {
  AVAILABLE: "AVAILABLE",
  MAINTENANCE: "MAINTENANCE",
  DISABLED: "DISABLED",
} as const;

export type OwnerSlotState =
  typeof OwnerSlotState[keyof typeof OwnerSlotState];

export interface SlotBoardCounts {
  total: number;
  available: number;
  pending: number;
  reserved: number;
  occupied: number;
  maintenance: number;
  disabled: number;
  byVehicleType: SlotTypeCount[];
}

export interface SlotTypeCount {
  vehicleTypeId: string;
  vehicleTypeName: string;
  total: number;
  available: number;
}

export interface ParkingSlotRow {
  slotId: string;
  facilityId: string;
  slotNumber: string;
  vehicleTypeId: string;
  vehicleTypeName: string;
  bayLabel: string;
  status: SlotState;
  effectiveStatus: SlotState;
  bookable: boolean;
  hourlyRate: number;
  busyFrom: string | null;
  busyUntil: string | null;
  current: SlotBooking | null;
}

export interface SlotBoard {
  facility: ParkingFacility;
  counts: SlotBoardCounts;
  slots: ParkingSlotRow[];
}

export interface ParkingSlotDetails {
  slot: ParkingSlotRow;
  upcoming: SlotBooking[];
  history: SlotBooking[];
}

export interface SlotBoardFilter {
  vehicleTypeId?: string;
  status?: SlotState | "";
  from?: string;
  to?: string;
}

export interface SlotStatusInput {
  status: OwnerSlotState;
  reason?: string;
}
