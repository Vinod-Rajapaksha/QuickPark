from typing import Any, Dict, List

from app.models.validation import (
    ValidationIssue,
    ValidationResult,
    ValidationStatus,
)


class ValidationAgent:
    """
    Validates outputs produced by specialized agents before those outputs
    are trusted or used for sensitive actions.

    Design rules:
    - No database access.
    - No backend API access.
    - No tool execution.
    - No state-changing actions.
    - Deterministic business rules are evaluated locally.
    - Sensitive actions require explicit human approval.
    """

    SENSITIVE_ACTIONS = {
        "create_reservation",
        "cancel_reservation",
        "update_reservation",
        "delete_reservation",
    }

    SUPPORTED_ACTIONS = {
        "find_parking",
        "validate_recommendation",
        "check_availability",
        "validate_reservation_details",
        "create_reservation",
    }

    def validate(
        self,
        agent: str,
        action: str,
        output: Dict[str, Any],
    ) -> ValidationResult:
        """
        Validate an agent output and return a structured result.

        This method never executes the requested action.
        """

        common_issues = self._validate_common_fields(
            agent=agent,
            action=action,
            output=output,
        )

        if common_issues:
            return self._rejected(
                agent=agent,
                action=action,
                issues=common_issues,
            )

        if action == "find_parking":
            return self._validate_parking_recommendation(
                agent=agent,
                action=action,
                output=output,
            )

        if action == "validate_recommendation":
            return self._validate_parking_recommendation(
                agent=agent,
                action=action,
                output=output,
            )

        if action == "check_availability":
            return self._validate_availability(
                agent=agent,
                action=action,
                output=output,
            )

        if action == "validate_reservation_details":
            return self._validate_reservation(
                agent=agent,
                action=action,
                output=output,
                require_approval=False,
            )

        if action == "create_reservation":
            return self._validate_reservation(
                agent=agent,
                action=action,
                output=output,
                require_approval=True,
            )

        return self._rejected(
            agent=agent,
            action=action,
            issues=[
                ValidationIssue(
                    code="unsupported_action",
                    field="action",
                    message=f"Validation is not defined for action '{action}'.",
                )
            ],
        )

    def _validate_common_fields(
        self,
        agent: str,
        action: str,
        output: Dict[str, Any],
    ) -> List[ValidationIssue]:
        issues: List[ValidationIssue] = []

        if not agent or not agent.strip():
            issues.append(
                ValidationIssue(
                    code="missing_agent",
                    field="agent",
                    message="Agent name is required.",
                )
            )

        if not action or not action.strip():
            issues.append(
                ValidationIssue(
                    code="missing_action",
                    field="action",
                    message="Action is required.",
                )
            )

        if action and action not in self.SUPPORTED_ACTIONS:
            issues.append(
                ValidationIssue(
                    code="unsupported_action",
                    field="action",
                    message=f"Unsupported validation action '{action}'.",
                )
            )

        if not isinstance(output, dict):
            issues.append(
                ValidationIssue(
                    code="invalid_output_type",
                    field="output",
                    message="Agent output must be an object.",
                )
            )

        return issues

    def _validate_parking_recommendation(
        self,
        agent: str,
        action: str,
        output: Dict[str, Any],
    ) -> ValidationResult:
        issues: List[ValidationIssue] = []

        parking_id = output.get("parking_id")

        if not self._has_value(parking_id):
            issues.append(
                ValidationIssue(
                    code="missing_parking_id",
                    field="parking_id",
                    message="Parking recommendation must contain a parking_id.",
                )
            )

        if issues:
            return self._rejected(
                agent=agent,
                action=action,
                issues=issues,
            )

        return self._approved(
            agent=agent,
            action=action,
            output=output,
        )

    def _validate_availability(
        self,
        agent: str,
        action: str,
        output: Dict[str, Any],
    ) -> ValidationResult:
        issues: List[ValidationIssue] = []

        parking_id = output.get("parking_id")
        available = output.get("available")

        if not self._has_value(parking_id):
            issues.append(
                ValidationIssue(
                    code="missing_parking_id",
                    field="parking_id",
                    message="Availability output must contain a parking_id.",
                )
            )

        if not isinstance(available, bool):
            issues.append(
                ValidationIssue(
                    code="invalid_availability",
                    field="available",
                    message="Availability must be a boolean value.",
                )
            )

        if issues:
            return self._rejected(
                agent=agent,
                action=action,
                issues=issues,
            )

        return self._approved(
            agent=agent,
            action=action,
            output=output,
        )

    def _validate_reservation(
        self,
        agent: str,
        action: str,
        output: Dict[str, Any],
        require_approval: bool,
    ) -> ValidationResult:
        issues: List[ValidationIssue] = []

        parking_id = output.get("parking_id")
        start_time = output.get("start_time")
        end_time = output.get("end_time")

        if not self._has_value(parking_id):
            issues.append(
                ValidationIssue(
                    code="missing_parking_id",
                    field="parking_id",
                    message="Reservation output must contain a parking_id.",
                )
            )

        if not self._has_value(start_time):
            issues.append(
                ValidationIssue(
                    code="missing_start_time",
                    field="start_time",
                    message="Reservation output must contain a start_time.",
                )
            )

        if not self._has_value(end_time):
            issues.append(
                ValidationIssue(
                    code="missing_end_time",
                    field="end_time",
                    message="Reservation output must contain an end_time.",
                )
            )

        if (
            self._has_value(start_time)
            and self._has_value(end_time)
            and start_time == end_time
        ):
            issues.append(
                ValidationIssue(
                    code="invalid_time_range",
                    field="end_time",
                    message="Reservation start_time and end_time cannot be equal.",
                )
            )

        if issues:
            return self._rejected(
                agent=agent,
                action=action,
                issues=issues,
            )

        if require_approval or action in self.SENSITIVE_ACTIONS:
            return self._requires_approval(
                agent=agent,
                action=action,
                output=output,
            )

        return self._approved(
            agent=agent,
            action=action,
            output=output,
        )

    @staticmethod
    def _has_value(value: Any) -> bool:
        if value is None:
            return False

        if isinstance(value, str):
            return bool(value.strip())

        return True

    @staticmethod
    def _approved(
        agent: str,
        action: str,
        output: Dict[str, Any],
    ) -> ValidationResult:
        return ValidationResult(
            valid=True,
            status=ValidationStatus.APPROVED,
            agent=agent,
            action=action,
            approval_required=False,
            issues=[],
            validated_output=output,
        )

    @staticmethod
    def _requires_approval(
        agent: str,
        action: str,
        output: Dict[str, Any],
    ) -> ValidationResult:
        return ValidationResult(
            valid=True,
            status=ValidationStatus.REQUIRES_APPROVAL,
            agent=agent,
            action=action,
            approval_required=True,
            issues=[],
            validated_output=output,
        )

    @staticmethod
    def _rejected(
        agent: str,
        action: str,
        issues: List[ValidationIssue],
    ) -> ValidationResult:
        return ValidationResult(
            valid=False,
            status=ValidationStatus.REJECTED,
            agent=agent,
            action=action,
            approval_required=False,
            issues=issues,
            validated_output=None,
        )