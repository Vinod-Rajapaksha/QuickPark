import React from "react";
import { ExternalLink, MapPin, Zap } from "lucide-react";
import Button from "../../../components/common/Button/Button";
import Modal from "../../../components/common/Modal/Modal";
import {
  formatCoordinates,
  formatLandArea,
  formatMoney,
  formatOperatingHours,
} from "../utils/parkingUtils";
import type { ParkingFacility } from "../types/parkingTypes";

interface ParkingDetailsModalProps {
  facility: ParkingFacility | null;
  onClose: () => void;
  // Absent on reads that are not a driver shopping for a bay.
  onBookSlot?: (facility: ParkingFacility) => void;
}

export const ParkingDetailsModal: React.FC<ParkingDetailsModalProps> = ({
  facility,
  onClose,
  onBookSlot,
}) => {
  if (!facility) return null;

  const coordinates = formatCoordinates(facility);
  const mapUrl = coordinates
    ? `https://www.openstreetmap.org/?mlat=${facility.latitude}&mlon=${facility.longitude}#map=17/${facility.latitude}/${facility.longitude}`
    : null;

  return (
    <Modal
      isOpen={facility !== null}
      onClose={onClose}
      title={facility.name}
      maxWidth="max-w-2xl"
      footer={
        onBookSlot && (
          <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-slate-500">
              {facility.allocations.length === 0
                ? "This property has no priced vehicle types, so it cannot take a booking yet."
                : "Bays are confirmed against the period you choose on the next step."}
            </p>
            <Button
              type="button"
              size="sm"
              disabled={facility.allocations.length === 0}
              onClick={() => onBookSlot(facility)}
            >
              Book a Slot
            </Button>
          </div>
        )
      }
    >
      <p className="flex items-start gap-1.5 text-sm text-slate-600">
        <MapPin size={15} className="mt-0.5 shrink-0 text-slate-400" />
        {facility.address}, {facility.city}, {facility.district}, {facility.province} Province
      </p>

      <dl className="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-xs uppercase tracking-wide text-slate-400">Operating hours</dt>
          <dd className="mt-1 text-slate-700">{formatOperatingHours(facility)}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-slate-400">Land area</dt>
          <dd className="mt-1 text-slate-700">{formatLandArea(facility.landAreaPerches)}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-slate-400">EV charging</dt>
          <dd className="mt-1 flex items-center gap-1.5 text-slate-700">
            {facility.hasEvCharging ? (
              <span className="flex items-center gap-1 font-medium text-emerald-600">
                <Zap size={14} />
                Available
              </span>
            ) : (
              "Not available"
            )}
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-slate-400">Location</dt>
          <dd className="mt-1 text-slate-700">
            {coordinates ?? "No coordinates set"}
            {mapUrl && (
              <a
                href={mapUrl}
                target="_blank"
                rel="noreferrer"
                className="ml-2 inline-flex items-center gap-1 text-blue-600 hover:underline"
              >
                OpenStreetMap
                <ExternalLink size={12} />
              </a>
            )}
          </dd>
        </div>
      </dl>

      <h3 className="mt-6 text-sm font-semibold text-slate-900">Pricing & bays</h3>
      {facility.allocations.length === 0 ? (
        <p className="mt-2 text-sm text-slate-500">
          This property has no priced vehicle types yet.
        </p>
      ) : (
        <div className="mt-2 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-400">
                <th className="py-2 pr-4 font-medium">Vehicle type</th>
                <th className="py-2 pr-4 font-medium">Bay size</th>
                <th className="py-2 pr-4 font-medium">Rate</th>
                <th className="py-2 font-medium">Free now</th>
              </tr>
            </thead>
            <tbody>
              {facility.allocations.map((allocation) => {
                const group = facility.slotGroups.find(
                  (g) => g.vehicleTypeId === allocation.vehicleTypeId,
                );
                return (
                  <tr key={allocation.vehicleTypeId} className="border-b border-slate-100">
                    <td className="py-2 pr-4 text-slate-700">{allocation.vehicleTypeName}</td>
                    <td className="py-2 pr-4 text-slate-700">
                      {group?.bayLabel ?? "—"}
                    </td>
                    <td className="py-2 pr-4 font-medium text-blue-600">
                      {formatMoney(allocation.hourlyRate)}/hr
                    </td>
                    <td className="py-2 text-slate-700">
                      {group ? `${group.available} of ${group.total}` : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Modal>
  );
};

export default ParkingDetailsModal;
