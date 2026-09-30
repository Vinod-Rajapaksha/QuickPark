import React, { useState } from "react";
import { Link } from "react-router-dom";
import { History } from "lucide-react";
import Button from "../../components/common/Button/Button";
import Spinner from "../../components/common/Spinner/Spinner";
import Alert from "../../components/feedback/Alert";
import { ROUTES } from "../../app/routes/routeConstants";
import ReservationCard from "../../features/reservations/components/ReservationCard";
import ReservationDetails from "../../features/reservations/components/ReservationDetails";
import useReservations from "../../features/reservations/hooks/useReservations";

const HISTORY_TABS = [
  { value: "", label: "All History" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
];

export const BookingHistoryPage: React.FC = () => {
  const [status, setStatus] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { reservations, isLoading, loadError, refresh } = useReservations(
    status ? { status } : {},
  );

  const historyReservations = status
    ? reservations
    : reservations.filter(
        (r) => r.status === "COMPLETED" || r.status === "CANCELLED",
      );

  const selected =
    historyReservations.find((item) => item.reservationId === selectedId) ??
    null;

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
            <History size={24} className="text-slate-400" />
            Booking History
          </h1>
          <p className="mt-1 text-slate-500">
            Review your past parking sessions and cancelled reservations.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={refresh}
            disabled={isLoading}
          >
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

      <div className="flex flex-wrap gap-2">
        {HISTORY_TABS.map((tab) => (
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
          <Alert tone="error" title="Could not load your history">
            {loadError}
          </Alert>
          <Button type="button" variant="outline" onClick={refresh}>
            Try again
          </Button>
        </div>
      ) : historyReservations.length === 0 ? (
        <div className="flex flex-col items-center rounded-xl border border-dashed border-slate-300 py-14 text-center">
          <History size={32} className="text-slate-300" />
          <p className="mt-3 font-medium text-slate-700">
            No history records found
          </p>
          <p className="mt-1 max-w-sm text-sm text-slate-500">
            Your past bookings will appear here once they are completed or
            cancelled.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {historyReservations.map((reservation) => (
            <ReservationCard
              key={reservation.reservationId}
              reservation={reservation}
              onView={(item) => setSelectedId(item.reservationId)}
            />
          ))}
        </div>
      )}

      <ReservationDetails
        reservation={selected}
        onClose={() => setSelectedId(null)}
      />
    </div>
  );
};

export default BookingHistoryPage;
