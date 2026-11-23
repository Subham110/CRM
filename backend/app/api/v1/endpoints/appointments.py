from typing import List, Optional
from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.schemas.appointment import (
    AppointmentCreate,
    AppointmentResponse,
    AppointmentUpdate,
    AppointmentStatusEnum,
)
from app.services.appointment_service import AppointmentService

router = APIRouter()


@router.post(
    "/",
    response_model=AppointmentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Book a new doctor appointment",
)
async def book_appointment(
    appointment_in: AppointmentCreate,
    db: AsyncSession = Depends(get_db),
):
    """
    Book an appointment for visiting a doctor.
    Required details:
    - **patient_name**: Full name of the patient
    - **patient_age**: Age in years (1 - 125)
    - **reason**: Reason for visit / symptoms
    - **doctor_name**: Name of the doctor to consult
    - **appointment_date**: Scheduled visit date & time
    """
    return await AppointmentService.create_appointment(db, appointment_in)


@router.get(
    "/",
    response_model=List[AppointmentResponse],
    status_code=status.HTTP_200_OK,
    summary="Retrieve all booked appointments",
)
async def list_appointments(
    search: Optional[str] = Query(None, description="Search by patient name or reason"),
    status: Optional[AppointmentStatusEnum] = Query(None, description="Filter by status"),
    doctor: Optional[str] = Query(None, description="Filter by doctor name"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """List appointments with optional search, status filtering and pagination."""
    return await AppointmentService.get_appointments(
        db=db,
        search=search,
        status=status.value if status else None,
        doctor=doctor,
        skip=skip,
        limit=limit,
    )


@router.get(
    "/{appointment_id}",
    response_model=AppointmentResponse,
    status_code=status.HTTP_200_OK,
    summary="Get appointment details by ID",
)
async def get_appointment(
    appointment_id: int,
    db: AsyncSession = Depends(get_db),
):
    """Fetch details of a specific appointment by its unique identifier."""
    return await AppointmentService.get_appointment_by_id(db, appointment_id)


@router.patch(
    "/{appointment_id}",
    response_model=AppointmentResponse,
    status_code=status.HTTP_200_OK,
    summary="Update appointment details or status",
)
async def update_appointment(
    appointment_id: int,
    update_data: AppointmentUpdate,
    db: AsyncSession = Depends(get_db),
):
    """Update details or status of an existing appointment."""
    return await AppointmentService.update_appointment(db, appointment_id, update_data)


@router.delete(
    "/{appointment_id}",
    response_model=AppointmentResponse,
    status_code=status.HTTP_200_OK,
    summary="Cancel an appointment",
)
async def cancel_appointment(
    appointment_id: int,
    db: AsyncSession = Depends(get_db),
):
    """Cancel an appointment booking."""
    return await AppointmentService.cancel_appointment(db, appointment_id)

