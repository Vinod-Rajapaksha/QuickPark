import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronLeft, MapPin, Search } from "lucide-react";
import Button from "../../components/common/Button/Button";
import Card from "../../components/common/Card/Card";
import Input from "../../components/common/Input/Input";
import Select from "../../components/common/Select/Select";
import DiscoveryRateFilters, {
  RATE_SLIDER_MAX,
  RATE_SLIDER_MIN,
} from "../../features/parking/components/DiscoveryRateFilters";
import DiscoveryResults from "../../features/parking/components/DiscoveryResults";
import ParkingDetailsModal from "../../features/parking/components/ParkingDetailsModal";
import { useParkingDiscovery } from "../../features/parking/hooks/useParkingDiscovery";
import type { DiscoverySort } from "../../features/parking/hooks/useParkingDiscovery";
import { toDistrictOptions, toProvinceOptions } from "../../features/parking/utils/parkingUtils";
import type {
  ParkingFacility,
  ParkingLocationFilter,
} from "../../features/parking/types/parkingTypes";
import { ROUTES } from "../../app/routes/routeConstants";

export const ParkingSearchByDestinationPage: React.FC = () => {
  const navigate = useNavigate();
  const [province, setProvince] = useState("");
  const [district, setDistrict] = useState("");
  const [cityInput, setCityInput] = useState("");
  const [hasEv, setHasEv] = useState(false);
  const [minRate, setMinRate] = useState(RATE_SLIDER_MIN);
  const [maxRate, setMaxRate] = useState(RATE_SLIDER_MAX);
  const [sort, setSort] = useState<DiscoverySort>("name");
  const [applied, setApplied] = useState<ParkingLocationFilter>({});
  const [selected, setSelected] = useState<ParkingFacility | null>(null);

  const discovery = useParkingDiscovery(applied, sort);

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    setApplied({
      province: province || undefined,
      district: district || undefined,
      city: cityInput.trim() || undefined,
      hasEvCharging: hasEv || undefined,
      minHourlyRate: minRate > RATE_SLIDER_MIN ? minRate : undefined,
      maxHourlyRate: maxRate < RATE_SLIDER_MAX ? maxRate : undefined,
    });
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <Link
          to={ROUTES.PARKING_DISCOVERY}
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
        >
          <ChevronLeft size={16} />
          Parking Discovery
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">Search by Destination</h1>
        <p className="mt-1 text-slate-500">
          Find approved parking in the city or town you are heading to.
        </p>
      </div>

      <Card padding="md">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Select
              options={toProvinceOptions()}
              value={province}
              onChange={(value) => {
                setProvince(value);
                setDistrict("");
              }}
              placeholder="All Provinces"
            />
            <Select
              options={toDistrictOptions(province || undefined)}
              value={district}
              onChange={setDistrict}
              placeholder="All Districts"
            />
            <Input
              label="City or town"
              placeholder="e.g. Kandy"
              value={cityInput}
              onChange={(event) => setCityInput(event.target.value)}
              leftIcon={<MapPin size={16} />}
            />
            <div className="flex items-end">
              <Button
                type="submit"
                fullWidth
                leftIcon={<Search size={16} />}
                disabled={discovery.isLoading}
              >
                Search
              </Button>
            </div>
          </div>
          <DiscoveryRateFilters
            hasEvCharging={hasEv}
            onHasEvChargingChange={setHasEv}
            minRate={minRate}
            maxRate={maxRate}
            onMinRateChange={(value) => {
              setMinRate(value);
              if (value > maxRate) setMaxRate(value);
            }}
            onMaxRateChange={(value) => {
              setMaxRate(value);
              if (value < minRate) setMinRate(value);
            }}
            sort={sort}
            onSortChange={setSort}
          />
        </form>
      </Card>

      <DiscoveryResults
        isLoading={discovery.isLoading}
        loadError={discovery.loadError}
        total={discovery.total}
        pageItems={discovery.pageItems}
        page={discovery.page}
        pageCount={discovery.pageCount}
        onPageChange={discovery.setPage}
        onRetry={() => void discovery.refresh()}
        onViewDetails={setSelected}
        emptyTitle="No parking found there"
        emptyHint="Try a nearby city, or widen the rate range and clear the province or district filters."
      />

      <ParkingDetailsModal
        facility={selected}
        onClose={() => setSelected(null)}
        onBookSlot={(facility) => {
          setSelected(null);
          navigate(ROUTES.RESERVATION_CREATE(facility.facilityId));
        }}
      />
    </div>
  );
};

export default ParkingSearchByDestinationPage;
