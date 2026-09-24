import React, { useState } from "react";
import { CheckCircle2, MapPin, Save, Trash2 } from "lucide-react";
import Button from "../../../components/common/Button/Button";
import Input from "../../../components/common/Input/Input";
import type { CoordinateInput, ParkingFacility } from "../types/parkingTypes";
import {
  formatCoordinates,
  parseCoordinate,
  roundCoordinate,
  validateCoordinatePair,
  type CoordinateErrors,
} from "../utils/parkingUtils";

interface PropertyLocationTabProps {
  facility: ParkingFacility;
  disabled?: boolean;
  isSaving?: boolean;
  serverError?: string | null;
  onSave: (coordinates: CoordinateInput) => void | Promise<unknown>;
}

const asText = (value: number | null): string => (value === null ? "" : String(value));

// Typed coordinates instead of a map pick; one number alone is not a place.
export const PropertyLocationTab: React.FC<PropertyLocationTabProps> = ({
  facility,
  disabled = false,
  isSaving = false,
  serverError = null,
  onSave,
}) => {
  const [latitude, setLatitude] = useState(() => asText(facility.latitude));
  const [longitude, setLongitude] = useState(() => asText(facility.longitude));
  const [errors, setErrors] = useState<CoordinateErrors>({});

  const saved = formatCoordinates(facility);

  const save = () => {
    const found = validateCoordinatePair(latitude, longitude);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    const parsedLat = parseCoordinate(latitude);
    const parsedLng = parseCoordinate(longitude);
    void onSave({
      latitude: parsedLat === null ? null : roundCoordinate(parsedLat),
      longitude: parsedLng === null ? null : roundCoordinate(parsedLng),
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
          Enter the coordinates of the property entrance in decimal degrees. Drivers search by
          distance from this point, so it has to be where the car actually parks.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Input
            label="Latitude"
            inputMode="decimal"
            placeholder="6.006642"
            value={latitude}
            onChange={(event) => setLatitude(event.target.value)}
            error={errors.latitude}
            disabled={disabled || isSaving}
          />
          <p className="mt-1 text-xs text-slate-400">Between 5.9 and 10.2 for Sri Lanka.</p>
        </div>
        <div>
          <Input
            label="Longitude"
            inputMode="decimal"
            placeholder="80.228054"
            value={longitude}
            onChange={(event) => setLongitude(event.target.value)}
            error={errors.longitude}
            disabled={disabled || isSaving}
          />
          <p className="mt-1 text-xs text-slate-400">Between 79.4 and 82.1 for Sri Lanka.</p>
        </div>
      </div>

      <ul className="list-inside list-disc space-y-1 text-xs text-slate-400">
        <li>Open any map app, long-press the entrance, and copy the two numbers it shows.</li>
        <li>Use a dot for the decimal point, not a comma, and up to six digits after it.</li>
        <li>Both numbers are required together; leaving both empty clears the saved location.</li>
      </ul>

      {saved ? (
        <p className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <CheckCircle2 size={16} className="shrink-0" />
          Saved location: {saved}
        </p>
      ) : (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          No location saved yet. An admin will not approve this property until both numbers are
          entered.
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
                setLatitude("");
                setLongitude("");
                setErrors({});
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
