from fastapi import FastAPI
from app.api.routes.planning import router as planning_router
from app.config.settings import settings

app = FastAPI(
    title="QuickPark Agent Service",
    description="Provides agent orchestration capabilities for QuickPark.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

@app.get("/api/health", summary="Health check endpoint")
def health_check():
    return {
        "status": "healthy",
        "service": "quickpark-agent-service"
    }

app.include_router(planning_router, prefix="/api/planning", tags=["Planning"])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=settings.AGENT_SERVICE_PORT, reload=True)
