import httpx
import pytest

from app.services.api_client import ApiClient, ApiError

BASE = "http://backend.test/api"


def make_client(handler) -> ApiClient:
    return ApiClient(base_url=BASE, transport=httpx.MockTransport(handler))


def test_get_sends_the_bearer_token_and_query():
    seen = {}

    def handler(request: httpx.Request) -> httpx.Response:
        seen["url"] = str(request.url)
        seen["auth"] = request.headers.get("Authorization")
        return httpx.Response(200, json=[{"ok": True}])

    payload = make_client(handler).get("/Reservations/provider", token="abc", params={"from": "2026-09-01"})

    assert payload == [{"ok": True}]
    assert seen["auth"] == "Bearer abc"
    assert seen["url"] == f"{BASE}/Reservations/provider?from=2026-09-01"


def test_missing_token_never_reaches_the_network():
    def handler(request: httpx.Request) -> httpx.Response:
        raise AssertionError("must not be called")

    with pytest.raises(ApiError) as exc:
        make_client(handler).get("/Reservations/provider", token="")

    assert "access token is required" in str(exc.value)


def test_error_status_becomes_api_error_without_the_token():
    client = make_client(lambda request: httpx.Response(403, json={"message": "nope"}))

    with pytest.raises(ApiError) as exc:
        client.get("/ParkingFacilities/me", token="supersecret")

    assert str(exc.value) == "/ParkingFacilities/me: backend returned 403"
    assert "supersecret" not in str(exc.value)


def test_transport_failure_becomes_api_error():
    def handler(request: httpx.Request) -> httpx.Response:
        raise httpx.ConnectError("refused")

    with pytest.raises(ApiError) as exc:
        make_client(handler).get("/Reservations/provider", token="abc")

    assert "request to the QuickPark backend failed" in str(exc.value)
