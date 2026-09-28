import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Crosshair, ChevronLeft, MapPin, Search, Zap } from "lucide-react";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, Popup, CircleMarker, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import iconUrl from "leaflet/dist/images/marker-icon.png";
import iconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";
import Button from "../../components/common/Button/Button";
import Card from "../../components/common/Card/Card";
import Input from "../../components/common/Input/Input";
import Select from "../../components/common/Select/Select";
import Alert from "../../components/feedback/Alert";
import Spinner from "../../components/common/Spinner/Spinner";
import DiscoveryResults from "../../features/parking/components/DiscoveryResults";
import ParkingDetailsModal from "../../features/parking/components/ParkingDetailsModal";
import { useParkingDiscovery, lowestHourlyRateOf } from "../../features/parking/hooks/useParkingDiscovery";
import {
  COORDINATE_BOUNDS,
  formatMoney,
  formatOperatingHours,
  roundCoordinate,
} from "../../features/parking/utils/parkingUtils";
import type {
  ParkingFacility,
  ParkingLocationFilter,
} from "../../features/parking/types/parkingTypes";
import { ROUTES } from "../../app/routes/routeConstants";

// Leaflet's default icon paths break under bundlers; create an explicit icon.
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
  1: "Location permission was denied. Allow location access for this site and try again, or search by city or town below.",
  2: "Your location is unavailable right now — check that location services are on, or search by city or town instead.",
  3: "Finding your location took too long. Try again, or search by city or town instead.",
};

interface GeoPoint {
  latitude: number;
  longitude: number;
}

// Moves the map to cover every marker whenever the result set changes.
const FitToMarkers: React.FC<{ points: [number, number][] }> = ({ points }) => {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) return;
    if (points.length === 1) {
      map.setView(points[0], 14);
    } else {
      map.fitBounds(L.latLngBounds(points).pad(0.25));
    }
  }, [map, points]);
  return null;
};

