from pydantic import BaseModel, Field

from shared.enums import RoleType


class LoginPayload(BaseModel):
    email: str = Field(min_length=1, max_length=255)
    password: str = Field(min_length=1, max_length=255)


class LoginResult(BaseModel):
    access_token: str
    token_type: str = "bearer"
    email: str
    role: RoleType
