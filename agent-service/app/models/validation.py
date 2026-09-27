from enum import Enum
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class ValidationStatus(str, Enum):
    APPROVED = "approved"
    REJECTED = "rejected"
    REQUIRES_APPROVAL = "requires_approval"


class ValidationIssue(BaseModel):
    code: str
    message: str
    field: Optional[str] = None


class ValidationRequest(BaseModel):
    agent: str = Field(min_length=1)
    action: str = Field(min_length=1)
    output: Dict[str, Any] = Field(default_factory=dict)


class ValidationResult(BaseModel):
    valid: bool
    status: ValidationStatus
    agent: str
    action: str

    approval_required: bool = False

    issues: List[ValidationIssue] = Field(default_factory=list)

    validated_output: Optional[Dict[str, Any]] = None