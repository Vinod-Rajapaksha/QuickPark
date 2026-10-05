import React from "react";
import Button from "../../../components/common/Button/Button";
import Modal from "../../../components/common/Modal/Modal";
import Alert from "../../../components/feedback/Alert";
import { formatMoney } from "../../parking/utils/parkingUtils";
import { canDriverCancel, formatDateTime } from "../utils/reservationUtils";
import ReservationStatusBadge from "./ReservationStatusBadge";
import type { Reservation } from "../types/reservationTypes";

interface ReservationDetailsProps {
  reservation: Reservation | null;
  onClose: () => void;
  onCancel?: (reservation: Reservation) => void;
  isCancelling?: boolean;
}

const Row: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div>
    <dt className="text-xs uppercase tracking-wide text-slate-400">{label}</dt>
    <dd className="mt-1 text-slate-700">{children}</dd>
  </div>
);

export const ReservationDetails: React.FC<ReservationDetailsProps> = ({
  reservation,
  onClose,
  onCancel,
  isCancelling = false,
}) => {
  if (!reservation) return null;

  const pendingPayment = reservation.status === "PENDING";
  const cancellable = onCancel && canDriverCancel(reservation);

  return (
    <Modal
      isOpen={reservation !== null}
      onClose={onClose}
      title={reservation.facilityName}
      maxWidth="max-w-xl"
      footer={
        <div className="flex justify-end gap-2">
          {cancellable && (
            <Button
              type="button"
              variant="danger"
              size="sm"
              isLoading={isCancelling}
              onClick={() => onCancel?.(reservation)}
            >
              Cancel reservation
            </Button>
          )}
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      }
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-slate-500">
          {reservation.city}, {reservation.district}, {reservation.province}
        </p>
        <ReservationStatusBadge status={reservation.status} />
      </div>

      {pendingPayment && (
        <Alert tone="warning" title="Awaiting payment" className="mt-4">
          This booking is held but not confirmed yet. The confirmation payment covers the time from{" "}
          {formatDateTime(reservation.createdAt)} until it starts at{" "}
          {formatDateTime(reservation.startTime)}.
        </Alert>
      )}

      {reservation.status === "CANCELLED" && (
        <Alert tone="error" title="Cancelled" className="mt-4">
          {reservation.cancelReason
            ? `Reason: ${reservation.cancelReason}`
            : "This booking was cancelled and the bay is free again."}
        </Alert>
      )}

      <dl className="mt-5 grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
        <Row label="Reference">
          <span className="font-mono text-xs">{reservation.reservationId}</span>
        </Row>
        <Row label="Bay">
          {reservation.slotNumber} ({reservation.vehicleTypeName})
        </Row>
        <Row label="Starts">{formatDateTime(reservation.startTime)}</Row>
        <Row label="Ends">{formatDateTime(reservation.endTime)}</Row>
        <Row label="Booked">
          {reservation.hours} hour{reservation.hours === 1 ? "" : "s"}
        </Row>
        <Row label="Hourly rate">{formatMoney(reservation.hourlyRate)}</Row>
        <Row label="Created">{formatDateTime(reservation.createdAt)}</Row>
        <Row label="Checked in">{formatDateTime(reservation.checkedInAt)}</Row>
      </dl>

      <div className="mt-5 flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
        <span className="text-sm font-medium text-slate-600">Total amount</span>
        <span className="text-xl font-semibold text-slate-900">
          {formatMoney(reservation.totalAmount)}
        </span>
      </div>
    </Modal>
  );
};

export default ReservationDetails;