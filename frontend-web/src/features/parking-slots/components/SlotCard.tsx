import React from "react";
import { SquarePen, Users } from "lucide-react";
import Button from "../../../components/common/Button/Button";
import Card from "../../../components/common/Card/Card";
import SlotStatusBadge from "./SlotStatusBadge";
import type { ParkingSlotRow } from "../types/parkingSlotTypes";
import {
  formatInstant,
  formatMoney,
  SLOT_STATE_HINT,
} from "../utils/parkingSlotUtils";

interface SlotCardProps {
  slot: ParkingSlotRow;
  selected?: boolean;
  onOpen: (slot: ParkingSlotRow) => void;
  onChangeStatus: (slot: ParkingSlotRow) => void;
}

const timeFor = (value: string | null): string =>
  value ? formatInstant(value) : "—";

export const SlotCard: React.FC<SlotCardProps> = ({
  slot,
  selected = false,
  onOpen,
  onChangeStatus,
}) => (
  <Card
    padding="sm"
    className={`border transition-shadow ${
      selected ? "border-primary-400 ring-2 ring-primary-100" : "border-slate-200"
    } ${slot.status === "DISABLED" ? "opacity-70" : ""}`}
  >
    <div className="flex items-start justify-between gap-2">
      <div className="min-w-0">
        <p className="truncate font-semibold text-slate-900">{slot.slotNumber}</p>
        <p className="mt-0.5 truncate text-xs text-slate-500">
          {slot.vehicleTypeName} · {slot.bayLabel}
        </p>
      </div>
      <SlotStatusBadge state={slot.effectiveStatus} title={SLOT_STATE_HINT[slot.effectiveStatus]} />
    </div>

    <p className="mt-3 text-sm text-slate-700">{formatMoney(slot.hourlyRate)} / hour</p>

    <div className="mt-2 space-y-1 text-xs text-slate-500">
      {slot.current ? (
        <p className="flex items-center gap-1.5 text-slate-700">
          <Users size={13} className="shrink-0 text-slate-400" />
          <span className="truncate">{slot.current.driverName}</span>
        </p>
      ) : null}
      <p>
        {slot.busyFrom || slot.busyUntil
          ? `${timeFor(slot.busyFrom)} → ${timeFor(slot.busyUntil)}`
          : "Free for the period you are looking at."}
      </p>
    </div>

    <div className="mt-4 flex flex-wrap gap-2">
      <Button type="button" size="sm" variant="outline" onClick={() => onOpen(slot)}>
        Details
      </Button>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        leftIcon={<SquarePen size={14} />}
        onClick={() => onChangeStatus(slot)}
      >
        Change state
      </Button>
    </div>
  </Card>
);

export default SlotCard;
