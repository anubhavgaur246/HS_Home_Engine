import json

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session

from core.database import get_db
from shared.constants import ResponseMessageConstants
from shared.utils import generic_json_response
from .schemas import EmployeeImportPayload
from .services import import_employees


router = APIRouter()


async def _resolve_employee_import_data(file: UploadFile | None = File(default=None)):
    if file is None:
        raise HTTPException(status_code=400, detail=ResponseMessageConstants.JSON_FILE_REQUIRED)

    try:
        file_bytes = await file.read()
    except Exception as exc:
        raise HTTPException(status_code=400, detail=ResponseMessageConstants.UNABLE_TO_READ_UPLOADED_JSON_FILE) from exc

    if not file_bytes:
        raise HTTPException(status_code=400, detail=ResponseMessageConstants.UPLOADED_JSON_FILE_EMPTY)

    try:
        parsed_payload = json.loads(file_bytes)
    except json.JSONDecodeError as exc:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid JSON file: {exc.msg}",
        ) from exc

    return EmployeeImportPayload.model_validate(parsed_payload).root


@router.post("/employees/import")
@router.post("/data-upload/employees/import", include_in_schema=False)
async def import_employee_data(
    db: Session = Depends(get_db),
    file: UploadFile | None = File(default=None),
):
    try:
        employees = await _resolve_employee_import_data(file=file)
        result = import_employees(db, employees)
        return generic_json_response(
            success=True,
            status_code=200,
            message=ResponseMessageConstants.EMPLOYEE_DATA_IMPORTED,
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
