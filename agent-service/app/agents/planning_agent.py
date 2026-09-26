from app.models.agent_step import AgentStep
from app.models.agent_workflow import AgentWorkflow

ALLOWED_AGENTS = {
    "parking_demand_agent",
    "recommendation_agent",
    "reservation_agent",
    "validation_agent"
}

ALLOWED_TOOLS = {
    "search_parking",
    "check_availability",
    "calculate_price",
    "validate_reservation",
    "create_reservation"
}

class PlanningError(Exception):
    pass

class PlanningAgent:
    def __init__(self):
        pass

    def create_plan(self, objective: str) -> AgentWorkflow:
        steps = []
        objective_lower = objective.lower()

        if "reserve" in objective_lower or "reservation" in objective_lower:
            # Plan with reservation
            steps = [
                AgentStep(
                    step_id="step_1",
                    order=1,
                    agent="recommendation_agent",
                    action="find_parking",
                    description="Find suitable parking space based on user context.",
                    required_tools=["search_parking"],
                    dependencies=[],
                    expected_output="Location and details of a suitable parking space."
                ),
                AgentStep(
                    step_id="step_2",
                    order=2,
                    agent="reservation_agent",
                    action="check_availability",
                    description="Check availability for the recommended parking.",
                    required_tools=["check_availability"],
                    dependencies=["step_1"],
                    expected_output="Availability confirmation."
                ),
                AgentStep(
                    step_id="step_3",
                    order=3,
                    agent="validation_agent",
                    action="validate_reservation_details",
                    description="Validate reservation details.",
                    required_tools=["validate_reservation"],
                    dependencies=["step_2"],
                    expected_output="Validated reservation context."
                ),
                AgentStep(
                    step_id="step_4",
                    order=4,
                    agent="reservation_agent",
                    action="create_reservation",
                    description="Create the reservation for the user.",
                    required_tools=["create_reservation"],
                    dependencies=["step_3"],
                    approval_required=True,
                    expected_output="Reservation confirmation and token."
                )
            ]
        elif "find" in objective_lower or "search" in objective_lower:
            # Plan for searching only
            steps = [
                AgentStep(
                    step_id="step_1",
                    order=1,
                    agent="recommendation_agent",
                    action="find_parking",
                    description="Find suitable parking space based on user context.",
                    required_tools=["search_parking"],
                    dependencies=[],
                    expected_output="Location and details of a suitable parking space."
                ),
                AgentStep(
                    step_id="step_2",
                    order=2,
                    agent="validation_agent",
                    action="validate_recommendation",
                    description="Validate the recommended parking.",
                    required_tools=[],
                    dependencies=["step_1"],
                    expected_output="Validated recommendation."
                )
            ]
        else:
            raise PlanningError(f"Unsupported objective: {objective}")

        workflow = AgentWorkflow(objective=objective, steps=steps)
        self.validate_plan(workflow)
        return workflow

    def validate_plan(self, workflow: AgentWorkflow):
        if not workflow.steps:
            raise PlanningError("Plan is empty.")

        step_ids = set()
        for step in workflow.steps:
            if step.step_id in step_ids:
                raise PlanningError(f"Duplicate step ID: {step.step_id}")
            
            # Validate order manually by checking if current order is strictly increasing
            if step.agent not in ALLOWED_AGENTS:
                raise PlanningError(f"Unknown agent: {step.agent}")
            
            for tool in step.required_tools:
                if tool not in ALLOWED_TOOLS:
                    raise PlanningError(f"Unknown tool: {tool}")

            if step.action == "create_reservation" and not step.approval_required:
                raise PlanningError("create_reservation action must require human approval.")
                
            for dep in step.dependencies:
                if dep not in step_ids:
                    raise PlanningError(f"Invalid or circular dependency: {dep} for step {step.step_id}")
                    
            step_ids.add(step.step_id)

        # Ensure deterministic ordering based on order field
        sorted_steps = sorted(workflow.steps, key=lambda s: s.order)
        if workflow.steps != sorted_steps:
            raise PlanningError("Steps are not in deterministic order.")
