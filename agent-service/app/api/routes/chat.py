from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, Any
from pydantic import BaseModel

from app.models.chat import ChatRequest, ChatResponse, ChatSession
from app.services.chat_service import ChatService

router = APIRouter()
chat_service = ChatService()

@router.post("/message", response_model=ChatResponse)
async def send_message(request: ChatRequest):
    context = {
        "location_lat": request.location_lat,
        "location_lng": request.location_lng,
        "driver_id": request.driver_id,
    }
    
    session, ai_message = chat_service.process_chat(
        session_id=request.session_id,
        message=request.message,
        context=context
    )
    
    return ChatResponse(
        session_id=session.session_id,
        message=ai_message
    )

@router.get("/history/{session_id}", response_model=ChatSession)
async def get_history(session_id: str):
    session = chat_service.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session
