import React from "react";
import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Calendar,
  Search,
  History,
  Car,
  ArrowRight,
} from "lucide-react";
import Card from "../../components/common/Card/Card";
import Button from "../../components/common/Button/Button";
import Spinner from "../../components/common/Spinner/Spinner";
import Alert from "../../components/feedback/Alert";
import { ROUTES } from "../../app/routes/routeConstants";
import ReservationCard from "../../features/reservations/components/ReservationCard";
import useReservations from "../../features/reservations/hooks/useReservations";

export const DriverDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { reservations, isLoading, loadError } = useReservations();

  const upcomingReservations = reservations
    .filter((r) => r.status === "PENDING" || r.status === "CONFIRMED")
    .slice(0, 3);

  return (
    <div className="mx-auto max-w-6xl space-y-8 pb-12">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
            <LayoutDashboard size={24} className="text-slate-400" />
            Dashboard
          </h1>
          <p className="mt-1 text-slate-500">
            Welcome back! Manage your parking and explore new spaces.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card
          className="border-slate-200 bg-gradient-to-br from-blue-50 to-indigo-50 border-none shadow-sm cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => navigate(ROUTES.PARKING_DISCOVERY)}
        >
          <div className="p-2 flex flex-col items-center text-center space-y-3">
            <div className="p-3 bg-blue-500 text-white rounded-full">
              <Search size={28} />
            </div>
            <h3 className="font-bold text-slate-800">Find Parking</h3>
            <p className="text-sm text-slate-600">
              Discover and book parking spaces instantly.
            </p>
          </div>
        </Card>

        <Card
          className="border-slate-200 bg-gradient-to-br from-emerald-50 to-teal-50 border-none shadow-sm cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => navigate(ROUTES.DRIVER_RESERVATIONS)}
        >
          <div className="p-2 flex flex-col items-center text-center space-y-3">
            <div className="p-3 bg-emerald-500 text-white rounded-full">
              <Calendar size={28} />
            </div>
            <h3 className="font-bold text-slate-800">My Reservations</h3>
            <p className="text-sm text-slate-600">
              Manage your active and pending bookings.
            </p>
          </div>
        </Card>

        <Card
          className="border-slate-200 bg-gradient-to-br from-amber-50 to-orange-50 border-none shadow-sm cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => navigate(ROUTES.BOOKING_HISTORY)}
        >
          <div className="p-2 flex flex-col items-center text-center space-y-3">
            <div className="p-3 bg-amber-500 text-white rounded-full">
              <History size={28} />
            </div>
            <h3 className="font-bold text-slate-800">Booking History</h3>
            <p className="text-sm text-slate-600">
              Review all your past parking sessions.
            </p>
          </div>
        </Card>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-800">
            Upcoming Reservations
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(ROUTES.DRIVER_RESERVATIONS)}
            rightIcon={<ArrowRight size={16} />}
          >
            View all
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-10">
            <Spinner size="md" />
          </div>
        ) : loadError ? (
          <Alert tone="error" title="Failed to load reservations">
            {loadError}
          </Alert>
        ) : upcomingReservations.length === 0 ? (
          <Card className="border-dashed border-slate-300 py-12 text-center shadow-none">
            <Car size={32} className="mx-auto text-slate-300 mb-3" />
            <p className="font-medium text-slate-700">No upcoming parking</p>
            <p className="text-sm text-slate-500 mt-1 mb-4">
              You have no active or pending reservations.
            </p>
            <Button
              variant="primary"
              onClick={() => navigate(ROUTES.PARKING_DISCOVERY)}
            >
              Book a Spot
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {upcomingReservations.map((res) => (
              <ReservationCard
                key={res.reservationId}
                reservation={res}
                onView={() => navigate(ROUTES.DRIVER_RESERVATIONS)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DriverDashboardPage;
