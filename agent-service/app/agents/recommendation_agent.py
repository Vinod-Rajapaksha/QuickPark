import json
import logging
from typing import Any, List, Optional

from google import genai
from google.genai import types as genai_types
from pydantic import BaseModel, Field, ValidationError

from app.config.settings import settings
from app.models.tool_execution import ToolExecution
from app.tools.search_parking import search_parking

logger = logging.getLogger(__name__)

GEMINI_MODEL = "gemini-3.5-flash"
SYSTEM_INSTRUCTION = (
    "You are a parking recommendation assistant for QuickPark.\n"
    "Generate recommendations for the driver based ONLY on the provided candidate data.\n"
    "Rules:\n"
    "- Use only parking_id values from the candidates above.\n"
    "- Do NOT invent facilities, prices, availability, or distances.\n"
    "- Provide a clear reason for each recommendation.\n"
    "- List which driver preferences each recommendation matches.\n"
    "- Set confidence between 0.0 and 1.0 based on how well the candidate matches preferences.\n"
    "- Rank from most to least suitable.\n"
    "- Return at most 5 recommendations.\n\n"
    "Respond with valid JSON matching this schema:\n"
    '{"recommendations": [{"parking_id": "...", "parking_name": "...", '
    '"rank": 1, "reason": "...", "matched_preferences": ["..."], '
    '"confidence": 0.9}], "summary": "..."}'
)
MAX_RECOMMENDATIONS = 5


class RecommendationRequest(BaseModel):
    destination: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    radius_km: Optional[float] = None
    vehicle_type: Optional[str] = None
    ev_charging_required: bool = False
    max_hourly_rate: Optional[float] = None
    min_hourly_rate: Optional[float] = None
    preferred_date: Optional[str] = None
    notes: Optional[str] = None


class ParkingCandidate(BaseModel):
    facility_id: str
    name: str
    address: Optional[str] = None
    city: Optional[str] = None
    district: Optional[str] = None
    province: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    hourly_rate: Optional[float] = None
    has_ev_charging: bool = False
    available_slots: int = 0
    total_slots: int = 0
    opening_time: Optional[str] = None
    closing_time: Optional[str] = None
    vehicle_types: List[str] = Field(default_factory=list)
    distance_km: Optional[float] = None


class ParkingRecommendation(BaseModel):
    parking_id: str
    parking_name: str
    rank: int
    reason: str
    matched_preferences: List[str] = Field(default_factory=list)
    confidence: float = Field(ge=0.0, le=1.0)
    hourly_rate: Optional[float] = None
    available_slots: Optional[int] = None
    has_ev_charging: Optional[bool] = None
    distance_km: Optional[float] = None


class RecommendationResponse(BaseModel):
    recommendations: List[ParkingRecommendation] = Field(default_factory=list)
    summary: str = ""
    total_candidates: int = 0
    filtered_candidates: int = 0
    tool_executions: List[ToolExecution] = Field(default_factory=list)


class RecommendationError(Exception):
    pass


