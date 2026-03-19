from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.schemas import CameraCreate, CameraSyncRequest, CameraTestRequest, CameraTestResponse, CameraUpdate
from app.runtime import get_camera_scanner
from app.services.camera_service import CameraService


router = APIRouter(prefix="/cameras", tags=["cameras"])


@router.get("")
def list_cameras(db: Session = Depends(get_db)):
    cameras = CameraService.list_cameras(db)
    scanner = get_camera_scanner()
    return {"cameras": scanner.get_status(cameras)}


@router.post("")
def create_camera(payload: CameraCreate, db: Session = Depends(get_db)):
    try:
        camera = CameraService.create_camera(
            db,
            camera_id=payload.camera_id,
            display_name=payload.display_name,
            location=payload.location,
            source_type=payload.source_type,
            source_url=payload.source_url,
            notes=payload.notes,
            is_active=payload.is_active,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    return {
        "camera_id": camera.camera_id,
        "display_name": camera.display_name,
        "location": camera.location,
        "source_type": camera.source_type,
        "source_url": camera.source_url,
        "notes": camera.notes,
        "is_active": camera.is_active,
    }


@router.put("/{camera_id}")
def update_camera(camera_id: str, payload: CameraUpdate, db: Session = Depends(get_db)):
    try:
        camera = CameraService.update_camera(
            db,
            camera_id=camera_id,
            display_name=payload.display_name,
            location=payload.location,
            source_type=payload.source_type,
            source_url=payload.source_url,
            notes=payload.notes,
            is_active=payload.is_active,
        )
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc

    return {
        "camera_id": camera.camera_id,
        "display_name": camera.display_name,
        "location": camera.location,
        "source_type": camera.source_type,
        "source_url": camera.source_url,
        "notes": camera.notes,
        "is_active": camera.is_active,
    }


@router.post("/test", response_model=CameraTestResponse)
def test_camera(payload: CameraTestRequest):
    scanner = get_camera_scanner()
    return scanner.test_camera_source(payload.source_type, payload.source_url)


@router.post("/sync")
def sync_camera_frames(payload: CameraSyncRequest):
    scanner = get_camera_scanner()
    scanner.sync_frames([frame.model_dump() for frame in payload.frames])
    scanner.process_buffer()
    return {"success": True, "synced": len(payload.frames)}
