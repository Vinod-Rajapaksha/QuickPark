import { useCallback, useEffect, useMemo, useState } from "react";
import { commissionApi } from "../api/commissionApi";
import type {
  SaveVehiclePricingInput,
  SaveVehicleTypeInput,
  VehiclePricingConfig,
  VehicleTypeConfig,
} from "../types/commissionTypes";
import { getApiErrorMessage } from "../utils/commissionUtils";

// Everything the admin screen edits is DB state, so a save here is live for the owner form
// on the next request — no restart, and nothing is re-priced retroactively.
export const useCommission = () => {
  const [vehicleTypes, setVehicleTypes] = useState<VehicleTypeConfig[]>([]);
  const [pricing, setPricing] = useState<VehiclePricingConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const [types, rates] = await Promise.all([
        commissionApi.getVehicleTypes(),
        commissionApi.getPricing(),
      ]);
      setVehicleTypes(types);
      setPricing(rates);
    } catch (err) {
      setLoadError(getApiErrorMessage(err, "Failed to load the parking configuration."));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const run = useCallback(
    async (key: string, fallback: string, action: () => Promise<unknown>) => {
      setBusyKey(key);
      setActionError(null);
      try {
        await action();
        await refresh();
        return true;
      } catch (err) {
        setActionError(getApiErrorMessage(err, fallback));
        return false;
      } finally {
        setBusyKey(null);
      }
    },
    [refresh],
  );

  const savePricing = useCallback(
    (vehicleTypeId: string, input: SaveVehiclePricingInput) =>
      run(`pricing:${vehicleTypeId}`, "Failed to save this pricing.", () =>
        commissionApi.savePricing(vehicleTypeId, input),
      ),
    [run],
  );

  const withdrawPricing = useCallback(
    (vehicleTypeId: string) =>
      run(`pricing:${vehicleTypeId}`, "Failed to withdraw this pricing.", () =>
        commissionApi.deletePricing(vehicleTypeId),
      ),
    [run],
  );

  const saveVehicleType = useCallback(
    (input: SaveVehicleTypeInput, vehicleTypeId?: string) =>
      run(
        vehicleTypeId ? `type:${vehicleTypeId}` : "type:new",
        "Failed to save this vehicle type.",
        () =>
          vehicleTypeId
            ? commissionApi.updateVehicleType(vehicleTypeId, input)
            : commissionApi.createVehicleType(input),
      ),
    [run],
  );

  const pricingByType = useMemo(
    () => Object.fromEntries(pricing.map((row) => [row.vehicleTypeId, row])),
    [pricing],
  );

  return {
    vehicleTypes,
    pricing,
    pricingByType,
    isLoading,
    loadError,
    actionError,
    busyKey,
    refresh,
    savePricing,
    withdrawPricing,
    saveVehicleType,
  };
};
