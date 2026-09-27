import logging
from typing import Optional

from app.agents.recommendation_agent import (
    RecommendationAgent,
    RecommendationRequest,
    RecommendationResponse,
    RecommendationError,
)
from app.models.agent_step import AgentStep
from app.models.agent_workflow import AgentWorkflow

logger = logging.getLogger(__name__)


class ParkingRecommendationWorkflow:
    def __init__(self, agent: Optional[RecommendationAgent] = None):
        self.agent = agent or RecommendationAgent()

    def execute(self, request: RecommendationRequest) -> RecommendationResponse:
        workflow = AgentWorkflow(
            objective="Find and recommend suitable parking for the driver.",
            steps=[
                AgentStep(
                    step_id="rec_1",
                    order=1,
                    agent="recommendation_agent",
                    action="find_parking",
                    description="Search and filter parking candidates based on driver context.",
                    required_tools=["search_parking"],
                    dependencies=[],
                    expected_output="Structured parking recommendations.",
                )
            ],
        )

        logger.info(
            "Executing recommendation workflow: destination=%s, ev=%s, max_rate=%s",
            request.destination,
            request.ev_charging_required,
            request.max_hourly_rate,
        )

        response = self.agent.generate_recommendations(request)

        workflow.steps[0].status = "completed"
        logger.info(
            "Recommendation workflow completed: %d recommendations returned.",
            len(response.recommendations),
        )

        return response
