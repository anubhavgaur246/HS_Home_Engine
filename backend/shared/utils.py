from typing import Any

from fastapi.encoders import jsonable_encoder
from fastapi.responses import JSONResponse


def generic_json_response(
    success: bool,
    status_code: int,
    message: str,
    data: Any = None,
    error: Any = None,
):
    return JSONResponse(
        content={
            "success": success,
            "status_code": status_code,
            "message": message,
            "data": jsonable_encoder(data) if data is not None else None,
            "error": error,
        },
        status_code=status_code,
    )


def generic_json_body(success, data, status_code, message, error=None):
    return generic_json_response(success, status_code, message, data, error)
