from pydantic import BaseModel, Field
from typing import List, Optional, Any
from datetime import datetime
import uuid

class ChatMessage(BaseModel):
    role: str = Field(..., description="Role of the message sender: 'user', 'agent', 'system'")
    content: str = Field(..., description="The message content")
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    action_type: Optional[str] = Field(None, description="Type of action required (e.g. 'reservation_approval')")
    action_payload: Optional[dict] = Field(None, description="Data for the action")

class ChatSession(BaseModel):
    session_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    driver_id: Optional[str] = None
    messages: List[ChatMessage] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class ChatRequest(BaseModel):
    session_id: Optional[str] = Field(None, description="Provide session_id to continue a conversation")
    driver_id: Optional[str] = None
    message: str = Field(..., description="The user's message")
    location_lat: Optional[float] = None
    location_lng: Optional[float] = None

class ChatResponse(BaseModel):
    session_id: str
    message: ChatMessage
