from typing import Any, Optional, List
from pydantic import BaseModel, Field


class ToolExecution(BaseModel):
    tool_name: str
    input_params: dict[str, Any] = Field(default_factory=dict)
    output: Any = None
    status: str = "pending"
    error: Optional[str] = None
