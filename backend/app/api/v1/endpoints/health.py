import logging
from fastapi import APIRouter, Depends, status, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from app.core.database import get_db

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/health", status_code=status.HTTP_200_OK, tags=["Health"])
async def health_check():
    """Basic liveness probe for container orchestrator (Kubernetes / Docker Compose)."""
    return {
        "status": "healthy",
        "service": "appointment-microservice",
        "timestamp": "OK"
    }


@router.get("/health/ready", tags=["Health"])
async def readiness_check(db: AsyncSession = Depends(get_db)):
    """Readiness probe checking database connectivity."""
    try:
        await db.execute(text("SELECT 1"))
        return {
            "status": "ready",
            "database": "connected",
            "details": "Postgres connection verified"
        }
    except Exception as e:
        logger.error(f"Readiness probe failed: {e}")
        return Response(
            content='{"status": "degraded", "database": "disconnected"}',
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            media_type="application/json"
        )

