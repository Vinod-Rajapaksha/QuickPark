"""Deterministic parking-demand metrics.

Pure calculation layer: it receives PII-free reservation records and returns a
structured result. No network access, no LLM, no thresholds of judgement.
"""

from collections import Counter
from datetime import datetime, timedelta, timezone, tzinfo
from decimal import Decimal
from typing import Iterable, List, Optional, Sequence, Tuple
from zoneinfo import ZoneInfo

from app.models.demand_analysis import (
    NON_MATERIALISED_STATUSES,
    DemandMetricsResult,
    DemandReservation,
    NarrativeAnalysis,
    PeriodCount,
    RevenueSummary,
    TimeWindow,
)

USER_TIMEZONE = "Asia/Colombo"
# Window is half-open on booking start: [date_from, date_to).
WINDOW_BASIS = "Reservations counted by StartTime inside [date_from, date_to)."
TOP_PERIOD_COUNT = 5
# Sri Lanka is UTC+5:30 year round; used when the tz database is unavailable.
_COLOMBO_FALLBACK = timezone(timedelta(hours=5, minutes=30), "Asia/Colombo")

ZERO = Decimal("0")
ALL_HOURS: Tuple[str, ...] = tuple(f"{h:02d}" for h in range(24))


def resolve_timezone(name: str) -> tzinfo:
    try:
        return ZoneInfo(name)
    except Exception:
        return _COLOMBO_FALLBACK


def _as_utc(moment: datetime) -> datetime:
    return moment.replace(tzinfo=timezone.utc) if moment.tzinfo is None else moment


def _label(value: str) -> str:
    return value.strip() or "Unlabelled"


def _rate(part: int, whole: int) -> Optional[float]:
    if whole == 0:
        return None
    return round(part / whole, 4)


def _ranked(counter: Counter) -> dict:
    ordered = sorted(counter.items(), key=lambda item: (-item[1], item[0]))
    return {name: count for name, count in ordered}


def _peak_periods(counter: Counter) -> List[PeriodCount]:
    busy = sorted(
        ((h, c) for h, c in ((hour, counter.get(hour, 0)) for hour in ALL_HOURS) if c > 0),
        key=lambda item: (-item[1], item[0]),
    )
    return [PeriodCount(period=h, count=c) for h, c in busy[:TOP_PERIOD_COUNT]]


def _low_demand_periods(counter: Counter) -> List[PeriodCount]:
    empty = [h for h in ALL_HOURS if counter.get(h, 0) == 0]
    return [PeriodCount(period=h, count=0) for h in empty[:TOP_PERIOD_COUNT]]


def compute_demand_metrics(
    reservations: Sequence[DemandReservation],
    *,
    date_from: datetime,
    date_to: datetime,
    timezone_name: str = USER_TIMEZONE,
) -> DemandMetricsResult:
    """Aggregate reservations into the facts an owner reports on."""
    if date_to <= date_from:
        raise ValueError("date_to must be after date_from")

    zone = resolve_timezone(timezone_name)
    start = _as_utc(date_from).astimezone(zone)
    end = _as_utc(date_to).astimezone(zone)

    in_window = [r for r in reservations if start <= _as_utc(r.start_time).astimezone(zone) < end]
    counted = [r for r in in_window if r.status.upper() not in NON_MATERIALISED_STATUSES]

    by_status = Counter(r.status.upper() for r in in_window)
    by_facility = Counter(_label(r.facility_name) for r in counted)
    by_vehicle = Counter(_label(r.vehicle_type_name) for r in counted)
    by_date: Counter = Counter(
        _as_utc(r.start_time).astimezone(zone).date().isoformat() for r in counted
    )
    by_hour_counter: Counter = Counter(
        _as_utc(r.start_time).astimezone(zone).strftime("%H") for r in counted
    )
    by_hour = [PeriodCount(period=h, count=by_hour_counter.get(h, 0)) for h in ALL_HOURS]

    hours_total = sum((r.hours for r in counted), ZERO)
    average_hours = float(hours_total) / len(counted) if counted else None
    revenue = _revenue(counted)

    has_demand = bool(counted)
    return DemandMetricsResult(
        time_window=TimeWindow(
            date_from=start,
            date_to=end,
            timezone=timezone_name,
            basis=WINDOW_BASIS,
        ),
        total_reservations=len(in_window),
        counted_statuses=sorted({r.status.upper() for r in counted}),
        reservations_by_facility=_ranked(by_facility),
        reservations_by_vehicle_type=_ranked(by_vehicle),
        reservations_by_date=[PeriodCount(period=p, count=c) for p, c in sorted(by_date.items())],
        reservations_by_hour=by_hour,
        reservations_by_status=_ranked(by_status),
        average_booking_hours=round(average_hours, 2) if average_hours is not None else None,
        cancellation_rate=_rate(by_status.get("CANCELLED", 0), len(in_window)),
        no_show_rate=_rate(by_status.get("NOSHOW", 0), len(in_window)),
        revenue_summary=revenue,
        peak_periods=_peak_periods(by_hour_counter) if has_demand else [],
        low_demand_periods=_low_demand_periods(by_hour_counter) if has_demand else [],
    )


