from typing import List, Optional
from uuid import UUID

from app.models.demand_analysis import FacilityContext
from app.services.api_client import ApiClient

PROVIDER_FACILITIES_PATH = "/ParkingFacilities/me"


class ParkingService:
    """Reads the provider's own properties, which scopes and labels a demand run."""

    def __init__(self, client: Optional[ApiClient] = None):
        self._client = client if client is not None else ApiClient()

    def get_provider_facilities(self, *, token: str) -> List[FacilityContext]:
        payload = self._client.get(PROVIDER_FACILITIES_PATH, token=token)
        if not isinstance(payload, list):
            raise ValueError("Expected a list of facilities from the backend.")
        return [FacilityContext.model_validate(item) for item in payload]

    def find(
        self, facilities: List[FacilityContext], facility_id: Optional[UUID]
    ) -> Optional[FacilityContext]:
        if facility_id is None:
            return None
        wanted = str(facility_id)
        return next((f for f in facilities if f.facility_id == wanted), None)

    def search_facilities(
        self,
        city: Optional[str] = None,
        latitude: Optional[float] = None,
        longitude: Optional[float] = None,
        radius_km: Optional[float] = None,
        ev_only: Optional[bool] = None,
        max_hourly_rate: Optional[float] = None,
        min_hourly_rate: Optional[float] = None,
    ) -> list:
        params = {}
        if city: params["city"] = city
        if latitude: params["latitude"] = latitude
        if longitude: params["longitude"] = longitude
        if radius_km: params["radiusKm"] = radius_km
        if ev_only is not None: params["evOnly"] = str(ev_only).lower()
        if max_hourly_rate: params["maxHourlyRate"] = max_hourly_rate
        if min_hourly_rate: params["minHourlyRate"] = min_hourly_rate

        try:
            return self._client.get("/ParkingFacilities", params=params)
        except Exception as e:
            return []
