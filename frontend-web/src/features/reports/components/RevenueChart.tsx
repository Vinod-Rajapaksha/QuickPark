import React from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatMoney } from "../../parking/utils/parkingUtils";
import type { TrendPoint } from "../utils/reportUtils";

export interface RevenueChartProps {
  points: TrendPoint[];
}

const compact = (value: number): string =>
  value >= 1000
    ? `${(value / 1000).toLocaleString("en-LK", { maximumFractionDigits: 1 })}K`
    : value.toLocaleString("en-LK", { maximumFractionDigits: 0 });

const RevenueChart: React.FC<RevenueChartProps> = ({ points }) => (
  <div className="h-64 w-full">
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={points} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id="revenue-amount" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="revenue-provider" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
            <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#64748b" }} tickLine={false} />
        <YAxis
          tick={{ fontSize: 12, fill: "#64748b" }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => compact(Number(value))}
          width={56}
        />
        <Tooltip formatter={(value) => formatMoney(Number(value))} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Area
          type="monotone"
          dataKey="amount"
          name="Collected"
          stroke="#3b82f6"
          fill="url(#revenue-amount)"
          strokeWidth={2}
        />
        <Area
          type="monotone"
          dataKey="providerAmount"
          name="Your share"
          stroke="#10b981"
          fill="url(#revenue-provider)"
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  </div>
);

export default RevenueChart;
