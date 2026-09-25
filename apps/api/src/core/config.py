from typing import List, Union
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field, field_validator


class Settings(BaseSettings):
    """
    AIML Club OCT — Connect Master Configuration
    Sourced from .env and environment variables.
    """
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    ENVIRONMENT: str = Field(default="development")
    PORT: int = Field(default=8000)
    API_V1_PREFIX: str = Field(default="/v1")
    PROJECT_NAME: str = Field(default="AIML Club OCT — Connect API")
    OFFICIAL_TAGLINE: str = Field(default="Innovate. Implement. Inspire.")
    
    # CORS
    CORS_ORIGINS: List[str] = Field(
        default=[
            "http://localhost:3000",
            "http://localhost:3001",
            "https://aimlcluboct.in",
            "https://app.aimlcluboct.in",
            "https://admin.aimlcluboct.in",
        ]
    )

    # Supabase / PostgreSQL
    DATABASE_URL: str = Field(default="")
    SUPABASE_URL: str = Field(default="")
    SUPABASE_ANON_KEY: str = Field(default="")
    SUPABASE_JWT_SECRET: str = Field(default="")

    # Google Drive
    GOOGLE_DRIVE_ROOT_FOLDER_ID: str = Field(default="")

    # Security
    SECRET_KEY: str = Field(default="dev-secret-key-change-in-production")
    JWT_ALGORITHM: str = Field(default="HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=60)

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)


settings = Settings()
