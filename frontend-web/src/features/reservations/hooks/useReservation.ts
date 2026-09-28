import { useCallback, useEffect, useMemo, useState } from "react";
import { parkingApi } from "../../parking/api/parkingApi";
import type { ParkingFacility } from "../../parking/types/parkingTypes";
import { getApiErrorMessage } from "../../parking/utils/parkingUtils";
import { reservationApi } from "../api/reservationApi";
import type { DriverSlot, Reservation } from "../types/reservationTypes";
import { bookingHours, defaultStartValue } from "../utils/reservationUtils";

// A datetime-local control yields wall-clock text, and the server reads a time with no offset as
// UTC. Resolving the offset here keeps the instant the driver meant.
export const toUtcInstant = (wallClock: string): string | null => {
  const parsed = new Date(wallClock);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
};

// Answers are stamped with the period they were read for, so a slow reply about bays that have
// since been taken can never stand in for the newest one.
interface SlotResult {
  key: string;
  slots: DriverSlot[];
  error: string | null;
}

// One booking attempt against one property: the property's own priced vehicle types, the bays free
// for the chosen period, and the create call itself.
export const useReservationBooking = (facilityId: string) => {
  const [facility, setFacility] = useState<ParkingFacility | null>(null);
  const [facilityError, setFacilityError] = useState<string | null>(null);

  const [vehicleTypeId, setVehicleTypeId] = useState("");
  const [startTime, setStartTime] = useState(() => defaultStartValue(30));
  const [endTime, setEndTime] = useState(() => defaultStartValue(120));
  const [slotId, setSlotId] = useState("");

  const [slotResult, setSlotResult] = useState<SlotResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!facilityId) return;
    let cancelled = false;

    parkingApi
      .getApprovedFacility(facilityId)
      .then(
        (data) => {
          if (cancelled) return;
          setFacility(data);
          setFacilityError(null);
          // A driver starts from the first type the property sells.
          setVehicleTypeId((current) => current || data.allocations[0]?.vehicleTypeId || "");
        },
        (err: unknown) => {
          if (!cancelled) {
            setFacilityError(getApiErrorMessage(err, "Could not load that property."));
          }
        },
      );

    return () => {
      cancelled = true;
    };
  }, [facilityId]);

  const from = useMemo(() => toUtcInstant(startTime), [startTime]);
  const to = useMemo(() => toUtcInstant(endTime), [endTime]);
  const windowIsValid = Boolean(from && to && Date.parse(to) > Date.parse(from));

  const requestKey =
    facilityId && vehicleTypeId && windowIsValid && from && to
      ? `${facilityId}|${vehicleTypeId}|${from}|${to}`
      : "";

  useEffect(() => {
    if (!requestKey || !from || !to) return;
    let cancelled = false;

    reservationApi.getAvailableSlots(facilityId, vehicleTypeId, from, to).then(
      (data) => {
        if (!cancelled) setSlotResult({ key: requestKey, slots: data, error: null });
      },
      (err: unknown) => {
        if (!cancelled) {
          setSlotResult({
            key: requestKey,
            slots: [],
            error: getApiErrorMessage(err, "Could not check the bays for that period."),
          });
        }
      },
    );

    return () => {
      cancelled = true;
    };
  }, [requestKey, facilityId, vehicleTypeId, from, to]);

  const settled = slotResult && slotResult.key === requestKey ? slotResult : null;
  const slots = settled?.slots ?? [];
  const slotsError = settled?.error ?? null;
  const slotsLoading = requestKey !== "" && settled === null;

  // A bay chosen for an earlier period may have been taken by the time this one is checked. The
  // server decides for real when the booking is made; this only stops the driver being misled.
  const pickedSlot = slots.find((slot) => slot.slotId === slotId) ?? null;
  const slotNotice =
    pickedSlot && !pickedSlot.availableForPeriod
      ? `${pickedSlot.slotNumber} was taken for this period. Choose another bay.`
      : null;

  const allocation = useMemo(
    () => facility?.allocations.find((item) => item.vehicleTypeId === vehicleTypeId) ?? null,
    [facility, vehicleTypeId],
  );

  const hours = bookingHours(startTime, endTime);
  const estimatedAmount = allocation ? allocation.hourlyRate * hours : 0;

  const submit = useCallback(async (): Promise<Reservation | null> => {
    if (!facility || !allocation || !windowIsValid || !from || !to) {
      setSubmitError(null);
      return null;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    try {
      return await reservationApi.create({
        facilityId: facility.facilityId,
        vehicleTypeId: allocation.vehicleTypeId,
        slotId: slotId || null,
        startTime: from,
        endTime: to,
      });
    } catch (err) {
      setSubmitError(getApiErrorMessage(err, "Could not create the reservation."));
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }, [allocation, facility, from, slotId, to, windowIsValid]);

  return {
    facility,
    facilityError,
    vehicleTypes: facility?.allocations ?? [],
    vehicleTypeId,
    setVehicleTypeId,
    startTime,
    endTime,
    setStartTime,
    setEndTime,
    windowIsValid,
    slots,
    slotsLoading,
    slotsError,
    slotNotice,
    slotId,
    setSlotId,
    hourlyRate: allocation?.hourlyRate ?? 0,
    hours,
    estimatedAmount,
    isSubmitting,
    submitError,
    submit,
  };
};

export default useReservationBooking;