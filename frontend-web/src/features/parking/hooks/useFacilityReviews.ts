import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import type { ToastType } from "../../../app/contexts/ToastContext";
import { useToast } from "../../../hooks/useToast";
import { parkingApi } from "../api/parkingApi";
import type {
  FacilityQueueRow,
  FacilityReview,
  FacilitySectionName,
  ParkingFacility,
} from "../types/parkingTypes";
import { ParkingStatus } from "../types/parkingTypes";
import {
  QueueGrouping,
  getApiErrorMessage,
  openSections,
} from "../utils/parkingUtils";

type Decision = "APPROVED" | "REJECTED";

export const DEFAULT_QUEUE_STATUS = ParkingStatus.PENDING_APPROVAL;

// Admin-side confirmation of a click only; the owner's record of the decision is their notification.
const decisionCopy = (
  subject: string,
  decision: Decision,
  facility: ParkingFacility,
  remarks?: string,
): { tone: ToastType; title: string; description: string } => {
  if (decision === "REJECTED") {
    return {
      tone: "info",
      title: `${subject} sent back`,
      description: `The owner sees your remark: “${remarks}”. The property stays out of the driver listings until every section is approved.`,
    };
  }
  const open = openSections(facility);
  return {
    tone: "success",
    title: `${subject} approved`,
    description:
      open.length === 0
        ? "Every section is now settled, so the property is live for drivers and the owner has been told."
        : `Still waiting for your decision: ${open.map((section) => section.label).join(", ")}.`,
  };
};

// Filters and arrangement live in the URL so Back, reload and a shared link land on the same queue.
export const useFacilityQueue = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const status = searchParams.get("status") ?? DEFAULT_QUEUE_STATUS;
  const provider = searchParams.get("provider") ?? "";
  const grouping: QueueGrouping =
    searchParams.get("group") === QueueGrouping.PROVIDER
      ? QueueGrouping.PROVIDER
      : QueueGrouping.PROPERTY;

  const [rows, setRows] = useState<FacilityQueueRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const write = useCallback(
    (key: string, value: string) => {
      const next = new URLSearchParams(searchParams);
      if (value === "") next.delete(key);
      else next.set(key, value);
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  const refresh = useCallback(async () => {
    setLoadError(null);
    try {
      const data = await parkingApi.getFacilitiesForReview(
        status || undefined,
        provider || undefined,
      );
      setRows(data);
    } catch (error) {
      setLoadError(
        getApiErrorMessage(error, "Failed to load the review queue."),
      );
    } finally {
      setIsLoading(false);
    }
  }, [status, provider]);

  useEffect(() => {
    Promise.resolve().then(() => {
      void refresh();
    });
  }, [refresh]);

  return {
    rows,
    status,
    provider,
    grouping,
    setStatus: (value: string) => write("status", value),
    setProvider: (value: string) => write("provider", value),
    setGrouping: (value: QueueGrouping) => write("group", value),
    queryString: searchParams.toString(),
    isLoading,
    loadError,
    refresh,
  };
};

// Detail always comes from the server so a decision is never posted against a stale row.
export const useFacilityDetail = (facilityId: string | null) => {
  const { showToast } = useToast();
  const [review, setReview] = useState<FacilityReview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);

  const load = useCallback(async (): Promise<FacilityReview | null> => {
    if (!facilityId) {
      return null;
    }
    setLoadError(null);
    try {
      const fresh = await parkingApi.getFacilityForReview(facilityId);
      setReview(fresh);
      return fresh;
    } catch (error) {
      setReview(null);
      setLoadError(getApiErrorMessage(error, "Failed to load this property."));
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [facilityId]);

  useEffect(() => {
    Promise.resolve().then(() => {
      if (facilityId) {
        void load();
      } else {
        setReview(null);
        setIsLoading(false);
      }
    });
  }, [facilityId, load]);

  // One decision can settle all four sections, so the record is re-read and the fresh verdicts announced.
  const run = useCallback(
    async (
      key: string,
      action: () => Promise<unknown>,
      failure: string,
    ): Promise<{ ok: boolean; facility: ParkingFacility | null }> => {
      if (!facilityId) return { ok: false, facility: null };
      setBusyKey(key);
      try {
        await action();
        const fresh = await load();
        return { ok: true, facility: fresh?.facility ?? null };
      } catch (error) {
        // The queue is long enough to have scrolled an inline banner out of sight.
        showToast(
          `${failure} ${getApiErrorMessage(error, "The platform refused this decision.")}`,
          "error",
        );
        return { ok: false, facility: null };
      } finally {
        setBusyKey(null);
      }
    },
    [facilityId, load, showToast],
  );

  const labelOf = (facility: ParkingFacility, section: FacilitySectionName) =>
    facility.sections.find((row) => row.section === section)?.label ??
    "That section";

  const decideSection = useCallback(
    async (
      section: FacilitySectionName,
      decision: Decision,
      remarks?: string,
    ) => {
      const { ok, facility } = await run(
        `section:${section}`,
        () =>
          parkingApi.reviewFacilitySection(
            facilityId!,
            section,
            decision,
            decision === "REJECTED" ? remarks : undefined,
          ),
        `Could not record the ${decision === "REJECTED" ? "rejection" : "approval"}.`,
      );
      if (!ok || !facility) return false;
      const copy = decisionCopy(
        labelOf(facility, section),
        decision,
        facility,
        remarks,
      );
      showToast(`${copy.title}. ${copy.description}`, copy.tone);
      return true;
    },
    [run, facilityId, showToast],
  );

  return {
    review,
    facility: review?.facility ?? null,
    isLoading,
    loadError,
    busyKey,
    refresh: load,
    decideSection,
  };
};
