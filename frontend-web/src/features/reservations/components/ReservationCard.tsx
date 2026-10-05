import React from "react";
import { Clock, MapPin, PencilLine } from "lucide-react";
import Button from "../../../components/common/Button/Button";
import Card from "../../../components/common/Card/Card";
import { formatMoney } from "../../parking/utils/parkingUtils";
import { canDriverCancel, formatDateTime } from "../utils/reservationUtils";
import ReservationStatusBadge from "./ReservationStatusBadge";
import type { Reservation } from "../types/reservationTypes";

interface ReservationCardProps {
  reservation: Reservation;
  onView: (reservation: Reservation) => void;
  onCancel?: (reservation: Reservation) => void;
  onPay?: (reservation: Reservation) => void;
  onViewQr?: (reservation: Reservation) => void;
}

export const ReservationCard: React.FC<ReservationCardProps> = ({
  reservation,
  onView,
  onCancel,
  onPay,
  onViewQr,
}) => {
  const cancellable = onCancel && canDriverCancel(reservation);

  return (
    <Card padding="sm" interactive className="h-full" onClick={() => onView(reservation)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-semibold text-slate-900">{reservation.facilityName}</p>
          <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-slate-500">
            <MapPin size={12} className="shrink-0" />
            {reservation.city}, {reservation.district}
          </p>
        </div>
        <ReservationStatusBadge status={reservation.status} />
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-xs uppercase tracking-wide text-slate-400">Bay</dt>
          <dd className="mt-0.5 font-medium text-slate-800">
            {reservation.slotNumber}
            <span className="ml-1 font-normal text-slate-500">
              ({reservation.vehicleTypeName})
            </span>
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-slate-400">Reference</dt>
          <dd className="mt-0.5 font-mono text-xs text-slate-600">
            {reservation.reservationId.slice(0, 8).toUpperCase()}
          </dd>
        </div>
        <div className="col-span-2">
          <dt className="flex items-center gap-1 text-xs uppercase tracking-wide text-slate-400">
            <Clock size={12} />
            Period
          </dt>
          <dd className="mt-0.5 text-slate-700">
            {formatDateTime(reservation.startTime)} → {formatDateTime(reservation.endTime)}
          </dd>
        </div>
      </dl>

      <div className="mt-4 flex flex-wrap items-end justify-between gap-4 border-t border-slate-100 pt-3">
        <div className="min-w-fit">
          <p className="text-xs uppercase tracking-wide text-slate-400">Amount</p>
          <p className="text-lg font-semibold text-slate-900">
            {formatMoney(reservation.totalAmount)}
          </p>
          <p className="text-xs text-slate-500">
            {reservation.hours} hour{reservation.hours === 1 ? "" : "s"} ×{" "}
            {formatMoney(reservation.hourlyRate)}
          </p>
        </div>
        <div className="flex flex-wrap shrink-0 gap-2">
          {(reservation.status === "CONFIRMED" || reservation.status === "CHECKED_IN") && onViewQr && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={(event) => {
                event.stopPropagation();
                onViewQr(reservation);
              }}
            >
              QR Code
            </Button>
          )}
          {reservation.status === "PENDING" && (!reservation.isAgentBooking || reservation.isApprovedByProvider) && onPay && (
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={(event) => {
                event.stopPropagation();
                onPay(reservation);
              }}
            >
              Pay Now
            </Button>
          )}
          {cancellable && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={(event) => {
                event.stopPropagation();
                onCancel?.(reservation);
              }}
            >
              Cancel
            </Button>
          )}
          <Button
            type="button"
            variant="secondary"
            size="sm"
            leftIcon={<PencilLine size={14} />}
            onClick={(event) => {
              event.stopPropagation();
              onView(reservation);
            }}
          >
            Details
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default ReservationCard;