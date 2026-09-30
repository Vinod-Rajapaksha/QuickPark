import pytest
from unittest.mock import patch
from app.workflows.parking_recommendation_workflow import ParkingRecommendationWorkflow

@patch('app.workflows.parking_recommendation_workflow.RecommendationAgent')
@patch('app.workflows.parking_recommendation_workflow.ValidationAgent')
def test_parking_recommendation_workflow_success(mock_val_agent_cls, mock_rec_agent_cls):
    mock_rec_agent = mock_rec_agent_cls.return_value
    mock_val_agent = mock_val_agent_cls.return_value
    
    class DummyRec:
        def __init__(self):
            self.parking_id = "fac-1"
        def model_dump(self):
            return {"parking_id": "fac-1"}
    class DummyRecResp:
        def __init__(self):
            self.recommendations = [DummyRec()]
        def model_dump(self):
            return {"mock": "rec_data"}
    mock_rec_agent.generate_recommendations.return_value = DummyRecResp()
    
    class DummyValResp:
        def model_dump(self):
            return {"mock": "val_data"}
    mock_val_agent.validate.return_value = DummyValResp()
    
    workflow = ParkingRecommendationWorkflow()
    result = workflow.run({"destination": "Colombo"})
    
    assert result["status"] == "success"
    assert result["recommendations"] == {"mock": "rec_data"}
    assert result["top_recommendation_validation"] == {"mock": "val_data"}

@patch('app.workflows.parking_recommendation_workflow.RecommendationAgent')
@patch('app.workflows.parking_recommendation_workflow.ValidationAgent')
def test_parking_recommendation_workflow_no_recommendations(mock_val_agent_cls, mock_rec_agent_cls):
    mock_rec_agent = mock_rec_agent_cls.return_value
    
    class DummyRecRespEmpty:
        def __init__(self):
            self.recommendations = []
        def model_dump(self):
            return {"mock": "empty"}
    mock_rec_agent.generate_recommendations.return_value = DummyRecRespEmpty()
    
    workflow = ParkingRecommendationWorkflow()
    result = workflow.run({"destination": "Colombo"})
    
    assert result["status"] == "failed"
    assert result["message"] == "No recommendations found."
    assert result["data"] == {"mock": "empty"}
