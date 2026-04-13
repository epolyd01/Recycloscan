from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, Float, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.database import Base


class ScanRecord(Base):
    __tablename__ = "scan_records"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    item: Mapped[str] = mapped_column(String, nullable=False)
    recyclable: Mapped[bool] = mapped_column(Boolean, nullable=False)
    confidence: Mapped[float] = mapped_column(Float, nullable=False)
    reason: Mapped[str] = mapped_column(String, nullable=False)
    tip: Mapped[str] = mapped_column(String, nullable=False)
    misconception: Mapped[str | None] = mapped_column(String, nullable=True)
    image_path: Mapped[str | None] = mapped_column(String, nullable=True)
    scanned_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
