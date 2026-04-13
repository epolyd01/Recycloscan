from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
        protected_namespaces=("settings_",),
    )

    model_path: str = "../data/models/best.pt"
    database_url: str = "sqlite+aiosqlite:///./recyclescan.db"
    confidence_threshold: float = 0.5
    max_image_size_mb: int = 10
    allowed_origins: str = "http://localhost:8081"
    mock_inference: bool = False  # set to true in .env to bypass YOLO for UI testing

    @property
    def allowed_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.allowed_origins.split(",")]


settings = Settings()
