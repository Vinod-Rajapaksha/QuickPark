from app.agents.validation_agent import ValidationAgent
from app.models.validation import ValidationStatus


def create_agent() -> ValidationAgent:
    return ValidationAgent()


def test_valid_parking_recommendation_is_approved():
    agent = create_agent()

    result = agent.validate(
        agent="recommendation_agent",
        action="find_parking",
        output={
            "parking_id": "parking-123",
            "name": "SLIIT Parking",
        },
    )

    assert result.valid is True
    assert result.status == ValidationStatus.APPROVED
    assert result.approval_required is False
    assert result.issues == []
    assert result.validated_output is not None


def test_parking_recommendation_without_parking_id_is_rejected():
    agent = create_agent()

    result = agent.validate(
        agent="recommendation_agent",
        action="find_parking",
        output={
            "name": "SLIIT Parking",
        },
    )

    assert result.valid is False
    assert result.status == ValidationStatus.REJECTED
    assert result.validated_output is None

    assert any(
        issue.code == "missing_parking_id"
        for issue in result.issues
    )


def test_valid_availability_output_is_approved():
    agent = create_agent()

    result = agent.validate(
        agent="reservation_agent",
        action="check_availability",
        output={
            "parking_id": "parking-123",
            "available": True,
        },
    )

    assert result.valid is True
    assert result.status == ValidationStatus.APPROVED
    assert result.approval_required is False


def test_availability_requires_boolean_value():
    agent = create_agent()

    result = agent.validate(
        agent="reservation_agent",
        action="check_availability",
        output={
            "parking_id": "parking-123",
            "available": "yes",
        },
    )

    assert result.valid is False
    assert result.status == ValidationStatus.REJECTED

    assert any(
        issue.code == "invalid_availability"
        for issue in result.issues
    )


def test_valid_reservation_details_are_approved():
    agent = create_agent()

    result = agent.validate(
        agent="validation_agent",
        action="validate_reservation_details",
        output={
            "parking_id": "parking-123",
            "start_time": "2026-09-28T10:00:00",
            "end_time": "2026-09-28T12:00:00",
        },
    )

    assert result.valid is True
    assert result.status == ValidationStatus.APPROVED
    assert result.approval_required is False


def test_reservation_without_parking_id_is_rejected():
    agent = create_agent()

    result = agent.validate(
        agent="validation_agent",
        action="validate_reservation_details",
        output={
            "start_time": "2026-09-28T10:00:00",
            "end_time": "2026-09-28T12:00:00",
        },
    )

    assert result.valid is False
    assert result.status == ValidationStatus.REJECTED

    assert any(
        issue.code == "missing_parking_id"
        for issue in result.issues
    )


def test_reservation_without_start_time_is_rejected():
    agent = create_agent()

    result = agent.validate(
        agent="validation_agent",
        action="validate_reservation_details",
        output={
            "parking_id": "parking-123",
            "end_time": "2026-09-28T12:00:00",
        },
    )

    assert result.valid is False

    assert any(
        issue.code == "missing_start_time"
        for issue in result.issues
    )


def test_reservation_without_end_time_is_rejected():
    agent = create_agent()

    result = agent.validate(
        agent="validation_agent",
        action="validate_reservation_details",
        output={
            "parking_id": "parking-123",
            "start_time": "2026-09-28T10:00:00",
        },
    )

    assert result.valid is False

    assert any(
        issue.code == "missing_end_time"
        for issue in result.issues
    )


def test_equal_reservation_times_are_rejected():
    agent = create_agent()

    result = agent.validate(
        agent="validation_agent",
        action="validate_reservation_details",
        output={
            "parking_id": "parking-123",
            "start_time": "2026-09-28T10:00:00",
            "end_time": "2026-09-28T10:00:00",
        },
    )

    assert result.valid is False
    assert result.status == ValidationStatus.REJECTED

    assert any(
        issue.code == "invalid_time_range"
        for issue in result.issues
    )


def test_create_reservation_requires_human_approval():
    agent = create_agent()

    result = agent.validate(
        agent="reservation_agent",
        action="create_reservation",
        output={
            "parking_id": "parking-123",
            "start_time": "2026-09-28T10:00:00",
            "end_time": "2026-09-28T12:00:00",
        },
    )

    assert result.valid is True
    assert result.status == ValidationStatus.REQUIRES_APPROVAL
    assert result.approval_required is True


def test_invalid_create_reservation_is_rejected_before_approval():
    agent = create_agent()

    result = agent.validate(
        agent="reservation_agent",
        action="create_reservation",
        output={
            "parking_id": "",
            "start_time": "2026-09-28T10:00:00",
            "end_time": "2026-09-28T12:00:00",
        },
    )

    assert result.valid is False
    assert result.status == ValidationStatus.REJECTED
    assert result.approval_required is False


def test_unsupported_action_is_rejected():
    agent = create_agent()

    result = agent.validate(
        agent="some_agent",
        action="delete_database",
        output={},
    )

    assert result.valid is False
    assert result.status == ValidationStatus.REJECTED

    assert any(
        issue.code == "unsupported_action"
        for issue in result.issues
    )


def test_validation_agent_does_not_modify_input():
    agent = create_agent()

    original_output = {
        "parking_id": "parking-123",
        "available": True,
    }

    original_copy = original_output.copy()

    agent.validate(
        agent="reservation_agent",
        action="check_availability",
        output=original_output,
    )

    assert original_output == original_copy