export const NearbyParkingPage: React.FC = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"idle" | "geo" | "city">("idle");
  const [reference, setReference] = useState<GeoPoint | null>(null);
  const [radiusKm, setRadiusKm] = useState(5);
  const [cityInput, setCityInput] = useState("");
  const [cityQuery, setCityQuery] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [status, setStatus] = useState<{ tone: "error" | "info"; message: string } | null>(null);
  const [selected, setSelected] = useState<ParkingFacility | null>(null);

  const filter: ParkingLocationFilter = useMemo(() => {
    if (mode === "geo" && reference) {
      return {
        latitude: reference.latitude,
        longitude: reference.longitude,
        radiusKm,
      };
    }
    if (mode === "city" && cityQuery) return { city: cityQuery };
    return {};
  }, [mode, reference, radiusKm, cityQuery]);

  const discovery = useParkingDiscovery(filter, "name");

  const markers = useMemo(
    () =>
      discovery.results.filter(
        (facility): facility is ParkingFacility & { latitude: number; longitude: number } =>
          facility.latitude !== null && facility.longitude !== null,
      ),
    [discovery.results],
  );

  const points = useMemo<[number, number][]>(() => {
    const facilityPoints = markers.map(
      (facility) => [facility.latitude, facility.longitude] as [number, number],
    );
    return reference && mode === "geo"
      ? [[reference.latitude, reference.longitude], ...facilityPoints]
      : facilityPoints;
  }, [markers, reference, mode]);

  const handleUseMyLocation = () => {
    if (!("geolocation" in navigator)) {
      setStatus({
        tone: "error",
        message:
          "Your browser does not support location sharing, so nearby search is unavailable here. Try the city or town search instead.",
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
        const outsideSriLanka =
          latitude < COORDINATE_BOUNDS.minLatitude ||
          latitude > COORDINATE_BOUNDS.maxLatitude ||
          longitude < COORDINATE_BOUNDS.minLongitude ||
          longitude > COORDINATE_BOUNDS.maxLongitude;
        setMode("geo");
        setReference({ latitude, longitude });
        setStatus(
          outsideSriLanka
            ? {
                tone: "info",
                message:
                  "Your location looks like it is outside Sri Lanka, so the closest properties may be far away.",
              }
            : null,
        );
      },
      (error) => {
        setIsLocating(false);
        setStatus({
          tone: "error",
          message:
            GEO_ERROR_MESSAGES[error.code] ??
            "Your location could not be found. Try again, or search by city or town instead.",
        });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  };

  const handleCitySearch = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = cityInput.trim();
    if (!trimmed) return;
    setMode("city");
    setCityQuery(trimmed);
    setStatus(null);
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
        <h1 className="mt-2 text-2xl font-bold text-slate-900">Nearby Parking</h1>
        <p className="mt-1 text-slate-500">
          See approved parking around you on the map, or search around a city or town.
        </p>
      </div>

      <Card padding="md">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
          <div className="shrink-0">
            <Button
              type="button"
              leftIcon={isLocating ? undefined : <Crosshair size={16} />}
              isLoading={isLocating}
              onClick={handleUseMyLocation}
            >
              Use My Location
            </Button>
          </div>
          <form onSubmit={handleCitySearch} className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <Input
                label="Or search around a city or town"
                placeholder="e.g. Colombo"
                value={cityInput}
                onChange={(event) => setCityInput(event.target.value)}
                leftIcon={<MapPin size={16} />}
              />
            </div>
            <Button type="submit" variant="outline" leftIcon={<Search size={16} />}>
              Search city
            </Button>
            {mode === "geo" && (
              <div className="sm:w-44">
                <Select
                  options={RADIUS_OPTIONS}
                  value={String(radiusKm)}
                  onChange={(value) => setRadiusKm(Number(value))}
                />
              </div>
            )}
          </form>
        </div>
        {status && (
          <div className="mt-4">
            <Alert tone={status.tone}>{status.message}</Alert>
          </div>
        )}
        {discovery.loadError && (
          <div className="mt-4">
            <Alert tone="error" title="Could not load parking options">
              {discovery.loadError}
            </Alert>
          </div>
        )}
      </Card>

      <div className="relative z-0 overflow-hidden rounded-xl border border-slate-200">
        <MapContainer
          center={SRI_LANKA_CENTER}
          zoom={8}
          scrollWheelZoom
          className="h-[420px] w-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <FitToMarkers points={points} />
          {mode === "geo" && reference && (
            <CircleMarker
              center={[reference.latitude, reference.longitude]}
              radius={8}
              pathOptions={{ color: "white", weight: 2, fillColor: "#2563eb", fillOpacity: 1 }}
            >
              <Popup>You are here</Popup>
            </CircleMarker>
          )}
          {markers.map((facility) => {
            const rate = lowestHourlyRateOf(facility);
            const available = facility.slotGroups.reduce(
              (sum, group) => sum + group.available,
              0,
            );
            return (
              <Marker
                key={facility.facilityId}
                position={[facility.latitude, facility.longitude]}
                icon={parkingIcon}
              >
                <Popup maxWidth={280}>
                  <div className="space-y-1.5">
                    <p className="font-semibold text-slate-900">{facility.name}</p>
                    <p className="text-xs text-slate-500">
                      {facility.address}, {facility.city}
                    </p>
                    <p className="text-sm text-slate-700">
                      {rate !== null ? `${formatMoney(rate)} / hour` : "No rates published yet"}
                      {facility.hasEvCharging && (
                        <span className="ml-2 inline-flex items-center gap-1 font-medium text-emerald-600">
                          <Zap size={12} />
                          EV
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-slate-500">
                      {available} of {facility.slotCount} slots free ·{" "}
                      {formatOperatingHours(facility)}
                      {facility.distanceKm !== null ? ` · ${facility.distanceKm} km away` : ""}
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
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

      <div>
        <h2 className="text-lg font-semibold text-slate-900">
          {mode === "geo" && reference
            ? `Within ${radiusKm} km of you`
            : mode === "city" && cityQuery
              ? `In ${cityQuery}`
              : "All approved properties"}
        </h2>
        <p className="mt-0.5 text-sm text-slate-500">
          The same results as the markers above, as a list.
        </p>
      </div>

      {discovery.isLoading && markers.length === 0 ? (
        <div className="flex justify-center py-10">
          <Spinner size="lg" />
        </div>
      ) : markers.length === 0 && discovery.total > 0 ? (
        <Alert tone="info">
          None of these properties have map coordinates yet, so they cannot be placed on the map.
          Use the list below to browse them.
        </Alert>
      ) : null}

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
          mode === "geo"
            ? "No parking within this radius"
            : mode === "city"
              ? `No parking found in ${cityQuery ?? "that city"}`
              : "No parking available yet"
        }
        emptyHint={
          mode === "geo"
            ? "Try a wider radius, or search around a city or town instead."
            : mode === "city"
              ? "Check the spelling, or try a nearby city."
              : "Approved parking properties will appear here once owners publish them."
        }
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

export default NearbyParkingPage;
