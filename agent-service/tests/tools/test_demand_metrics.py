from datetime import datetime, timezone
from decimal import Decimal

import pytest

from app.models.demand_analysis import DemandReservation
from app.tools.demand_metrics import (
    ALL_HOURS,
    USER_TIMEZONE,
    build_prompt_facts,
    compute_demand_metrics,
    deterministic_narrative,
)

DATE_FROM = datetime(2026, 9, 1, tzinfo=timezone.utc)
DATE_TO = datetime(2026, 9, 8, tzinfo=timezone.utc)

DRIVER_PII = {
    "driverId": "11111111-1111-1111-1111-111111111111",
    "driverName": "Nimal Perera",
    "driverPhone": "+94770000000",
    "slotNumber": "A-12",
    "cancelReason": "changed plans",
}


def make_reservation(**overrides) -> DemandReservation:
    payload = {
        "facilityId": "facility-1",
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
    }
    payload.update(overrides)
    return DemandReservation.model_validate(payload)


def analyse(rows, **kwargs):
    options = {"date_from": DATE_FROM, "date_to": DATE_TO}
    options.update(kwargs)
    return compute_demand_metrics(rows, **options)


def test_empty_dataset_is_safe():
    metrics = analyse([])

    assert metrics.total_reservations == 0
    assert metrics.reservations_by_facility == {}
    assert metrics.reservations_by_vehicle_type == {}
    assert metrics.reservations_by_date == []
    assert metrics.reservations_by_status == {}
    assert metrics.average_booking_hours is None
    assert metrics.cancellation_rate is None
    assert metrics.no_show_rate is None
    assert metrics.peak_periods == []
    assert metrics.low_demand_periods == []
    assert metrics.revenue_summary.total_amount == Decimal("0")
    assert metrics.revenue_summary.average_booking_value is None


def test_total_counts_every_status():
    metrics = analyse([
        make_reservation(),
        make_reservation(status="CANCELLED"),
        make_reservation(status="NOSHOW"),
        make_reservation(status="COMPLETED"),
    ])

    assert metrics.total_reservations == 4
    assert metrics.reservations_by_status == {"CANCELLED": 1, "NOSHOW": 1, "COMPLETED": 1, "CONFIRMED": 1}
    assert metrics.counted_statuses == ["COMPLETED", "CONFIRMED"]


def test_grouping_by_facility_and_vehicle_type():
    metrics = analyse([
        make_reservation(facilityName="Central Tower", vehicleTypeName="Car"),
        make_reservation(facilityName="Central Tower", vehicleTypeName="Van"),
        make_reservation(facilityName="Airport Lot", vehicleTypeName="Car"),
        make_reservation(facilityName="Airport Lot", vehicleTypeName="Car"),
    ])

    assert metrics.reservations_by_facility == {"Airport Lot": 2, "Central Tower": 2}
    assert list(metrics.reservations_by_facility) == ["Airport Lot", "Central Tower"]
    assert metrics.reservations_by_vehicle_type == {"Car": 3, "Van": 1}


def test_cancelled_and_noshow_are_excluded_from_grouped_demand():
    metrics = analyse([
        make_reservation(facilityName="Central Tower"),
        make_reservation(facilityName="Central Tower", status="CANCELLED"),
        make_reservation(facilityName="Airport Lot", status="NOSHOW"),
    ])

    assert metrics.reservations_by_facility == {"Central Tower": 1}
    assert metrics.total_reservations == 3


def test_hour_buckets_are_zero_filled_and_sorted():
    metrics = analyse([
        make_reservation(startTime="2026-09-02T05:00:00+00:00"),
        make_reservation(startTime="2026-09-03T05:20:00+00:00"),
    ])

    hours = {bucket.period: bucket.count for bucket in metrics.reservations_by_hour}
    assert [bucket.period for bucket in metrics.reservations_by_hour] == list(ALL_HOURS)
    # 05:00Z and 05:20Z are 10:30 and 10:50 in Asia/Colombo.
    assert hours["10"] == 2
    assert hours["05"] == 0


def test_date_buckets_use_local_dates():
    metrics = analyse([
        make_reservation(startTime="2026-09-01T20:00:00+00:00"),
        make_reservation(startTime="2026-09-02T18:00:00+00:00"),
    ])

    # 2026-09-01T20:00Z is already 2026-09-02 01:30 local; 18:00Z is 23:30 local.
    assert [bucket.period for bucket in metrics.reservations_by_date] == ["2026-09-02"]
    assert metrics.reservations_by_date[0].count == 2
    assert metrics.time_window.timezone == USER_TIMEZONE


def test_average_booking_hours_uses_billed_hours():
    metrics = analyse([
        make_reservation(hours=1),
        make_reservation(hours=5),
        make_reservation(hours=2, status="CANCELLED"),
    ])

    assert metrics.average_booking_hours == 3.0


