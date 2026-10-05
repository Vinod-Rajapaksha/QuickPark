import { useEffect, useState } from "react";
import { parkingApi } from "../api/parkingApi";
import type { RegistrationOptions } from "../types/parkingTypes";
import { getApiErrorMessage } from "../utils/parkingUtils";

// Vehicle types with their standard bay and admin pricing, read fresh so an admin change shows without a redeploy.
export const useRegistrationOptions = () => {
  const [options, setOptions] = useState<RegistrationOptions>({
    vehicleTypes: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const data = await parkingApi.getRegistrationOptions();
        if (!cancelled) setOptions(data);
      } catch (err) {
        if (!cancelled) {
          setLoadError(getApiErrorMessage(err, "Failed to load the vehicle types."));
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return { options, isLoading, loadError };
};

export default useRegistrationOptions;
