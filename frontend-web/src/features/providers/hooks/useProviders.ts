import { useCallback, useEffect, useState } from "react";
import { providerApi } from "../api/providerApi";
import type {
  ProviderProfile,
  ProviderVerificationStatus,
} from "../types/providerTypes";
import { getApiErrorMessage } from "../utils/providerUtils";

export const useProviders = () => {
  const [pending, setPending] = useState<ProviderProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyUserId, setBusyUserId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const data = await providerApi.getPendingVerifications();
      setPending(data);
    } catch (err) {
      setLoadError(
        getApiErrorMessage(err, "Failed to load pending verifications."),
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const decide = useCallback(
    async (
      userId: string,
      status: Extract<ProviderVerificationStatus, "APPROVED" | "REJECTED">,
      remarks?: string,
    ) => {
      setBusyUserId(userId);
      setActionError(null);
      try {
        await providerApi.updateVerificationStatus(userId, status, remarks);
        await refresh();
        return true;
      } catch (err) {
        setActionError(
          getApiErrorMessage(err, "Failed to update verification status."),
        );
        return false;
      } finally {
        setBusyUserId(null);
      }
    },
    [refresh],
  );

  const getDocumentUrl = useCallback(async (userId: string) => {
    try {
      return await providerApi.getNicDocumentUrlFor(userId);
    } catch (err) {
      setActionError(getApiErrorMessage(err, "Failed to load NIC document."));
      return null;
    }
  }, []);

  return {
    pending,
    isLoading,
    loadError,
    actionError,
    busyUserId,
    refresh,
    decide,
    getDocumentUrl,
  };
};
