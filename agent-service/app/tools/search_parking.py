from typing import Any
from app.services.parking_service import ParkingService


def search_parking(
    city: str | None = None,
    latitude: float | None = None,
    longitude: float | None = None,
    radius_km: float | None = None,
    ev_only: bool | None = None,
    max_hourly_rate: float | None = None,
    min_hourly_rate: float | None = None,
    parking_service: ParkingService | None = None,
) -> list[dict[str, Any]]:
    service = parking_service or ParkingService()
    return service.search_facilities(
        city=city,
        latitude=latitude,
        longitude=longitude,
        radius_km=radius_km,
        ev_only=ev_only,
        max_hourly_rate=max_hourly_rate,
        min_hourly_rate=min_hourly_rate,
    )
