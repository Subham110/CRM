import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import init_db
from app.api.v1.router import api_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("appointment_service")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan: database initialization and cleanup."""
    logger.info("Initializing Doctor Appointment Microservice...")
    try:
        await init_db()
        logger.info("Database schema initialized.")
    except Exception as e:
        logger.warning(f"Database connection deferred or failed on startup: {e}")
    yield
    logger.info("Shutting down Doctor Appointment Microservice...")


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Microservice for booking and managing doctor appointments with PostgreSQL storage.",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Router
app.include_router(api_router, prefix=settings.API_V1_STR)
# Direct health endpoint at root level for load balancers
from app.api.v1.endpoints.health import health_check
app.add_api_route("/health", health_check, methods=["GET"], tags=["Health"])


@app.get("/", tags=["Root"])
def root():
    return {
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "docs": "/docs",
        "api_v1": settings.API_V1_STR,
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)

