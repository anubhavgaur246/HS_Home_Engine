from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.orm import Session

from core.database import get_db
from shared.enums import RoleType

from modules.auth.services import decode_access_token
from .schemas import EmployeeImportPayload, EmployeeImportResult
from .services import import_employees


router = APIRouter()


@router.post("/employees/import", response_model=EmployeeImportResult)
def import_employee_data(
    payload: EmployeeImportPayload,
    db: Session = Depends(get_db),
    authorization: str | None = Header(default=None),
):
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Authentication required")
    claims = decode_access_token(authorization.split(" ", 1)[1])
    if claims.get("role") != RoleType.SUPER_ADMIN.value:
        raise HTTPException(status_code=403, detail="Super admin access required")
    return import_employees(db, payload.root)
