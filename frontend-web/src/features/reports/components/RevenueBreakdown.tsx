import React from "react";
import { formatMoney, formatPercent } from "../../parking/utils/parkingUtils";
import { Table, type Column } from "../../../components/tables";
import type { RevenueBreakdownRow } from "../utils/reportUtils";

export interface RevenueBreakdownProps {
  rows: RevenueBreakdownRow[];
  nameHeader: string;
  emptyMessage: string;
  total: number;
  withBookedHours?: boolean;
}

const RevenueBreakdown: React.FC<RevenueBreakdownProps> = ({
  rows,
  nameHeader,
  emptyMessage,
  total,
  withBookedHours = false,
}) => {
  const columns: Column<RevenueBreakdownRow>[] = [
    { key: "name", header: nameHeader, render: (row) => (
      <span className="font-medium text-slate-900">{row.name}</span>
    ) },
    { key: "amount", header: "Collected", render: (row) => formatMoney(row.amount) },
    { key: "provider", header: "Your share", render: (row) => formatMoney(row.providerAmount) },
    { key: "commission", header: "Platform fee", render: (row) => formatMoney(row.commission) },
    { key: "payments", header: "Bookings", render: (row) => String(row.payments) },
  ];

  if (withBookedHours) {
    columns.push({
      key: "hours",
      header: "Bay hours",
      render: (row) => String(row.bookedHours ?? 0),
    });
  }

  if (total > 0) {
    columns.push({
      key: "share",
      header: "Share",
      render: (row) => formatPercent((row.amount / total) * 100),
    });
  }

  return (
    <Table
      columns={columns}
      data={rows}
      emptyMessage={emptyMessage}
      keyExtractor={(row) => row.id}
    />
  );
};

export default RevenueBreakdown;
