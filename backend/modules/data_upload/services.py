from datetime import datetime, timezone
from io import BytesIO
import json
from pathlib import Path
from tempfile import NamedTemporaryFile
from zipfile import BadZipFile, ZipFile

from fastapi import HTTPException
import ezodf
from openpyxl import load_workbook


FIELD_MAPPING = {
    "email": "google_email",
    "highspringEmail": "hs_email_id",
    "firstName": "first_name",
    "lastName": "last_name",
    "ldap": "ldap",
    "role": "role",
}


def _load_json_employees(json_content: bytes):
    try:
        payload = json.loads(json_content.decode("utf-8-sig"))
    except (UnicodeDecodeError, json.JSONDecodeError) as exc:
        raise HTTPException(status_code=400, detail="json_file must contain valid UTF-8 JSON") from exc

    if isinstance(payload, list):
        employees = payload
    elif isinstance(payload, dict) and isinstance(payload.get("data"), list):
        employees = payload["data"]
    else:
        raise HTTPException(
            status_code=400,
            detail="JSON must be an array or an object with a 'data' array",
        )

    if any(not isinstance(employee, dict) for employee in employees):
        raise HTTPException(status_code=400, detail="Every employee record must be a JSON object")

    return employees


def _validate_headers(headers):
    required_columns = set(FIELD_MAPPING.values()) | {"created_at"}
    missing_columns = sorted(required_columns - set(headers))
    if missing_columns:
        raise HTTPException(
            status_code=400,
            detail=f"Template is missing required column headers: {', '.join(missing_columns)}",
        )


def _build_xlsx(template_content: bytes, employees) -> BytesIO:
    try:
        workbook = load_workbook(BytesIO(template_content))
    except Exception as exc:
        raise HTTPException(status_code=400, detail="template_file must be a valid .xlsx workbook") from exc

    worksheet = workbook.active
    headers = {
        str(cell.value).strip(): cell.column
        for cell in worksheet[1]
        if cell.value is not None
    }
    _validate_headers(headers)
    created_at = datetime.now(timezone.utc).replace(microsecond=0).isoformat()
    for row_number, employee in enumerate(employees, start=2):
        for source_field, output_header in FIELD_MAPPING.items():
            value = employee.get(source_field)
            worksheet.cell(row=row_number, column=headers[output_header], value="" if value is None else value)
        worksheet.cell(row=row_number, column=headers["created_at"], value=created_at)

    output = BytesIO()
    workbook.save(output)
    output.seek(0)
    return output


def _build_ods(template_content: bytes, employees) -> BytesIO:
    temp_path = None
    try:
        with NamedTemporaryFile(suffix=".ods", delete=False) as temp_file:
            temp_file.write(template_content)
            temp_path = temp_file.name
        workbook = ezodf.opendoc(temp_path)
        worksheet = workbook.sheets[0]
    except Exception as exc:
        raise HTTPException(status_code=400, detail="template_file must be a valid .ods workbook") from exc

    try:
        headers = {}
        for column in range(worksheet.ncols()):
            value = worksheet[0, column].value
            if value is not None:
                headers[str(value).strip()] = column
        _validate_headers(headers)

        # ODS sheets only contain explicitly allocated rows; add rows before
        # assigning employee values so templates with just headers work.
        for _ in range(max(0, len(employees) + 1 - worksheet.nrows())):
            worksheet.append_rows(1)

        created_at = datetime.now(timezone.utc).replace(microsecond=0).isoformat()
        for row_number, employee in enumerate(employees, start=1):
            for source_field, output_header in FIELD_MAPPING.items():
                value = employee.get(source_field)
                worksheet[row_number, headers[output_header]].set_value("" if value is None else value)
            worksheet[row_number, headers["created_at"]].set_value(created_at)

        workbook.save()
        with open(temp_path, "rb") as generated_file:
            output = BytesIO(generated_file.read())
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=400,
            detail=f"Could not process the ODS template ({type(exc).__name__}): {exc}",
        ) from exc
    finally:
        if temp_path:
            Path(temp_path).unlink(missing_ok=True)
    output.seek(0)
    return output


def build_employee_workbook(json_content: bytes, template_content: bytes, template_filename: str):
    """Map employee records into an uploaded XLSX or ODS template."""
    employees = _load_json_employees(json_content)
    extension = Path(template_filename or "").suffix.lower()
    # Both XLSX and ODS are ZIP containers. Inspect the members because users
    # sometimes have a misspelled extension (for example, .xslx).
    try:
        with ZipFile(BytesIO(template_content)) as archive:
            members = set(archive.namelist())
        actual_format = "ods" if "mimetype" in members and "content.xml" in members else (
            "xlsx" if "[Content_Types].xml" in members and "xl/workbook.xml" in members else None
        )
    except BadZipFile:
        actual_format = None

    if actual_format == "ods" or (actual_format is None and extension == ".ods"):
        return _build_ods(template_content, employees), "ods"
    if actual_format == "xlsx" or (actual_format is None and extension in {".xlsx", ".xslx"}):
        return _build_xlsx(template_content, employees), "xlsx"
    raise HTTPException(status_code=400, detail="Template must be a valid .xlsx or .ods workbook")
