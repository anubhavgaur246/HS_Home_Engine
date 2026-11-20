from email.message import EmailMessage
import smtplib
from typing import Any, Sequence

from fastapi.encoders import jsonable_encoder
from fastapi.responses import JSONResponse

from core.config import settings


class EmailUtils:
    @staticmethod
    def send_email(
        to_email: str,
        subject: str,
        body: str,
        html_body: str | None = None,
        cc: Sequence[str] | None = None,
    ) -> None:
        if not settings.SMTP_HOST or not settings.SMTP_FROM_EMAIL:
            raise RuntimeError("SMTP_HOST and SMTP_FROM_EMAIL must be configured")

        message = EmailMessage()
        message["Subject"] = subject
        message["From"] = settings.SMTP_FROM_EMAIL
        message["To"] = to_email
        if cc:
            message["Cc"] = ", ".join(cc)
        message.set_content(body)
        if html_body:
            message.add_alternative(html_body, subtype="html")

        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=15) as smtp:
            if settings.SMTP_USE_TLS:
                smtp.starttls()
            if settings.SMTP_USERNAME:
                smtp.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD or "")
            smtp.send_message(message)


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
