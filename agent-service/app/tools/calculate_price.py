from typing import Any
from app.services.reservation_service import ReservationService

def calculate_price(
    facility_id: str,
    start_time: str,
    end_time: str,
    vehicle_type: str,
    reservation_service: ReservationService | None = None,
) -> dict[str, Any]:
    service = reservation_service or ReservationService()
    return service.calculate_price(
        facility_id=facility_id,
        start_time=start_time,
        end_time=end_time,
        vehicle_type=vehicle_type
    )
