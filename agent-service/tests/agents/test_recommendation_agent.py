import pytest
from unittest.mock import patch, MagicMock
from app.agents.recommendation_agent import RecommendationAgent, RecommendationRequest, RecommendationResponse

@pytest.fixture
def agent():
    return RecommendationAgent(api_key="test-api-key")

@patch('app.agents.recommendation_agent.search_parking')
def test_generate_recommendations_no_candidates(mock_search, agent):
    mock_search.return_value = []
    
    request = RecommendationRequest(
        destination="Colombo",
        latitude=6.9271,
        longitude=79.8612,
        radius_km=5.0
    )
    
    response = agent.generate_recommendations(request)
    
    assert isinstance(response, RecommendationResponse)
    assert response.total_candidates == 0
    assert response.filtered_candidates == 0
    assert len(response.recommendations) == 0
    assert "No parking facilities match" in response.summary

@patch('app.agents.recommendation_agent.RecommendationAgent._search_candidates')
@patch('app.agents.recommendation_agent.RecommendationAgent._apply_deterministic_filters')
@patch('app.agents.recommendation_agent.RecommendationAgent._rank_candidates')
@patch('app.agents.recommendation_agent.RecommendationAgent._generate_with_gemini')
@patch('app.agents.recommendation_agent.RecommendationAgent._validate_recommendations')
@patch('app.agents.recommendation_agent.RecommendationAgent._build_summary')
def test_generate_recommendations_success(
    mock_build_summary,
    mock_validate,
    mock_generate,
    mock_rank,
    mock_filter,
    mock_search,
    agent
):
    valid_recommendation = {
        "parking_id": "fac-1",
        "parking_name": "Mock Parking",
        "rank": 1,
        "reason": "Because it is mocked",
        "confidence": 0.9,
        "matched_preferences": []
    }
    mock_search.return_value = [{"mock": "candidate"}]
    mock_filter.return_value = [{"mock": "candidate"}]
    mock_rank.return_value = [{"mock": "candidate"}]
    mock_generate.return_value = [valid_recommendation]
    mock_validate.return_value = [valid_recommendation]
    mock_build_summary.return_value = "Mock summary"
    
    request = RecommendationRequest(destination="Kandy")
    response = agent.generate_recommendations(request)
    
    assert isinstance(response, RecommendationResponse)
    assert response.total_candidates == 1
    assert response.filtered_candidates == 1
    assert response.summary == "Mock summary"
    assert response.recommendations[0].parking_id == "fac-1"
