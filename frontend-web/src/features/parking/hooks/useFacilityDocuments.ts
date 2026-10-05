import { useCallback, useEffect, useState } from "react";
import { parkingApi } from "../api/parkingApi";
import type {
  FacilityDocumentType,
  ParkingFacilityDocument,
} from "../types/parkingTypes";
import { getApiErrorMessage } from "../utils/parkingUtils";

export const useFacilityDocuments = (facilityId: string) => {
  const [documents, setDocuments] = useState<ParkingFacilityDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const refresh = useCallback(async () => {
    if (!facilityId) return;
    setLoadError(null);
    try {
      const data = await parkingApi.getDocuments(facilityId);
      setDocuments(data);
    } catch (err) {
      setLoadError(getApiErrorMessage(err, "Failed to load property documents."));
    } finally {
      setIsLoading(false);
    }
  }, [facilityId]);

  useEffect(() => {
    Promise.resolve().then(() => {
      if (facilityId) {
        void refresh();
      } else {
        setIsLoading(false);
      }
    });
  }, [facilityId, refresh]);

  const upload = useCallback(
    async (type: FacilityDocumentType, file: File) => {
      setIsUploading(true);
      setActionError(null);
      try {
        const created = await parkingApi.uploadDocument(facilityId, type, file);
        setDocuments((current) => [created, ...current]);
        return true;
      } catch (err) {
        setActionError(
          getApiErrorMessage(err, "Failed to upload this document."),
        );
        return false;
      } finally {
        setIsUploading(false);
      }
    },
    [facilityId],
  );

  const remove = useCallback(async (documentId: string) => {
    setActionError(null);
    try {
      await parkingApi.deleteDocument(documentId);
      setDocuments((current) =>
        current.filter((document) => document.documentId !== documentId),
      );
      return true;
    } catch (err) {
      setActionError(getApiErrorMessage(err, "Failed to delete this document."));
      return false;
    }
  }, []);

  return {
    documents,
    isLoading,
    loadError,
    actionError,
    isUploading,
    refresh,
    upload,
    remove,
  };
};
