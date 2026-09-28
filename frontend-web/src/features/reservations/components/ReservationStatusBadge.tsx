import React from "react";
import Badge, { type BadgeVariant } from "../../../components/common/Badge/Badge";

// The server sends the ReservationStatus name. PENDING is a booking the driver has not paid for
// yet, so it says so plainly instead of reading as a confirmation.
const STATUS_PRESENTATION: Record<string, { label: string; variant: BadgeVariant }> = {
  PENDING: { label: "Pending payment", variant: "warning" },
  CONFIRMED: { label: "Confirmed", variant: "success" },
  CHECKED_IN: { label: "Checked in", variant: "info" },
  CHECKED_OUT: { label: "Checked out", variant: "default" },
  COMPLETED: { label: "Completed", variant: "default" },
  CANCELLED: { label: "Cancelled", variant: "error" },
  NOSHOW: { label: "No show", variant: "error" },
};

interface ReservationStatusBadgeProps {
  status: string;
  withDot?: boolean;
}

export const ReservationStatusBadge: React.FC<ReservationStatusBadgeProps> = ({
  status,
  withDot = true,
}) => {
  const presentation = STATUS_PRESENTATION[status];

  return (
    <Badge variant={presentation?.variant ?? "default"} dot={withDot}>
      {presentation?.label ?? status}
    </Badge>
  );
};

export default ReservationStatusBadge;
