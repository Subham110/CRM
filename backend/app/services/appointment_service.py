from typing import List, Optional
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status
from app.models.appointment import Appointment
from app.schemas.appointment import (
    AppointmentCreate,
    AppointmentUpdate,
    DoctorInfo,
    AppointmentStatusEnum,
)

# Standard mock directory of doctors in the clinic / hospital microservice
DOCTORS_DATABASE: List[DoctorInfo] = [
    DoctorInfo(
        id="doc-1",
        name="Dr. Evelyn Harper",
        specialty="General Physician & Family Medicine",
        department="General Medicine",
        qualification="MD, MBBS, Harvard Medical School",
        experience_years=14,
        room="Cabin 101, Block A",
        available_days=["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        time_slots=[
            "09:00 AM - 10:00 AM",
            "10:00 AM - 11:00 AM",
            "11:30 AM - 12:30 PM",
            "02:00 PM - 03:00 PM",
            "03:30 PM - 04:30 PM",
        ],
        rating=4.9,
    ),
    DoctorInfo(
        id="doc-2",
        name="Dr. Marcus Vance",
        specialty="Cardiologist",
        department="Cardiology",
        qualification="MD, FACC, Johns Hopkins",
        experience_years=18,
        room="Cabin 204, Heart Wing",
        available_days=["Monday", "Wednesday", "Friday"],
        time_slots=[
            "09:30 AM - 10:30 AM",
            "11:00 AM - 12:00 PM",
            "02:30 PM - 03:30 PM",
            "04:00 PM - 05:00 PM",
        ],
        rating=4.95,
    ),
    DoctorInfo(
        id="doc-3",
        name="Dr. Priya Sharma",
        specialty="Pediatrician & Child Health Specialist",
        department="Pediatrics",
        qualification="MD, DNB (Pediatrics), Stanford Fellow",
        experience_years=11,
        room="Cabin 108, Child Care Center",
        available_days=["Monday", "Tuesday", "Thursday", "Saturday"],
        time_slots=[
            "09:00 AM - 10:00 AM",
            "10:30 AM - 11:30 AM",
            "01:30 PM - 02:30 PM",
            "03:00 PM - 04:00 PM",
        ],
        rating=4.88,
    ),
    DoctorInfo(
        id="doc-4",
        name="Dr. Liam Thorne",
        specialty="Orthopedic Surgeon & Sports Injuries",
        department="Orthopedics",
        qualification="MS (Ortho), FRCS",
        experience_years=16,
        room="Cabin 302, Ortho Suite",
        available_days=["Tuesday", "Wednesday", "Thursday", "Saturday"],
        time_slots=[
            "10:00 AM - 11:00 AM",
            "11:30 AM - 12:30 PM",
            "03:00 PM - 04:00 PM",
            "04:30 PM - 05:30 PM",
        ],
        rating=4.85,
    ),
    DoctorInfo(
        id="doc-5",
        name="Dr. Sophia Chen",
        specialty="Dermatologist & Cosmetologist",
        department="Dermatology",
        qualification="MD (Dermatology), Board Certified",
        experience_years=9,
        room="Cabin 115, Wellness Wing",
        available_days=["Monday", "Tuesday", "Friday", "Saturday"],
        time_slots=[
            "10:00 AM - 11:00 AM",
            "12:00 PM - 01:00 PM",
            "02:00 PM - 03:00 PM",
            "04:00 PM - 05:00 PM",
        ],
        rating=4.92,
    ),
]


class AppointmentService:
    @staticmethod
    async def create_appointment(
        db: AsyncSession, appointment_in: AppointmentCreate
    ) -> Appointment:
        """Create a new appointment record in the database."""
        db_obj = Appointment(
            patient_name=appointment_in.patient_name.strip(),
            patient_age=appointment_in.patient_age,
            reason=appointment_in.reason.strip(),
            doctor_name=appointment_in.doctor_name.strip(),
            department=appointment_in.department.strip(),
            appointment_date=appointment_in.appointment_date,
            time_slot=appointment_in.time_slot,
            contact_phone=appointment_in.contact_phone,
            contact_email=str(appointment_in.contact_email) if appointment_in.contact_email else None,
            status=AppointmentStatusEnum.CONFIRMED.value,
            notes=appointment_in.notes,
        )
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    @staticmethod
    async def get_appointments(
        db: AsyncSession,
        search: Optional[str] = None,
        status: Optional[str] = None,
        doctor: Optional[str] = None,
        skip: int = 0,
        limit: int = 50,
    ) -> List[Appointment]:
        """Fetch list of appointments with optional filtering and pagination."""
        query = select(Appointment).order_by(desc(Appointment.created_at))

        if search:
            search_term = f"%{search.strip()}%"
            query = query.where(
                (Appointment.patient_name.ilike(search_term))
                | (Appointment.reason.ilike(search_term))
            )
        if status:
            query = query.where(Appointment.status == status.upper())
        if doctor:
            query = query.where(Appointment.doctor_name.ilike(f"%{doctor.strip()}%"))

        query = query.offset(skip).limit(limit)
        result = await db.execute(query)
        return list(result.scalars().all())

    @staticmethod
    async def get_appointment_by_id(db: AsyncSession, appointment_id: int) -> Appointment:
        """Retrieve a specific appointment by its ID."""
        result = await db.execute(select(Appointment).where(Appointment.id == appointment_id))
        appointment = result.scalar_one_or_none()
        if not appointment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Appointment with ID {appointment_id} not found."
            )
        return appointment

    @staticmethod
    async def update_appointment(
        db: AsyncSession, appointment_id: int, update_data: AppointmentUpdate
    ) -> Appointment:
        """Update fields of an appointment."""
        appointment = await AppointmentService.get_appointment_by_id(db, appointment_id)
        
        update_dict = update_data.model_dump(exclude_unset=True)
        for key, value in update_dict.items():
            if value is not None:
                setattr(appointment, key, value)

        await db.commit()
        await db.refresh(appointment)
        return appointment

    @staticmethod
    async def cancel_appointment(db: AsyncSession, appointment_id: int) -> Appointment:
        """Cancel an appointment."""
        appointment = await AppointmentService.get_appointment_by_id(db, appointment_id)
        appointment.status = AppointmentStatusEnum.CANCELLED.value
        await db.commit()
        await db.refresh(appointment)
        return appointment

    @staticmethod
    def get_doctors() -> List[DoctorInfo]:
        """Return list of clinic doctors."""
        return DOCTORS_DATABASE

