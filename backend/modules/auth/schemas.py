from pydantic import BaseModel, Field, field_validator
import re

from core.config import settings


def validate_highspring_email(value: str) -> str:
    normalized = value.strip().lower()
    allowed_domains = r"(?:highspring\.in|yopmail\.com)" if settings.ENVIRONMENT.strip().lower() == "local" else r"highspring\.in"
    if not re.fullmatch(rf"[^@\s]+@{allowed_domains}", normalized):
        raise ValueError("Use your @highspring.in email address" if allowed_domains == r"highspring\.in" else "Use your @highspring.in or @yopmail.com email address")
    return normalized


class LoginPayload(BaseModel):
    email: str = Field(min_length=1, max_length=255)
    password: str = Field(min_length=1, max_length=255)

    @field_validator("email")
    @classmethod
    def validate_email_domain(cls, value: str) -> str:
        return validate_highspring_email(value)


class EmailLinkRequest(BaseModel):
    email: str = Field(min_length=1, max_length=255)

    @field_validator("email")
    @classmethod
    def validate_email_domain(cls, value: str) -> str:
        return validate_highspring_email(value)


class EmailLinkCompletion(BaseModel):
    token: str = Field(min_length=1)
    new_password: str = Field(min_length=1, max_length=255)


class ResetPasswordPayload(BaseModel):
    token: str = Field(min_length=1)
    new_password: str = Field(min_length=1, max_length=255)
