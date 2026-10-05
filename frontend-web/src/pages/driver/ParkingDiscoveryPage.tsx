import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  MapPin,
  Crosshair,
  Zap,
  Map as MapIcon,
  List,
  Filter,
} from "lucide-react";
import L from "leaflet";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  CircleMarker,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import iconUrl from "leaflet/dist/images/marker-icon.png";
import iconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";
import Button from "../../components/common/Button/Button";
import Card from "../../components/common/Card/Card";
import Input from "../../components/common/Input/Input";
import Select from "../../components/common/Select/Select";
import Alert from "../../components/feedback/Alert";
import DiscoveryRateFilters, {
  RATE_SLIDER_MAX,
  RATE_SLIDER_MIN,
} from "../../features/parking/components/DiscoveryRateFilters";
import DiscoveryResults from "../../features/parking/components/DiscoveryResults";
import ParkingDetailsModal from "../../features/parking/components/ParkingDetailsModal";
import {
  useParkingDiscovery,
  lowestHourlyRateOf,
} from "../../features/parking/hooks/useParkingDiscovery";
import type { DiscoverySort } from "../../features/parking/hooks/useParkingDiscovery";
import {
  formatMoney,
  roundCoordinate,
  toProvinceOptions,
  toDistrictOptions,
} from "../../features/parking/utils/parkingUtils";
import type {
  ParkingFacility,
  ParkingLocationFilter,
} from "../../features/parking/types/parkingTypes";
import { ROUTES } from "../../app/routes/routeConstants";

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

const RADIUS_OPTIONS = [
  { value: "2", label: "Within 2 km" },
  { value: "5", label: "Within 5 km" },
  { value: "10", label: "Within 10 km" },
  { value: "25", label: "Within 25 km" },
];

const GEO_ERROR_MESSAGES: Record<number, string> = {
  1: "Location permission denied. Please search by name or city instead.",
  2: "Location unavailable right now. Try searching by city instead.",
  3: "Finding location timed out. Try again or search by city.",
};

interface GeoPoint {
  latitude: number;
  longitude: number;
}

const FitToMarkers: React.FC<{ points: [number, number][] }> = ({ points }) => {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) return;
    if (points.length === 1) {
      map.setView(points[0], 14);
    } else {
      map.fitBounds(L.latLngBounds(points).pad(0.1));
    }
  }, [map, points]);
  return null;
};

