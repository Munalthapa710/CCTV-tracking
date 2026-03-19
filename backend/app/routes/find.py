from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.models.schemas import FindRequest, FindResponse
from app.runtime import get_camera_scanner, get_employee_service
from app.services.camera_service import CameraService
from app.services.tracking_service import TrackingService


router = APIRouter(tags=["find"])


@router.post("/find", response_model=FindResponse)
def find_employee(payload: FindRequest, db: Session = Depends(get_db)):
    employee_service = get_employee_service()
    scanner = get_camera_scanner()
    employee = employee_service.get_employee_by_employee_id(db, payload.employee_id)
    if employee is None:
        raise HTTPException(status_code=404, detail="Employee not found")

    cameras = CameraService.list_cameras(db)
    vectors = employee_service.get_embedding_vectors(employee)
    outcome = scanner.find_match(cameras, vectors, settings.FACE_MATCH_THRESHOLD)
    match = outcome["match"]

    if match is not None:
        TrackingService.record_detection(
            db,
            employee_pk=employee.id,
            employee_id=employee.employee_id,
            camera_id=match["camera_id"],
            location=match["location"],
            similarity=match["similarity"],
        )
        return {
            "found": True,
            "employee_id": employee.employee_id,
            "employee_name": employee.name,
            "location": match["location"],
            "camera_id": match["camera_id"],
            "similarity": match["similarity"],
            "message": f"Employee {employee.name} is in {match['location']}",
            "cameras": outcome["cameras"],
        }

    return {
        "found": False,
        "employee_id": employee.employee_id,
        "employee_name": employee.name,
        "location": None,
        "camera_id": None,
        "similarity": None,
        "message": f"Employee {employee.name} was not found in the latest camera scan",
        "cameras": outcome["cameras"],
    }
