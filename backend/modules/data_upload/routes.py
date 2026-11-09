from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.orm import Session

from core.database import get_db
from modules.auth.services import decode_access_token
from shared.enums import RoleType
from shared.utils import generic_json_response
from .schemas import EmployeeImportPayload
from .services import import_employees


router = APIRouter()


@router.post("/employees/import")
def import_employee_data(
    payload: EmployeeImportPayload,
    db: Session = Depends(get_db),
    authorization: str | None = Header(default=None),
):
    try:
        if not authorization or not authorization.lower().startswith("bearer "):
            raise HTTPException(status_code=401, detail="Authentication required")

        claims = decode_access_token(authorization.split(" ", 1)[1])
        if claims.get("role") != RoleType.SUPER_ADMIN.value:
            raise HTTPException(status_code=403, detail="Super admin access required")

        result = import_employees(db, payload.root)
        return generic_json_response(
            success=True,
            status_code=200,
            message="Employee data imported successfully.",
            data=result.model_dump(),
            error=None,
        )
    except HTTPException as exc:
        return generic_json_response(
            success=False,
            status_code=exc.status_code,
            message=str(exc.detail),
            data=None,
            error=str(exc.detail),
        )