def _revenue(counted: Iterable[DemandReservation]) -> RevenueSummary:
    records = list(counted)
    total = sum((r.total_amount for r in records), ZERO)
    commission = sum((r.commission_amount for r in records), ZERO)
    provider = sum((r.provider_amount for r in records), ZERO)
    average = (
        (total / len(records)).quantize(Decimal("0.01")) if records else None
    )
    return RevenueSummary(
        total_amount=total,
        total_commission=commission,
        total_provider_amount=provider,
        average_booking_value=average,
    )


def deterministic_narrative(metrics: DemandMetricsResult) -> NarrativeAnalysis:
    """Plain restatement of the calculated facts; used when Gemini is unavailable."""
    facts = metrics.model_dump()
    window = facts["time_window"]
    summary = (
        f"{facts['total_reservations']} reservation records fall in "
        f"{window['date_from']} .. {window['date_to']} ({window['timezone']}). "
        f"Demand and revenue count these statuses: "
        f"{', '.join(facts['counted_statuses']) or 'none'}."
    )

    insights: List[str] = []
    if facts["reservations_by_facility"]:
        name, count = next(iter(facts["reservations_by_facility"].items()))
        insights.append(f"Highest-demand facility: {name} ({count} reservations).")
    if facts["reservations_by_vehicle_type"]:
        name, count = next(iter(facts["reservations_by_vehicle_type"].items()))
        insights.append(f"Highest-demand vehicle type: {name} ({count} reservations).")
    if facts["peak_periods"]:
        peak = ", ".join(f"{p['period']}:00 ({p['count']})" for p in facts["peak_periods"])
        insights.append(f"Peak hours: {peak}.")
    if facts["reservations_by_date"]:
        busiest = max(facts["reservations_by_date"], key=lambda p: p["count"])
        insights.append(f"Busiest date: {busiest['period']} ({busiest['count']} reservations).")
    if facts["average_booking_hours"] is not None:
        insights.append(f"Average booking duration: {facts['average_booking_hours']} hours.")
    if facts["cancellation_rate"] is not None:
        insights.append(f"Cancellation rate: {facts['cancellation_rate'] * 100:.1f}%.")
    if facts["no_show_rate"] is not None:
        insights.append(f"No-show rate: {facts['no_show_rate'] * 100:.1f}%.")
    revenue = facts["revenue_summary"]
    insights.append(
        f"Revenue across counted bookings: {revenue['total_amount']} "
        f"(platform commission {revenue['total_commission']}, "
        f"provider share {revenue['total_provider_amount']})."
    )

    recommendations: List[str] = []
    if facts["low_demand_periods"]:
        low = ", ".join(p["period"] + ":00" for p in facts["low_demand_periods"])
        recommendations.append(f"Quietest hours are {low}; pricing or promotion decisions sit with the owner.")
    if facts["peak_periods"]:
        peak = ", ".join(p["period"] + ":00" for p in facts["peak_periods"])
        recommendations.append(f"Busiest hours are {peak}; bay staffing and maintenance can be planned around them.")
    if facts["total_reservations"] == 0:
        recommendations.append("No reservations in this window; widen the date range before drawing conclusions.")

    return NarrativeAnalysis(summary=summary, insights=insights, recommendations=recommendations)


def build_prompt_facts(metrics: DemandMetricsResult, facility_names: Sequence[str]) -> str:
    """Deterministic facts handed to the LLM. Numbers are already calculated here."""
    context = ", ".join(facility_names) if facility_names else "none"
    return (
        "QuickPark parking demand facts, calculated deterministically. "
        f"Provider facilities in scope: {context}. "
        "Interpret only these values; never invent or recompute numbers.\n"
        f"{metrics.model_dump_json(exclude_none=True, exclude_defaults=True)}"
    )
