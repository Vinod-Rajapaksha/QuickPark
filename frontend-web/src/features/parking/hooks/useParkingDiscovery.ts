import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { parkingApi } from "../api/parkingApi";
import type { ParkingFacility, ParkingLocationFilter } from "../types/parkingTypes";
import { getApiErrorMessage } from "../utils/parkingUtils";

// The server orders by name (or distance with a reference point); price order is applied here.
export type DiscoverySort = "name" | "priceAsc" | "priceDesc" | "distance";

const PAGE_SIZE = 6;

// A driver shops from the cheapest type the property offers.
export const lowestHourlyRateOf = (facility: ParkingFacility): number | null =>
  facility.allocations.length === 0
    ? null
    : Math.min(...facility.allocations.map((a) => a.hourlyRate));

export const useParkingDiscovery = (
  filter: ParkingLocationFilter,
  sort: DiscoverySort = "name",
) => {
  // The page rebuilds the filter object every render, so fetches key off its serialized form.
  const filterKey = JSON.stringify(filter);
  const [facilities, setFacilities] = useState<ParkingFacility[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  // Responses carry the sequence they started with; only the newest may land.
  const searchSequence = useRef(0);
  const [refreshNonce, setRefreshNonce] = useState(0);

  useEffect(() => {
    const sequence = ++searchSequence.current;
    parkingApi
      .searchApproved(JSON.parse(filterKey) as ParkingLocationFilter)
      .then(
        (data) => {
          if (sequence !== searchSequence.current) return;
          setPage(1);
          setFacilities(data);
          setLoadError(null);
          setIsLoading(false);
        },
        (err: unknown) => {
          if (sequence !== searchSequence.current) return;
          setLoadError(getApiErrorMessage(err, "Failed to load parking options."));
          setIsLoading(false);
        },
      );
    return () => {
      searchSequence.current += 1;
    };
  }, [filterKey, refreshNonce]);

  const refresh = useCallback(() => setRefreshNonce((nonce) => nonce + 1), []);

  const sorted = useMemo(() => {
    if (sort === "name" || sort === "distance") return facilities;
    const rate = (f: ParkingFacility) => lowestHourlyRateOf(f);
    const copy = [...facilities];
    if (sort === "priceAsc") {
      copy.sort((a, b) => (rate(a) ?? Infinity) - (rate(b) ?? Infinity));
    } else {
      copy.sort((a, b) => (rate(b) ?? -Infinity) - (rate(a) ?? -Infinity));
    }
    return copy;
  }, [facilities, sort]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const pageItems = useMemo(
    () => sorted.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [sorted, safePage],
  );

  return {
    results: sorted,
    pageItems,
    isLoading,
    loadError,
    total: sorted.length,
    page: safePage,
    pageCount,
    setPage,
    refresh,
  };
};
