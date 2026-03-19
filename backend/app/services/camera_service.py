from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.entities import Camera


DEFAULT_CAMERAS = [
    {"camera_id": "cam-a", "display_name": "Camera A", "location": "Room A", "source_type": "browser", "source_url": None, "notes": "Local browser webcam feed", "sort_order": 1},
    {"camera_id": "cam-b", "display_name": "Camera B", "location": "Room B", "source_type": "browser", "source_url": None, "notes": "Local browser webcam feed", "sort_order": 2},
    {"camera_id": "cam-c", "display_name": "Camera C", "location": "Room C", "source_type": "browser", "source_url": None, "notes": "Local browser webcam feed", "sort_order": 3},
]


class CameraService:
    @staticmethod
    def ensure_default_cameras(db: Session) -> None:
        camera_count = db.scalar(select(func.count(Camera.id))) or 0
        if camera_count > 0:
            return

        for camera in DEFAULT_CAMERAS:
            db.add(Camera(**camera, is_active=True))
        db.commit()

    @staticmethod
    def list_cameras(db: Session) -> list[Camera]:
        return list(db.scalars(select(Camera).order_by(Camera.sort_order.asc())))

    @staticmethod
    def create_camera(
        db: Session,
        *,
        camera_id: str,
        display_name: str,
        location: str,
        source_type: str,
        source_url: str | None,
        notes: str | None,
        is_active: bool,
    ) -> Camera:
        existing = db.scalar(select(Camera).where(Camera.camera_id == camera_id))
        if existing:
            raise ValueError("Camera ID already exists")

        next_order = (db.scalar(select(func.max(Camera.sort_order))) or 0) + 1
        camera = Camera(
            camera_id=camera_id.strip(),
            display_name=display_name.strip(),
            location=location.strip(),
            source_type=source_type.strip(),
            source_url=source_url.strip() if source_url else None,
            notes=notes.strip() if notes else None,
            is_active=is_active,
            sort_order=next_order,
        )
        db.add(camera)
        db.commit()
        db.refresh(camera)
        return camera

    @staticmethod
    def set_camera_active(db: Session, *, camera_id: str, is_active: bool) -> Camera:
        camera = db.scalar(select(Camera).where(Camera.camera_id == camera_id))
        if camera is None:
            raise ValueError("Camera not found")

        camera.is_active = is_active
        db.commit()
        db.refresh(camera)
        return camera

    @staticmethod
    def delete_camera(db: Session, *, camera_id: str) -> None:
        camera = db.scalar(select(Camera).where(Camera.camera_id == camera_id))
        if camera is None:
            raise ValueError("Camera not found")

        db.delete(camera)
        db.flush()

        cameras = list(db.scalars(select(Camera).order_by(Camera.sort_order.asc(), Camera.id.asc())))
        for index, remaining in enumerate(cameras, start=1):
            remaining.sort_order = index

        db.commit()

    @staticmethod
    def update_camera(
        db: Session,
        *,
        camera_id: str,
        display_name: str,
        location: str,
        source_type: str,
        source_url: str | None,
        notes: str | None,
        is_active: bool,
    ) -> Camera:
        camera = db.scalar(select(Camera).where(Camera.camera_id == camera_id))
        if camera is None:
            raise ValueError("Camera not found")

        camera.display_name = display_name.strip()
        camera.location = location.strip()
        camera.source_type = source_type.strip()
        camera.source_url = source_url.strip() if source_url else None
        camera.notes = notes.strip() if notes else None
        camera.is_active = is_active

        db.commit()
        db.refresh(camera)
        return camera
