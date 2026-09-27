from datetime import datetime
from typing import Callable, List, Optional
from uuid import UUID

from app.config.settings import settings
from app.models.demand_analysis import (
    DemandAnalysisResponse,
    DemandMetricsResult,
    FacilityContext,
    NarrativeAnalysis,
)
from app.services.api_client import ApiClient
from app.services.parking_service import ParkingService
from app.services.reservation_service import ReservationService
from app.tools.demand_metrics import (
    build_prompt_facts,
    compute_demand_metrics,
    deterministic_narrative,
)

GEMINI_MODEL = "gemini-1.5-flash"
SYSTEM_INSTRUCTION = (
    "You are a parking analyst for a QuickPark facility owner. You are given "
    "already-calculated demand facts. Explain and prioritise them for the owner. "
    "Never state a number that is not present in the input and never calculate a "
    "new one. Do not mention or infer any driver identity. Reply in JSON."
)

Narrator = Callable[[str], Optional[NarrativeAnalysis]]


class DemandAnalysisError(Exception):
    pass


def gemini_narrator(facts: str) -> Optional[NarrativeAnalysis]:
    """Optional interpretation layer. Any failure degrades to the deterministic report."""
    api_key = settings.GOOGLE_API_KEY
    if not api_key:
        return None

    try:
        from google import genai
        from google.genai import types

        client = genai.Client(api_key=api_key)
        response = client.models.generate_content(
            model=GEMINI_MODEL,
            contents=facts,
            config=types.GenerateContentConfig(
                system_instruction=SYSTEM_INSTRUCTION,
                response_mime_type="application/json",
                response_schema=NarrativeAnalysis,
            ),
        )
        parsed = getattr(response, "parsed", None)
        if isinstance(parsed, dict):
            parsed = NarrativeAnalysis.model_validate(parsed)
        return parsed if isinstance(parsed, NarrativeAnalysis) else None
    except Exception:
        return None


class ParkingDemandAgent:
    def __init__(
        self,
        reservations: Optional[ReservationService] = None,
        facilities: Optional[ParkingService] = None,
        narrator: Optional[Narrator] = None,
    ):
        client = ApiClient()
        self._reservations = reservations if reservations is not None else ReservationService(client)
        self._facilities = facilities if facilities is not None else ParkingService(client)
        self._narrator = narrator if narrator is not None else gemini_narrator

    def analyze(
        self,
        *,
        token: str,
        date_from: datetime,
        date_to: datetime,
        facility_id: Optional[UUID] = None,
    ) -> DemandAnalysisResponse:
        if date_to <= date_from:
            raise DemandAnalysisError("date_to must be after date_from")

        owned = self._facilities.get_provider_facilities(token=token)
        scope = self._facilities.find(owned, facility_id)
        if facility_id is not None and scope is None:
            raise DemandAnalysisError("Facility not found for this provider.")

        rows = self._reservations.get_provider_reservations(
            token=token, date_from=date_from, date_to=date_to, facility_id=facility_id
        )
        metrics = compute_demand_metrics(rows, date_from=date_from, date_to=date_to)

        return self._with_narration(metrics, _scope_names(owned, scope))

    def _with_narration(
        self, metrics: DemandMetricsResult, facility_names: List[str]
    ) -> DemandAnalysisResponse:
        narrated = bool(settings.GOOGLE_API_KEY)
        analysis = self._narrator(build_prompt_facts(metrics, facility_names)) if narrated else None

        if analysis is not None:
            return DemandAnalysisResponse(
                metrics=metrics, analysis=analysis, analysis_source="gemini"
            )

        return DemandAnalysisResponse(
            metrics=metrics,
            analysis=deterministic_narrative(metrics),
            analysis_source="gemini_fallback" if narrated else "deterministic",
        )


def _scope_names(owned: List[FacilityContext], scope: Optional[FacilityContext]) -> List[str]:
    if scope is not None:
        return [scope.name]
    return [facility.name for facility in owned]
