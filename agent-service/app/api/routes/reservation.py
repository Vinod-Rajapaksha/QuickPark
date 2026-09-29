from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any

from app.agents.reservation_agent import ReservationAgent

router = APIRouter()
agent = ReservationAgent()

class AvailabilityRequest(BaseModel):
    facility_id: str
    start_time: str
    end_time: str
    vehicle_type: str

class PriceRequest(BaseModel):
    facility_id: str
    start_time: str
    end_time: str
    vehicle_type: str

class CreateReservationRequest(BaseModel):
    payload: dict
    token: str

@router.post("/check-availability", summary="Check reservation availability")
def check_availability(req: AvailabilityRequest):
    return agent.check_availability(req.facility_id, req.start_time, req.end_time, req.vehicle_type)

@router.post("/calculate-price", summary="Calculate reservation price")
def calculate_price(req: PriceRequest):
    return agent.calculate_price(req.facility_id, req.start_time, req.end_time, req.vehicle_type)

@router.post("/create", summary="Create reservation")
def create_reservation(req: CreateReservationRequest):
    return agent.create_reservation(req.payload, req.token)
