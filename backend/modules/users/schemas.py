from pydantic import BaseModel, Field, field_validator

from shared.enums import RoleType


class AdminCreatePayload(BaseModel):
    first_name: str = Field(min_length=1, max_length=100)
    last_name: str | None = Field(default=None, max_length=100)
    hs_email_id: str = Field(min_length=3, max_length=255)
    password: str = Field(min_length=1, max_length=255)

    @field_validator("first_name", "last_name")
    @classmethod
    def trim_names(cls, value):
        return value.strip() if value is not None else value

    @field_validator("hs_email_id")
    @classmethod
    def normalize_email(cls, value):
        email = value.strip().lower()
        if "@" not in email or "." not in email.rsplit("@", 1)[-1]:
            raise ValueError("Enter a valid email address")
        return email


class UserUpdatePayload(BaseModel):
    first_name: str | None = Field(default=None, min_length=1, max_length=100)
    last_name: str | None = Field(default=None, max_length=100)
    hs_email_id: str | None = Field(default=None, min_length=3, max_length=255)
    level: str | None = Field(default=None, max_length=100)
    team: str | None = Field(default=None, max_length=255)
    programme_name: str | None = Field(default=None, max_length=255)
    projectname: str | None = Field(default=None, max_length=255)
    manager: str | None = Field(default=None, max_length=100)
    lead: str | None = Field(default=None, max_length=100)
    role: RoleType | None = None

    @field_validator("first_name", "last_name")
    @classmethod
    def trim_optional_names(cls, value):
        return value.strip() if value is not None else value

    @field_validator("hs_email_id")
    @classmethod
    def normalize_optional_email(cls, value):
        if value is None:
            return value
        email = value.strip().lower()
        if "@" not in email or "." not in email.rsplit("@", 1)[-1]:
            raise ValueError("Enter a valid email address")
        return email


class ToolUpdatePayload(BaseModel):
    is_product_live: bool | None = None
    is_upcoming: bool | None = None


class ToolCreatePayload(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    link: str | None = Field(default=None, max_length=255)
    video_url: str | None = Field(default=None, max_length=255)
    user_guide_url: str | None = Field(default=None, max_length=255)
    poc_id: int | None = None
    description: str | None = None
    is_product_live: bool = False
    is_upcoming: bool = False

    @field_validator("name", "link", "video_url", "user_guide_url", "description")
    @classmethod
    def trim_optional_text(cls, value):
        return value.strip() if value is not None else value
