import React, { useState } from "react";
import { CheckCircle2, MapPin, Save, Trash2, Info } from "lucide-react";
import Button from "../../../components/common/Button/Button";
import type { CoordinateInput, ParkingFacility } from "../types/parkingTypes";
import { formatCoordinates, roundCoordinate } from "../utils/parkingUtils";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import iconUrl from "leaflet/dist/images/marker-icon.png";
import iconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

const parkingIcon = L.icon({
  iconUrl,
  iconRetinaUrl,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const SRI_LANKA_CENTER: [number, number] = [7.8731, 80.7718];

interface LocationPickerProps {
  position: [number, number] | null;
  onPositionChange: (pos: [number, number]) => void;
  disabled: boolean;
}

const LocationPicker: React.FC<LocationPickerProps> = ({
  position,
  onPositionChange,
  disabled,
}) => {
  useMapEvents({
    click(e) {
      if (!disabled) {
        onPositionChange([e.latlng.lat, e.latlng.lng]);
      }
    },
  });

  return position ? <Marker position={position} icon={parkingIcon} /> : null;
};

interface PropertyLocationTabProps {
  facility: ParkingFacility;
  disabled?: boolean;
  isSaving?: boolean;
  serverError?: string | null;
  onSave: (coordinates: CoordinateInput) => void | Promise<unknown>;
}

export const PropertyLocationTab: React.FC<PropertyLocationTabProps> = ({
  facility,
  disabled = false,
  isSaving = false,
  serverError = null,
  onSave,
}) => {
  const [position, setPosition] = useState<[number, number] | null>(() => {
    if (facility.latitude !== null && facility.longitude !== null) {
      return [facility.latitude, facility.longitude];
    }
    return null;
  });
  const [error, setError] = useState<string | null>(null);

  const saved = formatCoordinates(facility);

  const save = () => {
    if (!position) {
      setError("Please select a location on the map.");
      return;
    }
    setError(null);

    void onSave({
      latitude: roundCoordinate(position[0]),
      longitude: roundCoordinate(position[1]),
    });
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
          <MapPin size={20} className="text-slate-400" />
          Property location
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Enter the coordinates of the property entrance in decimal degrees.
          Drivers search by distance from this point, so it has to be where the
          car actually parks.
        </p>
      </div>

      <div className="h-[400px] w-full rounded-xl overflow-hidden border border-slate-200 shadow-inner relative z-0">
        <MapContainer
          center={position || SRI_LANKA_CENTER}
          zoom={position ? 15 : 7}
          scrollWheelZoom
          className="h-full w-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <LocationPicker
            position={position}
            onPositionChange={(pos) => {
              setPosition(pos);
              setError(null);
            }}
            disabled={disabled || isSaving}
          />
        </MapContainer>
      </div>

      <div className="flex items-start gap-2 text-sm text-slate-500">
        <Info size={16} className="mt-0.5 shrink-0 text-slate-400" />
        <p>
          Click anywhere on the map to place or move the marker to the property
          entrance.
        </p>
      </div>

      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      {saved ? (
        <p className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <CheckCircle2 size={16} className="shrink-0" />
          Saved location: {saved}
        </p>
      ) : (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          No location saved yet. An admin will not approve this property until
          both numbers are entered.
        </p>
      )}

      {serverError && (
        <p className="text-sm text-red-600" role="alert">
          {serverError}
        </p>
      )}

      {!disabled && (
        <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-5">
          {saved && (
            <Button
              type="button"
              variant="ghost"
              leftIcon={<Trash2 size={16} />}
              disabled={isSaving}
              onClick={() => {
                setPosition(null);
                setError(null);
                void onSave({ latitude: null, longitude: null });
              }}
            >
              Clear location
            </Button>
          )}
          <Button
            type="button"
            variant="primary"
            leftIcon={<Save size={16} />}
            isLoading={isSaving}
            onClick={save}
          >
            Save location
          </Button>
        </div>
      )}
    </div>
  );
};

export default PropertyLocationTab;
