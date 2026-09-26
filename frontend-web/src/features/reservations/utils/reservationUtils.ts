import type {
  BookingGateAction,
  Reservation,
} from "../types/reservationTypes";

export const GATE_ACTION_LABEL: Record<BookingGateAction, string> = {
  CONFIRM: "Confirm",
  CHECK_IN: "Check in",
  CHECK_OUT: "Check out",
  NO_SHOW: "No show",
};

// Kept deliberately close to the server's transitions: confirming settles a pending booking,
// checking in opens the stay, and checking out is what re-prices it for the hours used.
export const gateActionsFor = (
  reservation: Reservation,
  now: Date = new Date(),
): BookingGateAction[] => {
  const actions: BookingGateAction[] = [];
  if (reservation.status !== "PENDING" && reservation.status !== "CONFIRMED")
    return actions;

  const time = now.getTime();
  const start = Date.parse(reservation.startTime);
  const end = Date.parse(reservation.endTime);
  if (Number.isNaN(start) || Number.isNaN(end)) return actions;

  if (reservation.checkedInAt) {
    if (!reservation.checkedOutAt) actions.push("CHECK_OUT");
    return actions;
  }

  if (time <= end) {
    if (reservation.status === "PENDING") actions.push("CONFIRM");
    else actions.push("CHECK_IN");
  }
  if (time > start && time <= end) actions.push("NO_SHOW");
  return actions;
};

// Hours the driver is charged for, counting a started hour as a whole one.
export const bookingHours = (startTime: string, endTime: string): number => {
  const start = Date.parse(startTime);
  const end = Date.parse(endTime);
  if (Number.isNaN(start) || Number.isNaN(end) || end <= start) return 0;
  return Math.ceil((end - start) / 3_600_000);
};

// datetime-local wants a wall-clock "YYYY-MM-DDTHH:mm", which toISOString's UTC form is not.
export const defaultStartValue = (offsetMinutes = 0): string => {
  const value = new Date(Date.now() + offsetMinutes * 60_000);
  const pad = (part: number) => String(part).padStart(2, "0");
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(
    value.getDate(),
  )}T${pad(value.getHours())}:${pad(value.getMinutes())}`;
};
