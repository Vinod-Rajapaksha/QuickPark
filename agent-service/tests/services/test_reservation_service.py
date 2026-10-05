from datetime import datetime, timezone

import httpx
import pytest

from app.services.api_client import ApiClient
from app.services.reservation_service import ReservationService, to_utc_iso

BACKEND_RESERVATION = {
    "reservationId": "aaaaaaaa-0000-0000-0000-000000000001",
    "driverId": "bbbbbbbb-0000-0000-0000-000000000002",
    "driverName": "Nimal Perera",
    "driverPhone": "+94770000000",
    "facilityId": "cccccccc-0000-0000-0000-000000000003",
    "facilityName": "Central Tower",
    "city": "Colombo",
    "province": "Western",
    "district": "Colombo",
    "providerId": "dddddddd-0000-0000-0000-000000000004",
    "slotId": "eeeeeeee-0000-0000-0000-000000000005",
    "slotNumber": "A-12",
    "vehicleTypeId": "ffffffff-0000-0000-0000-000000000006",
    "vehicleTypeName": "Car",
    "startTime": "2026-09-02T05:00:00Z",
    "endTime": "2026-09-02T08:00:00Z",
    "hours": 3,
    "hourlyRate": 100.0,
    "totalAmount": 300.0,
    "commissionRate": 0.1,
    "commissionAmount": 30.0,
    "providerAmount": 270.0,
    "status": "CONFIRMED",
    "checkedInAt": None,
    "checkedOutAt": None,
    "cancelReason": None,
    "cancelledBy": None,
    "cancelledAt": None,
    "createdAt": "2026-08-20T09:00:00Z",
    "updatedAt": "2026-08-20T09:00:00Z",
}


def build_service(handler) -> ReservationService:
    return ReservationService(client=ApiClient(base_url="http://backend.test/api", transport=httpx.MockTransport(handler)))


def test_provider_reservations_are_mapped_without_driver_pii():
    captured = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["query"] = dict(request.url.params)
        return httpx.Response(200, json=[BACKEND_RESERVATION])

    rows = build_service(handler).get_provider_reservations(
        token="abc",
        date_from=datetime(2026, 9, 1, tzinfo=timezone.utc),
        date_to=datetime(2026, 9, 8, tzinfo=timezone.utc),
    )

    assert captured["path"] == "/api/Reservations/provider"
    assert captured["query"] == {
        "from": "2026-09-01T00:00:00+00:00",
        "to": "2026-09-08T00:00:00+00:00",
    }
    assert len(rows) == 1
    assert rows[0].facility_name == "Central Tower"
    assert rows[0].total_amount == 300
    rendered = rows[0].model_dump_json()
    for secret in ("Nimal Perera", "+94770000000", "bbbbbbbb", "A-12"):
        assert secret not in rendered


def test_facility_filter_is_forwarded():
    seen = {}

    def handler(request: httpx.Request) -> httpx.Response:
        seen["query"] = dict(request.url.params)
        return httpx.Response(200, json=[])

    build_service(handler).get_provider_reservations(
        token="abc",
        date_from=datetime(2026, 9, 1, tzinfo=timezone.utc),
        date_to=datetime(2026, 9, 8, tzinfo=timezone.utc),
        facility_id="cccccccc-0000-0000-0000-000000000003",
    )

    assert seen["query"]["facilityId"] == "cccccccc-0000-0000-0000-000000000003"


def test_naive_window_is_sent_as_utc():
    assert to_utc_iso(datetime(2026, 9, 1, 5, 30)) == "2026-09-01T05:30:00+00:00"
    assert to_utc_iso(datetime(2026, 9, 1, 5, 30, tzinfo=timezone.utc)) == "2026-09-01T05:30:00+00:00"


def test_unexpected_payload_is_rejected():
    service = build_service(lambda request: httpx.Response(200, json={"status": 500}))

    with pytest.raises(ValueError):
        service.get_provider_reservations(
            token="abc",
            date_from=datetime(2026, 9, 1, tzinfo=timezone.utc),
            date_to=datetime(2026, 9, 8, tzinfo=timezone.utc),
        )
