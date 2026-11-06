from typing import Annotated

from pydantic import BaseModel, ConfigDict, Field, RootModel, field_validator, model_validator

from shared.enums import RoleType


class EmployeeImport(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    email: str | None = Field(default=None, max_length=255)
    highspring_email: str | None = Field(default=None, alias="highspringEmail", max_length=255)
    first_name: str = Field(alias="firstName", min_length=1, max_length=100)
    last_name: str | None = Field(default=None, alias="lastName", max_length=100)
    ldap: str | None = Field(default=None, max_length=100)
    role: RoleType = RoleType.USER

    @field_validator("role", mode="before")
    @classmethod
    def normalize_role(cls, value):
        if value is None or value == "":
            return RoleType.USER
        if isinstance(value, str):
            normalized = value.strip().upper()
            try:
                return RoleType(normalized)
            except ValueError:
                return RoleType.USER
        return value


class EmployeeImportPayload(RootModel[Annotated[list[EmployeeImport], Field(min_length=1)]]):
    @model_validator(mode="before")
    @classmethod
    def unwrap_data(cls, value):
        if isinstance(value, dict):
            data = value.get("data")
            return data if isinstance(data, list) else [value]
        return value


class EmployeeImportResult(BaseModel):
    created: int
    skipped: int
    skipped_missing_email: int = 0
