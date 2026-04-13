import logging

from fastapi import APIRouter, Depends, HTTPException, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.db.database import get_db
from app.db.models import ScanRecord
from app.models.schemas import ScanResponse
from app.services import classifier, yolo_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/scan", tags=["scan"])

_ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png"}


@router.post("", response_model=ScanResponse, status_code=status.HTTP_200_OK)
async def scan_image(
    file: UploadFile,
    db: AsyncSession = Depends(get_db),
) -> ScanResponse:
    if file.content_type not in _ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Only JPEG and PNG images are accepted. Got: {file.content_type}",
        )

    max_bytes = settings.max_image_size_mb * 1024 * 1024
    image_bytes = await file.read()

    if len(image_bytes) > max_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=(
                f"Image exceeds the {settings.max_image_size_mb} MB limit "
                f"({len(image_bytes) / (1024 * 1024):.1f} MB received)."
            ),
        )

    try:
        detections = yolo_service.run_inference(image_bytes)
        result = classifier.classify(detections)
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Unexpected error during scan.")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred. Please try again.",
        ) from exc

    try:
        record = ScanRecord(
            item=result.item,
            recyclable=result.recyclable,
            confidence=result.confidence,
            reason=result.reason,
            tip=result.tip,
            misconception=result.misconception,
        )
        db.add(record)
        await db.commit()
    except Exception:
        logger.exception("Failed to save scan record to database.")
        await db.rollback()
        # Return the result anyway — a DB write failure shouldn't block the user.

    return result
