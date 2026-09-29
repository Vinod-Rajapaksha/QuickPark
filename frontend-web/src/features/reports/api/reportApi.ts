import { axiosClient } from "../../../services/api/axiosClient";
import { normaliseOverview } from "../utils/reportUtils";
import type { RevenueOverview, RevenueOverviewPayload, RevenueQuery } from "../types/reportTypes";

const BASE = "/reports";

export const reportApi = {
  getProviderRevenue: async (query: RevenueQuery = {}): Promise<RevenueOverview> => {
    const params: Record<string, string | boolean> = {};
    if (query.from) params.from = query.from;
    if (query.to) params.to = query.to;
    if (query.byProperty) params.byProperty = true;
    if (query.facilityId) params.facilityId = query.facilityId;

    const response = await axiosClient.get<RevenueOverviewPayload>(`${BASE}/provider`, { params });
    return normaliseOverview(response.data);
  },
};
