from app.models.agent_step import AgentStep
from app.models.agent_workflow import AgentWorkflow
from app.models.chat import ChatMessage
from app.config.settings import settings
import logging
from typing import List, Optional, Dict, Any

from google import genai
from google.genai import types as genai_types

logger = logging.getLogger(__name__)

GEMINI_MODEL = "gemini-3.5-flash"
SYSTEM_INSTRUCTION = (
    "You are QuickPark's intelligent parking assistant. Your job is to help drivers find the perfect "
    "parking spot, check availability, calculate prices, and make reservations. \n\n"
    "Guidelines:\n"
    "1. Be concise, polite, and highly professional.\n"
    "2. If you do not have enough information to find parking (e.g., location, vehicle type), ask for it clearly.\n"
    "3. Never make up prices, distances, or parking facility names. If you don't know, inform the user.\n"
    "4. Do not offer services outside the scope of parking, such as driving directions or general knowledge.\n"
    "5. Keep responses short and directly address the user's request."
)

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
    "create_reservation",
    "compute_demand_metrics"
}

class PlanningError(Exception):
    pass

reservation_tool = genai_types.Tool(
    function_declarations=[
        genai_types.FunctionDeclaration(
            name="request_reservation_approval",
            description="Call this function when the user explicitly wants to book or reserve a parking spot. Do not call this if they are just asking for recommendations.",
            parameters=genai_types.Schema(
                type=genai_types.Type.OBJECT,
                properties={
                    "facility_id": genai_types.Schema(type=genai_types.Type.STRING, description="UUID of the facility to book"),
                    "facility_name": genai_types.Schema(type=genai_types.Type.STRING, description="Name of the facility"),
                    "start_time": genai_types.Schema(type=genai_types.Type.STRING, description="ISO format start time"),
                    "end_time": genai_types.Schema(type=genai_types.Type.STRING, description="ISO format end time"),
                    "vehicle_type": genai_types.Schema(type=genai_types.Type.STRING, description="Type of vehicle (e.g., CAR, MOTORCYCLE)"),
                    "estimated_price": genai_types.Schema(type=genai_types.Type.NUMBER, description="Estimated price in LKR"),
                },
                required=["facility_id", "facility_name", "start_time", "end_time", "vehicle_type", "estimated_price"]
            )
        )
    ]
)

class PlanningAgent:
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or settings.GOOGLE_API_KEY
        if not self.api_key:
            logger.warning("Google API Key not set. Conversational features might fail.")
        self.client = genai.Client(api_key=self.api_key) if self.api_key else None
        self.model_name = GEMINI_MODEL

    def process_message(self, user_message: str, history: List[ChatMessage], context: dict = None) -> Dict[str, Any]:
        """
        Processes a user message and returns a dict with the AI response and potential actions.
        """
        if not self.client:
            return {"text": "System Error: AI service is currently unavailable.", "action_type": None, "action_payload": None}

        contents = []
        MAX_HISTORY = 10
        recent_history = history[-MAX_HISTORY:] if len(history) > MAX_HISTORY else history
        
        for msg in recent_history:
            role = "user" if msg.role == "user" else "model"
            contents.append(
                genai_types.Content(role=role, parts=[genai_types.Part.from_text(msg.content)])
            )
            
        context_str = ""
        if context:
            context_str = f"[System Context: User Location ({context.get('location_lat', 'Unknown')}, {context.get('location_lng', 'Unknown')})] "
            
        final_message = f"{context_str}{user_message}"

        contents.append(
            genai_types.Content(role="user", parts=[genai_types.Part.from_text(final_message)])
        )

        try:
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=contents,
                config=genai_types.GenerateContentConfig(
                    system_instruction=SYSTEM_INSTRUCTION,
                    temperature=0.7,
                    tools=[reservation_tool]
                ),
            )
            
            # Check for function calls
            if response.function_calls:
                call = response.function_calls[0]
                if call.name == "request_reservation_approval":
                    return {
                        "text": "I can help with that! Please review and confirm your reservation details below.",
                        "action_type": "reservation_approval",
                        "action_payload": call.args
                    }
                    
            return {"text": response.text, "action_type": None, "action_payload": None}
        except Exception as e:
            logger.error(f"Error in PlanningAgent processing chat: {e}")
            return {"text": "Sorry, I encountered an error while processing your request. Please try again.", "action_type": None, "action_payload": None}

    def create_plan(self, objective: str) -> AgentWorkflow:
        steps = []
        objective_lower = objective.lower()

        if any(keyword in objective_lower for keyword in ("demand", "analyz", "analys")):
            # Analysing historic bookings, not looking for a bay to park in.
            steps = [
                AgentStep(
                    step_id="step_1",
                    order=1,
                    agent="parking_demand_agent",
                    action="analyze_parking_demand",
                    description="Aggregate the provider's reservations into demand metrics.",
                    required_tools=["compute_demand_metrics"],
                    dependencies=[],
                    expected_output="Structured parking demand metrics and analysis."
                )
            ]
        elif "reserve" in objective_lower or "reservation" in objective_lower:
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
