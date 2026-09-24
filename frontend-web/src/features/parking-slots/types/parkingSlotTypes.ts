import type { ParkingFacility } from "../../parking/types/parkingTypes";

// How the bay board sees the booking holding a bay; the server sends the whole booking.
export interface SlotBooking {
  reservationId: string;
  driverName: string;
  startTime: string;
  endTime: string;
}

// Owner-set states are AVAILABLE, MAINTENANCE, DISABLED; RESERVED and OCCUPIED are derived.
export type SlotState =
  | "AVAILABLE"
  | "RESERVED"
  | "OCCUPIED"
  | "MAINTENANCE"
  | "DISABLED";

// The three states a bay can actually be sent to.
export type OwnerSlotState = "AVAILABLE" | "MAINTENANCE" | "DISABLED";

// Total counts bays in the layout, so a retired bay never inflates what a driver can book.
export interface SlotBoardCounts {
  total: number;
  available: number;
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

// One bay. status is what the owner set, effectiveState is what the card shows.
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

// Everything one screen of the board needs.
export interface SlotBoard {
  facility: ParkingFacility;
  counts: SlotBoardCounts;
  slots: ParkingSlotRow[];
}

// One bay opened from the board, with what is waiting for it and what it carried.
export interface ParkingSlotDetails {
  slot: ParkingSlotRow;
  upcoming: SlotBooking[];
  history: SlotBooking[];
}

// The board's two filters, plus the period the owner is asking about.
export interface SlotBoardFilter {
  vehicleTypeId?: string;
  status?: SlotState | "";
  from?: string;
  to?: string;
}

// The state change a bay is sent to.
export interface SlotStatusInput {
  status: OwnerSlotState;
  reason?: string;
}
