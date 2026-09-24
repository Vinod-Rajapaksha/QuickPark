import React from "react";
import { BadgeDollarSign, Layers, RefreshCw } from "lucide-react";
import Button from "../../components/common/Button/Button";
import Spinner from "../../components/common/Spinner/Spinner";
import CommissionCard from "../../features/commission/components/CommissionCard";
import CommissionTable from "../../features/commission/components/CommissionTable";
import VehicleBayTable from "../../features/commission/components/VehicleBayTable";
import { useCommission } from "../../features/commission/hooks/useCommission";

export const CommissionPage: React.FC = () => {
  const {
    vehicleTypes,
    pricingByType,
    isLoading,
    loadError,
    actionError,
    busyKey,
    refresh,
    savePricing,
    withdrawPricing,
    saveVehicleType,
  } = useCommission();

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
            <BadgeDollarSign size={24} className="text-slate-400" />
            Vehicle pricing &amp; bays
          </h1>
          <p className="mt-1 max-w-2xl text-slate-500">
            What a provider may charge, what the platform keeps, and the one bay size every
            provider must build each vehicle type to. Everything here is read straight from
            the database, so a save reaches the owner form on their next request — no
            redeploy.
          </p>
        </div>
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
      </div>

      <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        Saving a rule re-adjusts every property that stores it, straight away. A price outside
        your new window is moved to the nearest bound, the commission and the standard bay are
        re-stamped, and each owner is notified of exactly what changed so they can set it
        differently if they wish. Bookings already made keep the price and commission they were
        booked at.
      </p>

      {actionError && (
        <p
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          role="alert"
        >
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
      ) : (
        <div className="space-y-6">
          <CommissionCard
            title="Price window and commission per vehicle type"
            icon={<BadgeDollarSign size={18} />}
            description="Providers enter a price and see your window next to the field. The commission is stamped onto their allocation and onto every booking — they cannot set or change it."
          >
            <CommissionTable
              vehicleTypes={vehicleTypes}
              pricingByType={pricingByType}
              busyKey={busyKey}
              onSave={savePricing}
              onWithdraw={withdrawPricing}
            />
          </CommissionCard>

          <CommissionCard
            title="Vehicle types and their standard bay"
            icon={<Layers size={18} />}
            description="Every vehicle type is built to the one bay you type here — the owner never chooses a size, and every slot generated for that type is cut to it. Leave both sides empty to keep the type out of the owner's allocation form."
          >
            <VehicleBayTable
              vehicleTypes={vehicleTypes}
              busyKey={busyKey}
              onSave={saveVehicleType}
            />
          </CommissionCard>
        </div>
      )}
    </div>
  );
};

export default CommissionPage;
