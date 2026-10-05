import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, LayoutGrid, RefreshCw } from "lucide-react";
import Button from "../../components/common/Button/Button";
import Input from "../../components/common/Input/Input";
import Select from "../../features/parking/components/FormSelect";
import Spinner from "../../components/common/Spinner/Spinner";
import SlotForm from "../../features/parking-slots/components/SlotForm";
import SlotGrid from "../../features/parking-slots/components/SlotGrid";
import SlotStatusBadge from "../../features/parking-slots/components/SlotStatusBadge";
import { useParkingSlots } from "../../features/parking-slots/hooks/useParkingSlots";
import type {
  ParkingSlotRow,
  SlotBoardFilter,
  SlotStatusInput,
} from "../../features/parking-slots/types/parkingSlotTypes";
import {
  BOARD_STATUS_OPTIONS,
  describeCounts,
} from "../../features/parking-slots/utils/parkingSlotUtils";
import { useParkings } from "../../features/parking/hooks/useParkings";
import { ROUTES } from "../../app/routes/routeConstants";

// The bay board: changes bay state, never bay rows.
const SlotManagementPage: React.FC = () => {
  const { facilityId } = useParams<{ facilityId: string }>();
  const navigate = useNavigate();
  const { facilities, isLoading: isLoadingFacilities } = useParkings();

  const {
    facility,
    counts,
    slots,
    isLoading,
    loadError,
    actionError,
    isSaving,
    details,
    detailsSlotId,
    isLoadingDetails,
    refresh,
    applyFilters,
    resetFilters,
    openSlot,
    closeSlot,
    changeStatus,
  } = useParkingSlots(facilityId);

  const [bayFilter, setBayFilter] = useState<SlotBoardFilter>({});
  const [slotBeingEdited, setSlotBeingEdited] = useState<ParkingSlotRow | null>(null);

  const facilityOptions = facilities.map((item) => ({
    value: item.facilityId,
    label: item.name,
  }));

  // Switching property must not leave a bay of the previous one open in the side panel.
  useEffect(() => {
    closeSlot();
  }, [facilityId, closeSlot]);

  const submitStatus = async (input: SlotStatusInput): Promise<void> => {
    if (!slotBeingEdited) return;
    if (await changeStatus(slotBeingEdited.slotId, input)) setSlotBeingEdited(null);
  };

  if (isLoadingFacilities) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <button
            type="button"
            className="mb-1 flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700"
            onClick={() => navigate(ROUTES.FACILITIES)}
          >
            <ArrowLeft size={15} />
            My properties
          </button>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
            <LayoutGrid size={24} className="text-slate-400" />
            {facility?.name ?? "Bays"}
          </h1>
          <p className="mt-1 text-sm text-slate-500">{describeCounts(counts)}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            leftIcon={<RefreshCw size={15} />}
            isLoading={isLoading}
            onClick={() => {
              void refresh();
              if (detailsSlotId) void openSlot(detailsSlotId);
            }}
          >
            Reload
          </Button>
        </div>
      </div>

      {facilities.length > 1 && (
        <div className="max-w-sm">
          <Select
            label="Show bays of"
            options={facilityOptions}
            value={facilityId ?? ""}
            onChange={(event) => navigate(ROUTES.facilitySlotsPath(event.target.value))}
          />
        </div>
      )}

      {loadError && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {loadError}
        </p>
      )}
      {actionError && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800" role="alert">
          {actionError}
        </p>
      )}

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Select
            label="Vehicle type"
            placeholder="Every type"
            options={counts.byVehicleType.map((group) => ({
              value: group.vehicleTypeId,
              label: `${group.vehicleTypeName} (${group.available}/${group.total} free)`,
            }))}
            value={bayFilter.vehicleTypeId ?? ""}
            onChange={(event) => setBayFilter({ ...bayFilter, vehicleTypeId: event.target.value })}
          />
          <Select
            label="Bay state"
            placeholder="Any state"
            options={BOARD_STATUS_OPTIONS}
            value={bayFilter.status ?? ""}
            onChange={(event) =>
              setBayFilter({ ...bayFilter, status: event.target.value as SlotBoardFilter["status"] })
            }
          />
          <Input
            label="From"
            type="datetime-local"
            value={bayFilter.from ?? ""}
            onChange={(event) => setBayFilter({ ...bayFilter, from: event.target.value })}
          />
          <Input
            label="To"
            type="datetime-local"
            value={bayFilter.to ?? ""}
            onChange={(event) => setBayFilter({ ...bayFilter, to: event.target.value })}
          />
          <div className="flex items-end gap-2">
            <Button type="button" size="sm" onClick={() => applyFilters(bayFilter)}>
              Apply
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => {
                setBayFilter({});
                resetFilters();
              }}
            >
              Clear
            </Button>
          </div>
        </div>
        <p className="mt-2 text-xs text-slate-500">
          A period is optional. Left empty, every bay reads as it is right now.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Spinner size="lg" />
          </div>
        ) : (
          <SlotGrid
            slots={slots}
            selectedSlotId={detailsSlotId}
            onOpen={(slot) => void openSlot(slot.slotId)}
            onChangeStatus={setSlotBeingEdited}
          />
        )}

        <aside className="space-y-4">
          {isLoadingDetails && <Spinner size="md" />}

          {!isLoadingDetails && details && (
            <>
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h2 className="font-semibold text-slate-900">
                      Bay {details.slot.slotNumber}
                    </h2>
                    <p className="text-xs text-slate-500">
                      {details.slot.vehicleTypeName} · {details.slot.bayLabel}
                    </p>
                  </div>
                  <SlotStatusBadge state={details.slot.effectiveStatus} />
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setSlotBeingEdited(details.slot)}
                  >
                    Change state
                  </Button>
                  {details.slot.bookable && (
                    <p className="text-xs text-slate-500">
                      Free for the period you are looking at.
                    </p>
                  )}
                  <Button type="button" size="sm" variant="ghost" onClick={closeSlot}>
                    Close
                  </Button>
                </div>
              </div>
            </>
          )}

          {!isLoadingDetails && !details && (
            <div className="rounded-xl border border-dashed border-slate-200 p-4 text-sm text-slate-500">
              Pick a bay to see its state and the period it is held for.
            </div>
          )}
        </aside>
      </div>

      <SlotForm
        slot={slotBeingEdited}
        open={slotBeingEdited !== null}
        isSaving={isSaving}
        serverError={actionError}
        onClose={() => setSlotBeingEdited(null)}
        onSubmit={submitStatus}
      />
    </div>
  );
};

export default SlotManagementPage;
