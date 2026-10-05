import { z } from "zod";
import { OwnerSlotState, SlotState } from "../types/parkingSlotTypes";
import { MAX_SLOT_REASON_LENGTH } from "../utils/parkingSlotUtils";

// The three owner-settable states; a bay is never marked reserved by hand.
const OWNER_STATE_VALUES = [
  OwnerSlotState.AVAILABLE,
  OwnerSlotState.MAINTENANCE,
  OwnerSlotState.DISABLED,
] as const;

export const slotStatusSchema = z.object({
  status: z.enum(OWNER_STATE_VALUES, { message: "Choose a state for this bay." }),
  // The reason is recorded on the bay, not sent to the driver, so it stays optional.
  reason: z
    .string()
    .max(MAX_SLOT_REASON_LENGTH, `Keep the note under ${MAX_SLOT_REASON_LENGTH} characters.`)
    .optional()
    .or(z.literal("")),
});

export type SlotStatusValues = z.infer<typeof slotStatusSchema>;

// Board filters include the derived RESERVED and OCCUPIED; the period stays a string until it is converted to UTC.
export const slotBoardFilterSchema = z.object({
  vehicleTypeId: z.string().optional(),
  status: z
    .enum([
      SlotState.AVAILABLE,
      SlotState.RESERVED,
      SlotState.OCCUPIED,
      SlotState.MAINTENANCE,
      SlotState.DISABLED,
    ])
    .optional()
    .or(z.literal("")),
  from: z.string().optional(),
  to: z.string().optional(),
});

export type SlotBoardFilterValues = z.infer<typeof slotBoardFilterSchema>;
