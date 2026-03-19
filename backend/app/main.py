from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import inspect, text
from sqlalchemy import func, select

from app.core.config import DATA_DIR, PREVIEW_DIR, SNAPSHOT_DIR, settings
from app.core.database import Base, SessionLocal, engine
from app.models.entities import Camera, Employee
from app.routes.auth import router as auth_router
from app.routes.cameras import router as cameras_router
from app.routes.employees import router as employees_router
from app.routes.find import router as find_router
from app.routes.tracking import router as tracking_router
from app.runtime import camera_scanner, employee_service, face_engine
from app.services.camera_service import CameraService


@asynccontextmanager
async def lifespan(_: FastAPI):
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    PREVIEW_DIR.mkdir(parents=True, exist_ok=True)
    SNAPSHOT_DIR.mkdir(parents=True, exist_ok=True)
    Base.metadata.create_all(bind=engine)
    ensure_schema_columns()

    with SessionLocal() as db:
        CameraService.ensure_default_cameras(db)

    camera_scanner.start()
    yield
    camera_scanner.stop()


app = FastAPI(
    title=settings.APP_NAME,
    description="Register employees from face scans and find them across simulated CCTV cameras",
    version="2.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/assets", StaticFiles(directory=Path(DATA_DIR)), name="assets")

app.include_router(auth_router, prefix="/api")
app.include_router(employees_router, prefix="/api")
app.include_router(cameras_router, prefix="/api")
app.include_router(find_router, prefix="/api")
app.include_router(tracking_router, prefix="/api")


def ensure_schema_columns() -> None:
    inspector = inspect(engine)
    table_names = inspector.get_table_names()
    statements = []
    if "cameras" in table_names:
        existing_columns = {column["name"] for column in inspector.get_columns("cameras")}
        if "source_type" not in existing_columns:
            statements.append("ALTER TABLE cameras ADD COLUMN source_type VARCHAR(32) DEFAULT 'browser'")
        if "source_url" not in existing_columns:
            statements.append("ALTER TABLE cameras ADD COLUMN source_url VARCHAR(512)")
        if "notes" not in existing_columns:
            statements.append("ALTER TABLE cameras ADD COLUMN notes VARCHAR(512)")

    if "tracking_events" in table_names:
        tracking_columns = {column["name"] for column in inspector.get_columns("tracking_events")}
        if "snapshot_image" not in tracking_columns:
            statements.append("ALTER TABLE tracking_events ADD COLUMN snapshot_image VARCHAR(255)")

    if statements:
        with engine.begin() as connection:
            for statement in statements:
                connection.execute(text(statement))


@app.get("/")
def root():
    return {
        "name": settings.APP_NAME,
        "version": "2.0.0",
        "docs": "/api/docs",
        "face_engine_mode": face_engine.mode,
    }


@app.get("/api/health")
def health():
    with SessionLocal() as db:
        employee_count = db.scalar(select(func.count(Employee.id))) or 0
        camera_count = db.scalar(select(func.count(Camera.id))) or 0

    return {
        "status": "healthy",
        "employee_count": employee_count,
        "camera_count": camera_count,
        "processed_camera_count": camera_scanner.processed_camera_count(),
    }
