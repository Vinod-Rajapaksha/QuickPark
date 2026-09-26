import type { BadgeVariant } from "../../../components/common/Badge/Badge";
import { formatMoney } from "../../parking/utils/parkingUtils";
import {
  OwnerSlotState,
  SlotState,
  type ParkingSlotRow,
  type SlotBoardCounts,
} from "../types/parkingSlotTypes";

export { formatMoney };

export const SLOT_STATE_BADGE: Record<SlotState, BadgeVariant> = {
  AVAILABLE: "success",
  RESERVED: "info",
  OCCUPIED: "primary",
  MAINTENANCE: "warning",
  DISABLED: "default",
};

export const SLOT_STATE_LABEL: Record<SlotState, string> = {
  AVAILABLE: "Available",
  RESERVED: "Reserved",
  OCCUPIED: "Occupied",
  MAINTENANCE: "Maintenance",
  DISABLED: "Retired",
};

export const SLOT_STATE_HINT: Record<SlotState, string> = {
  AVAILABLE: "Free to book for the period you are looking at.",
  RESERVED: "A booking is waiting to start on this bay.",
  OCCUPIED: "A vehicle is in this bay right now.",
  MAINTENANCE: "You took this bay out of service. Drivers are not shown it.",
  DISABLED: "Retired from the layout. Its past bookings stay on file.",
};

// The only states an owner can put a bay into; whether it is reserved is never stored.
export const OWNER_SLOT_STATES: OwnerSlotState[] = [
  OwnerSlotState.AVAILABLE,
  OwnerSlotState.MAINTENANCE,
  OwnerSlotState.DISABLED,
];

export const OWNER_SLOT_STATE_LABEL: Record<OwnerSlotState, string> = {
  AVAILABLE: "Back in service",
  MAINTENANCE: "Maintenance",
  DISABLED: "Retire this bay",
};

export const OWNER_SLOT_STATE_HELP: Record<OwnerSlotState, string> = {
  AVAILABLE: "The bay goes back on the map for drivers straight away.",
  MAINTENANCE:
    "Drivers stop being shown the bay. A booking that has not ended has to move or be cancelled first.",
  DISABLED:
    "The bay leaves the layout but its row and its bookings are never deleted, so the history stays readable.",
};

export const BOARD_STATUS_OPTIONS: { value: SlotState; label: string }[] = (
  [
    SlotState.AVAILABLE,
    SlotState.RESERVED,
    SlotState.OCCUPIED,
    SlotState.MAINTENANCE,
    SlotState.DISABLED,
  ] as SlotState[]
).map((value) => ({ value, label: SLOT_STATE_LABEL[value] }));

// A bay a live booking speaks for can only go back to available.
export const slotStateIsLocked = (slot: ParkingSlotRow): boolean =>
  !OWNER_SLOT_STATES.includes(slot.status as OwnerSlotState) &&
  slot.status !== SlotState.AVAILABLE;

export const nextOwnerStates = (slot: ParkingSlotRow): OwnerSlotState[] => {
  if (slotStateIsLocked(slot)) return [];
  return OWNER_SLOT_STATES.filter((state) => state !== slot.status);
};

export const describeCounts = (counts: SlotBoardCounts): string =>
  [
    `${counts.total} bays`,
    `${counts.available} available`,
    counts.reserved ? `${counts.reserved} reserved` : null,
    counts.occupied ? `${counts.occupied} occupied` : null,
    counts.maintenance ? `${counts.maintenance} maintenance` : null,
    counts.disabled ? `${counts.disabled} retired` : null,
  ]
    .filter((part): part is string => Boolean(part))
    .join(" · ");

// The reason a bay is being taken out of service, kept to the server's ceiling.
export const MAX_SLOT_REASON_LENGTH = 300;

export const slotReasonIsAllowed = (reason: string): boolean =>
  reason.length <= MAX_SLOT_REASON_LENGTH;

export const slotReasonIsNeeded = (state: OwnerSlotState, current: SlotState): boolean =>
  state === OwnerSlotState.MAINTENANCE && current !== SlotState.MAINTENANCE;

const pad = (value: number): string => `${value}`.padStart(2, "0");

// The API sends UTC and a datetime-local input wants the owner's own wall clock.
export const toLocalInputValue = (iso: string): string => {
  const at = new Date(iso);
  if (Number.isNaN(at.getTime())) return "";
  return `${at.getFullYear()}-${pad(at.getMonth() + 1)}-${pad(at.getDate())}T${pad(
    at.getHours(),
  )}:${pad(at.getMinutes())}`;
};

export const toApiInstant = (localValue: string): string => {
  const at = new Date(localValue);
  return Number.isNaN(at.getTime()) ? "" : at.toISOString();
};

const dateTimeFormatter = new Intl.DateTimeFormat("en-LK", {
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

export const formatInstant = (iso: string): string => {
  const at = new Date(iso);
  return Number.isNaN(at.getTime())
    ? "—"
    : dateTimeFormatter.format(at).replace(", ", " ");
};

export const formatPeriod = (startIso: string, endIso: string): string =>
  `${formatInstant(startIso)} → ${formatInstant(endIso)}`;
