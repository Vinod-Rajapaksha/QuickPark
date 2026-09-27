import logging
from typing import Dict, Any

from app.tools.check_availability import check_availability
from app.tools.calculate_price import calculate_price
from app.tools.create_reservation import create_reservation
from app.utils.decorators import handle_agent_errors

logger = logging.getLogger(__name__)

class ReservationAgent:
    def __init__(self):
        pass

    @handle_agent_errors()
    def check_availability(self, facility_id: str, start_time: str, end_time: str, vehicle_type: str) -> Dict[str, Any]:
        logger.info(f"Checking availability for facility {facility_id}")
        return check_availability(facility_id, start_time, end_time, vehicle_type)

    @handle_agent_errors()
    def calculate_price(self, facility_id: str, start_time: str, end_time: str, vehicle_type: str) -> Dict[str, Any]:
        logger.info(f"Calculating price for facility {facility_id}")
        return calculate_price(facility_id, start_time, end_time, vehicle_type)

    @handle_agent_errors()
    def create_reservation(self, payload: dict, token: str) -> Dict[str, Any]:
        logger.info(f"Creating reservation")
        return create_reservation(payload, token)
