import logging
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.db.database import init_db
from app.routes import education, history, scan

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    logger.info("Starting RecycleRight API…")

    await init_db()

    # Pre-warm the model so the first real request is fast.
    # If best.pt is missing we log a warning but do NOT crash — the server
    # starts anyway and returns a 503 on POST /api/scan until the model exists.
    try:
        from app.services.yolo_service import get_model

        get_model()
    except Exception as exc:
        logger.warning("Model pre-warm skipped: %s", exc)

    logger.info("Startup complete.")
    yield
    logger.info("Shutting down RecycleRight API.")


app = FastAPI(
    title="RecycleRight API",
    version="1.0.0",
    description="YOLOv8-powered recycling classification API for the RecycloscanApp.",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(scan.router, prefix="/api")
app.include_router(education.router, prefix="/api")
app.include_router(history.router, prefix="/api")


@app.get("/", tags=["health"])
async def health_check() -> dict:
    from app.services.yolo_service import _model

    return {
        "status": "ok",
        "model_loaded": _model is not None,
    }
