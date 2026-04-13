import json
import logging
from pathlib import Path
from typing import Any

from app.models.schemas import ScanResponse

logger = logging.getLogger(__name__)

_RULES_PATH = Path(__file__).parent.parent / "data" / "recycling_rules.json"

with _RULES_PATH.open(encoding="utf-8") as _f:
    _RULES: dict[str, dict[str, Any]] = json.load(_f)

logger.info("Loaded recycling rules for %d item classes.", len(_RULES))


def classify(detections: list[dict[str, Any]]) -> ScanResponse:
    """
    Map YOLO detections to a recycling verdict.

    Takes the highest-confidence detection and looks it up in recycling_rules.json.
    Falls back gracefully when there are no detections or an unknown class.
    """
    if not detections:
        return ScanResponse(
            item="Unknown",
            recyclable=False,
            confidence=0.0,
            reason="No item detected. Try better lighting or move closer to the object.",
            tip="Make sure the item fills most of the camera frame and is well-lit.",
            misconception=None,
        )

    best = detections[0]
    class_name: str = best["class_name"]
    confidence: float = best["confidence"]

    rule = _RULES.get(class_name)

    if rule is None:
        logger.warning("Class '%s' has no entry in recycling_rules.json.", class_name)
        return ScanResponse(
            item=class_name,
            recyclable=False,
            confidence=confidence,
            reason="Item recognised but its recycling status is not yet in our database.",
            tip="Check your local council's recycling guidelines for this item.",
            misconception=None,
        )

    return ScanResponse(
        item=class_name,
        recyclable=rule["recyclable"],
        confidence=confidence,
        reason=rule["reason"],
        tip=rule["tip"],
        misconception=rule.get("misconception"),
    )
