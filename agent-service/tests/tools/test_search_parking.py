import pytest
from unittest.mock import MagicMock
from app.tools.search_parking import search_parking
from app.services.parking_service import ParkingService

def test_search_parking():
    mock_service = MagicMock(spec=ParkingService)
    mock_service.search_facilities.return_value = [{"id": "fac-1"}]
    
    result = search_parking(
        city="Kandy",
        radius_km=5.0,
        parking_service=mock_service
    )
    
    assert result == [{"id": "fac-1"}]
    mock_service.search_facilities.assert_called_once_with(
        city="Kandy",
        latitude=None,
        longitude=None,
        radius_km=5.0,
        ev_only=None,
        max_hourly_rate=None,
        min_hourly_rate=None
    )
