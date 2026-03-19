from datetime import datetime

from pydantic import BaseModel, Field


class LoginRequest(BaseModel):
    username: str
    password: str


class LoginResponse(BaseModel):
    success: bool
    token: str | None = None
    username: str | None = None
    message: str


class RegisterRequest(BaseModel):
    username: str = Field(min_length=3, max_length=64)
    password: str = Field(min_length=6, max_length=128)


class EmployeeCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    employee_id: str = Field(min_length=1, max_length=64)
    samples: list[str] = Field(min_length=5)


class EmployeeCard(BaseModel):
    employee_id: str
    name: str
    preview_image_url: str | None = None
    sample_count: int
    last_seen_location: str | None = None
    last_seen_time: datetime | None = None


class EmployeeListResponse(BaseModel):
    employees: list[EmployeeCard]


class CameraFrameSync(BaseModel):
    camera_id: str
    image: str


class CameraSyncRequest(BaseModel):
    frames: list[CameraFrameSync]


class CameraStatus(BaseModel):
    camera_id: str
    display_name: str
    location: str
    source_type: str
    source_url: str | None = None
    notes: str | None = None
    is_active: bool
    latest_preview: str | None = None
    processed_at: datetime | None = None
    face_detected: bool = False
    similarity: float | None = None
    highlighted: bool = False


class CameraCreate(BaseModel):
    camera_id: str = Field(min_length=1, max_length=64)
    display_name: str = Field(min_length=1, max_length=128)
    location: str = Field(min_length=1, max_length=128)
    source_type: str = Field(min_length=1, max_length=32)
    source_url: str | None = Field(default=None, max_length=512)
    notes: str | None = Field(default=None, max_length=512)
    is_active: bool = True


class CameraUpdate(BaseModel):
    display_name: str = Field(min_length=1, max_length=128)
    location: str = Field(min_length=1, max_length=128)
    source_type: str = Field(min_length=1, max_length=32)
    source_url: str | None = Field(default=None, max_length=512)
    notes: str | None = Field(default=None, max_length=512)
    is_active: bool = True


class FindRequest(BaseModel):
    employee_id: str


class FindResponse(BaseModel):
    found: bool
    employee_id: str
    employee_name: str | None = None
    location: str | None = None
    camera_id: str | None = None
    similarity: float | None = None
    message: str
    cameras: list[CameraStatus]


class HealthResponse(BaseModel):
    status: str
    employee_count: int
    camera_count: int
    processed_camera_count: int
