import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    email: EmailStr


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=12, max_length=128)
    legacy_workspace_id: uuid.UUID | None = Field(
        default=None, alias="legacyWorkspaceId"
    )

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: EmailStr) -> str:
        return str(value).strip().lower()


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: EmailStr) -> str:
        return str(value).strip().lower()


class ErrorResponse(BaseModel):
    error: str
    fields: dict[str, str] | None = None


class RepositoryInfo(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    name: str
    description: str
    endpoint: str | None = None


class RemoteRepositoryRequest(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    endpoint: str = Field(min_length=1, max_length=2048)
    description: str = Field(max_length=5000)


class SavedQueryRequest(BaseModel):
    repository: str = Field(min_length=1, max_length=200)
    sparql: str = Field(min_length=1)
    name: str = Field(min_length=1, max_length=200)


class SavedQueryResponse(BaseModel):
    id: uuid.UUID
    name: str
    sparql: str
    repository: str
    date: datetime
