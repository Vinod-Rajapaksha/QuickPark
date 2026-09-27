from datetime import datetime, timezone
from typing import List, Optional
from uuid import UUID

from app.models.demand_analysis import DemandReservation
from app.services.api_client import ApiClient

PROVIDER_RESERVATIONS_PATH = "/Reservations/provider"


def to_utc_iso(moment: datetime) -> str:
    aware = moment.replace(tzinfo=timezone.utc) if moment.tzinfo is None else moment
    return aware.astimezone(timezone.utc).isoformat()


class ReservationService:
    """Reads the provider's bookings; driver PII is dropped at the model boundary."""

    def __init__(self, client: Optional[ApiClient] = None):
        self._client = client if client is not None else ApiClient()

    def get_provider_reservations(
        self,
        *,
        token: str,
        date_from: datetime,
        date_to: datetime,
        facility_id: Optional[UUID] = None,
    ) -> List[DemandReservation]:
        params = {"from": to_utc_iso(date_from), "to": to_utc_iso(date_to)}
        if facility_id is not None:
            params["facilityId"] = str(facility_id)

        payload = self._client.get(PROVIDER_RESERVATIONS_PATH, token=token, params=params)
        if not isinstance(payload, list):
            raise ValueError("Expected a list of reservations from the backend.")
        return [DemandReservation.model_validate(item) for item in payload]
