from typing import List
from pydantic import BaseModel
from .agent_step import AgentStep

class AgentWorkflow(BaseModel):
    objective: str
    steps: List[AgentStep]
    status: str = "planned"
