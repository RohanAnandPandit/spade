from functools import lru_cache
from typing import Annotated

from pydantic import field_validator
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    build: str = "development"
    database_url: str = "postgresql+psycopg://postgres:postgres@localhost:5432/spade"
    allowed_origins: Annotated[list[str], NoDecode] = ["http://localhost:5173"]
    session_days: int = 7
    max_upload_bytes: int = 32 * 1024 * 1024

    @field_validator("database_url", mode="before")
    @classmethod
    def use_psycopg_driver(cls, value):
        if isinstance(value, str):
            for scheme in ("postgres://", "postgresql://"):
                if value.startswith(scheme):
                    return value.replace(scheme, "postgresql+psycopg://", 1)
        return value

    @field_validator("allowed_origins", mode="before")
    @classmethod
    def split_origins(cls, value):
        if isinstance(value, str):
            return [origin.strip() for origin in value.split(",") if origin.strip()]
        return value

    @property
    def secure_cookies(self) -> bool:
        return self.build == "production"


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
