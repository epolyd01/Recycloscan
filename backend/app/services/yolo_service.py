import logging
import os
from io import BytesIO
from typing import Any

import numpy as np
from fastapi import HTTPException, status
from PIL import Image

from app.config import settings

logger = logging.getLogger(__name__)

_model: Any | None = None


def get_model() -> Any:
    """
    Return the module-level YOLO singleton, loading it on the first call.
    Raises HTTPException 503 if the model file is missing so the server
    stays up and reports a clear error rather than crashing.
    """
    global _model

    if _model is not None:
        return _model

    model_path = settings.model_path
    if not os.path.exists(model_path):
        logger.error("Model file not found at '%s'.", model_path)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=(
                "Model not trained yet. "
                "Run ml/train.py first, then copy best.pt to the path "
                f"configured in MODEL_PATH (currently: {model_path})."
            ),
        )

    try:
        from ultralytics import YOLO  # imported lazily so the server starts without GPU

        logger.info("Loading YOLO model from '%s'…", model_path)
        _model = YOLO(model_path)
        logger.info("YOLO model loaded successfully.")
    except Exception as exc:
        logger.exception("Failed to load YOLO model.")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Model could not be loaded: {exc}",
        ) from exc

    return _model


def run_inference(image_bytes: bytes) -> list[dict[str, Any]]:
    """
    Run YOLO inference on raw image bytes.

    Returns a list of detections sorted by confidence descending:
    [
        {
            "class_id": int,
            "class_name": str,
            "confidence": float,
            "bbox": [x1, y1, x2, y2],
        },
        ...
    ]
    Returns an empty list if nothing is detected above the confidence threshold.
    """
    model = get_model()

    try:
        image = Image.open(BytesIO(image_bytes)).convert("RGB")
        img_array = np.array(image)
    except Exception as exc:
        logger.exception("Failed to decode image bytes.")
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid image data: {exc}",
        ) from exc

    try:
        results = model(img_array, conf=settings.confidence_threshold, verbose=False)
    except Exception as exc:
        logger.exception("YOLO inference failed.")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Inference failed. Please try again.",
        ) from exc

    detections: list[dict[str, Any]] = []

    for result in results:
        boxes = result.boxes
        if boxes is None:
            continue

        names: dict[int, str] = result.names  # class_id → class_name

        for box in boxes:
            class_id = int(box.cls[0].item())
            confidence = float(box.conf[0].item())
            bbox = [round(v, 2) for v in box.xyxy[0].tolist()]

            detections.append(
                {
                    "class_id": class_id,
                    "class_name": names.get(class_id, f"class_{class_id}"),
                    "confidence": confidence,
                    "bbox": bbox,
                }
            )

    detections.sort(key=lambda d: d["confidence"], reverse=True)
    logger.debug("Inference returned %d detection(s).", len(detections))
    return detections
