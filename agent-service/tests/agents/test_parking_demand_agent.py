from datetime import datetime, timezone
from types import SimpleNamespace
from uuid import UUID

import pytest

from app.agents.parking_demand_agent import (
    DemandAnalysisError,
    ParkingDemandAgent,
    gemini_narrator,
)
from app.config.settings import settings
from app.models.demand_analysis import (
    DemandReservation,
    FacilityContext,
    NarrativeAnalysis,
)
from app.services.api_client import ApiError

FACILITY_ID = UUID("11111111-2222-3333-4444-555555555555")
DATE_FROM = datetime(2026, 9, 1, tzinfo=timezone.utc)
DATE_TO = datetime(2026, 9, 8, tzinfo=timezone.utc)


def reservation(**overrides) -> DemandReservation:
    payload = {
        "facilityId": str(FACILITY_ID),
        "facilityName": "Central Tower",
        "vehicleTypeId": "type-1",
        "vehicleTypeName": "Car",
        "startTime": "2026-09-02T05:00:00+00:00",
        "endTime": "2026-09-02T08:00:00+00:00",
        "hours": 3,
        "totalAmount": "300.00",
        "commissionAmount": "30.00",
        "providerAmount": "270.00",
        "status": "CONFIRMED",
        "driverName": "Nimal Perera",
        "driverPhone": "+94770000000",
    }
    payload.update(overrides)
    return DemandReservation.model_validate(payload)


class FakeReservationService:
    def __init__(self, rows=None, error=None):
        self.rows = rows if rows is not None else [reservation()]
        self.error = error
        self.calls = []

    def get_provider_reservations(self, *, token, date_from, date_to, facility_id=None):
        self.calls.append({"token": token, "facility_id": facility_id})
        if self.error:
            raise self.error
        return self.rows


class FakeParkingService:
    def __init__(self, facilities=None):
        self.facilities = (
            facilities
            if facilities is not None
            else [FacilityContext.model_validate({"facilityId": str(FACILITY_ID), "name": "Central Tower"})]
        )
        self.tokens = []

    def get_provider_facilities(self, *, token):
        self.tokens.append(token)
        return self.facilities

    def find(self, facilities, facility_id):
        if facility_id is None:
            return None
        return next((f for f in facilities if f.facility_id == str(facility_id)), None)


def build_agent(reservations=None, facilities=None, narrator=None):
    return ParkingDemandAgent(
        reservations=reservations or FakeReservationService(),
        facilities=facilities or FakeParkingService(),
        narrator=narrator or (lambda facts: None),
    )


def analyze(agent=None, **overrides):
    options = {"token": "secret-token", "date_from": DATE_FROM, "date_to": DATE_TO}
    options.update(overrides)
    return (agent or build_agent()).analyze(**options)


def test_agent_returns_structured_metrics_without_a_key(monkeypatch):
    monkeypatch.setattr(settings, "GOOGLE_API_KEY", None)

    response = analyze()

    assert response.analysis_source == "deterministic"
    assert response.metrics.total_reservations == 1
    assert response.metrics.reservations_by_facility == {"Central Tower": 1}
    assert response.analysis.summary


def test_agent_falls_back_when_the_narrator_yields_nothing(monkeypatch):
    monkeypatch.setattr(settings, "GOOGLE_API_KEY", "key")

    response = analyze()

    assert response.analysis_source == "gemini_fallback"
    assert response.analysis.summary


def test_agent_uses_narration_when_the_llm_answers(monkeypatch):
    monkeypatch.setattr(settings, "GOOGLE_API_KEY", "key")
    seen = []

    def narrator(facts):
        seen.append(facts)
        return NarrativeAnalysis(summary="Owner read-out", insights=["Peak at 10:00"], recommendations=[])

    response = analyze(build_agent(narrator=narrator))

    assert response.analysis_source == "gemini"
    assert response.analysis.summary == "Owner read-out"
    assert "Central Tower" in seen[0]
    assert "secret-token" not in seen[0]


