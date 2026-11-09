from pydantic import BaseModel, Field

from shared.enums import RoleType


class LoginPayload(BaseModel):
    email: str = Field(min_length=1, max_length=255)
    password: str = Field(min_length=1, max_length=255)


class ResetPasswordPayload(BaseModel):
    token: str = Field(min_length=1)
    new_password: str = Field(min_length=1, max_length=255)


class LoginResult(BaseModel):
    access_token: str
    token_type: str = "bearer"
    email: str
    role: RoleType
    requires_password_reset: bool = False
    reset_token: str | None = None
