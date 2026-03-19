import threading
import time
from dataclasses import dataclass
from datetime import datetime

import cv2
import numpy as np

from app.ai.face_engine import FaceEngine
from app.core.config import settings
from app.models.entities import Camera


@dataclass
class CameraState:
    preview: str | None = None
    embedding: np.ndarray | None = None
    processed_at: datetime | None = None
    face_detected: bool = False


class CameraScanner:
    def __init__(self, face_engine: FaceEngine) -> None:
        self.face_engine = face_engine
        self._buffer_lock = threading.Lock()
        self._state_lock = threading.Lock()
        self._frame_buffer: dict[str, str] = {}
        self._states: dict[str, CameraState] = {}
        self._thread: threading.Thread | None = None
        self._stop_event = threading.Event()

    def start(self) -> None:
        if self._thread and self._thread.is_alive():
            return
        self._stop_event.clear()
        self._thread = threading.Thread(target=self._loop, daemon=True)
        self._thread.start()

    def stop(self) -> None:
        self._stop_event.set()
        if self._thread and self._thread.is_alive():
            self._thread.join(timeout=2)

    def sync_frames(self, frames: list[dict[str, str]]) -> None:
        with self._buffer_lock:
            for frame in frames:
                self._frame_buffer[frame["camera_id"]] = frame["image"]

    def _loop(self) -> None:
        while not self._stop_event.is_set():
            self.process_buffer()
            time.sleep(settings.CAMERA_PROCESS_INTERVAL)

    def process_buffer(self) -> None:
        with self._buffer_lock:
            queued = dict(self._frame_buffer)
        # Browser-sourced frames are pushed into the buffer. Network CCTV sources are captured from their URLs.
        updated = {}
        try:
            from app.core.database import SessionLocal
            from app.services.camera_service import CameraService

            with SessionLocal() as db:
                cameras = CameraService.list_cameras(db)

            for camera in cameras:
                if not camera.is_active:
                    continue

                if camera.source_type == "browser":
                    image_data = queued.get(camera.camera_id)
                    if image_data is not None:
                        updated[camera.camera_id] = self._process_image_data(image_data)
                elif camera.source_type == "network" and camera.source_url:
                    updated[camera.camera_id] = self._capture_network_source(camera.source_url)
        except Exception:
            pass

        with self._state_lock:
            self._states.update(updated)

    def _process_image_data(self, image_data: str) -> CameraState:
        try:
            image = self.face_engine.decode_image(image_data)
            result = self.face_engine.extract_face(image)
            return CameraState(
                preview=self.face_engine.encode_image(image),
                embedding=result.embedding if result else None,
                processed_at=datetime.utcnow(),
                face_detected=result is not None,
            )
        except Exception:
            return CameraState(
                preview=None,
                embedding=None,
                processed_at=datetime.utcnow(),
                face_detected=False,
            )

    def _capture_network_source(self, source_url: str) -> CameraState:
        capture = cv2.VideoCapture(source_url)
        ok, frame = capture.read()
        capture.release()
        if not ok or frame is None:
            return CameraState(preview=None, embedding=None, processed_at=datetime.utcnow(), face_detected=False)

        result = self.face_engine.extract_face(frame)
        return CameraState(
            preview=self.face_engine.encode_image(frame),
            embedding=result.embedding if result else None,
            processed_at=datetime.utcnow(),
            face_detected=result is not None,
        )

    def get_status(self, cameras: list[Camera]) -> list[dict]:
        with self._state_lock:
            states = dict(self._states)

        results = []
        for camera in cameras:
            state = states.get(camera.camera_id, CameraState())
            results.append(
                {
                    "camera_id": camera.camera_id,
                    "display_name": camera.display_name,
                    "location": camera.location,
                    "source_type": camera.source_type,
                    "source_url": camera.source_url,
                    "notes": camera.notes,
                    "is_active": camera.is_active,
                    "latest_preview": state.preview,
                    "processed_at": state.processed_at,
                    "face_detected": state.face_detected,
                    "similarity": None,
                    "highlighted": False,
                }
            )
        return results

    def find_match(self, cameras: list[Camera], employee_embeddings: list[np.ndarray], threshold: float) -> dict:
        with self._state_lock:
            states = dict(self._states)

        best_match = None
        camera_cards = []

        for camera in cameras:
            state = states.get(camera.camera_id, CameraState())
            best_similarity = None
            if state.embedding is not None:
                best_similarity = max(
                    self.face_engine.cosine_similarity(state.embedding, employee_embedding)
                    for employee_embedding in employee_embeddings
                )
                if best_similarity >= threshold and (best_match is None or best_similarity > best_match["similarity"]):
                    best_match = {
                        "camera_id": camera.camera_id,
                        "location": camera.location,
                        "similarity": best_similarity,
                    }

            camera_cards.append(
                {
                    "camera_id": camera.camera_id,
                    "display_name": camera.display_name,
                    "location": camera.location,
                    "source_type": camera.source_type,
                    "source_url": camera.source_url,
                    "notes": camera.notes,
                    "is_active": camera.is_active,
                    "latest_preview": state.preview,
                    "processed_at": state.processed_at,
                    "face_detected": state.face_detected,
                    "similarity": best_similarity,
                    "highlighted": False,
                }
            )

        if best_match is not None:
            for card in camera_cards:
                card["highlighted"] = card["camera_id"] == best_match["camera_id"]

        return {"match": best_match, "cameras": camera_cards}

    def processed_camera_count(self) -> int:
        with self._state_lock:
            return sum(1 for state in self._states.values() if state.processed_at is not None)
