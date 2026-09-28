import React, { useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, CalendarPlus, Clock, MapPin } from "lucide-react";
import Button from "../../components/common/Button/Button";
import Card from "../../components/common/Card/Card";
import Input from "../../components/common/Input/Input";
import Spinner from "../../components/common/Spinner/Spinner";
import Alert from "../../components/feedback/Alert";
import { ROUTES } from "../../app/routes/routeConstants";
import { formatMoney } from "../../features/parking/utils/parkingUtils";
import useReservationBooking, {
  toUtcInstant,
} from "../../features/reservations/hooks/useReservation";
import type { DriverSlot } from "../../features/reservations/types/reservationTypes";

const MAX_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

// Mirrors the checks the server runs when it books, so a driver sees the reason before submitting.
// The server stays the final authority.
const validatePeriod = (startTime: string, endTime: string): string | null => {
  const start = toUtcInstant(startTime);
  const end = toUtcInstant(endTime);
  if (!start || !end) return "Pick a start and an end for the booking.";

  const startMs = Date.parse(start);
  const endMs = Date.parse(end);

  if (endMs <= startMs) return "The reservation must end after it starts.";
  // The server allows five minutes of slack around a start that has just slipped behind the clock.
  if (startMs < Date.now() - 5 * 60 * 1000) return "The reservation start time is in the past.";
  if (endMs - startMs > MAX_WINDOW_MS) return "A reservation can span at most 7 days.";
  return null;
};

