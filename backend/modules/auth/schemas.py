from pydantic import BaseModel, Field


class LoginPayload(BaseModel):
    email: str = Field(min_length=1, max_length=255)
    password: str = Field(min_length=1, max_length=255)


class ResetPasswordPayload(BaseModel):
    token: str = Field(min_length=1)
    new_password: str = Field(min_length=1, max_length=255)
