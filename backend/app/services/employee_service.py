import json
from pathlib import Path

import cv2
import numpy as np
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.ai.face_engine import FaceEngine
from app.core.config import settings
from app.models.entities import Embedding, Employee, TrackingEvent


class EmployeeService:
    def __init__(self, face_engine: FaceEngine) -> None:
        self.face_engine = face_engine
        Path(settings.PREVIEW_DIR).mkdir(parents=True, exist_ok=True)

    def create_employee(self, db: Session, *, name: str, employee_id: str, samples: list[str]) -> Employee:
        existing = db.scalar(select(Employee).where(Employee.employee_id == employee_id))
        if existing:
            raise ValueError("Employee ID already exists")

        embeddings: list[np.ndarray] = []
        preview_path: str | None = None

        for index, sample in enumerate(samples):
            image = self.face_engine.decode_image(sample)
            result = self.face_engine.extract_face(image)
            if result is None:
                continue

            embeddings.append(result.embedding)
            if preview_path is None:
                preview_path = self._save_preview(employee_id, result.crop, fallback=image)

        if len(embeddings) < 5:
            raise ValueError("Capture at least 5 clear face samples before saving")

        employee = Employee(name=name.strip(), employee_id=employee_id.strip(), preview_image=preview_path)
        db.add(employee)
        db.flush()

        for vector in embeddings:
            db.add(Embedding(employee_pk=employee.id, vector=json.dumps(vector.tolist())))

        db.commit()
        db.refresh(employee)
        return employee

    def list_employees(self, db: Session) -> list[dict]:
        latest_tracking = (
            select(
                TrackingEvent.employee_pk,
                func.max(TrackingEvent.timestamp).label("last_seen_time"),
            )
            .group_by(TrackingEvent.employee_pk)
            .subquery()
        )

        rows = (
            db.query(Employee, TrackingEvent.location, latest_tracking.c.last_seen_time)
            .outerjoin(latest_tracking, latest_tracking.c.employee_pk == Employee.id)
            .outerjoin(
                TrackingEvent,
                (TrackingEvent.employee_pk == Employee.id)
                & (TrackingEvent.timestamp == latest_tracking.c.last_seen_time),
            )
            .order_by(Employee.created_at.desc())
            .all()
        )

        results = []
        for employee, location, last_seen_time in rows:
            results.append(
                {
                    "employee_id": employee.employee_id,
                    "name": employee.name,
                    "preview_image_url": self.preview_url(employee.preview_image),
                    "sample_count": len(employee.embeddings),
                    "last_seen_location": location,
                    "last_seen_time": last_seen_time,
                }
            )
        return results

    def search_employees(self, db: Session, query: str) -> list[Employee]:
        pattern = f"%{query.strip()}%"
        return list(
            db.scalars(
                select(Employee).where(
                    or_(Employee.employee_id.ilike(pattern), Employee.name.ilike(pattern))
                )
            )
        )

    def get_employee_by_employee_id(self, db: Session, employee_id: str) -> Employee | None:
        return db.scalar(select(Employee).where(Employee.employee_id == employee_id))

    def get_embedding_vectors(self, employee: Employee) -> list[np.ndarray]:
        vectors = []
        for embedding in employee.embeddings:
            vectors.append(np.array(json.loads(embedding.vector), dtype=np.float32))
        return vectors

    def preview_url(self, preview_path: str | None) -> str | None:
        if not preview_path:
            return None
        return f"/assets/previews/{Path(preview_path).name}"

    def _save_preview(self, employee_id: str, crop: np.ndarray, fallback: np.ndarray) -> str:
        output = crop if crop.size else fallback
        resized = cv2.resize(output, (240, 240))
        path = Path(settings.PREVIEW_DIR) / f"{employee_id}.jpg"
        cv2.imwrite(str(path), resized)
        return str(path)
