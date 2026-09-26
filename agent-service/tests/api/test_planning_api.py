from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {
        "status": "healthy",
        "service": "quickpark-agent-service"
    }

def test_valid_planning_request_returns_200():
    response = client.post(
        "/api/planning/plan",
        json={"objective": "Find an available parking space near SLIIT"}
    )
    assert response.status_code == 200

def test_valid_planning_request_returns_agent_workflow():
    response = client.post(
        "/api/planning/plan",
        json={"objective": "Find an available parking space near SLIIT"}
    )
    data = response.json()
    assert "objective" in data
    assert "steps" in data
    assert len(data["steps"]) > 0

def test_reservation_workflow_contains_create_reservation_with_approval():
    response = client.post(
        "/api/planning/plan",
        json={"objective": "Find an available parking space near SLIIT and reserve it for 2 hours."}
    )
    assert response.status_code == 200
    data = response.json()
    
    # Check if create_reservation exists and has approval_required = true
    reservation_step = next((step for step in data["steps"] if step["action"] == "create_reservation"), None)
    
    assert reservation_step is not None
    assert reservation_step["approval_required"] is True

def test_unsupported_objective_returns_error():
    response = client.post(
        "/api/planning/plan",
        json={"objective": "Wash my car"}
    )
    assert response.status_code == 400
    assert "Unsupported objective" in response.json()["detail"]
