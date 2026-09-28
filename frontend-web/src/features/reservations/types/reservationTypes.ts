// Mirrors the API's ReservationResponse. The gate columns are what the action buttons read.
export interface Reservation {
  reservationId: string;
  driverId: string;
  driverName: string;
  driverPhone: string;
  facilityId: string;
  facilityName: string;
  city: string;
  province: string;
  district: string;
  providerId: string;
  slotId: string;
  slotNumber: string;
  vehicleTypeId: string;
  vehicleTypeName: string;
  startTime: string;
  endTime: string;
  hours: number;
  hourlyRate: number;
  totalAmount: number;
  commissionRate: number;
  commissionAmount: number;
  providerAmount: number;
  // Server sends the ReservationStatus name; a bad value simply offers no gate action.
  status: string;
  checkedInAt: string | null;
  checkedOutAt: string | null;
  cancelReason: string | null;
  cancelledBy: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type BookingGateAction = "CONFIRM" | "CHECK_IN" | "CHECK_OUT" | "NO_SHOW";

// Mirrors the API's CreateReservationRequest. The driver is never named here: the server reads the
// account from the access token. Leaving slotId empty lets the server assign the lowest free bay.
export interface CreateReservationInput {
  facilityId: string;
  vehicleTypeId: string;
  slotId?: string | null;
  startTime: string;
  endTime: string;
}

// Mirrors the API's SlotResponse for GET /api/parkingFacilities/{id}/slots, which answers only for
// an approved property and needs both from and to (or neither) to judge a period.
export interface DriverSlot {
  slotId: string;
  facilityId: string;
  slotNumber: string;
  vehicleTypeId: string;
  vehicleTypeName: string;
  bayLabel: string;
  // What the owner set: AVAILABLE, MAINTENANCE or DISABLED.
  status: string;
  availableForPeriod: boolean;
  hourlyRate: number;
  busyFrom: string | null;
  busyUntil: string | null;
}