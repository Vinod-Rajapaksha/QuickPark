import React from "react";
import { Building2, Users } from "lucide-react";
import type { SelectOption } from "../../../components/common/Select/Select";
import { ParkingStatus } from "../types/parkingTypes";
import { QueueGrouping } from "./parkingUtils";

// An empty value means no filter, which the queue hook drops from the URL.
export const STATUS_OPTIONS: SelectOption[] = [
  { value: "", label: "Any status" },
  { value: ParkingStatus.PENDING_APPROVAL, label: "Awaiting review" },
  { value: ParkingStatus.APPROVED, label: "Live" },
  { value: ParkingStatus.REJECTED, label: "Rejected" },
  { value: ParkingStatus.SUSPENDED, label: "Suspended" },
  { value: ParkingStatus.DRAFT, label: "Draft" },
];

export interface GroupOption {
  value: QueueGrouping;
  label: string;
  icon: React.ReactNode;
}

export const GROUP_OPTIONS: GroupOption[] = [
  {
    value: QueueGrouping.PROPERTY,
    label: "By property",
    icon: <Building2 size={16} />,
  },
  {
    value: QueueGrouping.PROVIDER,
    label: "By provider",
    icon: <Users size={16} />,
  },
];
