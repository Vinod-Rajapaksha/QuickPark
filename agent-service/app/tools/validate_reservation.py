from typing import Any
from app.services.reservation_service import ReservationService

def validate_reservation(
    payload: dict,
    token: str,
    reservation_service: ReservationService | None = None,
) -> dict[str, Any]:
    service = reservation_service or ReservationService()
    return service.validate_reservation(
        payload=payload,
        token=token
    )
