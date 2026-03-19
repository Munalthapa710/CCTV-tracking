from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Request
from sqlalchemy.orm import Session
from typing import List
import base64
import numpy as np
import cv2
import os
import uuid
import json

from app.core.database import get_db
from app.models.models import User, FaceEmbedding
from app.models.schemas import UserResponse, UserCreate, UserUpdate
from app.services.user_service import UserService
from app.face_recognition.face_service import FaceRecognitionService
from app.routes.auth import get_current_user

router = APIRouter(prefix="/users", tags=["Users"])


@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    name: str = Form(...),
    department: str = Form(...),
    email: str = Form(None),
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Register a new user with face images."""
    user_service = UserService(db)
    
    user_data = UserCreate(name=name, department=department, email=email)
    user = user_service.create_user(user_data, files)
    
    return user


@router.get("/", response_model=List[UserResponse])
async def get_users(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all registered users."""
    user_service = UserService(db)
    return user_service.get_users(skip=skip, limit=limit)


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get user by ID."""
    user_service = UserService(db)
    user = user_service.get_user(user_id)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return user


@router.put("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: int,
    name: str = Form(None),
    department: str = Form(None),
    email: str = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update user information."""
    user_service = UserService(db)
    
    user_data = UserUpdate(name=name, department=department, email=email)
    user = user_service.update_user(user_id, user_data)
    
    return user


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a user."""
    user_service = UserService(db)
    user_service.delete_user(user_id)


@router.post("/{user_id}/faces", status_code=status.HTTP_201_CREATED)
async def add_face_images(
    user_id: int,
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Add additional face images to an existing user."""
    user_service = UserService(db)
    
    added_count = user_service.add_face_to_user(user_id, files)
    
    return {
        "message": f"Successfully added {added_count} face image(s)",
        "user_id": user_id
    }


@router.get("/{user_id}/embeddings")
async def get_user_embeddings(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all face embeddings for a user."""
    user_service = UserService(db)
    embeddings = user_service.get_user_embeddings(user_id)

    return {
        "user_id": user_id,
        "embedding_count": len(embeddings),
        "embeddings": [
            {
                "id": emb.id,
                "image_path": emb.image_path,
                "created_at": emb.created_at
            }
            for emb in embeddings
        ]
    }


@router.post("/register-camera", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register_user_with_camera(
    name: str = Form(...),
    department: str = Form(...),
    email: str = Form(None),
    password: str = Form(None),
    face_images: str = Form(...),  # JSON array of base64 images
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Register a new user with face images captured from camera."""
    user_service = UserService(db)
    
    # Check if email already exists
    if email:
        existing = db.query(User).filter(User.email == email).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
    
    # Create user
    user_data = UserCreate(name=name, department=department, email=email)
    user = user_service.create_user(user_data, [])
    
    # Process base64 face images
    upload_dir = "uploads/faces"
    os.makedirs(upload_dir, exist_ok=True)
    
    try:
        face_data_list = json.loads(face_images)
    except json.JSONDecodeError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid face images format"
        )
    
    embeddings = []
    face_rec_service = FaceRecognitionService()
    
    for idx, base64_image in enumerate(face_data_list):
        try:
            # Remove data URL prefix if present
            if ',' in base64_image:
                base64_image = base64_image.split(',')[1]
            
            # Decode base64 image
            image_data = base64.b64decode(base64_image)
            nparr = np.frombuffer(image_data, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            
            if img is None:
                continue
            
            # Extract embedding
            embedding = face_rec_service.extract_embedding(img)
            
            if embedding is not None:
                embeddings.append(embedding)
                
                # Save image
                filename = f"{user.id}_camera_{uuid.uuid4().hex}.jpg"
                filepath = os.path.join(upload_dir, filename)
                cv2.imwrite(filepath, img)
                
                # Store embedding
                face_embedding = FaceEmbedding(
                    user_id=user.id,
                    embedding_vector=FaceRecognitionService.embedding_to_string(embedding),
                    image_path=filepath
                )
                db.add(face_embedding)
                
        except Exception as e:
            print(f"Error processing camera image {idx}: {e}")
            continue
    
    db.commit()
    
    if not embeddings:
        db.rollback()
        # Delete the user since no faces were detected
        db.delete(user)
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No faces detected in camera images. Please try again with clear face images."
        )
    
    return user
