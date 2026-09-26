import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, RefreshCw, Building2 } from "lucide-react";
import Button from "../../components/common/Button/Button";
import ConfirmDialog from "../../components/common/ConfirmDialog/ConfirmDialog";
import Spinner from "../../components/common/Spinner/Spinner";
import NotificationBell from "../../components/feedback/NotificationBell";
import ParkingCard from "../../features/parking/components/ParkingCard";
import { useParkings } from "../../features/parking/hooks/useParkings";
import { useRegistrationOptions } from "../../features/parking/hooks/useRegistrationOptions";
import type { ParkingFacility } from "../../features/parking/types/parkingTypes";
import { ROUTES } from "../../app/routes/routeConstants";

export const ParkingListPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    facilities,
    isLoading,
    loadError,
    actionError,
    isSaving,
    refresh,
    update,
    remove,
    saveRates,
  } = useParkings();
  const [pendingDelete, setPendingDelete] = useState<ParkingFacility | null>(null);
  const { options } = useRegistrationOptions();

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
            <Building2 size={24} className="text-slate-400" />
            My Parking Properties
          </h1>
          <p className="mt-1 text-slate-500">
            Register your parking properties and track their approval status.
            Only approved properties are visible to drivers.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <NotificationBell />
          <Button
            type="button"
            variant="outline"
            size="sm"
            leftIcon={<RefreshCw size={16} />}
            isLoading={isLoading}
            onClick={() => void refresh()}
          >
            Refresh
          </Button>
          <Button
            size="sm"
            leftIcon={<Plus size={16} />}
            onClick={() => navigate(ROUTES.FACILITY_CREATE)}
          >
            Register property
          </Button>
        </div>
      </div>

      {actionError && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {actionError}
        </p>
      )}

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      ) : loadError ? (
        <div className="py-16 text-center">
          <p className="text-slate-600">{loadError}</p>
          <Button className="mt-4" variant="outline" onClick={() => void refresh()}>
            Try again
          </Button>
        </div>
      ) : facilities.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center">
          <p className="font-medium text-slate-700">No properties yet</p>
          <p className="mt-1 text-sm text-slate-500">
            Register your first parking property to start receiving bookings.
          </p>
          <Button
            className="mt-4"
            size="sm"
            leftIcon={<Plus size={16} />}
            onClick={() => navigate(ROUTES.FACILITY_CREATE)}
          >
            Register property
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {facilities.map((facility) => (
            <ParkingCard
              key={facility.facilityId}
              facility={facility}
              vehicleTypes={options.vehicleTypes}
              onOpenSetup={(target) =>
                navigate(ROUTES.facilitySetupPath(target.facilityId))
              }
              onOpenSlots={(target) =>
                navigate(ROUTES.facilitySlotsPath(target.facilityId))
              }
              onSaveHours={async (input) =>
                (await update(facility.facilityId, input)) !== null
              }
              onSaveRates={async (allocations) =>
                (await saveRates(facility.facilityId, allocations)) !== null
              }
              onDelete={setPendingDelete}
            />
          ))}
        </div>
      )}

      <ConfirmDialog
        isOpen={pendingDelete !== null}
        type="danger"
        title={`Delete “${pendingDelete?.name ?? "this property"}”?`}
        description="Its bays, allocated vehicle types and uploaded documents are removed for good, and the property disappears from your list."
        confirmText="Delete property"
        cancelText="Keep it"
        isLoading={isSaving}
        onClose={() => setPendingDelete(null)}
        onConfirm={() => {
          const target = pendingDelete;
          setPendingDelete(null);
          if (target) void remove(target.facilityId);
        }}
      />
    </div>
  );
};

export default ParkingListPage;
