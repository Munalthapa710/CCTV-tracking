from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.schemas import EmployeeCreate, EmployeeListResponse
from app.runtime import get_employee_service


router = APIRouter(tags=["employees"])


@router.post("/employee/add")
def add_employee(payload: EmployeeCreate, db: Session = Depends(get_db)):
    service = get_employee_service()
    try:
        employee = service.create_employee(
            db,
            name=payload.name,
            employee_id=payload.employee_id,
            samples=payload.samples,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    return {
        "employee_id": employee.employee_id,
        "name": employee.name,
        "preview_image_url": service.preview_url(employee.preview_image),
        "sample_count": len(employee.embeddings),
    }


@router.get("/employees", response_model=EmployeeListResponse)
def list_employees(db: Session = Depends(get_db)):
    service = get_employee_service()
    return {"employees": service.list_employees(db)}


@router.get("/employees/search")
def search_employees(q: str, db: Session = Depends(get_db)):
    service = get_employee_service()
    employees = service.search_employees(db, q)
    return {
        "employees": [
            {
                "employee_id": employee.employee_id,
                "name": employee.name,
                "preview_image_url": service.preview_url(employee.preview_image),
                "sample_count": len(employee.embeddings),
            }
            for employee in employees
        ]
    }


@router.get("/employees/{employee_id}")
def get_employee(employee_id: str, db: Session = Depends(get_db)):
    service = get_employee_service()
    employee = service.get_employee_by_employee_id(db, employee_id)
    if employee is None:
        raise HTTPException(status_code=404, detail="Employee not found")

    latest_event = employee.tracking_events[-1] if employee.tracking_events else None
    return {
        "employee_id": employee.employee_id,
        "name": employee.name,
        "preview_image_url": service.preview_url(employee.preview_image),
        "sample_count": len(employee.embeddings),
        "last_seen_location": latest_event.location if latest_event else None,
        "last_seen_time": latest_event.timestamp if latest_event else None,
    }
