from sqlalchemy.orm import Session

from app.models.entities import TrackingEvent


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
    ) -> TrackingEvent:
        event = TrackingEvent(
            employee_pk=employee_pk,
            employee_id=employee_id,
            camera_id=camera_id,
            location=location,
            similarity=similarity,
        )
        db.add(event)
        db.commit()
        db.refresh(event)
        return event
