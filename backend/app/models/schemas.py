from datetime import datetime

from pydantic import BaseModel, ConfigDict


class ScanResponse(BaseModel):
    """
    Matches the fields the frontend strips from ScanResult:
    Omit<ScanResult, 'id' | 'imageUri' | 'scannedAt'>
    """

    item: str
    recyclable: bool
    confidence: float
    reason: str
    tip: str
    misconception: str | None = None


class ScanHistoryItem(ScanResponse):
    model_config = ConfigDict(from_attributes=True)

    id: int
    scanned_at: datetime


class EducationItem(BaseModel):
    id: str
    title: str
    myth: str
    fact: str
    category: str
