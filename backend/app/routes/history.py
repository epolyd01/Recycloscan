import logging

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.db.models import ScanRecord
from app.models.schemas import ScanHistoryItem

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/history", tags=["history"])


@router.get("", response_model=list[ScanHistoryItem], status_code=status.HTTP_200_OK)
async def get_history(
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    db: AsyncSession = Depends(get_db),
) -> list[ScanHistoryItem]:
    try:
        stmt = (
            select(ScanRecord)
            .order_by(ScanRecord.scanned_at.desc())
            .limit(limit)
            .offset(offset)
        )
        rows = (await db.execute(stmt)).scalars().all()
        return [ScanHistoryItem.model_validate(row) for row in rows]
    except Exception as exc:
        logger.exception("Failed to fetch scan history.")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not retrieve scan history.",
        ) from exc


@router.delete(
    "/{record_id}",
    status_code=status.HTTP_200_OK,
)
async def delete_history_item(
    record_id: int,
    db: AsyncSession = Depends(get_db),
) -> dict[str, bool]:
    try:
        stmt = delete(ScanRecord).where(ScanRecord.id == record_id)
        result = await db.execute(stmt)
        await db.commit()

        if result.rowcount == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"No scan record found with id {record_id}.",
            )
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Failed to delete scan record id=%d.", record_id)
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not delete scan record.",
        ) from exc

    return {"deleted": True}
