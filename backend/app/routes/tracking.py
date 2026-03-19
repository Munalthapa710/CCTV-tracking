from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.models.models import User
from app.models.schemas import (
    PersonLocation, MovementHistory, TrackingLogResponse,
    PersonLocation as PersonLocationSchema
)
from app.services.camera_service import TrackingService
from app.routes.auth import get_current_user

router = APIRouter(prefix="/tracking", tags=["Tracking"])


@router.get("/person/{user_id}/location")
async def get_person_location(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get current location of a specific person."""
    tracking_service = TrackingService(db)
    location = tracking_service.get_person_current_location(user_id)
    
    if not location:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No tracking data found for this person"
        )
    
    return location


@router.get("/persons/active")
async def get_active_persons(
    within_minutes: int = Query(default=60, ge=1, le=1440),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all active persons with their last seen location."""
    tracking_service = TrackingService(db)
    persons = tracking_service.get_all_active_persons(within_minutes=within_minutes)
    
    return {
        "count": len(persons),
        "within_minutes": within_minutes,
        "persons": persons
    }


@router.get("/person/{user_id}/history")
async def get_person_history(
    user_id: int,
    limit: int = Query(default=50, ge=1, le=500),
    hours: int = Query(default=24, ge=1, le=168),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get movement history for a person."""
    tracking_service = TrackingService(db)
    
    # Verify user exists
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    history = tracking_service.get_person_movement_history(
        user_id=user_id, limit=limit, hours=hours
    )
    
    return {
        "user_id": user_id,
        "user_name": user.name,
        "hours": hours,
        "movements": history
    }


@router.get("/location/{location_name}")
async def get_location_history(
    location_name: str,
    limit: int = Query(default=100, ge=1, le=500),
    hours: int = Query(default=24, ge=1, le=168),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all persons detected at a specific location."""
    tracking_service = TrackingService(db)
    
    # URL decode the location name
    from urllib.parse import unquote
    location = unquote(location_name)
    
    history = tracking_service.get_location_history(
        location=location, limit=limit, hours=hours
    )
    
    return {
        "location": location,
        "hours": hours,
        "count": len(history),
        "detections": history
    }


@router.get("/search")
async def search_person(
    q: str = Query(..., min_length=1, description="Search query for person name"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Search for a person by name."""
    tracking_service = TrackingService(db)
    results = tracking_service.search_person_by_name(q)
    
    return {
        "query": q,
        "count": len(results),
        "results": results
    }


@router.get("/statistics")
async def get_statistics(
    hours: int = Query(default=24, ge=1, le=168),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get tracking statistics."""
    tracking_service = TrackingService(db)
    stats = tracking_service.get_statistics(hours=hours)
    
    return stats


@router.get("/logs", response_model=List[TrackingLogResponse])
async def get_tracking_logs(
    limit: int = Query(default=100, ge=1, le=500),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get recent tracking logs."""
    from app.models.models import TrackingLog
    from datetime import datetime, timedelta
    
    cutoff_time = datetime.utcnow() - timedelta(hours=24)
    
    logs = db.query(TrackingLog).filter(
        TrackingLog.timestamp >= cutoff_time
    ).order_by(TrackingLog.timestamp.desc()).limit(limit).all()
    
    result = []
    for log in logs:
        user = db.query(User).filter(User.id == log.user_id).first()
        camera = None
        if log.camera_id:
            from app.models.models import Camera
            camera = db.query(Camera).filter(Camera.id == log.camera_id).first()
        
        result.append({
            'id': log.id,
            'user_id': log.user_id,
            'user_name': user.name if user else "Unknown",
            'camera_id': log.camera_id,
            'camera_name': camera.name if camera else None,
            'location': log.location,
            'confidence_score': log.confidence_score,
            'timestamp': log.timestamp
        })
    
    return result
