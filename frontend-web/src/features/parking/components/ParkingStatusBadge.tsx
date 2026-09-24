import React from "react";
import Badge from "../../../components/common/Badge/Badge";
import type { ParkingStatus } from "../types/parkingTypes";
import { STATUS_BADGE_VARIANT, STATUS_LABEL } from "../utils/parkingUtils";

interface ParkingStatusBadgeProps {
  status: ParkingStatus;
  size?: "sm" | "md";
}

export const ParkingStatusBadge: React.FC<ParkingStatusBadgeProps> = ({
  status,
  size = "sm",
}) => (
  <Badge variant={STATUS_BADGE_VARIANT[status] ?? "default"} size={size} dot>
    {STATUS_LABEL[status] ?? status}
  </Badge>
);

export default ParkingStatusBadge;
