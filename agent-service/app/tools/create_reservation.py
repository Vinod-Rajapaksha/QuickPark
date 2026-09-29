from typing import Any
from app.services.reservation_service import ReservationService

def create_reservation(
    payload: dict,
    token: str,
    reservation_service: ReservationService | None = None,
) -> dict[str, Any]:
    service = reservation_service or ReservationService()
    return service.create_reservation(
        payload=payload,
        token=token
    )
