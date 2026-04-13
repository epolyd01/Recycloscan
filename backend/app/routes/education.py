import json
import logging
from functools import lru_cache
from pathlib import Path

from fastapi import APIRouter, HTTPException, status

from app.models.schemas import EducationItem

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/education", tags=["education"])

_EDUCATION_PATH = Path(__file__).parent.parent / "data" / "education.json"


@lru_cache(maxsize=1)
def _load_education() -> list[EducationItem]:
    with _EDUCATION_PATH.open(encoding="utf-8") as f:
        raw: list[dict] = json.load(f)
    return [EducationItem(**item) for item in raw]


@router.get("", response_model=list[EducationItem], status_code=status.HTTP_200_OK)
async def get_education() -> list[EducationItem]:
    try:
        return _load_education()
    except FileNotFoundError:
        logger.error("education.json not found at '%s'.", _EDUCATION_PATH)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Education content is unavailable.",
        )
    except Exception as exc:
        logger.exception("Failed to load education content.")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not load education content.",
        ) from exc
