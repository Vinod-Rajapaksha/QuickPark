import pytest
from unittest.mock import MagicMock
from app.tools.calculate_price import calculate_price
from app.services.reservation_service import ReservationService

def test_calculate_price():
    mock_service = MagicMock(spec=ReservationService)
    mock_service.calculate_price.return_value = {"price": 150.0}
    
    result = calculate_price(
        facility_id="fac-1",
        start_time="2024-01-01T10:00:00Z",
        end_time="2024-01-01T12:00:00Z",
        vehicle_type="CAR",
        reservation_service=mock_service
    )
    
    assert result == {"price": 150.0}
    mock_service.calculate_price.assert_called_once_with(
        facility_id="fac-1",
        start_time="2024-01-01T10:00:00Z",
        end_time="2024-01-01T12:00:00Z",
        vehicle_type="CAR"
    )
