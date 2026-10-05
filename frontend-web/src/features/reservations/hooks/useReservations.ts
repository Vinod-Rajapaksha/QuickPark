import { useCallback, useEffect, useRef, useState } from "react";
import { reservationApi, type DriverReservationFilter } from "../api/reservationApi";
import { getApiErrorMessage } from "../../parking/utils/parkingUtils";
import type { Reservation } from "../types/reservationTypes";

// The driver's own bookings. Cancellation lives here so a card never edits the list by hand.
export const useReservations = (filter: DriverReservationFilter = {}) => {
  // The page rebuilds the filter object every render, so loads key off its serialized form.
  const filterKey = JSON.stringify(filter);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [refreshNonce, setRefreshNonce] = useState(0);

  // Responses carry the sequence they started with; only the newest may land.
  const loadSequence = useRef(0);

  useEffect(() => {
    const sequence = ++loadSequence.current;

    reservationApi
      .getMyReservations(JSON.parse(filterKey) as DriverReservationFilter)
      .then(
        (data) => {
          if (sequence !== loadSequence.current) return;
          setReservations(data);
          setLoadError(null);
          setIsLoading(false);
        },
        (err: unknown) => {
          if (sequence !== loadSequence.current) return;
          setLoadError(getApiErrorMessage(err, "Could not load your reservations."));
          setIsLoading(false);
        },
      );

    return () => {
      loadSequence.current += 1;
    };
  }, [filterKey, refreshNonce]);

  const refresh = useCallback(() => setRefreshNonce((nonce) => nonce + 1), []);

  // Cancelling frees the bay server-side; a booking that has already started is refused there.
  const cancel = useCallback(
    async (reservationId: string, reason?: string) => {
      setIsCancelling(true);
      setActionError(null);
      try {
        await reservationApi.cancel(reservationId, reason);
        refresh();
        return true;
      } catch (err) {
        setActionError(getApiErrorMessage(err, "Could not cancel that reservation."));
        return false;
      } finally {
        setIsCancelling(false);
      }
    },
    [refresh],
  );

  const dismissActionError = useCallback(() => setActionError(null), []);

  return {
    reservations,
    isLoading,
    loadError,
    actionError,
    isCancelling,
    refresh,
    cancel,
    dismissActionError,
  };
};

export default useReservations;