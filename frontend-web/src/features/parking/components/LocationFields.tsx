import React from "react";
import Select from "../../../components/common/Select/Select";
import { toProvinceOptions, toDistrictOptions } from "../utils/parkingUtils";

interface LocationFieldsProps {
  province: string;
  district: string;
  onProvinceChange: (province: string) => void;
  onDistrictChange: (district: string) => void;
  provinceError?: string;
  districtError?: string;
  disabled?: boolean;
  // As a search filter the pair offers "All Provinces" / "All Districts" instead of being required.
  allProvincesLabel?: string;
  allDistrictsLabel?: string;
  className?: string;
}

export const LocationFields: React.FC<LocationFieldsProps> = ({
  province,
  district,
  onProvinceChange,
  onDistrictChange,
  provinceError,
  districtError,
  disabled = false,
  allProvincesLabel,
  allDistrictsLabel,
  className = "",
}) => {
  const isFilter = allProvincesLabel !== undefined;

  const handleProvinceChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    onProvinceChange(event.target.value);
    // A district only makes sense within the newly selected province.
    onDistrictChange("");
  };

  return (
    <div className={`grid grid-cols-1 gap-4 sm:grid-cols-2 ${className}`}>
      <Select
        label="Province"
        required={!isFilter}
        disabled={disabled}
        options={toProvinceOptions(allProvincesLabel ?? "Select Province")}
        value={province}
        onChange={handleProvinceChange}
        error={provinceError}
      />
      <Select
        label="District"
        required={!isFilter}
        disabled={disabled || (!isFilter && !province)}
        options={toDistrictOptions(
          province,
          isFilter ? allDistrictsLabel : "Select District",
        )}
        value={province ? district : ""}
        onChange={(event) => onDistrictChange(event.target.value)}
        error={districtError}
        hint={
          !isFilter && !province
            ? "Select a province first"
            : undefined
        }
      />
    </div>
  );
};

export default LocationFields;
