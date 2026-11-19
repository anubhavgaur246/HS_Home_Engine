from datetime import date
from urllib.parse import urlparse

from pydantic import BaseModel, Field, field_validator

from shared.enums import AnnouncementType


class AnnouncementCreate(BaseModel):
    type: AnnouncementType
    email_subject: str | None = Field(default=None, max_length=255)
    cc: list[str] = Field(default_factory=list)
    tool_id: int | None = Field(default=None, gt=0)
    publish_date: date
    title: str = Field(min_length=1, max_length=255)
    summary: str = Field(min_length=1, max_length=500)
    description: str = Field(min_length=1)
    image_url: str | None = Field(default=None, max_length=2048)
    document_url: str | None = Field(default=None, max_length=2048)

    @field_validator("email_subject", "title", "summary", "description")
    @classmethod
    def trim_text(cls, value):
        return value.strip() if value is not None else value

    @field_validator("title", "summary", "description")
    @classmethod
    def require_nonblank_text(cls, value):
        if value is not None and not value.strip():
            raise ValueError("This field cannot be blank")
        return value

    @field_validator("cc")
    @classmethod
    def validate_cc(cls, values):
        normalized = []
        for value in values:
            email = value.strip().lower()
            local, separator, domain = email.partition("@")
            if not separator or not local or "." not in domain or any(char.isspace() for char in email):
                raise ValueError("CC entries must be valid email addresses")
            if email not in normalized:
                normalized.append(email)
        return normalized

    @field_validator("image_url", "document_url")
    @classmethod
    def validate_media_url(cls, value):
        if value is None or not value.strip():
            return None
        parsed = urlparse(value.strip())
        if parsed.scheme not in {"http", "https"} or not parsed.netloc:
            raise ValueError("Media fields must be absolute HTTP or HTTPS URLs")
        return value.strip()


class AnnouncementUpdate(BaseModel):
    type: AnnouncementType | None = None
    email_subject: str | None = Field(default=None, max_length=255)
    cc: list[str] | None = None
    tool_id: int | None = Field(default=None, gt=0)
    publish_date: date | None = None
    title: str | None = Field(default=None, min_length=1, max_length=255)
    summary: str | None = Field(default=None, min_length=1, max_length=500)
    description: str | None = Field(default=None, min_length=1)
    image_url: str | None = Field(default=None, max_length=2048)
    document_url: str | None = Field(default=None, max_length=2048)

    @field_validator("email_subject", "title", "summary", "description")
    @classmethod
    def trim_text(cls, value):
        return value.strip() if value is not None else value

    @field_validator("title", "summary", "description")
    @classmethod
    def require_nonblank_text(cls, value):
        if value is not None and not value.strip():
            raise ValueError("This field cannot be blank")
        return value

    @field_validator("cc")
    @classmethod
    def validate_cc(cls, values):
        if values is None:
            return values
        return AnnouncementCreate.validate_cc(values)

    @field_validator("image_url", "document_url")
    @classmethod
    def validate_media_url(cls, value):
        return AnnouncementCreate.validate_media_url(value)