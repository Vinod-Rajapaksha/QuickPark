from typing import Any, Dict
from app.models.agent_workflow import AgentWorkflow
from app.agents.recommendation_agent import RecommendationAgent, RecommendationRequest
from app.agents.reservation_agent import ReservationAgent
from app.agents.validation_agent import ValidationAgent
from app.agents.parking_demand_agent import ParkingDemandAgent
from app.models.validation import ValidationStatus

class WorkflowOrchestrator:
    def __init__(self):
        self.recommendation_agent = RecommendationAgent()
        self.reservation_agent = ReservationAgent()
        self.validation_agent = ValidationAgent()
        self.parking_demand_agent = ParkingDemandAgent()

    def execute_workflow(self, workflow: AgentWorkflow, initial_context: Dict[str, Any], auth_token: str = None) -> Dict[str, Any]:
        """
        Executes a workflow by delegating tasks to specific agents based on the plan.
        """
        context = dict(initial_context)
        execution_results = {}

        steps = sorted(workflow.steps, key=lambda x: x.order)

        for step in steps:
            for dep in step.dependencies:
                if dep not in execution_results:
                    return {"status": "error", "step_id": step.step_id, "message": f"Dependency {dep} not met."}

            if step.approval_required and not context.get("approval_granted", False):
                return {
                    "status": "requires_approval",
                    "step_id": step.step_id,
                    "action": step.action,
                    "context": context,
                    "message": f"Human approval required for step {step.step_id} ({step.action})."
                }
            
            try:
                result = self._execute_step(step, context, auth_token)
                execution_results[step.step_id] = result
                context.update(result)
            except Exception as e:
                return {"status": "error", "step_id": step.step_id, "message": str(e)}

        return {
            "status": "success",
            "results": execution_results,
            "final_context": context
        }

    def _execute_step(self, step, context: Dict[str, Any], auth_token: str) -> Dict[str, Any]:
        if step.agent == "recommendation_agent":
            if step.action == "find_parking":
                req = RecommendationRequest(**context)
                res = self.recommendation_agent.generate_recommendations(req)
                if not res.recommendations:
                    raise Exception("No parking recommendations found.")
                
                top_rec = res.recommendations[0].model_dump()
                return {"parking_id": top_rec["parking_id"], "recommendation": top_rec}
                
        elif step.agent == "reservation_agent":
            if step.action == "check_availability":
                res = self.reservation_agent.check_availability(
                    facility_id=context.get("parking_id"),
                    start_time=context.get("start_time"),
                    end_time=context.get("end_time"),
                    vehicle_type=context.get("vehicle_type", "CAR")
                )
                return {"availability": res}
            
            elif step.action == "calculate_price":
                res = self.reservation_agent.calculate_price(
                    facility_id=context.get("parking_id"),
                    start_time=context.get("start_time"),
                    end_time=context.get("end_time"),
                    vehicle_type=context.get("vehicle_type", "CAR")
                )
                
                estimated_price = res.get("totalAmount", 0)
                return {"price_details": res, "estimated_price": estimated_price}
            
            elif step.action == "create_reservation":
                payload = {
                    "facilityId": context.get("parking_id"),
                    "startTime": context.get("start_time"),
                    "endTime": context.get("end_time"),
                    "vehicleType": context.get("vehicle_type", "CAR"),
                    "totalAmount": context.get("estimated_price", 0)
                }
                res = self.reservation_agent.create_reservation(payload, auth_token)
                return {"reservation_result": res}

        elif step.agent == "validation_agent":
            res = self.validation_agent.validate(agent=step.agent, action=step.action, output=context)
            if res.status == ValidationStatus.REJECTED:
                issues = ", ".join([i.message for i in res.issues])
                raise Exception(f"Validation failed: {issues}")
            return {"validation_result": "approved"}
            
        elif step.agent == "parking_demand_agent":
            if step.action == "analyze_parking_demand":
                res = self.parking_demand_agent.analyze_demand(facility_id=context.get("parking_id"))
                return {"demand_analysis": res}
                
        raise Exception(f"Action '{step.action}' not implemented for agent '{step.agent}' in Orchestrator.")
