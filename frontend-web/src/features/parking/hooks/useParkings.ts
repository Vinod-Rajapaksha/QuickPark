import { useCallback, useEffect, useState } from "react";
import { parkingApi } from "../api/parkingApi";
import type { AllocationInput, ParkingFacility, ParkingInput } from "../types/parkingTypes";
import { getApiErrorMessage } from "../utils/parkingUtils";

export const useParkings = () => {
  const [facilities, setFacilities] = useState<ParkingFacility[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      setFacilities(await parkingApi.getMyFacilities());
    } catch (err) {
      setLoadError(getApiErrorMessage(err, "Failed to load your properties."));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const create = useCallback(
    async (input: ParkingInput) => {
      setIsSaving(true);
      setActionError(null);
      try {
        const created = await parkingApi.createFacility(input);
        setFacilities((current) => [created, ...current]);
        return created;
      } catch (err) {
        setActionError(
          getApiErrorMessage(err, "Failed to register this property."),
        );
        return null;
      } finally {
        setIsSaving(false);
      }
    },
    [],
  );

  const update = useCallback(
    async (facilityId: string, input: ParkingInput) => {
      setIsSaving(true);
      setActionError(null);
      try {
        const updated = await parkingApi.updateFacility(facilityId, input);
        setFacilities((current) =>
          current.map((item) => (item.facilityId === facilityId ? updated : item)),
        );
        return updated;
      } catch (err) {
        setActionError(getApiErrorMessage(err, "Failed to save this property."));
        return null;
      } finally {
        setIsSaving(false);
      }
    },
    [],
  );

  // Repricing re-sends the layout unchanged, so only the price moves.
  const saveRates = useCallback(
    async (facilityId: string, allocations: AllocationInput[]) => {
      setIsSaving(true);
      setActionError(null);
      try {
        const updated = await parkingApi.saveAllocations(facilityId, allocations);
        setFacilities((current) =>
          current.map((item) => (item.facilityId === facilityId ? updated : item)),
        );
        return updated;
      } catch (err) {
        setActionError(getApiErrorMessage(err, "Failed to save your prices."));
        return null;
      } finally {
        setIsSaving(false);
      }
    },
    [],
  );

  return {
    facilities,
    isLoading,
    loadError,
    actionError,
    isSaving,
    refresh,
    create,
    update,
    saveRates,
  };
};
