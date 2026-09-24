import { useCallback, useEffect, useState } from "react";
import { useToast } from "../../../hooks/useToast";
import { providerApi } from "../api/providerApi";
import type {
  ProviderProfile,
  ProviderVerificationStatus,
} from "../types/providerTypes";
import { getApiErrorMessage } from "../utils/providerUtils";

export const useProviders = () => {
  const toast = useToast();
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
        // Announced from the pre-decision snapshot: the refresh below drops the card, and the
        // queue is long enough for the inline banner to sit off-screen.
        const ownerName = pending.find((p) => p.userId === userId)?.fullName;
        const who = ownerName ? ` for ${ownerName}` : "";
        if (status === "REJECTED") {
          toast.warning(
            `NIC verification rejected${who}`,
            remarks ? `Remarks sent to the owner: ${remarks}` : undefined,
          );
        } else {
          toast.success(
            `NIC verification approved${who}`,
            "The owner can now register a parking property.",
          );
        }
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
    [refresh, pending, toast],
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
