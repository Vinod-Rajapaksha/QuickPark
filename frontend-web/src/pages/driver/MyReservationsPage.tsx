import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { CalendarDays } from "lucide-react";
import Button from "../../components/common/Button/Button";
import ConfirmDialog from "../../components/common/ConfirmDialog/ConfirmDialog";
import Spinner from "../../components/common/Spinner/Spinner";
import Alert from "../../components/feedback/Alert";
import { ROUTES } from "../../app/routes/routeConstants";
import ReservationCard from "../../features/reservations/components/ReservationCard";
import ReservationDetails from "../../features/reservations/components/ReservationDetails";
import useReservations from "../../features/reservations/hooks/useReservations";
import type { Reservation } from "../../features/reservations/types/reservationTypes";

// The statuses a driver books their week around; the server filters on the name it stores.
const STATUS_TABS = [
  { value: "", label: "All" },
  { value: "PENDING", label: "Pending payment" },
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
];

export const MyReservationsPage: React.FC = () => {
  const location = useLocation();
  const justBooked = (location.state as { justBooked?: string } | null)?.justBooked ?? null;
  const [showCreatedNotice, setShowCreatedNotice] = useState(true);

  const [status, setStatus] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pendingCancel, setPendingCancel] = useState<Reservation | null>(null);

  const {
    reservations,
    isLoading,
    loadError,
    actionError,
    isCancelling,
    refresh,
    cancel,
    dismissActionError,
  } = useReservations(status ? { status } : {});

  // Read from the live list so a cancellation refreshes the open details in place.
  const selected = reservations.find((item) => item.reservationId === selectedId) ?? null;

  const confirmCancel = async () => {
    if (!pendingCancel) return;
    const cancelled = await cancel(pendingCancel.reservationId);
    if (cancelled) setPendingCancel(null);
  };

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
            <CalendarDays size={24} className="text-slate-400" />
            My Reservations
          </h1>
          <p className="mt-1 text-slate-500">
            Every bay you booked, and what still needs paying for.
          </p>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={refresh} disabled={isLoading}>
            Refresh
          </Button>
          <Link
            to={ROUTES.PARKING_DISCOVERY}
            className="inline-flex items-center justify-center rounded-lg bg-primary-600 px-3 py-2 text-sm font-medium text-white shadow-md hover:bg-primary-700"
          >
            Find parking
          </Link>
        </div>
      </div>

      {justBooked && showCreatedNotice && (
        <Alert
          tone="success"
          title="Reservation created"
          onDismiss={() => setShowCreatedNotice(false)}
        >
          Reference {justBooked.slice(0, 8).toUpperCase()} is held as pending payment. Pay it to
          confirm the booking.
        </Alert>
      )}

      {actionError && (
        <Alert tone="error" title="Could not update the booking" onDismiss={dismissActionError}>
          {actionError}
        </Alert>
      )}

      <div className="flex flex-wrap gap-2">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setStatus(tab.value)}
            aria-pressed={status === tab.value}
            className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
              status === tab.value
                ? "border-blue-600 bg-blue-600 text-white shadow-sm"
                : "border-slate-300 bg-white text-slate-700 hover:border-blue-400 hover:bg-blue-50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      ) : loadError ? (
        <div className="space-y-4">
          <Alert tone="error" title="Could not load your reservations">
            {loadError}
          </Alert>
          <Button type="button" variant="outline" onClick={refresh}>
            Try again
          </Button>
        </div>
      ) : reservations.length === 0 ? (
        <div className="flex flex-col items-center rounded-xl border border-dashed border-slate-300 py-14 text-center">
          <CalendarDays size={32} className="text-slate-300" />
          <p className="mt-3 font-medium text-slate-700">
            {status ? `No ${STATUS_TABS.find((tab) => tab.value === status)?.label.toLowerCase()} bookings` : "No reservations yet"}
          </p>
          <p className="mt-1 max-w-sm text-sm text-slate-500">
            Book a bay from Parking Discovery and it appears here, held until you pay.
          </p>
          <Link
            to={ROUTES.PARKING_DISCOVERY}
            className="mt-4 inline-flex rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
          >
            Find parking
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {reservations.map((reservation) => (
            <ReservationCard
              key={reservation.reservationId}
              reservation={reservation}
              onView={(item) => setSelectedId(item.reservationId)}
              onCancel={(item) => setPendingCancel(item)}
            />
          ))}
        </div>
      )}

      <ReservationDetails
        reservation={selected}
        onClose={() => setSelectedId(null)}
        onCancel={(item) => setPendingCancel(item)}
        isCancelling={isCancelling}
      />

      <ConfirmDialog
        isOpen={pendingCancel !== null}
        onClose={() => setPendingCancel(null)}
        onConfirm={confirmCancel}
        title="Cancel this reservation?"
        description={
          pendingCancel
            ? `${pendingCancel.slotNumber} at ${pendingCancel.facilityName} will be released for other drivers. This cannot be undone.`
            : ""
        }
        confirmText="Cancel reservation"
        cancelText="Keep it"
        type="danger"
        isLoading={isCancelling}
      />
    </div>
  );
};

export default MyReservationsPage;
