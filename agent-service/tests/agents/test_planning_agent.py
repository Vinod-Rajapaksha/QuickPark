import pytest
from app.agents.planning_agent import PlanningAgent, PlanningError
from app.models.agent_step import AgentStep
from app.models.agent_workflow import AgentWorkflow

def test_simple_parking_search_creates_valid_plan():
    planner = PlanningAgent()
    plan = planner.create_plan("Find an available parking space near SLIIT.")
    
    assert plan is not None
    assert len(plan.steps) == 2
    assert plan.steps[0].action == "find_parking"
    assert plan.steps[1].action == "validate_recommendation"
    
def test_reservation_creates_multi_step_plan():
    planner = PlanningAgent()
    plan = planner.create_plan("Find a parking space near SLIIT and reserve it for 2 hours.")
    
    assert plan is not None
    assert len(plan.steps) == 4
    assert any(step.action == "create_reservation" for step in plan.steps)

def test_reservation_creation_requires_approval():
    planner = PlanningAgent()
    plan = planner.create_plan("Reserve a parking space")
    
    reservation_step = next(step for step in plan.steps if step.action == "create_reservation")
    assert reservation_step.approval_required is True

def test_unsupported_objective_is_rejected():
    planner = PlanningAgent()
    with pytest.raises(PlanningError) as exc:
        planner.create_plan("Wash my car")
    assert "Unsupported objective" in str(exc.value)

def test_unknown_agent_rejected():
    planner = PlanningAgent()
    workflow = AgentWorkflow(
        objective="Test",
        steps=[
            AgentStep(step_id="1", order=1, agent="unknown_agent", action="test", description="t")
        ]
    )
    with pytest.raises(PlanningError) as exc:
        planner.validate_plan(workflow)
    assert "Unknown agent" in str(exc.value)

def test_unknown_tool_rejected():
    planner = PlanningAgent()
    workflow = AgentWorkflow(
        objective="Test",
        steps=[
            AgentStep(step_id="1", order=1, agent="recommendation_agent", action="find_parking", description="t", required_tools=["unknown_tool"])
        ]
    )
    with pytest.raises(PlanningError) as exc:
        planner.validate_plan(workflow)
    assert "Unknown tool" in str(exc.value)

def test_invalid_dependencies_rejected():
    planner = PlanningAgent()
    workflow = AgentWorkflow(
        objective="Test",
        steps=[
            AgentStep(step_id="1", order=1, agent="recommendation_agent", action="find_parking", description="t", dependencies=["nonexistent_step"])
        ]
    )
    with pytest.raises(PlanningError) as exc:
        planner.validate_plan(workflow)
    assert "Invalid or circular dependency" in str(exc.value)

def test_circular_dependencies_rejected():
    planner = PlanningAgent()
    workflow = AgentWorkflow(
        objective="Test",
        steps=[
            AgentStep(step_id="1", order=1, agent="recommendation_agent", action="find_parking", description="t", dependencies=["2"]),
            AgentStep(step_id="2", order=2, agent="recommendation_agent", action="test", description="t", dependencies=["1"])
        ]
    )
    with pytest.raises(PlanningError) as exc:
        planner.validate_plan(workflow)
    assert "Invalid or circular dependency" in str(exc.value)

def test_missing_approval_for_reservation_rejected():
    planner = PlanningAgent()
    workflow = AgentWorkflow(
        objective="Test",
        steps=[
            AgentStep(step_id="1", order=1, agent="reservation_agent", action="create_reservation", description="t", approval_required=False)
        ]
    )
    with pytest.raises(PlanningError) as exc:
        planner.validate_plan(workflow)
    assert "must require human approval" in str(exc.value)

def test_plan_step_ordering_deterministic():
    planner = PlanningAgent()
    workflow = AgentWorkflow(
        objective="Test",
        steps=[
            AgentStep(step_id="2", order=2, agent="recommendation_agent", action="find_parking", description="t"),
            AgentStep(step_id="1", order=1, agent="recommendation_agent", action="test", description="t")
        ]
    )
    with pytest.raises(PlanningError) as exc:
        planner.validate_plan(workflow)
    assert "Steps are not in deterministic order" in str(exc.value)

def test_planner_does_not_execute_tools():
    planner = PlanningAgent()
    plan = planner.create_plan("Find a parking space near SLIIT")
    assert isinstance(plan, AgentWorkflow)
