from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from core.database import get_db

from .schemas import EmployeeImportPayload, EmployeeImportResult
from .services import import_employees


router = APIRouter()


@router.post("/employees/import", response_model=EmployeeImportResult)
def import_employee_data(
    payload: EmployeeImportPayload,
    db: Session = Depends(get_db),
):
    return import_employees(db, payload.root)
