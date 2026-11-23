from fastapi import APIRouter
from app.api.v1.endpoints import appointments, doctors, health

api_router = APIRouter()

api_router.include_router(health.router, tags=["Health"])
api_router.include_router(appointments.router, prefix="/appointments", tags=["Appointments"])
api_router.include_router(doctors.router, prefix="/doctors", tags=["Doctors"])

