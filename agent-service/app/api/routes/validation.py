from fastapi import APIRouter

from app.agents.validation_agent import ValidationAgent
from app.models.validation import ValidationRequest, ValidationResult


router = APIRouter()

validation_agent = ValidationAgent()


@router.post(
    "/validate",
    response_model=ValidationResult,
    summary="Validate an agent output before it is used",
)
def validate_agent_output(
    request: ValidationRequest,
) -> ValidationResult:
    """
    Validate output produced by another agent.

    This endpoint performs validation only.
    It does not execute tools, modify system state,
    access the database, or create reservations.
    """

    return validation_agent.validate(
        agent=request.agent,
        action=request.action,
        output=request.output,
    )