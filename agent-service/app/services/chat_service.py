import os
import redis
from typing import Dict, Optional, Tuple
from datetime import datetime
from app.models.chat import ChatSession, ChatMessage
from app.agents.planning_agent import PlanningAgent
from app.config.settings import settings

redis_url = os.environ.get("REDIS_URL", "redis://localhost:6379/0")
try:
    _redis_client = redis.Redis.from_url(redis_url, decode_responses=True)
    _redis_client.ping()
    _use_redis = True
except redis.exceptions.ConnectionError:
    _redis_client = None
    _use_redis = False

_sessions: Dict[str, ChatSession] = {}

class ChatService:
    def __init__(self):
        self.planner = PlanningAgent()

    def get_session(self, session_id: str) -> Optional[ChatSession]:
        if _use_redis:
            try:
                data = _redis_client.get(f"chat_session:{session_id}")
                if data:
                    return ChatSession.model_validate_json(data)
            except redis.exceptions.ConnectionError:
                pass
        return _sessions.get(session_id)

    def _save_session(self, session: ChatSession):
        if _use_redis:
            try:
                _redis_client.setex(
                    f"chat_session:{session.session_id}",
                    86400, # 24 hours
                    session.model_dump_json()
                )
                return
            except redis.exceptions.ConnectionError:
                pass
        _sessions[session.session_id] = session

    def create_session(self, driver_id: Optional[str] = None) -> ChatSession:
        session = ChatSession(driver_id=driver_id)
        self._save_session(session)
        return session

    def process_chat(self, session_id: Optional[str], message: str, context: dict = None) -> Tuple[ChatSession, ChatMessage]:
        session = None
        if session_id:
            session = self.get_session(session_id)
            
        if not session:
            session = self.create_session()

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
        self._save_session(session)
        
        return session, ai_msg
