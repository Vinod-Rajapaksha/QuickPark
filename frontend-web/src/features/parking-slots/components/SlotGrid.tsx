import React, { useMemo } from "react";
import SlotCard from "./SlotCard";
import type { ParkingSlotRow } from "../types/parkingSlotTypes";

interface SlotGridProps {
  slots: ParkingSlotRow[];
  selectedSlotId?: string | null;
  onOpen: (slot: ParkingSlotRow) => void;
  onChangeStatus: (slot: ParkingSlotRow) => void;
}

export const SlotGrid: React.FC<SlotGridProps> = ({
  slots,
  selectedSlotId,
  onOpen,
  onChangeStatus,
}) => {
  const groups = useMemo(() => {
    const byType = new Map<string, { label: string; slots: ParkingSlotRow[] }>();
    for (const slot of slots) {
      const group = byType.get(slot.vehicleTypeId) ?? {
        label: `${slot.vehicleTypeName} · ${slot.bayLabel}`,
        slots: [],
      };
      group.slots.push(slot);
      byType.set(slot.vehicleTypeId, group);
    }
    return [...byType.values()].map((group) => ({
      ...group,
      slots: [...group.slots].sort((a, b) => a.slotNumber.localeCompare(b.slotNumber)),
    }));
  }, [slots]);

  if (groups.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
        No bay matches these filters. Clear them, or add bays to this property from its layout.
      </p>
    );
  }

  return (
    <div className="space-y-8">
      {groups.map((group) => (
        <section key={group.label}>
          <div className="mb-3 flex items-baseline justify-between gap-3">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-600">
              {group.label}
            </h3>
            <p className="text-xs text-slate-400">
              {group.slots.filter((slot) => slot.bookable).length} of {group.slots.length} free
            </p>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {group.slots.map((slot) => (
              <SlotCard
                key={slot.slotId}
                slot={slot}
                selected={selectedSlotId === slot.slotId}
                onOpen={onOpen}
                onChangeStatus={onChangeStatus}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
};

export default SlotGrid;
