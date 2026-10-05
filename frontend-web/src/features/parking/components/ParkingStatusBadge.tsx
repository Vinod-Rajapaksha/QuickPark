import React from "react";
import Badge from "../../../components/common/Badge/Badge";

interface ParkingStatusBadgeProps {
  status: string;
  size?: "sm" | "md";
}

// Placeholder written so the property tables can load; the owning team maps statuses to variants.
const ParkingStatusBadge: React.FC<ParkingStatusBadgeProps> = ({ status, size = "sm" }) => (
  <Badge variant="default" size={size}>
    {status}
  </Badge>
);

export default ParkingStatusBadge;
