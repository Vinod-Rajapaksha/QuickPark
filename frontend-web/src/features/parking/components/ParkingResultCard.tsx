import React from "react";
import { Car, Clock, MapPin, Navigation, Zap } from "lucide-react";
import Button from "../../../components/common/Button/Button";
import Card from "../../../components/common/Card/Card";
import {
  formatMoney,
  formatOperatingHours,
} from "../utils/parkingUtils";
import { lowestHourlyRateOf } from "../hooks/useParkingDiscovery";
import type { ParkingFacility } from "../types/parkingTypes";

interface ParkingResultCardProps {
  facility: ParkingFacility;
  onViewDetails: (facility: ParkingFacility) => void;
}

export const ParkingResultCard: React.FC<ParkingResultCardProps> = ({
  facility,
  onViewDetails,
}) => {
  const lowestRate = lowestHourlyRateOf(facility);
  const typeNames = facility.slotGroups.map((group) => group.vehicleTypeCode);

  return (
    <Card className="border-slate-200" padding="md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate font-semibold text-slate-900">{facility.name}</h3>
          <p className="mt-0.5 truncate text-sm text-slate-500">{facility.address}</p>
        </div>
        {lowestRate !== null && (
          <div className="shrink-0 text-right">
            <p className="text-sm font-bold text-blue-600">{formatMoney(lowestRate)}</p>
            <p className="text-xs text-slate-400">per hour</p>
          </div>
        )}
      </div>

      <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-700">
        <span className="flex items-center gap-1.5">
          <MapPin size={15} className="shrink-0 text-slate-400" />
          {facility.city}, {facility.district}
        </span>
        {facility.distanceKm !== null && (
          <span className="flex items-center gap-1.5">
            <Navigation size={14} className="shrink-0 text-slate-400" />
            {facility.distanceKm} km away
          </span>
        )}
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-slate-700">
        <span className="flex items-center gap-1.5">
          <Car size={15} className="text-slate-400" />
          {facility.slotCount} slot{facility.slotCount === 1 ? "" : "s"}
        </span>
        <span className="flex items-center gap-1.5">
          <Clock size={14} className="text-slate-400" />
          {formatOperatingHours(facility)}
        </span>
        {facility.hasEvCharging && (
          <span className="flex items-center gap-1 font-medium text-emerald-600">
            <Zap size={14} />
            EV charging
          </span>
        )}
      </div>

      {typeNames.length > 0 && (
        <p className="mt-2 text-xs text-slate-500">Vehicle types: {typeNames.join(", ")}</p>
      )}

      <div className="mt-4">
        <Button type="button" variant="outline" size="sm" onClick={() => onViewDetails(facility)}>
          View details
        </Button>
      </div>
    </Card>
  );
};

export default ParkingResultCard;
