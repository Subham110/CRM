from typing import List
from fastapi import APIRouter, status
from app.schemas.appointment import DoctorInfo
from app.services.appointment_service import AppointmentService

router = APIRouter()


@router.get(
    "/",
    response_model=List[DoctorInfo],
    status_code=status.HTTP_200_OK,
    summary="List all available clinic doctors",
)
async def list_doctors():
    """Retrieve available doctors, their departments, ratings, and booking slots."""
    return AppointmentService.get_doctors()

