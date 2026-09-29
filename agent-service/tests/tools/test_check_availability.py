import pytest
from unittest.mock import MagicMock
from app.tools.check_availability import check_availability
from app.services.reservation_service import ReservationService

def test_check_availability():
    mock_service = MagicMock(spec=ReservationService)
    mock_service.check_availability.return_value = {"available": True}
    
    result = check_availability(
        facility_id="fac-1",
        start_time="2024-01-01T10:00:00Z",
        end_time="2024-01-01T12:00:00Z",
        vehicle_type="CAR",
        reservation_service=mock_service
    )
    
    assert result == {"available": True}
    mock_service.check_availability.assert_called_once_with(
        facility_id="fac-1",
        start_time="2024-01-01T10:00:00Z",
        end_time="2024-01-01T12:00:00Z",
        vehicle_type="CAR"
    )
