from typing import List, Optional, Any
from pydantic import BaseModel, Field

class AgentStep(BaseModel):
    step_id: str
    order: int
    agent: str
    action: str
    description: str
    required_tools: List[str] = Field(default_factory=list)
    dependencies: List[str] = Field(default_factory=list)
    status: str = "pending"
    approval_required: bool = False
    input_context: Optional[Any] = None
    expected_output: Optional[str] = None
