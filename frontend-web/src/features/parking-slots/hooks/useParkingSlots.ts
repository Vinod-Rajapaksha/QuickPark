import { useCallback, useEffect, useMemo, useState } from "react";
import { parkingSlotApi } from "../api/parkingSlotApi";
import type {
  ParkingSlotDetails,
  ParkingSlotRow,
  SlotBoard,
  SlotBoardCounts,
  SlotBoardFilter,
  SlotStatusInput,
} from "../types/parkingSlotTypes";
import { getApiErrorMessage } from "../../parking/utils/parkingUtils";
import { toApiInstant } from "../utils/parkingSlotUtils";

const EMPTY_COUNTS: SlotBoardCounts = {
  total: 0,
  available: 0,
  reserved: 0,
  occupied: 0,
  maintenance: 0,
  disabled: 0,
  byVehicleType: [],
};

// Draft filters are held apart from the sent ones so a dropdown change does not fire a request.
export const useParkingSlots = (facilityId: string | undefined) => {
  const [board, setBoard] = useState<SlotBoard | null>(null);
  const [draft, setDraft] = useState<SlotBoardFilter>({});
  const [sent, setSent] = useState<SlotBoardFilter>({});
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [details, setDetails] = useState<ParkingSlotDetails | null>(null);
  const [detailsSlotId, setDetailsSlotId] = useState<string | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  const params = useMemo<SlotBoardFilter>(
    () => ({
      vehicleTypeId: sent.vehicleTypeId || undefined,
      status: sent.status || undefined,
      from: sent.from ? toApiInstant(sent.from) : undefined,
      to: sent.to ? toApiInstant(sent.to) : undefined,
    }),
    [sent],
  );

  const refresh = useCallback(async () => {
    if (!facilityId) {
      setBoard(null);
      return;
    }
    setIsLoading(true);
    setLoadError(null);
    try {
      setBoard(await parkingSlotApi.getBoard(facilityId, params));
    } catch (err) {
      setLoadError(getApiErrorMessage(err, "Failed to load your bays."));
    } finally {
      setIsLoading(false);
    }
  }, [facilityId, params]);

  useEffect(() => {
    Promise.resolve().then(() => {
      if (!facilityId) {
        setBoard(null);
        setIsLoading(false);
        return;
      }
      void refresh();
    });
  }, [facilityId, refresh]);

  const applyFilters = useCallback((next: SlotBoardFilter) => {
    setDraft(next);
    setSent(next);
  }, []);

  const resetFilters = useCallback(() => {
    setDraft({});
    setSent({});
  }, []);

  // One bay opened from the board, with what holds it and what waits for it.
  const openSlot = useCallback(async (slotId: string) => {
    setDetailsSlotId(slotId);
    setIsLoadingDetails(true);
    setDetails(null);
    setActionError(null);
    try {
      setDetails(await parkingSlotApi.getSlot(slotId));
    } catch (err) {
      setActionError(getApiErrorMessage(err, "Failed to open this bay."));
      setDetailsSlotId(null);
    } finally {
      setIsLoadingDetails(false);
    }
  }, []);

  const closeSlot = useCallback(() => {
    setDetailsSlotId(null);
    setDetails(null);
  }, []);

  // Maintenance, retire or restore; the server's refusal names the bays in the way.
  const changeStatus = useCallback(
    async (slotId: string, input: SlotStatusInput): Promise<boolean> => {
      setIsSaving(true);
      setActionError(null);
      try {
        const updated: ParkingSlotRow = await parkingSlotApi.updateSlotStatus(slotId, input);
        setBoard((current) =>
          current
            ? {
                ...current,
                slots: current.slots.map((slot) =>
                  slot.slotId === updated.slotId ? updated : slot,
                ),
              }
            : current,
        );
        if (detailsSlotId === slotId) await openSlot(slotId);
        return true;
      } catch (err) {
        setActionError(getApiErrorMessage(err, "Failed to change this bay's state."));
        return false;
      } finally {
        setIsSaving(false);
        void refresh();
      }
    },
    [detailsSlotId, openSlot, refresh],
  );

  return {
    facility: board?.facility ?? null,
    counts: board?.counts ?? EMPTY_COUNTS,
    slots: board?.slots ?? [],
    draft,
    isLoading,
    isLoadingDetails,
    loadError,
    actionError,
    isSaving,
    details,
    detailsSlotId,
    refresh,
    applyFilters,
    resetFilters,
    openSlot,
    closeSlot,
    changeStatus,
    setActionError,
  };
};

export type ParkingSlotBoardState = ReturnType<typeof useParkingSlots>;
