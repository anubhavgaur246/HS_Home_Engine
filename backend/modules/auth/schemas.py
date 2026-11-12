from pydantic import BaseModel, Field, field_validator

from shared.enums import RoleType


class LoginPayload(BaseModel):
    email: str = Field(min_length=1, max_length=255)
    password: str = Field(min_length=1, max_length=255)


class ResetPasswordPayload(BaseModel):
    token: str = Field(min_length=1)
    new_password: str = Field(min_length=1, max_length=255)


class AdminCreatePayload(BaseModel):
    first_name: str = Field(min_length=1, max_length=100)
    last_name: str | None = Field(default=None, max_length=100)
    hs_email_id: str = Field(min_length=3, max_length=255)
    password: str = Field(min_length=12, max_length=255)

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


class LoginResult(BaseModel):
    access_token: str
    token_type: str = "bearer"
    email: str
    role: RoleType
    requires_password_reset: bool = False
    reset_token: str | None = None
