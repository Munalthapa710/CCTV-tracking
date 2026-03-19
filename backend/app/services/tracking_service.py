import base64
from datetime import datetime
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.core.config import SNAPSHOT_DIR
from app.models.entities import Camera, Employee, TrackingEvent


class TrackingService:
    @staticmethod
    def record_detection(
        db: Session,
        *,
        employee_pk: int,
        employee_id: str,
        camera_id: str,
        location: str,
        similarity: float,
        snapshot_image: str | None = None,
    ) -> TrackingEvent:
        snapshot_path = TrackingService._save_snapshot(
            employee_id=employee_id,
            camera_id=camera_id,
            snapshot_image=snapshot_image,
        )
        event = TrackingEvent(
            employee_pk=employee_pk,
            employee_id=employee_id,
            camera_id=camera_id,
            location=location,
            similarity=similarity,
            snapshot_image=snapshot_path,
        )
        db.add(event)
        db.commit()
        db.refresh(event)
        return event

    @staticmethod
    def list_events(
        db: Session,
        *,
        limit: int = 50,
        employee_id: str | None = None,
        camera_id: str | None = None,
    ) -> list[dict]:
        query = select(TrackingEvent).options(joinedload(TrackingEvent.employee))
        if employee_id:
            query = query.where(TrackingEvent.employee_id == employee_id.strip())
        if camera_id:
            query = query.where(TrackingEvent.camera_id == camera_id.strip())
        query = query.order_by(TrackingEvent.timestamp.desc()).limit(limit)

        camera_lookup = {
            camera.camera_id: camera.display_name
            for camera in db.scalars(select(Camera))
        }

        events = list(db.scalars(query))
        results = []
        for event in events:
            employee = event.employee
            results.append(
                {
                    "id": event.id,
                    "employee_id": event.employee_id,
                    "employee_name": employee.name if employee else event.employee_id,
                    "employee_preview_image_url": TrackingService._employee_preview_url(employee),
                    "camera_id": event.camera_id,
                    "camera_display_name": camera_lookup.get(event.camera_id),
                    "location": event.location,
                    "similarity": event.similarity,
                    "snapshot_image_url": TrackingService.snapshot_url(event.snapshot_image),
                    "timestamp": event.timestamp,
                }
            )
        return results

    @staticmethod
    def snapshot_url(snapshot_path: str | None) -> str | None:
        if not snapshot_path:
            return None
        return f"/assets/snapshots/{Path(snapshot_path).name}"

    @staticmethod
    def _employee_preview_url(employee: Employee | None) -> str | None:
        if employee is None or not employee.preview_image:
            return None
        return f"/assets/previews/{Path(employee.preview_image).name}"

    @staticmethod
    def _save_snapshot(*, employee_id: str, camera_id: str, snapshot_image: str | None) -> str | None:
        if not snapshot_image or "," not in snapshot_image:
            return None

        _, encoded = snapshot_image.split(",", 1)
        try:
            image_bytes = base64.b64decode(encoded, validate=True)
        except Exception:
            return None

        SNAPSHOT_DIR.mkdir(parents=True, exist_ok=True)
        filename = f"{employee_id}_{camera_id}_{datetime.utcnow().strftime('%Y%m%d%H%M%S%f')}.jpg"
        path = SNAPSHOT_DIR / filename
        path.write_bytes(image_bytes)
        return str(path)
