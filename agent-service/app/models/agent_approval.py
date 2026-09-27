from enum import Enum
from typing import Optional

from pydantic import BaseModel


class ApprovalStatus(str, Enum):
    NOT_REQUIRED = "not_required"
    REQUIRED = "required"
    APPROVED = "approved"
    REJECTED = "rejected"


class AgentApproval(BaseModel):
    required: bool = False
    status: ApprovalStatus = ApprovalStatus.NOT_REQUIRED
    reason: Optional[str] = None