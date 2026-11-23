from datetime import datetime
from enum import Enum
from typing import Optional, List
from pydantic import BaseModel, Field, EmailStr, ConfigDict


class AppointmentStatusEnum(str, Enum):
    PENDING = "PENDING"
    CONFIRMED = "CONFIRMED"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"


class AppointmentBase(BaseModel):
    # Core user-requested fields with strict validation
    patient_name: str = Field(
        ...,
        min_length=2,
        max_length=120,
        description="Full Name of the visiting patient"
    )
    patient_age: int = Field(
        ...,
        ge=1,
        le=125,
        description="Age of the patient in years"
    )
    reason: str = Field(
        ...,
        min_length=3,
        max_length=1500,
        description="Reason for booking appointment and symptoms"
    )
    
    # Additional appointment parameters
    doctor_name: str = Field(
        ...,
        min_length=2,
        max_length=120,
        description="Selected Doctor's full name"
    )
    department: str = Field(
        default="General Medicine",
        max_length=100,
        description="Medical Department / Specialty"
    )
    appointment_date: datetime = Field(
        ...,
        description="Scheduled appointment date & time"
    )
    time_slot: str = Field(
        default="09:00 AM - 10:00 AM",
        description="Selected appointment time window"
    )
    contact_phone: Optional[str] = Field(
        default=None,
        max_length=30,
        description="Contact phone number"
    )
    contact_email: Optional[EmailStr] = Field(
        default=None,
        description="Contact email address"
    )
    notes: Optional[str] = Field(
        default=None,
        max_length=500,
        description="Optional additional notes"
    )


class AppointmentCreate(AppointmentBase):
    pass


class AppointmentUpdate(BaseModel):
    patient_name: Optional[str] = Field(None, min_length=2, max_length=120)
    patient_age: Optional[int] = Field(None, ge=1, le=125)
    reason: Optional[str] = Field(None, min_length=3, max_length=1500)
    doctor_name: Optional[str] = None
    department: Optional[str] = None
    appointment_date: Optional[datetime] = None
    time_slot: Optional[str] = None
    status: Optional[AppointmentStatusEnum] = None
    notes: Optional[str] = None


class AppointmentResponse(AppointmentBase):
    id: int
    status: AppointmentStatusEnum
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class DoctorInfo(BaseModel):
    id: str
    name: str
    specialty: str
    department: str
    qualification: str
    experience_years: int
    room: str
    available_days: List[str]
    time_slots: List[str]
    rating: float

