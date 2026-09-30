from fastapi import APIRouter, HTTPException
from app.agents.recommendation_agent import RecommendationAgent, RecommendationRequest, RecommendationResponse

router = APIRouter()
agent = RecommendationAgent()

@router.post("/generate", response_model=RecommendationResponse, summary="Generate parking recommendations")
def generate_recommendations(request: RecommendationRequest):
    return agent.generate_recommendations(request)
