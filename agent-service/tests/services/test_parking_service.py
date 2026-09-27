from uuid import UUID

import httpx

from app.services.api_client import ApiClient
from app.services.parking_service import ParkingService

FACILITY_ID = "cccccccc-0000-0000-0000-000000000003"

BACKEND_FACILITY = {
    "facilityId": FACILITY_ID,
    "providerId": "dddddddd-0000-0000-0000-000000000004",
    "name": "Central Tower",
    "address": "No 1, Galle Road",
    "city": "Colombo",
    "province": "Western",
    "district": "Colombo",
    "latitude": 6.9271,
    "longitude": 79.8612,
    "landAreaPerches": 12.5,
    "openingTime": "06:00:00",
    "closingTime": "22:00:00",
    "hasEvCharging": False,
    "status": "APPROVED",
    "slotCount": 40,
    "allocations": [{"vehicleTypeId": "f", "vehicleTypeName": "Car", "numberOfSlots": 40}],
}


def build_service(handler) -> ParkingService:
    return ParkingService(
        client=ApiClient(base_url="http://backend.test/api", transport=httpx.MockTransport(handler))
    )


def test_provider_facilities_are_read_from_the_owner_endpoint():
    seen = {}

    def handler(request: httpx.Request) -> httpx.Response:
        seen["path"] = request.url.path
        seen["auth"] = request.headers.get("Authorization")
        return httpx.Response(200, json=[BACKEND_FACILITY])

    facilities = build_service(handler).get_provider_facilities(token="abc")

    assert seen["path"] == "/api/ParkingFacilities/me"
    assert seen["auth"] == "Bearer abc"
    assert facilities[0].facility_id == FACILITY_ID
    assert facilities[0].name == "Central Tower"
    assert facilities[0].slot_count == 40


def test_address_and_coordinates_are_not_carried():
    facilities = build_service(lambda request: httpx.Response(200, json=[BACKEND_FACILITY])).get_provider_facilities(token="abc")

    rendered = facilities[0].model_dump_json()
    assert "No 1, Galle Road" not in rendered
    assert "79.8612" not in rendered


def test_find_matches_the_requested_facility():
    service = build_service(lambda request: httpx.Response(200, json=[BACKEND_FACILITY]))
    facilities = service.get_provider_facilities(token="abc")

    assert service.find(facilities, UUID(FACILITY_ID)) is facilities[0]
    assert service.find(facilities, None) is None
    assert service.find(facilities, UUID("99999999-0000-0000-0000-000000000009")) is None