class RecommendationAgent:
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or settings.GOOGLE_API_KEY or None
        self._gemini_client: Optional[genai.Client] = None

    @property
    def gemini_client(self) -> genai.Client:
        if self._gemini_client is None:
            if not self.api_key:
                raise RecommendationError(
                    "Gemini API key is not configured. Set GOOGLE_API_KEY in environment."
                )
            self._gemini_client = genai.Client(api_key=self.api_key)
        return self._gemini_client

    def generate_recommendations(
        self, request: RecommendationRequest
    ) -> RecommendationResponse:
        tool_executions: List[ToolExecution] = []

        candidates = self._search_candidates(request, tool_executions)
        total_candidates = len(candidates)

        filtered = self._apply_deterministic_filters(request, candidates)
        filtered_count = len(filtered)

        if not filtered:
            return RecommendationResponse(
                recommendations=[],
                summary="No parking facilities match your criteria. Try widening your search radius, removing filters, or searching a different area.",
                total_candidates=total_candidates,
                filtered_candidates=0,
                tool_executions=tool_executions,
            )

        top_candidates = self._rank_candidates(request, filtered)[:MAX_RECOMMENDATIONS]

        try:
            recommendations = self._generate_with_gemini(request, top_candidates)
        except RecommendationError:
            recommendations = self._deterministic_fallback(request, top_candidates)

        recommendations = self._validate_recommendations(recommendations, top_candidates)

        summary = self._build_summary(recommendations)

        return RecommendationResponse(
            recommendations=recommendations,
            summary=summary,
            total_candidates=total_candidates,
            filtered_candidates=filtered_count,
            tool_executions=tool_executions,
        )

    def _search_candidates(
        self, request: RecommendationRequest, tool_executions: List[ToolExecution]
    ) -> List[ParkingCandidate]:
        params = {
            "city": request.destination,
            "latitude": request.latitude,
            "longitude": request.longitude,
            "radius_km": request.radius_km,
            "ev_only": request.ev_charging_required if request.ev_charging_required else None,
            "max_hourly_rate": request.max_hourly_rate,
            "min_hourly_rate": request.min_hourly_rate,
        }
        try:
            raw_results = search_parking(**params)
            execution = ToolExecution(
                tool_name="search_parking",
                input_params={k: v for k, v in params.items() if v is not None},
                output={"count": len(raw_results)},
                status="success",
            )
        except Exception as e:
            execution = ToolExecution(
                tool_name="search_parking",
                input_params={k: v for k, v in params.items() if v is not None},
                status="error",
                error=str(e),
            )
            tool_executions.append(execution)
            raise RecommendationError(f"Parking search failed: {e}") from e

        tool_executions.append(execution)

        candidates = []
        for item in raw_results:
            candidate = self._map_facility_to_candidate(item)
            if candidate:
                candidates.append(candidate)
        return candidates

    def _map_facility_to_candidate(self, facility: dict[str, Any]) -> Optional[ParkingCandidate]:
        try:
            facility_id = facility.get("facilityId") or facility.get("id") or facility.get("FacilityId")
            if not facility_id:
                return None

            allocations = facility.get("allocations") or facility.get("Allocations") or []
            hourly_rate = None
            if allocations:
                rates = [
                    a.get("hourlyRate") or a.get("HourlyRate") or a.get("hourly_rate")
                    for a in allocations
                    if (a.get("hourlyRate") or a.get("HourlyRate") or a.get("hourly_rate")) is not None
                ]
                if rates:
                    hourly_rate = min(rates)

            slot_groups = facility.get("slotGroups") or facility.get("SlotGroups") or []
            available_slots = sum(
                g.get("available", 0) or g.get("Available", 0) for g in slot_groups
            )
            total_slots = sum(
                g.get("total", 0) or g.get("Total", 0) or g.get("numberOfSlots", 0) or g.get("NumberOfSlots", 0)
                for g in slot_groups
            )

            vehicle_types = [
                a.get("vehicleTypeName") or a.get("VehicleTypeName") or a.get("vehicle_type_name") or ""
                for a in allocations
            ]
            vehicle_types = [v for v in vehicle_types if v]

            return ParkingCandidate(
                facility_id=str(facility_id),
                name=facility.get("name") or facility.get("Name") or "Unknown",
                address=facility.get("address") or facility.get("Address"),
                city=facility.get("city") or facility.get("City"),
                district=facility.get("district") or facility.get("District"),
                province=facility.get("province") or facility.get("Province"),
                latitude=facility.get("latitude") or facility.get("Latitude"),
                longitude=facility.get("longitude") or facility.get("Longitude"),
                hourly_rate=hourly_rate,
                has_ev_charging=facility.get("hasEvCharging") or facility.get("HasEvCharging") or False,
                available_slots=available_slots,
                total_slots=total_slots,
                opening_time=facility.get("openingTime") or facility.get("OpeningTime"),
                closing_time=facility.get("closingTime") or facility.get("ClosingTime"),
                vehicle_types=vehicle_types,
                distance_km=facility.get("distanceKm") or facility.get("DistanceKm"),
            )
        except (KeyError, TypeError, ValidationError):
            return None

    def _apply_deterministic_filters(
        self, request: RecommendationRequest, candidates: List[ParkingCandidate]
    ) -> List[ParkingCandidate]:
        filtered = candidates

        if request.ev_charging_required:
            filtered = [c for c in filtered if c.has_ev_charging]

        if request.max_hourly_rate is not None:
            filtered = [
                c for c in filtered
                if c.hourly_rate is None or c.hourly_rate <= request.max_hourly_rate
            ]

        if request.min_hourly_rate is not None:
            filtered = [
                c for c in filtered
                if c.hourly_rate is None or c.hourly_rate >= request.min_hourly_rate
            ]

        if request.vehicle_type:
            vt = request.vehicle_type.upper()
            filtered = [
                c for c in filtered
                if not c.vehicle_types or vt in [v.upper() for v in c.vehicle_types]
            ]

        return filtered

    def _rank_candidates(
        self, request: RecommendationRequest, candidates: List[ParkingCandidate]
    ) -> List[ParkingCandidate]:
        def sort_key(c: ParkingCandidate) -> tuple:
            availability_score = 0 if c.available_slots > 0 else 1
            distance_score = c.distance_km if c.distance_km is not None else 9999
            rate_score = c.hourly_rate if c.hourly_rate is not None else 9999
            return (availability_score, distance_score, rate_score)

        return sorted(candidates, key=sort_key)

    def _generate_with_gemini(
        self, request: RecommendationRequest, candidates: List[ParkingCandidate]
    ) -> List[ParkingRecommendation]:
        candidate_data = [
            {k: v for k, v in {
                "parking_id": c.facility_id,
                "name": c.name,
                "city": c.city,
                "hourly_rate": c.hourly_rate,
                "available_slots": c.available_slots,
                "total_slots": c.total_slots,
                "has_ev_charging": c.has_ev_charging,
                "distance_km": c.distance_km,
                "vehicle_types": c.vehicle_types,
            }.items() if v is not None and v != []}
            for c in candidates
        ]

        user_context = {k: v for k, v in {
            "destination": request.destination,
            "ev_charging_required": request.ev_charging_required,
            "max_hourly_rate": request.max_hourly_rate,
            "vehicle_type": request.vehicle_type,
            "notes": request.notes,
        }.items() if v is not None}

        prompt = (
            f"Driver preferences: {json.dumps(user_context)}\n\n"
            f"Available parking candidates (pre-ranked by availability, distance, price):\n"
            f"{json.dumps(candidate_data, indent=2)}\n"
        )

        try:
            response = self.gemini_client.models.generate_content(
                model=GEMINI_MODEL,
                contents=prompt,
                config=genai_types.GenerateContentConfig(
                    system_instruction=SYSTEM_INSTRUCTION,
                    response_mime_type="application/json",
                    temperature=0.3,
                    max_output_tokens=2048,
                ),
            )
        except Exception as e:
            error_msg = str(e)
            if "API key" in error_msg or "permission" in error_msg.lower():
                raise RecommendationError("Gemini API authentication failed.") from e
            raise RecommendationError(f"Gemini API call failed: {error_msg}") from e

        try:
            text = response.text
            parsed = json.loads(text)
        except (json.JSONDecodeError, AttributeError) as e:
            raise RecommendationError(f"Gemini returned malformed response: {e}") from e

        recommendations = []
        for item in parsed.get("recommendations", []):
            try:
                rec = ParkingRecommendation(
                    parking_id=str(item["parking_id"]),
                    parking_name=item.get("parking_name", ""),
                    rank=int(item.get("rank", len(recommendations) + 1)),
                    reason=item.get("reason", ""),
                    matched_preferences=item.get("matched_preferences", []),
                    confidence=float(item.get("confidence", 0.5)),
                )
                recommendations.append(rec)
            except (KeyError, ValueError, TypeError):
                continue

        if not recommendations:
            raise RecommendationError("Gemini returned no valid recommendations.")

        return recommendations

    def _validate_recommendations(
        self, recommendations: List[ParkingRecommendation], candidates: List[ParkingCandidate]
    ) -> List[ParkingRecommendation]:
        candidate_map = {c.facility_id: c for c in candidates}
        valid = []

        for rec in recommendations:
            if rec.parking_id not in candidate_map:
                logger.warning(
                    "Gemini recommended non-existent parking_id: %s — rejected.",
                    rec.parking_id,
                )
                continue

            candidate = candidate_map[rec.parking_id]
            rec.parking_name = candidate.name
            rec.hourly_rate = candidate.hourly_rate
            rec.available_slots = candidate.available_slots
            rec.has_ev_charging = candidate.has_ev_charging
            rec.distance_km = candidate.distance_km
            valid.append(rec)

        return sorted(valid, key=lambda r: r.rank)[:MAX_RECOMMENDATIONS]

    def _deterministic_fallback(
        self, request: RecommendationRequest, candidates: List[ParkingCandidate]
    ) -> List[ParkingRecommendation]:
        recommendations = []
        for i, c in enumerate(candidates):
            matched = []
            if request.ev_charging_required and c.has_ev_charging:
                matched.append("EV charging available")
            if request.max_hourly_rate and c.hourly_rate and c.hourly_rate <= request.max_hourly_rate:
                matched.append(f"Within budget ({c.hourly_rate} LKR/hr)")
            if request.vehicle_type and request.vehicle_type.upper() in [v.upper() for v in c.vehicle_types]:
                matched.append(f"Supports {request.vehicle_type}")
            if c.available_slots > 0:
                matched.append(f"{c.available_slots} slots available")

            reason = (
                f"{c.name} in {c.city or 'the area'}"
                + (f" at {c.hourly_rate} LKR/hr" if c.hourly_rate else "")
                + (f" with {c.available_slots} slots free" if c.available_slots else "")
                + (", EV charging available" if c.has_ev_charging else "")
                + "."
            )

            confidence = min(0.5 + len(matched) * 0.15, 0.95)

            recommendations.append(
                ParkingRecommendation(
                    parking_id=c.facility_id,
                    parking_name=c.name,
                    rank=i + 1,
                    reason=reason,
                    matched_preferences=matched,
                    confidence=confidence,
                    hourly_rate=c.hourly_rate,
                    available_slots=c.available_slots,
                    has_ev_charging=c.has_ev_charging,
                    distance_km=c.distance_km,
                )
            )
        return recommendations

    def _build_summary(self, recommendations: List[ParkingRecommendation]) -> str:
        if not recommendations:
            return "No suitable parking could be recommended for your criteria."
        top = recommendations[0]
        count = len(recommendations)
        return (
            f"Found {count} recommended parking option{'s' if count > 1 else ''}. "
            f"Top pick: {top.parking_name} "
            f"(confidence: {top.confidence:.0%})."
        )
