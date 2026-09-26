import React from "react";
import Button, { type ButtonVariant } from "../../../components/common/Button/Button";
import type { BookingGateAction, Reservation } from "../types/reservationTypes";
import { GATE_ACTION_LABEL, gateActionsFor } from "../utils/reservationUtils";

interface ReservationGateActionsProps {
  reservation: Reservation;
  onGate?: (reservation: Reservation, action: BookingGateAction) => void;
  busyId?: string | null;
  now?: Date;
  className?: string;
}

const VARIANT: Record<BookingGateAction, ButtonVariant> = {
  CONFIRM: "outline",
  CHECK_IN: "primary",
  CHECK_OUT: "primary",
  NO_SHOW: "outline",
};

export const ReservationGateActions: React.FC<ReservationGateActionsProps> = ({
  reservation,
  onGate,
  busyId = null,
  now,
  className = "flex flex-wrap gap-2",
}) => {
  const actions = gateActionsFor(reservation, now);
  if (!onGate || actions.length === 0) return null;

  const busy = busyId === reservation.reservationId;

  return (
    <div className={className}>
      {actions.map((action) => (
        <Button
          key={action}
          type="button"
          size="sm"
          variant={VARIANT[action]}
          isLoading={busy}
          disabled={busy}
          onClick={() => onGate(reservation, action)}
        >
          {GATE_ACTION_LABEL[action]}
        </Button>
      ))}
    </div>
  );
};

export default ReservationGateActions;
