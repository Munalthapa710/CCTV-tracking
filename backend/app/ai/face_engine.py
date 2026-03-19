import base64
import io
from dataclasses import dataclass

import cv2
import numpy as np
from PIL import Image


@dataclass
class FaceResult:
    embedding: np.ndarray
    crop: np.ndarray


class FaceEngine:
    def __init__(self) -> None:
        self.mode = "opencv"
        self._insight_app = None
        cascade_path = cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
        self._cascade = cv2.CascadeClassifier(cascade_path)

        try:
            from insightface.app import FaceAnalysis

            app = FaceAnalysis(name="buffalo_l", providers=["CPUExecutionProvider"])
            app.prepare(ctx_id=-1, det_size=(320, 320))
            self._insight_app = app
            self.mode = "insightface"
        except Exception:
            self._insight_app = None

    def decode_image(self, image_payload: str) -> np.ndarray:
        encoded = image_payload.split(",", 1)[1] if "," in image_payload else image_payload
        image_bytes = base64.b64decode(encoded)
        pil_image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        return cv2.cvtColor(np.array(pil_image), cv2.COLOR_RGB2BGR)

    def encode_image(self, image: np.ndarray) -> str:
        success, buffer = cv2.imencode(".jpg", image, [int(cv2.IMWRITE_JPEG_QUALITY), 85])
        if not success:
            raise ValueError("Unable to encode image")
        return f"data:image/jpeg;base64,{base64.b64encode(buffer.tobytes()).decode('utf-8')}"

    def extract_face(self, image: np.ndarray) -> FaceResult | None:
        if self._insight_app is not None:
            face = self._extract_with_insightface(image)
            if face is not None:
                return face

        return self._extract_with_opencv(image)

    def _extract_with_insightface(self, image: np.ndarray) -> FaceResult | None:
        try:
            faces = self._insight_app.get(image)
        except Exception:
            return None

        if not faces:
            return None

        best_face = max(faces, key=lambda item: (item.bbox[2] - item.bbox[0]) * (item.bbox[3] - item.bbox[1]))
        x1, y1, x2, y2 = [max(0, int(v)) for v in best_face.bbox]
        crop = image[y1:y2, x1:x2]
        embedding = self._normalize(best_face.embedding.astype(np.float32))
        if crop.size == 0:
            crop = image.copy()
        return FaceResult(embedding=embedding, crop=crop)

    def _extract_with_opencv(self, image: np.ndarray) -> FaceResult | None:
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        faces = self._cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(80, 80))
        if len(faces) == 0:
            return None

        x, y, w, h = max(faces, key=lambda item: item[2] * item[3])
        crop = image[y : y + h, x : x + w]
        gray_crop = cv2.cvtColor(crop, cv2.COLOR_BGR2GRAY)
        resized = cv2.resize(gray_crop, (32, 32)).astype(np.float32) / 255.0
        histogram = cv2.calcHist([gray_crop], [0], None, [32], [0, 256]).flatten().astype(np.float32)
        embedding = np.concatenate([resized.flatten(), histogram])
        return FaceResult(embedding=self._normalize(embedding), crop=crop)

    def cosine_similarity(self, left: np.ndarray, right: np.ndarray) -> float:
        if left.size == 0 or right.size == 0:
            return 0.0
        return float(np.dot(self._normalize(left), self._normalize(right)))

    def _normalize(self, vector: np.ndarray) -> np.ndarray:
        norm = np.linalg.norm(vector)
        if norm == 0:
            return vector
        return vector / norm
