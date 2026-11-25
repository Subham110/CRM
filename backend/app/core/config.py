from typing import List, Optional
from pydantic import Field, SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "Doctor Appointment Microservice"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = "production"

    # Security Keys (Loaded strictly from .env / environment - NEVER hardcoded or exposed)
    SECRET_KEY: Optional[SecretStr] = None

    # Groq AI & LangChain Settings (Loaded securely from .env - NEVER exposed)
    GROQ_API_KEY: Optional[SecretStr] = None
    GROQ_MODEL: str = "llama-3.3-70b-versatile"

    # Database Settings (Credentials loaded securely from .env - no exposed keys in code)
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_PORT: int = 5432
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: Optional[SecretStr] = None
    POSTGRES_DB: str = "crm_db"

    # Optional explicit DATABASE_URL from .env or container environment
    RAW_DATABASE_URL: Optional[SecretStr] = Field(default=None, validation_alias="DATABASE_URL")

    # CORS configuration
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "*"
    ]

    model_config = SettingsConfigDict(
        env_file=(".env", "../.env"),
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="allow"
    )

    @property
    def DATABASE_URL(self) -> str:
        """
        Dynamically computes the database URL.
        Uses explicit DATABASE_URL from .env if provided;
        otherwise constructs it securely using credentials from .env without exposing them in source code.
        """
        if self.RAW_DATABASE_URL:
            return self.RAW_DATABASE_URL.get_secret_value()

        password = self.POSTGRES_PASSWORD.get_secret_value() if self.POSTGRES_PASSWORD else ""
        auth = f"{self.POSTGRES_USER}:{password}@" if password else f"{self.POSTGRES_USER}@"
        return f"postgresql+asyncpg://{auth}{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"


settings = Settings()
