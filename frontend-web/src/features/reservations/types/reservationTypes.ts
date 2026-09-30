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
  status: string;
  isApprovedByProvider: boolean;
  isAgentBooking: boolean;
  checkedInAt: string | null;
  checkedOutAt: string | null;
  cancelReason: string | null;
  cancelledBy: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type BookingGateAction =
  "CONFIRM" | "CHECK_IN" | "CHECK_OUT" | "NO_SHOW";

export interface CreateReservationInput {
  facilityId: string;
  vehicleTypeId: string;
  slotId?: string | null;
  startTime: string;
  endTime: string;
}

export interface DriverSlot {
  slotId: string;
  facilityId: string;
  slotNumber: string;
  vehicleTypeId: string;
  vehicleTypeName: string;
  bayLabel: string;
  status: string;
  availableForPeriod: boolean;
  hourlyRate: number;
  busyFrom: string | null;
  busyUntil: string | null;
}
