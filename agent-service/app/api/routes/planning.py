from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from typing import Dict, Any, Optional
from app.agents.planning_agent import PlanningAgent, PlanningError
from app.models.agent_workflow import AgentWorkflow
from app.workflows.orchestrator import WorkflowOrchestrator

router = APIRouter()
planner = PlanningAgent()
orchestrator = WorkflowOrchestrator()

class PlanRequest(BaseModel):
    objective: str

class ExecuteRequest(BaseModel):
    workflow: AgentWorkflow
    context: Dict[str, Any]
    token: Optional[str] = None

@router.post("/plan", response_model=AgentWorkflow, summary="Generate a structured plan for a user objective")
def generate_plan(request: PlanRequest):
    try:
        workflow = planner.create_plan(request.objective)
        return workflow
    except PlanningError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error during planning.")

@router.post("/execute", summary="Execute a generated AgentWorkflow")
def execute_plan(req: ExecuteRequest, request: Request):
    try:
        auth_token = req.token or request.cookies.get("quickpark_auth")
        
        result = orchestrator.execute_workflow(
            workflow=req.workflow,
            initial_context=req.context,
            auth_token=auth_token
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Execution failed: {str(e)}")