const SlotButton: React.FC<{
  slot: DriverSlot;
  picked: boolean;
  onPick: (slot: DriverSlot) => void;
}> = ({ slot, picked, onPick }) => {
  const blocked = !slot.availableForPeriod;

  return (
    <button
      type="button"
      disabled={blocked}
      onClick={() => onPick(slot)}
      title={
        blocked && slot.busyFrom && slot.busyUntil
          ? `Booked ${new Date(slot.busyFrom).toLocaleTimeString()} – ${new Date(
              slot.busyUntil,
            ).toLocaleTimeString()}`
          : slot.bayLabel
      }
      aria-pressed={picked}
      className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
        picked
          ? "border-blue-600 bg-blue-600 text-white shadow-sm"
          : blocked
            ? "cursor-not-allowed border-slate-200 bg-slate-50 text-slate-300 line-through"
            : "border-slate-300 bg-white text-slate-700 hover:border-blue-400 hover:bg-blue-50"
      }`}
    >
      {slot.slotNumber}
    </button>
  );
};

export const ReservationCreatePage: React.FC = () => {
  const { facilityId = "" } = useParams<{ facilityId: string }>();
  const navigate = useNavigate();
  const booking = useReservationBooking(facilityId);

  const periodError = useMemo(
    () => validatePeriod(booking.startTime, booking.endTime),
    [booking.startTime, booking.endTime],
  );

  const noVehicleTypes = !booking.facilityError && booking.facility && booking.vehicleTypes.length === 0;
  const canSubmit = Boolean(
    booking.facility &&
      booking.vehicleTypeId &&
      !periodError &&
      booking.windowIsValid &&
      !booking.slotNotice &&
      !noVehicleTypes &&
      !booking.isSubmitting,
  );

  const process = async () => {
    const createdReservation = await booking.submit();
    if (!createdReservation) return;
    navigate(ROUTES.DRIVER_RESERVATIONS, {
      state: { justBooked: createdReservation.reservationId },
    });
  };

  if (!facilityId) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <Alert tone="warning" title="No parking property chosen">
          Choose a property from Parking Discovery first, then book a bay from its details.
        </Alert>
        <Button type="button" variant="outline" onClick={() => navigate(ROUTES.PARKING_DISCOVERY)}>
          Go to Parking Discovery
        </Button>
      </div>
    );
  }

  if (booking.facilityError) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <Alert tone="error" title="Cannot start this booking">
          {booking.facilityError}
        </Alert>
        <Link to={ROUTES.PARKING_DISCOVERY} className="inline-flex items-center gap-1 text-sm text-blue-600">
          <ArrowLeft size={14} />
          Back to Parking Discovery
        </Link>
      </div>
    );
  }

  if (!booking.facility) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div>
        <Link
          to={ROUTES.PARKING_DISCOVERY}
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft size={14} />
          Parking Discovery
        </Link>
        <h1 className="mt-2 flex items-center gap-2 text-2xl font-bold text-slate-900">
          <CalendarPlus size={24} className="text-slate-400" />
          Parking Reservation
        </h1>
        <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-500">
          <span className="font-medium text-slate-700">{booking.facility.name}</span>
          <span className="inline-flex items-center gap-1">
            <MapPin size={13} className="text-slate-400" />
            {booking.facility.city}, {booking.facility.district}
          </span>
          {booking.hourlyRate > 0 && <span>{formatMoney(booking.hourlyRate)}/hour</span>}
        </p>
      </div>

      {noVehicleTypes && (
        <Alert tone="warning" title="Nothing to book here yet">
          This property has no priced vehicle types, so the server will not accept a booking for it.
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <Card padding="md">
            <h2 className="text-sm font-semibold text-slate-900">Vehicle type</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {booking.vehicleTypes.map((allocation) => {
                const picked = allocation.vehicleTypeId === booking.vehicleTypeId;
                return (
                  <button
                    key={allocation.vehicleTypeId}
                    type="button"
                    onClick={() => {
                      // A bay is built for one vehicle type, so a pick from the old type is void.
                      booking.setSlotId("");
                      booking.setVehicleTypeId(allocation.vehicleTypeId);
                    }}
                    aria-pressed={picked}
                    className={`rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                      picked
                        ? "border-blue-600 bg-blue-50 text-blue-800"
                        : "border-slate-300 bg-white text-slate-700 hover:border-blue-400"
                    }`}
                  >
                    <span className="block font-medium">{allocation.vehicleTypeName}</span>
                    <span className="block text-xs text-slate-500">
                      {formatMoney(allocation.hourlyRate)}/hr
                    </span>
                  </button>
                );
              })}
            </div>
          </Card>

          <Card padding="md">
            <h2 className="text-sm font-semibold text-slate-900">Reservation time</h2>
            <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Start"
                type="datetime-local"
                required
                value={booking.startTime}
                onChange={(event) => booking.setStartTime(event.target.value)}
              />
              <Input
                label="End"
                type="datetime-local"
                required
                value={booking.endTime}
                onChange={(event) => booking.setEndTime(event.target.value)}
              />
            </div>
            {periodError && (
              <p className="mt-2 text-sm text-red-600">{periodError}</p>
            )}
            <p className="mt-2 flex items-start gap-1.5 text-xs text-slate-500">
              <Clock size={13} className="mt-0.5 shrink-0 text-slate-400" />
              Bays are re-checked for the period you choose, and checked once more when the booking
              is created.
            </p>
          </Card>

          <Card padding="md">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold text-slate-900">Available bays</h2>
              {booking.slotsLoading && <Spinner size="sm" />}
            </div>

            {booking.slotNotice && (
              <Alert tone="warning" className="mt-3">
                {booking.slotNotice}
              </Alert>
            )}
            {booking.slotsError ? (
              <Alert tone="error" className="mt-3">
                {booking.slotsError}
              </Alert>
            ) : !booking.windowIsValid ? (
              <p className="mt-3 text-sm text-slate-500">
                Choose a valid period to see which bays are free.
              </p>
            ) : !booking.slotsLoading && booking.slots.length === 0 ? (
              <p className="mt-3 text-sm text-slate-500">
                This property has no bays of that vehicle type.
              </p>
            ) : (
              <>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => booking.setSlotId("")}
                    aria-pressed={booking.slotId === ""}
                    className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                      booking.slotId === ""
                        ? "border-blue-600 bg-blue-600 text-white shadow-sm"
                        : "border-slate-300 bg-white text-slate-700 hover:border-blue-400 hover:bg-blue-50"
                    }`}
                  >
                    Assign the lowest free bay
                  </button>
                  {booking.slots.map((slot) => (
                    <SlotButton
                      key={slot.slotId}
                      slot={slot}
                      picked={booking.slotId === slot.slotId}
                      onPick={(picked) => booking.setSlotId(picked.slotId)}
                    />
                  ))}
                </div>
                <p className="mt-3 text-xs text-slate-500">
                  {booking.slots.filter((slot) => slot.availableForPeriod).length} of{" "}
                  {booking.slots.length} bays free for this period. Struck-through bays are already
                  booked or off-limits.
                </p>
              </>
            )}
          </Card>
        </div>

        <Card padding="md" className="h-fit lg:sticky lg:top-6">
          <h2 className="text-sm font-semibold text-slate-900">Your reservation</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-slate-500">Parking</dt>
              <dd className="text-right font-medium text-slate-800">{booking.facility.name}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-slate-500">Hourly rate</dt>
              <dd className="text-right text-slate-800">
                {booking.hourlyRate > 0 ? `${formatMoney(booking.hourlyRate)}/hr` : "—"}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-slate-500">Duration</dt>
              <dd className="text-right text-slate-800">
                {booking.hours > 0
                  ? `${booking.hours} hour${booking.hours === 1 ? "" : "s"}`
                  : "—"}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-slate-500">Bay</dt>
              <dd className="text-right text-slate-800">
                {booking.slotId
                  ? booking.slots.find((slot) => slot.slotId === booking.slotId)?.slotNumber ?? "—"
                  : "Auto-assign"}
              </dd>
            </div>
          </dl>

          <div className="mt-4 flex items-end justify-between gap-3 border-t border-slate-100 pt-4">
            <span className="text-sm text-slate-500">Estimated amount</span>
            <span className="text-2xl font-bold text-slate-900">
              {formatMoney(booking.estimatedAmount)}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            The server stamps the final amount, including its own commission split.
          </p>

          {booking.submitError && (
            <Alert tone="error" className="mt-4">
              {booking.submitError}
            </Alert>
          )}

          <Button
            type="button"
            className="mt-4"
            fullWidth
            isLoading={booking.isSubmitting}
            disabled={!canSubmit}
            onClick={process}
          >
            Process Reservation
          </Button>
          <p className="mt-2 text-xs text-slate-500">
            The booking is created as pending payment. It only becomes confirmed once the payment
            module settles it.
          </p>
        </Card>
      </div>
    </div>
  );
};

export default ReservationCreatePage;
