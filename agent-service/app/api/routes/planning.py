from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.agents.planning_agent import PlanningAgent, PlanningError
from app.models.agent_workflow import AgentWorkflow

router = APIRouter()
planner = PlanningAgent()

class PlanRequest(BaseModel):
    objective: str

@router.post("/plan", response_model=AgentWorkflow, summary="Generate a structured plan for a user objective")
def generate_plan(request: PlanRequest):
    try:
        workflow = planner.create_plan(request.objective)
        return workflow
    except PlanningError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error during planning.")
