import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronLeft, Search } from "lucide-react";
import Button from "../../components/common/Button/Button";
import Card from "../../components/common/Card/Card";
import Input from "../../components/common/Input/Input";
import Alert from "../../components/feedback/Alert";
import DiscoveryRateFilters, {
  RATE_SLIDER_MAX,
  RATE_SLIDER_MIN,
} from "../../features/parking/components/DiscoveryRateFilters";
import DiscoveryResults from "../../features/parking/components/DiscoveryResults";
import ParkingDetailsModal from "../../features/parking/components/ParkingDetailsModal";
import { useParkingDiscovery } from "../../features/parking/hooks/useParkingDiscovery";
import type { DiscoverySort } from "../../features/parking/hooks/useParkingDiscovery";
import type {
  ParkingFacility,
  ParkingLocationFilter,
} from "../../features/parking/types/parkingTypes";
import { ROUTES } from "../../app/routes/routeConstants";

export const ParkingSearchByNamePage: React.FC = () => {
  const navigate = useNavigate();
  const [nameInput, setNameInput] = useState("");
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
      name: nameInput.trim() || undefined,
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
        <h1 className="mt-2 text-2xl font-bold text-slate-900">Search by Name</h1>
        <p className="mt-1 text-slate-500">
          Search approved parking by property name and filter by price or EV charging.
        </p>
      </div>

      <Card padding="md">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <Input
                label="Property name"
                placeholder="e.g. Kandy Central Parking"
                value={nameInput}
                onChange={(event) => setNameInput(event.target.value)}
                leftIcon={<Search size={16} />}
              />
            </div>
            <Button type="submit" disabled={discovery.isLoading}>
              Search
            </Button>
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

      {discovery.total > 0 && applied.name && !discovery.isLoading && (
        <Alert tone="info">
          Showing matches for “{applied.name}”. Clear the name box and search again to see every property.
        </Alert>
      )}

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
        emptyTitle="No parking found"
        emptyHint="Try a shorter name, or widen the rate range and clear the EV filter."
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

export default ParkingSearchByNamePage;
