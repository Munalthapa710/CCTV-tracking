from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.schemas import TrackingHistoryResponse
from app.services.tracking_service import TrackingService


router = APIRouter(prefix="/tracking", tags=["tracking"])


@router.get("", response_model=TrackingHistoryResponse)
def list_tracking_events(
    limit: int = Query(default=50, ge=1, le=250),
    employee_id: str | None = Query(default=None),
    camera_id: str | None = Query(default=None),
    db: Session = Depends(get_db),
):
    return {
        "events": TrackingService.list_events(
            db,
            limit=limit,
            employee_id=employee_id,
            camera_id=camera_id,
        )
    }
