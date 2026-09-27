from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_validation_endpoint_returns_approved_result():
    response = client.post(
        "/api/validation/validate",
        json={
            "agent": "recommendation_agent",
            "action": "find_parking",
            "output": {
                "parking_id": "parking-123",
                "name": "SLIIT Parking",
            },
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["valid"] is True
    assert data["status"] == "approved"
    assert data["approval_required"] is False
    assert data["issues"] == []


def test_validation_endpoint_rejects_invalid_output():
    response = client.post(
        "/api/validation/validate",
        json={
            "agent": "recommendation_agent",
            "action": "find_parking",
            "output": {},
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["valid"] is False
    assert data["status"] == "rejected"
    assert data["validated_output"] is None
    assert len(data["issues"]) > 0


def test_sensitive_action_requires_approval():
    response = client.post(
        "/api/validation/validate",
        json={
            "agent": "reservation_agent",
            "action": "create_reservation",
            "output": {
                "parking_id": "parking-123",
                "start_time": "2026-09-28T10:00:00",
                "end_time": "2026-09-28T12:00:00",
            },
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["valid"] is True
    assert data["status"] == "requires_approval"
    assert data["approval_required"] is True


def test_unsupported_action_is_rejected():
    response = client.post(
        "/api/validation/validate",
        json={
            "agent": "unknown_agent",
            "action": "dangerous_action",
            "output": {},
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["valid"] is False
    assert data["status"] == "rejected"


def test_invalid_request_schema_returns_422():
    response = client.post(
        "/api/validation/validate",
        json={
            "action": "find_parking",
            "output": {},
        },
    )

    assert response.status_code == 422