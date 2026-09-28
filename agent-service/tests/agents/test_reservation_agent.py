import pytest
from unittest.mock import patch, MagicMock
from app.agents.reservation_agent import ReservationAgent

@pytest.fixture
def agent():
    return ReservationAgent()

@patch('app.agents.reservation_agent.check_availability')
def test_check_availability(mock_check, agent):
    mock_check.return_value = {"available": True}
    result = agent.check_availability("fac-1", "2024-01-01T10:00:00Z", "2024-01-01T12:00:00Z", "CAR")
    assert result == {"available": True}
    mock_check.assert_called_once_with("fac-1", "2024-01-01T10:00:00Z", "2024-01-01T12:00:00Z", "CAR")

@patch('app.agents.reservation_agent.calculate_price')
def test_calculate_price(mock_calc, agent):
    mock_calc.return_value = {"price": 100.0}
    result = agent.calculate_price("fac-1", "2024-01-01T10:00:00Z", "2024-01-01T12:00:00Z", "CAR")
    assert result == {"price": 100.0}
    mock_calc.assert_called_once_with("fac-1", "2024-01-01T10:00:00Z", "2024-01-01T12:00:00Z", "CAR")

@patch('app.agents.reservation_agent.create_reservation')
def test_create_reservation(mock_create, agent):
    mock_create.return_value = {"reservation_id": "res-1"}
    payload = {"facility_id": "fac-1"}
    token = "test-token"
    result = agent.create_reservation(payload, token)
    assert result == {"reservation_id": "res-1"}
    mock_create.assert_called_once_with(payload, token)
