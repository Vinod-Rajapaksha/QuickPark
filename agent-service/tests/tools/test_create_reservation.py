import pytest
from unittest.mock import MagicMock
from app.tools.create_reservation import create_reservation
from app.services.reservation_service import ReservationService

def test_create_reservation():
    mock_service = MagicMock(spec=ReservationService)
    mock_service.create_reservation.return_value = {"status": "created"}
    
    payload = {"facility_id": "fac-1"}
    token = "my-token"
    result = create_reservation(payload, token, mock_service)
    
    assert result == {"status": "created"}
    mock_service.create_reservation.assert_called_once_with(payload=payload, token=token)
