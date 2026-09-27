from typing import Any
from app.services.api_client import ApiClient


class ParkingService:
    def __init__(self, client: ApiClient | None = None):
        self.client = client or ApiClient()

    def search_facilities(
        self,
        city: str | None = None,
        latitude: float | None = None,
        longitude: float | None = None,
        radius_km: float | None = None,
        ev_only: bool | None = None,
        max_hourly_rate: float | None = None,
        min_hourly_rate: float | None = None,
    ) -> list[dict[str, Any]]:
        params: dict[str, Any] = {}
        if city:
            params["City"] = city
        if latitude is not None:
            params["Latitude"] = latitude
        if longitude is not None:
            params["Longitude"] = longitude
        if radius_km is not None:
            params["RadiusKm"] = radius_km
        if ev_only is not None:
            params["EvOnly"] = ev_only
        if max_hourly_rate is not None:
            params["MaxHourlyRate"] = max_hourly_rate
        if min_hourly_rate is not None:
            params["MinHourlyRate"] = min_hourly_rate

        data = self.client.get("/parking/search", params=params)
        if isinstance(data, list):
            return data
        return data.get("items", data.get("results", []))
