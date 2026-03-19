from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Float, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base


class User(Base):
    """User model for storing registered users."""
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, index=True)
    department = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    face_embeddings = relationship("FaceEmbedding", back_populates="user", cascade="all, delete-orphan")
    tracking_logs = relationship("TrackingLog", back_populates="user", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<User(id={self.id}, name='{self.name}', department='{self.department}')>"


class FaceEmbedding(Base):
    """Face embedding model for storing face vectors."""
    __tablename__ = "face_embeddings"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    embedding_vector = Column(Text, nullable=False)  # Stored as JSON string
    image_path = Column(String(500), nullable=True)  # Optional: store reference image
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="face_embeddings")
    
    def __repr__(self):
        return f"<FaceEmbedding(id={self.id}, user_id={self.user_id})>"


class Camera(Base):
    """Camera model for storing CCTV camera information."""
    __tablename__ = "cameras"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    location = Column(String(200), nullable=False)  # Room name / Department
    rtsp_url = Column(String(500), nullable=False)
    is_active = Column(Integer, default=1)  # 1 = active, 0 = inactive
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    tracking_logs = relationship("TrackingLog", back_populates="camera", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Camera(id={self.id}, name='{self.name}', location='{self.location}')>"


class TrackingLog(Base):
    """Tracking log model for storing person movement history."""
    __tablename__ = "tracking_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    camera_id = Column(Integer, ForeignKey("cameras.id", ondelete="SET NULL"), nullable=True)
    location = Column(String(200), nullable=False)
    confidence_score = Column(Float, default=0.0)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    
    # Relationships
    user = relationship("User", back_populates="tracking_logs")
    camera = relationship("Camera", back_populates="tracking_logs")
    
    def __repr__(self):
        return f"<TrackingLog(id={self.id}, user_id={self.user_id}, location='{self.location}')>"


class SystemLog(Base):
    """System log model for auditing and debugging."""
    __tablename__ = "system_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    log_type = Column(String(50), nullable=False)  # INFO, WARNING, ERROR, TRACKING
    message = Column(Text, nullable=False)
    details = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    
    def __repr__(self):
        return f"<SystemLog(id={self.id}, type='{self.log_type}')>"
