from typing import Optional

from fastapi import APIRouter, Header, HTTPException

from app.agents.parking_demand_agent import DemandAnalysisError, ParkingDemandAgent
from app.models.demand_analysis import DemandAnalysisResponse, DemandAnalyzeRequest
from app.services.api_client import ApiError

router = APIRouter()
agent = ParkingDemandAgent()


def bearer_token(authorization: Optional[str]) -> str:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Bearer token required.")
    token = authorization[7:].strip()
    if not token:
        raise HTTPException(status_code=401, detail="Bearer token required.")
    return token


@router.post(
    "/analyze",
    response_model=DemandAnalysisResponse,
    summary="Analyse parking demand for the caller's own facilities",
)
def analyze_demand(
    request: DemandAnalyzeRequest,
    authorization: Optional[str] = Header(default=None),
) -> DemandAnalysisResponse:
    token = bearer_token(authorization)

    try:
        return agent.analyze(
            token=token,
            date_from=request.date_from,
            date_to=request.date_to,
            facility_id=request.facility_id,
        )
    except DemandAnalysisError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except ApiError as e:
        raise HTTPException(status_code=502, detail=str(e))
    except Exception:
        raise HTTPException(status_code=500, detail="Internal server error during demand analysis.")