export const ParkingDiscoveryPage: React.FC = () => {
  const navigate = useNavigate();

  // View mode for mobile
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Search State
  const [searchInput, setSearchInput] = useState("");
  const [searchType, setSearchType] = useState<"name" | "city">("name");
  const [province, setProvince] = useState("");
  const [district, setDistrict] = useState("");
  const [hasEv, setHasEv] = useState(false);
  const [minRate, setMinRate] = useState(RATE_SLIDER_MIN);
  const [maxRate, setMaxRate] = useState(RATE_SLIDER_MAX);
  const [sort, setSort] = useState<DiscoverySort>("name");

  // Geolocation State
  const [reference, setReference] = useState<GeoPoint | null>(null);
  const [radiusKm, setRadiusKm] = useState(5);
  const [isLocating, setIsLocating] = useState(false);
  const [status, setStatus] = useState<{
    tone: "error" | "info";
    message: string;
  } | null>(null);

  const [applied, setApplied] = useState<ParkingLocationFilter>({});
  const [selected, setSelected] = useState<ParkingFacility | null>(null);

  const discovery = useParkingDiscovery(applied, sort);

  // Derive markers & map points
  const markers = useMemo(
    () =>
      discovery.results.filter(
        (
          facility,
        ): facility is ParkingFacility & {
          latitude: number;
          longitude: number;
        } => facility.latitude !== null && facility.longitude !== null,
      ),
    [discovery.results],
  );

  const points = useMemo<[number, number][]>(() => {
    const facilityPoints = markers.map(
      (facility) => [facility.latitude, facility.longitude] as [number, number],
    );
    return reference
      ? [[reference.latitude, reference.longitude], ...facilityPoints]
      : facilityPoints;
  }, [markers, reference]);

  const handleUseMyLocation = () => {
    if (!("geolocation" in navigator)) {
      setStatus({
        tone: "error",
        message: "Geolocation is not supported by your browser.",
      });
      return;
    }
    setIsLocating(true);
    setStatus(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLocating(false);
        const latitude = roundCoordinate(position.coords.latitude);
        const longitude = roundCoordinate(position.coords.longitude);
        setReference({ latitude, longitude });
        setSearchInput("");
        setProvince("");
        setDistrict("");

        setApplied({
          latitude,
          longitude,
          radiusKm,
          hasEvCharging: hasEv || undefined,
          minHourlyRate: minRate > RATE_SLIDER_MIN ? minRate : undefined,
          maxHourlyRate: maxRate < RATE_SLIDER_MAX ? maxRate : undefined,
        });

        setViewMode("map");
      },
      (error) => {
        setIsLocating(false);
        setStatus({
          tone: "error",
          message:
            GEO_ERROR_MESSAGES[error.code] ?? "Location could not be found.",
        });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  };

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    setReference(null);
    setStatus(null);

    setApplied({
      name: searchType === "name" ? searchInput.trim() || undefined : undefined,
      city: searchType === "city" ? searchInput.trim() || undefined : undefined,
      province: province || undefined,
      district: district || undefined,
      hasEvCharging: hasEv || undefined,
      minHourlyRate: minRate > RATE_SLIDER_MIN ? minRate : undefined,
      maxHourlyRate: maxRate < RATE_SLIDER_MAX ? maxRate : undefined,
    });
  };

  return (
    <div className="mx-auto max-w-7xl h-[calc(100vh-40px)] min-h-[800px] flex flex-col gap-6">
      {/* Header & Controls */}
      <div className="shrink-0 space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <MapPin className="text-primary-500" />
            Discover Parking
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Search seamlessly across the platform or locate spots near you.
          </p>
        </div>

        <Card className="p-4 shadow-sm space-y-4 border-slate-200 overflow-visible">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="w-full sm:w-40 shrink-0">
                <Select
                  options={[
                    { value: "name", label: "By Name" },
                    { value: "city", label: "By City" },
                  ]}
                  value={searchType}
                  onChange={(val) => setSearchType(val as "name" | "city")}
                />
              </div>
              <div className="flex-1 relative">
                <Input
                  placeholder={
                    searchType === "name"
                      ? "e.g. Kandy Central"
                      : "e.g. Colombo"
                  }
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  leftIcon={<Search size={16} />}
                />
              </div>
              <Button
                type="submit"
                disabled={discovery.isLoading}
                className="shrink-0 w-full sm:w-auto"
              >
                Search
              </Button>
            </div>

            {/* Geo Search Row */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2 border-t border-slate-100">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                leftIcon={isLocating ? undefined : <Crosshair size={16} />}
                isLoading={isLocating}
                onClick={handleUseMyLocation}
                className="w-full sm:w-auto"
              >
                Locate Near Me
              </Button>
              {reference && (
                <div className="w-full sm:w-44">
                  <Select
                    options={RADIUS_OPTIONS}
                    value={String(radiusKm)}
                    onChange={(val) => {
                      const newRadius = Number(val);
                      setRadiusKm(newRadius);
                      if (reference) {
                        setApplied((prev) => ({
                          ...prev,
                          radiusKm: newRadius,
                        }));
                      }
                    }}
                  />
                </div>
              )}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="ml-auto w-full sm:w-auto text-slate-500"
                leftIcon={<Filter size={16} />}
                onClick={() => setShowAdvanced(!showAdvanced)}
              >
                {showAdvanced ? "Hide Filters" : "Advanced Filters"}
              </Button>
            </div>

            {/* Advanced Filters */}
            {showAdvanced && (
              <div className="pt-3 space-y-4 border-t border-slate-100 animate-in fade-in slide-in-from-top-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Select
                    options={toProvinceOptions()}
                    value={province}
                    onChange={(value) => {
                      setProvince(value);
                      setDistrict("");
                    }}
                    placeholder="All Provinces"
                    searchable
                  />
                  <Select
                    options={toDistrictOptions(province || undefined)}
                    value={district}
                    onChange={setDistrict}
                    placeholder="All Districts"
                    searchable
                  />
                </div>
                <DiscoveryRateFilters
                  hasEvCharging={hasEv}
                  onHasEvChargingChange={setHasEv}
                  minRate={minRate}
                  maxRate={maxRate}
                  onMinRateChange={(v) => {
                    setMinRate(v);
                    if (v > maxRate) setMaxRate(v);
                  }}
                  onMaxRateChange={(v) => {
                    setMaxRate(v);
                    if (v < minRate) setMinRate(v);
                  }}
                  sort={sort}
                  onSortChange={setSort}
                />
              </div>
            )}
          </form>
        </Card>

        {status && <Alert tone={status.tone}>{status.message}</Alert>}

        {/* Mobile View Toggle */}
        <div className="lg:hidden flex bg-slate-100 p-1 rounded-lg">
          <button
            onClick={() => setViewMode("list")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all ${viewMode === "list" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}
          >
            <List size={16} /> List View
          </button>
          <button
            onClick={() => setViewMode("map")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all ${viewMode === "map" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}
          >
            <MapIcon size={16} /> Map View
          </button>
        </div>
      </div>

      {/* Split Area: Left Results, Right Map */}
      <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0 w-full overflow-hidden">
        {/* LEFT COLUMN: Results (Hidden on mobile if in Map view) */}
        <div
          className={`flex-1 flex flex-col min-h-0 w-full lg:w-1/2 xl:w-5/12 overflow-hidden ${viewMode === "map" ? "hidden lg:flex" : "flex"}`}
        >
          <div className="flex-1 overflow-y-auto pb-6">
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
              emptyTitle={
                reference ? "No parking within this radius" : "No parking found"
              }
              emptyHint="Try adjusting your filters, location, or radius."
            />
          </div>
        </div>

        {/* RIGHT COLUMN: Map (Hidden on mobile if in List view) */}
        <div
          className={`w-full lg:w-1/2 xl:w-7/12 h-[400px] lg:h-full rounded-2xl overflow-hidden shadow-sm border border-slate-200 z-0 relative ${viewMode === "list" ? "hidden lg:block" : "block"}`}
        >
          <MapContainer
            center={SRI_LANKA_CENTER}
            zoom={8}
            scrollWheelZoom
            className="h-full w-full"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <FitToMarkers points={points} />
            {reference && (
              <CircleMarker
                center={[reference.latitude, reference.longitude]}
                radius={8}
                pathOptions={{
                  color: "white",
                  weight: 2,
                  fillColor: "#2563eb",
                  fillOpacity: 1,
                }}
              >
                <Popup>You are here</Popup>
              </CircleMarker>
            )}
            {markers.map((facility) => {
              const rate = lowestHourlyRateOf(facility);
              return (
                <Marker
                  key={facility.facilityId}
                  position={[facility.latitude, facility.longitude]}
                  icon={parkingIcon}
                >
                  <Popup maxWidth={280}>
                    <div className="space-y-1.5">
                      <p className="font-semibold text-slate-900">
                        {facility.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {facility.address}, {facility.city}
                      </p>
                      <p className="text-sm text-slate-700">
                        {rate !== null
                          ? `${formatMoney(rate)} / hour`
                          : "No rates published"}
                        {facility.hasEvCharging && (
                          <span className="ml-2 inline-flex items-center gap-1 font-medium text-emerald-600">
                            <Zap size={12} /> EV
                          </span>
                        )}
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="mt-2 w-full"
                        onClick={() => setSelected(facility)}
                      >
                        View details
                      </Button>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        </div>
      </div>

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

export default ParkingDiscoveryPage;