def test_metrics_stay_the_source_of_truth_over_narration(monkeypatch):
    monkeypatch.setattr(settings, "GOOGLE_API_KEY", "key")

    def narrator(facts):
        return NarrativeAnalysis(summary="Invented 99 reservations", insights=[], recommendations=[])

    response = analyze(build_agent(narrator=narrator))

    assert response.metrics.total_reservations == 1
    assert "99" not in response.metrics.model_dump_json()


def test_prompt_facts_carry_no_driver_pii(monkeypatch):
    monkeypatch.setattr(settings, "GOOGLE_API_KEY", "key")
    seen = []

    def narrator(facts):
        seen.append(facts)
        return None

    analyze(build_agent(narrator=narrator))

    assert "Nimal Perera" not in seen[0]
    assert "+94770000000" not in seen[0]


def test_facility_filter_is_validated_before_booking_data_is_read():
    reservations = FakeReservationService()
    agent = ParkingDemandAgent(
        reservations=reservations,
        facilities=FakeParkingService(),
        narrator=lambda facts: None,
    )

    with pytest.raises(DemandAnalysisError) as exc:
        analyze(agent, facility_id=UUID("99999999-9999-9999-9999-999999999999"))

    assert "Facility not found" in str(exc.value)
    assert reservations.calls == []


def test_facility_filter_reaches_the_reservation_service():
    reservations = FakeReservationService()
    agent = build_agent(reservations=reservations)

    analyze(agent, facility_id=FACILITY_ID)

    assert reservations.calls[0]["facility_id"] == FACILITY_ID


def test_bearer_token_is_passed_as_an_argument_only():
    reservations = FakeReservationService()
    facilities = FakeParkingService()
    agent = ParkingDemandAgent(reservations=reservations, facilities=facilities, narrator=lambda facts: None)

    response = analyze(agent)

    assert reservations.calls[0]["token"] == "secret-token"
    assert facilities.tokens == ["secret-token"]
    assert "secret-token" not in response.model_dump_json()


def test_invalid_window_is_rejected(monkeypatch):
    monkeypatch.setattr(settings, "GOOGLE_API_KEY", None)

    with pytest.raises(DemandAnalysisError):
        analyze(date_from=DATE_TO, date_to=DATE_FROM)


def test_backend_failure_propagates_as_api_error():
    agent = build_agent(reservations=FakeReservationService(error=ApiError("/Reservations/provider: backend returned 401")))

    with pytest.raises(ApiError):
        analyze(agent)


def test_empty_provider_history_still_reports(monkeypatch):
    monkeypatch.setattr(settings, "GOOGLE_API_KEY", None)
    agent = build_agent(reservations=FakeReservationService(rows=[]))

    response = analyze(agent)

    assert response.metrics.total_reservations == 0
    assert response.metrics.revenue_summary.total_amount == 0


def test_gemini_narrator_is_skipped_without_a_key(monkeypatch):
    monkeypatch.setattr(settings, "GOOGLE_API_KEY", None)

    assert gemini_narrator("facts") is None


def test_gemini_narrator_degrades_on_any_sdk_failure(monkeypatch):
    class ExplodingClient:
        def __init__(self, **kwargs):
            raise RuntimeError("network down")

    monkeypatch.setattr(settings, "GOOGLE_API_KEY", "key")
    _patch_genai(monkeypatch, ExplodingClient)

    assert gemini_narrator("facts") is None


def _patch_genai(monkeypatch, client_class):
    """Replaces the SDK surface the narrator imports, without any network access."""
    import sys

    import google
    from google.genai import types as genai_types

    module = SimpleNamespace(Client=client_class, types=genai_types)
    monkeypatch.setitem(sys.modules, "google.genai", module)
    monkeypatch.setattr(google, "genai", module, raising=False)
