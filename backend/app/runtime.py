from app.ai.camera_scanner import CameraScanner
from app.ai.face_engine import FaceEngine
from app.services.employee_service import EmployeeService


face_engine = FaceEngine()
employee_service = EmployeeService(face_engine)
camera_scanner = CameraScanner(face_engine)


def get_employee_service() -> EmployeeService:
    return employee_service


def get_camera_scanner() -> CameraScanner:
    return camera_scanner
