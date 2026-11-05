from fastapi import APIRouter, File, UploadFile
from fastapi.responses import StreamingResponse

from .services import build_employee_workbook


router = APIRouter()


@router.post("/employees/export")
async def export_employees(
    json_file: UploadFile = File(..., description="Employee JSON file"),
    template_file: UploadFile = File(..., description="Excel template (.xlsx or .ods)"),
):
    workbook, output_format = build_employee_workbook(
        json_content=await json_file.read(),
        template_content=await template_file.read(),
        template_filename=template_file.filename,
    )
    if output_format == "ods":
        media_type = "application/vnd.oasis.opendocument.spreadsheet"
    else:
        media_type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    return StreamingResponse(
        workbook,
        media_type=media_type,
        headers={"Content-Disposition": f'attachment; filename="employees_export.{output_format}"'},
    )
