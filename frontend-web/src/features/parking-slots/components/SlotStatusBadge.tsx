import React from "react";
import Badge from "../../../components/common/Badge/Badge";
import type { SlotState } from "../types/parkingSlotTypes";
import { SLOT_STATE_BADGE, SLOT_STATE_LABEL } from "../utils/parkingSlotUtils";

interface SlotStatusBadgeProps {
  state: SlotState;
  title?: string;
  className?: string;
}

// The board reads what a bay actually is rather than what the owner last set it 
const SlotStatusBadge: React.FC<SlotStatusBadgeProps> = ({ state, title, className }) => (
  <Badge variant={SLOT_STATE_BADGE[state] ?? "default"} dot title={title} className={className}>
    {SLOT_STATE_LABEL[state] ?? state}
  </Badge>
);

export default SlotStatusBadge;
