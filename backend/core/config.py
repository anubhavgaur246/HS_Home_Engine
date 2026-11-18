from pydantic import AliasChoices, Field
from pydantic_settings import BaseSettings
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[1] / ".env")

class Settings(BaseSettings):
    ENVIRONMENT: str = "prod"
    DATABASE_URL: str
    DB_USER: str | None = None
    DB_PASS: str | None = None
    DB_NAME: str | None = None
    INSTANCE_CONNECTION_NAME: str | None = None
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    SUPER_ADMIN_EMAIL: str | None = None
    SUPER_ADMIN_PASSWORD: str | None = None
    SMTP_HOST: str | None = Field(
        default=None,
        validation_alias=AliasChoices("SMTP_HOST", "MAIL_HOST"),
    )
    SMTP_PORT: int = 587
    SMTP_USERNAME: str | None = None
    SMTP_PASSWORD: str | None = None
    SMTP_FROM_EMAIL: str | None = None
    SMTP_USE_TLS: bool = True
    FRONTEND_BASE_URL: str = "http://localhost:5173"
    ASSESSMENT_TEST_URL: str = "http://localhost:5174/"

    class Config:
        env_file = ".env"

settings = Settings()
