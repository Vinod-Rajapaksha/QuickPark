from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes.demand import router as demand_router
from app.api.routes.planning import router as planning_router
from app.api.routes.chat import router as chat_router
from app.api.routes.recommendation import router as recommendation_router
from app.api.routes.reservation import router as reservation_router
from app.config.settings import settings
from app.api.routes.validation import router as validation_router
import logging

logger = logging.getLogger(__name__)

app = FastAPI(
    title="QuickPark Agent Service",
    description="Provides agent orchestration capabilities for QuickPark.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in settings.CORS_ORIGINS.split(",")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health", summary="Health check endpoint")
def health_check():
    return {
        "status": "healthy",
        "service": "quickpark-agent-service"
    }

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Global Error: {exc}")
    return JSONResponse(
        status_code=500,
        content={"message": "An internal error occurred", "detail": str(exc)},
    )

app.include_router(planning_router, prefix="/api/planning", tags=["Planning"])
app.include_router(demand_router, prefix="/api/demand", tags=["Demand"])
app.include_router(chat_router, prefix="/api/chat", tags=["Chat"])
app.include_router(recommendation_router, prefix="/api/recommendation", tags=["Recommendation"])
app.include_router(reservation_router, prefix="/api/reservation", tags=["Reservation"])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=settings.AGENT_SERVICE_PORT, reload=True)

app.include_router(validation_router,prefix="/api/validation",tags=["Validation"],)
