from typing import Any, Dict
from app.agents.recommendation_agent import RecommendationAgent, RecommendationRequest
from app.agents.validation_agent import ValidationAgent

class ParkingRecommendationWorkflow:
    def __init__(self):
        self.recommendation_agent = RecommendationAgent()
        self.validation_agent = ValidationAgent()

    def run(self, request_data: dict) -> Dict[str, Any]:
        # Step 1: Get recommendations
        rec_request = RecommendationRequest(**request_data)
        rec_response = self.recommendation_agent.generate_recommendations(rec_request)

        if not rec_response.recommendations:
            return {"status": "failed", "message": "No recommendations found.", "data": rec_response.model_dump()}

        # Step 2: Validate the top recommendation
        top_rec = rec_response.recommendations[0]
        val_response = self.validation_agent.validate(
            agent="recommendation_agent",
            action="validate_recommendation",
            output=top_rec.model_dump()
        )

        return {
            "status": "success",
            "recommendations": rec_response.model_dump(),
            "top_recommendation_validation": val_response.model_dump()
        }
