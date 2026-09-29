import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { reportApi } from "../api/reportApi";
import { getApiErrorMessage } from "../../parking/utils/parkingUtils";
import type { RevenueOverview } from "../types/reportTypes";
import {
  periodWindow,
  previousWindow,
  ReportPeriod,
  type CustomRange,
  type PeriodWindow,
  type ReportPeriodKey,
} from "../utils/reportUtils";

export const useReports = (facilityId?: string) => {
  const [period, setPeriod] = useState<ReportPeriodKey>(ReportPeriod.THIS_MONTH);
  const [custom, setCustom] = useState<CustomRange>({});
  const [overview, setOverview] = useState<RevenueOverview | null>(null);
  const [previous, setPrevious] = useState<RevenueOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const bounds = useMemo<PeriodWindow>(
    () => periodWindow(period, custom),
    [period, custom],
  );

  const previousBounds = useMemo(() => previousWindow(bounds), [bounds]);

  const requestId = useRef(0);

  const refresh = useCallback(async () => {
    const id = ++requestId.current;
    setLoadError(null);
    setIsLoading(true);
    const byProperty = !facilityId;

    try {
      const [current, comparison] = await Promise.all([
        reportApi.getProviderRevenue({
          from: bounds.from,
          to: bounds.to,
          byProperty,
          facilityId,
        }),
        previousBounds
          ? reportApi.getProviderRevenue({
              from: previousBounds.from,
              to: previousBounds.to,
              byProperty,
              facilityId,
            })
          : Promise.resolve(null),
      ]);

      if (id !== requestId.current) return;
      setOverview(current);
      setPrevious(comparison);
    } catch (err) {
      if (id !== requestId.current) return;
      setLoadError(
        getApiErrorMessage(err, "Your revenue for this period could not be read."),
      );
    } finally {
      if (id === requestId.current) setIsLoading(false);
    }
  }, [bounds, previousBounds, facilityId]);

  useEffect(() => {
    Promise.resolve().then(() => {
      void refresh();
    });
  }, [refresh]);

  const changePeriod = useCallback((next: string): void => {
    setPeriod((next as ReportPeriodKey) || ReportPeriod.THIS_MONTH);
  }, []);

  const changeCustom = useCallback((next: CustomRange): void => {
    setCustom(next);
    setPeriod(ReportPeriod.CUSTOM);
  }, []);

  const reset = useCallback((): void => {
    setPeriod(ReportPeriod.THIS_MONTH);
    setCustom({});
  }, []);

  return {
    period,
    custom,
    bounds,
    previousBounds,
    overview,
    previous,
    isLoading,
    loadError,
    refresh,
    changePeriod,
    changeCustom,
    reset,
  };
};
