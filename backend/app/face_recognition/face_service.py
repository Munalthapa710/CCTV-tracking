import cv2
import numpy as np
from typing import List, Tuple, Optional, Dict
from datetime import datetime
import insightface
from insightface.app import FaceAnalysis
from app.core.config import settings


class FaceRecognitionService:
    """
    Face recognition service using InsightFace.
    Handles face detection, embedding extraction, and face matching.
    """
    
    _instance: Optional['FaceRecognitionService'] = None
    _app: Optional[FaceAnalysis] = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    def __init__(self):
        if self._app is None:
            self.initialize()
    
    def initialize(self):
        """Initialize the InsightFace model."""
        try:
            # Initialize FaceAnalysis with retinaface detection
            self._app = FaceAnalysis(providers=['CPUExecutionProvider'])
            self._app.prepare(ctx_id=0, det_size=(640, 640))
            print("✓ Face recognition model initialized successfully")
        except Exception as e:
            print(f"✗ Error initializing face recognition: {e}")
            raise
    
    def detect_faces(self, image: np.ndarray) -> List[Dict]:
        """
        Detect faces in an image and return face information.
        
        Args:
            image: BGR image from OpenCV
            
        Returns:
            List of dictionaries containing face info (bbox, embedding, landmark)
        """
        if self._app is None:
            self.initialize()
        
        try:
            # Convert BGR to RGB for InsightFace
            rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
            
            # Detect faces
            faces = self._app.get(rgb_image)
            
            results = []
            for face in faces:
                face_info = {
                    'bbox': face.bbox.astype(int).tolist(),  # [x1, y1, x2, y2]
                    'embedding': face.embedding,  # 512-dim vector
                    'landmark': face.kps.astype(int).tolist() if face.kps is not None else None,
                    'det_score': float(face.det_score),  # Detection confidence
                }
                results.append(face_info)
            
            return results
        except Exception as e:
            print(f"Error detecting faces: {e}")
            return []
    
    def extract_embedding(self, image: np.ndarray) -> Optional[np.ndarray]:
        """
        Extract face embedding from an image (assumes single face).
        
        Args:
            image: BGR image from OpenCV
            
        Returns:
            Face embedding vector or None if no face detected
        """
        faces = self.detect_faces(image)
        if faces and len(faces) > 0:
            # Return embedding of the largest face (most prominent)
            largest_face = max(faces, key=lambda f: (f['bbox'][2] - f['bbox'][0]) * (f['bbox'][3] - f['bbox'][1]))
            return largest_face['embedding']
        return None
    
    def extract_embeddings_from_multiple_images(self, images: List[np.ndarray]) -> List[np.ndarray]:
        """
        Extract embeddings from multiple images of the same person.
        
        Args:
            images: List of BGR images
            
        Returns:
            List of embedding vectors
        """
        embeddings = []
        for image in images:
            embedding = self.extract_embedding(image)
            if embedding is not None:
                embeddings.append(embedding)
        return embeddings
    
    def compare_faces(self, embedding1: np.ndarray, embedding2: np.ndarray) -> float:
        """
        Compare two face embeddings using cosine similarity.
        
        Args:
            embedding1: First face embedding
            embedding2: Second face embedding
            
        Returns:
            Cosine similarity score (0-1, higher = more similar)
        """
        # Normalize embeddings
        embedding1_norm = embedding1 / np.linalg.norm(embedding1)
        embedding2_norm = embedding2 / np.linalg.norm(embedding2)
        
        # Calculate cosine similarity
        similarity = np.dot(embedding1_norm, embedding2_norm)
        
        # Convert to 0-1 range ( InsightFace returns -1 to 1)
        similarity = (similarity + 1) / 2
        
        return float(similarity)
    
    def recognize_face(self, image: np.ndarray, stored_embeddings: Dict[int, np.ndarray]) -> Tuple[Optional[int], str, float]:
        """
        Recognize a face by comparing with stored embeddings.
        
        Args:
            image: BGR image containing face
            stored_embeddings: Dictionary of {user_id: embedding}
            
        Returns:
            Tuple of (user_id, user_name, confidence_score)
        """
        detected_embedding = self.extract_embedding(image)
        
        if detected_embedding is None:
            return None, "Unknown", 0.0
        
        best_match_id = None
        best_match_name = None
        best_score = 0.0
        
        for user_id, (user_name, stored_embedding) in stored_embeddings.items():
            similarity = self.compare_faces(detected_embedding, stored_embedding)
            
            if similarity > best_score:
                best_score = similarity
                best_match_id = user_id
                best_match_name = user_name
        
        # Check if best score meets threshold
        if best_score >= settings.FACE_RECOGNITION_THRESHOLD:
            return best_match_id, best_match_name, best_score
        else:
            return None, "Unknown", best_score
    
    def draw_face_box(self, image: np.ndarray, face_info: Dict, label: str = None, color: Tuple = (0, 255, 0)):
        """
        Draw bounding box and label on face.
        
        Args:
            image: BGR image
            face_info: Face information dictionary
            label: Optional label to display
            color: BGR color tuple
        """
        bbox = face_info['bbox']
        x1, y1, x2, y2 = bbox
        
        # Draw rectangle
        cv2.rectangle(image, (x1, y1), (x2, y2), color, 2)
        
        # Draw label background
        if label:
            text_size = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.6, 2)[0]
            cv2.rectangle(image, (x1, y2), (x1 + text_size[0] + 10, y2 + text_size[1] + 10), color, -1)
            
            # Draw text
            cv2.putText(
                image, label, (x1 + 5, y2 + text_size[1] + 5),
                cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 0), 2
            )
        
        return image
    
    @staticmethod
    def embedding_to_string(embedding: np.ndarray) -> str:
        """Convert embedding array to string for database storage."""
        return ','.join(map(str, embedding.tolist()))
    
    @staticmethod
    def string_to_embedding(embedding_str: str) -> np.ndarray:
        """Convert string back to embedding array."""
        return np.array([float(x) for x in embedding_str.split(',')])
