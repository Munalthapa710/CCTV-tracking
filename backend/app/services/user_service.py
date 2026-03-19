import os
import uuid
import cv2
import numpy as np
from typing import List, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status, UploadFile

from app.models.models import User, FaceEmbedding
from app.models.schemas import UserCreate, UserUpdate
from app.face_recognition.face_service import FaceRecognitionService


class UserService:
    """Service for user management operations."""
    
    def __init__(self, db: Session):
        self.db = db
        self.face_service = FaceRecognitionService()
    
    def create_user(self, user_data: UserCreate, images: List[UploadFile]) -> User:
        """Create a new user with face images."""
        # Check if email already exists
        if user_data.email:
            existing = self.db.query(User).filter(User.email == user_data.email).first()
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Email already registered"
                )
        
        # Create user
        user = User(
            name=user_data.name,
            department=user_data.department,
            email=user_data.email
        )
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        
        # Process face images
        if images:
            self._process_face_images(user.id, images)
        
        return user
    
    def _process_face_images(self, user_id: int, images: List[UploadFile]):
        """Process uploaded face images and store embeddings."""
        upload_dir = "uploads/faces"
        os.makedirs(upload_dir, exist_ok=True)
        
        embeddings = []
        
        for image in images:
            try:
                # Read image
                contents = image.file.read()
                nparr = np.frombuffer(contents, np.uint8)
                img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
                
                if img is None:
                    continue
                
                # Extract embedding
                embedding = self.face_service.extract_embedding(img)
                
                if embedding is not None:
                    embeddings.append(embedding)
                    
                    # Save image
                    filename = f"{user_id}_{uuid.uuid4().hex}.jpg"
                    filepath = os.path.join(upload_dir, filename)
                    cv2.imwrite(filepath, img)
                    
                    # Store embedding
                    face_embedding = FaceEmbedding(
                        user_id=user_id,
                        embedding_vector=FaceRecognitionService.embedding_to_string(embedding),
                        image_path=filepath
                    )
                    self.db.add(face_embedding)
                
            except Exception as e:
                print(f"Error processing image: {e}")
                continue
        
        self.db.commit()
        
        if not embeddings:
            # Rollback user creation if no faces detected
            self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No faces detected in uploaded images. Please upload clear face images."
            )
    
    def get_user(self, user_id: int) -> Optional[User]:
        """Get user by ID."""
        return self.db.query(User).filter(User.id == user_id).first()
    
    def get_user_by_email(self, email: str) -> Optional[User]:
        """Get user by email."""
        return self.db.query(User).filter(User.email == email).first()
    
    def get_users(self, skip: int = 0, limit: int = 100) -> List[User]:
        """Get all users."""
        return self.db.query(User).offset(skip).limit(limit).all()
    
    def update_user(self, user_id: int, user_data: UserUpdate) -> User:
        """Update user information."""
        user = self.get_user(user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        update_data = user_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(user, field, value)
        
        self.db.commit()
        self.db.refresh(user)
        return user
    
    def delete_user(self, user_id: int):
        """Delete a user."""
        user = self.get_user(user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        self.db.delete(user)
        self.db.commit()
    
    def add_face_to_user(self, user_id: int, images: List[UploadFile]) -> int:
        """Add additional face images to an existing user."""
        user = self.get_user(user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        initial_count = self.db.query(FaceEmbedding).filter(
            FaceEmbedding.user_id == user_id
        ).count()
        
        self._process_face_images(user_id, images)
        
        new_count = self.db.query(FaceEmbedding).filter(
            FaceEmbedding.user_id == user_id
        ).count()
        
        return new_count - initial_count
    
    def get_user_embeddings(self, user_id: int) -> List[FaceEmbedding]:
        """Get all face embeddings for a user."""
        return self.db.query(FaceEmbedding).filter(
            FaceEmbedding.user_id == user_id
        ).all()
