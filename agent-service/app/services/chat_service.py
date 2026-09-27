from typing import Dict, Optional, Tuple
from datetime import datetime

from app.models.chat import ChatSession, ChatMessage
from app.agents.planning_agent import PlanningAgent

# In-memory storage for chat sessions
_sessions: Dict[str, ChatSession] = {}

class ChatService:
    def __init__(self):
        self.planner = PlanningAgent()

    def get_session(self, session_id: str) -> Optional[ChatSession]:
        return _sessions.get(session_id)

    def create_session(self, driver_id: Optional[str] = None) -> ChatSession:
        session = ChatSession(driver_id=driver_id)
        _sessions[session.session_id] = session
        return session

    def process_chat(self, session_id: Optional[str], message: str, context: dict = None) -> Tuple[ChatSession, ChatMessage]:
        if not session_id or session_id not in _sessions:
            session = self.create_session()
        else:
            session = _sessions[session_id]

        # Add user message to session
        user_msg = ChatMessage(role="user", content=message)
        session.messages.append(user_msg)
        
        # Only pass previous messages as history, excluding the current one
        history = session.messages[:-1]
        
        # Get AI response
        ai_response = self.planner.process_message(
            user_message=message,
            history=history,
            context=context
        )
        
        # Add AI message to session
        ai_msg = ChatMessage(
            role="agent",
            content=ai_response["text"],
            action_type=ai_response.get("action_type"),
            action_payload=ai_response.get("action_payload")
        )
        session.messages.append(ai_msg)
        
        session.updated_at = datetime.utcnow()
        
        return session, ai_msg
