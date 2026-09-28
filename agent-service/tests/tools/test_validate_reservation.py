import pytest
from unittest.mock import MagicMock
from app.tools.validate_reservation import validate_reservation
from app.services.reservation_service import ReservationService

def test_validate_reservation():
    mock_service = MagicMock(spec=ReservationService)
    mock_service.validate_reservation.return_value = {"valid": True}
    
    payload = {"facility_id": "fac-1"}
    token = "my-token"
    result = validate_reservation(payload, token, mock_service)
    
    assert result == {"valid": True}
    mock_service.validate_reservation.assert_called_once_with(payload=payload, token=token)
