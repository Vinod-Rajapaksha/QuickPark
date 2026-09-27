from datetime import datetime
from decimal import Decimal
from typing import Literal, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, model_validator

# Statuses whose bookings never materialise; they are excluded from demand and
# revenue metrics but still counted in reservations_by_status.
NON_MATERIALISED_STATUSES = ("CANCELLED", "NOSHOW")


class DemandAnalyzeRequest(BaseModel):
    date_from: datetime
    date_to: datetime
    facility_id: Optional[UUID] = None

    @model_validator(mode="after")
    def check_window(self):
        if self.date_to <= self.date_from:
            raise ValueError("date_to must be after date_from")
        return self


class DemandReservation(BaseModel):
    """PII-free projection of the backend ReservationResponse.

    Unknown fields (driver name/phone/id, slot number, ...) are dropped on
    construction, so they cannot reach the metrics tool or the LLM prompt.
    """

    model_config = ConfigDict(populate_by_name=True)

    facility_id: str = Field(alias="facilityId")
    facility_name: str = Field(alias="facilityName")
    vehicle_type_id: str = Field(alias="vehicleTypeId")
    vehicle_type_name: str = Field(alias="vehicleTypeName")
    start_time: datetime = Field(alias="startTime")
    end_time: datetime = Field(alias="endTime")
    hours: Decimal
    total_amount: Decimal = Field(alias="totalAmount")
    commission_amount: Decimal = Field(alias="commissionAmount")
    provider_amount: Decimal = Field(alias="providerAmount")
    status: str


class FacilityContext(BaseModel):
    """Provider-owned property used to validate a filter and to describe demand."""

    model_config = ConfigDict(populate_by_name=True)

    facility_id: str = Field(alias="facilityId")
    name: str
    city: str = ""
    province: str = ""
    district: str = ""
    opening_time: Optional[str] = Field(default=None, alias="openingTime")
    closing_time: Optional[str] = Field(default=None, alias="closingTime")
    slot_count: int = Field(default=0, alias="slotCount")


class TimeWindow(BaseModel):
    date_from: datetime
    date_to: datetime
    timezone: str
    basis: str


class PeriodCount(BaseModel):
    period: str
    count: int


class RevenueSummary(BaseModel):
    total_amount: Decimal
    total_commission: Decimal
    total_provider_amount: Decimal
    average_booking_value: Optional[Decimal]


class DemandMetricsResult(BaseModel):
    time_window: TimeWindow
    total_reservations: int
    counted_statuses: list[str] = Field(
        default_factory=list,
        description="Statuses behind demand, duration and revenue metrics.",
    )
    reservations_by_facility: dict[str, int]
    reservations_by_vehicle_type: dict[str, int]
    reservations_by_date: list[PeriodCount]
    reservations_by_hour: list[PeriodCount]
    reservations_by_status: dict[str, int]
    average_booking_hours: Optional[float]
    cancellation_rate: Optional[float]
    no_show_rate: Optional[float]
    revenue_summary: RevenueSummary
    peak_periods: list[PeriodCount]
    low_demand_periods: list[PeriodCount]


class NarrativeAnalysis(BaseModel):
    summary: str
    insights: list[str] = Field(default_factory=list)
    recommendations: list[str] = Field(default_factory=list)


class DemandAnalysisResponse(BaseModel):
    metrics: DemandMetricsResult
    analysis: Optional[NarrativeAnalysis] = None
    analysis_source: Literal["deterministic", "gemini", "gemini_fallback"]
