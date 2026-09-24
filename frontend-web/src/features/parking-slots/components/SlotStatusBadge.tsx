import React from "react";
import Badge from "../../../components/common/Badge/Badge";
import type { SlotState } from "../types/parkingSlotTypes";
import { SLOT_STATE_BADGE, SLOT_STATE_LABEL } from "../utils/parkingSlotUtils";

interface SlotStatusBadgeProps {
  state: SlotState;
  size?: "sm" | "md";
  title?: string;
}

export const SlotStatusBadge: React.FC<SlotStatusBadgeProps> = ({
  state,
  size = "sm",
  title,
}) => (
  <Badge
    variant={SLOT_STATE_BADGE[state] ?? "default"}
    size={size}
    dot
    title={title}
  >
    {SLOT_STATE_LABEL[state] ?? state}
  </Badge>
);

export default SlotStatusBadge;
