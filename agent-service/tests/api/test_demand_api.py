from datetime import datetime, timezone
from uuid import UUID

from fastapi.testclient import TestClient

from app.agents.parking_demand_agent import DemandAnalysisError
from app.api.routes import demand as demand_route
from app.models.demand_analysis import (
    DemandAnalysisResponse,
    DemandMetricsResult,
    NarrativeAnalysis,
    TimeWindow,
)
from app.main import app
from app.services.api_client import ApiError

client = TestClient(app)

TOKEN = "provider-bearer-token"
FACILITY_ID = str(UUID("11111111-2222-3333-4444-555555555555"))
BODY = {"date_from": "2026-09-01T00:00:00+00:00", "date_to": "2026-09-08T00:00:00+00:00"}


def sample_metrics() -> DemandMetricsResult:
    return DemandMetricsResult(
        time_window=TimeWindow(
            date_from=datetime(2026, 9, 1, tzinfo=timezone.utc),
            date_to=datetime(2026, 9, 8, tzinfo=timezone.utc),
            timezone="Asia/Colombo",
            basis="Reservations counted by StartTime inside [date_from, date_to).",
        ),
        total_reservations=2,
        counted_statuses=["CONFIRMED"],
        reservations_by_facility={"Central Tower": 2},
        reservations_by_vehicle_type={"Car": 2},
        reservations_by_date=[],
        reservations_by_hour=[],
        reservations_by_status={"CONFIRMED": 2},
        average_booking_hours=3.0,
        cancellation_rate=0.0,
        no_show_rate=0.0,
        revenue_summary={
            "total_amount": "600.00",
            "total_commission": "60.00",
            "total_provider_amount": "540.00",
            "average_booking_value": "300.00",
        },
        peak_periods=[],
        low_demand_periods=[],
    )


class StubAgent:
    def __init__(self, error=None):
        self.error = error
        self.calls = []

    def analyze(self, **kwargs):
        self.calls.append(kwargs)
        if self.error:
            raise self.error
        return DemandAnalysisResponse(
            metrics=sample_metrics(),
            analysis=NarrativeAnalysis(summary="Steady demand", insights=[], recommendations=[]),
            analysis_source="deterministic",
        )


def test_analyze_returns_metrics_and_source(monkeypatch):
    stub = StubAgent()
    monkeypatch.setattr(demand_route, "agent", stub)

    response = client.post("/api/demand/analyze", json=BODY, headers={"Authorization": f"Bearer {TOKEN}"})

    assert response.status_code == 200
    payload = response.json()
    assert payload["metrics"]["total_reservations"] == 2
    assert payload["analysis_source"] == "deterministic"
    assert payload["analysis"]["summary"] == "Steady demand"


def test_analyze_forwards_parsed_window_and_optional_facility(monkeypatch):
    stub = StubAgent()
    monkeypatch.setattr(demand_route, "agent", stub)

    client.post(
        "/api/demand/analyze",
        json={**BODY, "facility_id": FACILITY_ID},
        headers={"Authorization": f"Bearer {TOKEN}"},
    )

    call = stub.calls[0]
    assert call["token"] == TOKEN
    assert call["facility_id"] == UUID(FACILITY_ID)
    assert call["date_from"] == datetime(2026, 9, 1, tzinfo=timezone.utc)
    assert call["date_to"] == datetime(2026, 9, 8, tzinfo=timezone.utc)


def test_missing_authorization_header_is_rejected(monkeypatch):
    monkeypatch.setattr(demand_route, "agent", StubAgent())

    assert client.post("/api/demand/analyze", json=BODY).status_code == 401


def test_non_bearer_authorization_is_rejected(monkeypatch):
    monkeypatch.setattr(demand_route, "agent", StubAgent())

    response = client.post("/api/demand/analyze", json=BODY, headers={"Authorization": "Basic abc"})
    assert response.status_code == 401


def test_invalid_date_range_is_rejected_by_the_request_model():
    response = client.post(
        "/api/demand/analyze",
        json={"date_from": "2026-09-08T00:00:00+00:00", "date_to": "2026-09-01T00:00:00+00:00"},
        headers={"Authorization": f"Bearer {TOKEN}"},
    )

    assert response.status_code == 422
    assert "date_to must be after date_from" in response.text


def test_unknown_facility_maps_to_client_error(monkeypatch):
    monkeypatch.setattr(demand_route, "agent", StubAgent(error=DemandAnalysisError("Facility not found for this provider.")))

    response = client.post("/api/demand/analyze", json=BODY, headers={"Authorization": f"Bearer {TOKEN}"})

    assert response.status_code == 400
    assert "Facility not found" in response.json()["detail"]


def test_backend_failure_maps_to_bad_gateway(monkeypatch):
    monkeypatch.setattr(demand_route, "agent", StubAgent(error=ApiError("/Reservations/provider: backend returned 401")))

    response = client.post("/api/demand/analyze", json=BODY, headers={"Authorization": f"Bearer {TOKEN}"})

    assert response.status_code == 502
    assert "backend returned 401" in response.json()["detail"]


def test_unexpected_failure_never_leaks_the_token(monkeypatch):
    monkeypatch.setattr(demand_route, "agent", StubAgent(error=RuntimeError(f"boom {TOKEN}")))

    response = client.post("/api/demand/analyze", json=BODY, headers={"Authorization": f"Bearer {TOKEN}"})

    assert response.status_code == 500
    assert TOKEN not in response.text
