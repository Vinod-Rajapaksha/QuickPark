import React from "react";
import { TrendingUp } from "lucide-react";
import RevenueChart from "../components/RevenueChart";
import { trendPoints } from "../utils/reportUtils";
import type { RevenueBucket } from "../types/reportTypes";

export interface RevenueTrendProps {
  trend: RevenueBucket[];
}

const RevenueTrend: React.FC<RevenueTrendProps> = ({ trend }) => {
  if (trend.length === 0) return null;

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4">
      <h2 className="flex items-center gap-2 font-semibold text-slate-900">
        <TrendingUp size={18} className="text-slate-400" />
        Revenue trend
      </h2>
      <p className="mt-1 text-sm text-slate-500">
        One point per day inside a short period, per month across a long one.
      </p>
      <div className="mt-4">
        <RevenueChart points={trendPoints(trend)} />
      </div>
    </section>
  );
};

export default RevenueTrend;
