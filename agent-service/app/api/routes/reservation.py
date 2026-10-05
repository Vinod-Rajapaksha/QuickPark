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
    from app.agents.validation_agent import ValidationAgent
    from app.models.validation import ValidationStatus
    
    validator = ValidationAgent()
    validation_payload = {
        "parking_id": req.payload.get("facilityId"),
        "start_time": req.payload.get("startTime"),
        "end_time": req.payload.get("endTime"),
    }
    validation_result = validator.validate(
        agent="reservation_agent",
        action="create_reservation",
        output=validation_payload
    )
    
    if validation_result.status == ValidationStatus.REJECTED:
        raise HTTPException(status_code=400, detail=str(validation_result.issues))
        
    return agent.create_reservation(req.payload, req.token)
