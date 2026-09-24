import { useCallback, useEffect, useState } from "react";
import { providerApi } from "../api/providerApi";
import type { ProviderProfile } from "../types/providerTypes";
import { getApiErrorMessage } from "../utils/providerUtils";

export const useProvider = () => {
  const [profile, setProfile] = useState<ProviderProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await providerApi.getMyProfile();
      setProfile(data);
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to load your provider profile."));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const uploadNic = useCallback(async (file: File) => {
    setIsUploading(true);
    setError(null);
    try {
      const updated = await providerApi.uploadNicDocument(file);
      setProfile(updated);
      return updated;
    } catch (err) {
      setError(getApiErrorMessage(err, "NIC upload failed."));
      throw err;
    } finally {
      setIsUploading(false);
    }
  }, []);

  const getNicDocumentUrl = useCallback(async () => {
    try {
      return await providerApi.getMyNicDocumentUrl();
    } catch (err) {
      setError(
        getApiErrorMessage(err, "Failed to retrieve your NIC document."),
      );
      return null;
    }
  }, []);

  return { profile, isLoading, isUploading, error, refresh, uploadNic, getNicDocumentUrl };
};
