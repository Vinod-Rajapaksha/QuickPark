import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import type { AlertTone } from "../../../components/feedback/Alert";
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
): { tone: AlertTone; title: string; description: string } => {
  if (decision === "REJECTED") {
    return {
      tone: "warning",
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
      // Replace: typing in the owner box must not leave a history entry per keystroke.
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      setRows(
        await parkingApi.getFacilitiesForReview(
          status || undefined,
          provider || undefined,
        ),
      );
    } catch (error) {
      setLoadError(getApiErrorMessage(error, "Failed to load the review queue."));
    } finally {
      setIsLoading(false);
    }
  }, [status, provider]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    rows,
    status,
    provider,
    grouping,
    setStatus: (value: string) => write("status", value),
    setProvider: (value: string) => write("provider", value),
    setGrouping: (value: QueueGrouping) => write("group", value),
    // Carries the filters into a record's own page, so coming back restores this queue.
    queryString: searchParams.toString(),
    isLoading,
    loadError,
    refresh,
  };
};

// Detail always comes from the server so a decision is never posted against a stale row.
export const useFacilityDetail = (facilityId: string | null) => {
  const toast = useToast();
  const [review, setReview] = useState<FacilityReview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);

  const load = useCallback(async (): Promise<FacilityReview | null> => {
    if (!facilityId) {
      setReview(null);
      setIsLoading(false);
      return null;
    }
    setIsLoading(true);
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
    void load();
  }, [load]);

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
        toast.error(failure, getApiErrorMessage(error, "The platform refused this decision."));
        return { ok: false, facility: null };
      } finally {
        setBusyKey(null);
      }
    },
    [facilityId, load, toast],
  );

  const labelOf = (facility: ParkingFacility, section: FacilitySectionName) =>
    facility.sections.find((row) => row.section === section)?.label ?? "That section";

  const decideSection = useCallback(
    async (section: FacilitySectionName, decision: Decision, remarks?: string) => {
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
      toast.show(copy.tone, copy.title, copy.description);
      return true;
    },
    [run, facilityId, toast],
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