def test_cancellation_and_no_show_rates():
    rows = [make_reservation(status=s) for s in ("COMPLETED", "CONFIRMED", "CANCELLED", "NOSHOW")]
    metrics = analyse(rows[:3])

    assert metrics.cancellation_rate == 0.3333
    assert metrics.no_show_rate == 0.0

    assert analyse(rows).cancellation_rate == 0.25
    assert analyse(rows).no_show_rate == 0.25


def test_revenue_excludes_cancelled_and_no_show():
    metrics = analyse([
        make_reservation(totalAmount="100.00", commissionAmount="10.00", providerAmount="90.00"),
        make_reservation(totalAmount="250.00", commissionAmount="25.00", providerAmount="225.00"),
        make_reservation(totalAmount="999.00", status="CANCELLED"),
        make_reservation(totalAmount="999.00", status="NOSHOW"),
    ])

    revenue = metrics.revenue_summary
    assert revenue.total_amount == Decimal("350.00")
    assert revenue.total_commission == Decimal("35.00")
    assert revenue.total_provider_amount == Decimal("315.00")
    assert revenue.average_booking_value == Decimal("175.00")


def test_peak_and_low_demand_periods():
    metrics = analyse([
        make_reservation(startTime="2026-09-02T11:00:00+00:00"),
        make_reservation(startTime="2026-09-02T11:00:00+00:00"),
        make_reservation(startTime="2026-09-03T01:00:00+00:00"),
    ])

    assert [p.count for p in metrics.peak_periods] == sorted(
        (p.count for p in metrics.peak_periods), reverse=True
    )
    assert metrics.peak_periods[0].count == 2
    assert all(p.count == 0 for p in metrics.low_demand_periods)
    assert len(metrics.peak_periods) <= 5


def test_only_bookings_starting_in_window_are_counted():
    metrics = analyse([
        make_reservation(startTime="2026-08-31T22:00:00+00:00", endTime="2026-09-01T02:00:00+00:00"),
        make_reservation(startTime="2026-09-07T23:00:00+00:00"),
        make_reservation(startTime="2026-09-08T01:00:00+00:00"),
    ])

    # The first starts before the window; the last starts on or after its end.
    assert metrics.total_reservations == 1
    assert metrics.time_window.basis == "Reservations counted by StartTime inside [date_from, date_to)."


def test_naive_timestamps_are_read_as_utc():
    metrics = compute_demand_metrics(
        [make_reservation(startTime=datetime(2026, 9, 2, 5), endTime=datetime(2026, 9, 2, 8))],
        date_from=DATE_FROM,
        date_to=DATE_TO,
    )

    assert metrics.total_reservations == 1
    assert metrics.reservations_by_hour[10].count == 1


def test_invalid_date_range_is_rejected():
    with pytest.raises(ValueError) as exc:
        analyse([], date_from=DATE_TO, date_to=DATE_FROM)
    assert "date_to must be after date_from" in str(exc.value)


def test_driver_pii_never_enters_the_model():
    row = DemandReservation.model_validate(
        {
            "facilityId": "f", "facilityName": "F", "vehicleTypeId": "v",
            "vehicleTypeName": "Car", "startTime": "2026-09-02T05:00:00+00:00",
            "endTime": "2026-09-02T08:00:00+00:00", "hours": 3,
            "totalAmount": "1", "commissionAmount": "0", "providerAmount": "1",
            "status": "CONFIRMED", **DRIVER_PII,
        }
    )

    dumped = row.model_dump()
    assert "driverName" not in dumped
    assert "driverPhone" not in dumped
    assert "driverId" not in dumped


def test_metrics_and_prompt_are_free_of_driver_pii():
    forged = DemandReservation.model_validate(
        {**make_reservation().model_dump(by_alias=True), **DRIVER_PII}
    )

    metrics = analyse([forged])
    rendered = metrics.model_dump_json() + build_prompt_facts(metrics, ["Central Tower"])

    for value in DRIVER_PII.values():
        assert value not in rendered


def test_deterministic_narrative_restates_only_calculated_facts():
    metrics = analyse([
        make_reservation(facilityName="Central Tower", startTime="2026-09-02T11:00:00+00:00"),
        make_reservation(facilityName="Central Tower", startTime="2026-09-02T11:00:00+00:00"),
    ])

    narrative = deterministic_narrative(metrics)

    assert "2 reservation records" in narrative.summary
    assert "Highest-demand facility: Central Tower (2 reservations)." in narrative.insights
    assert any("Peak hours" in line for line in narrative.insights)
    assert narrative.recommendations


def test_deterministic_narrative_handles_no_data():
    narrative = deterministic_narrative(analyse([]))

    assert "0 reservation records" in narrative.summary
    assert narrative.recommendations == [
        "No reservations in this window; widen the date range before drawing conclusions."
    ]
