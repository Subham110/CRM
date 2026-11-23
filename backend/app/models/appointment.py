from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.sql import func
from app.core.database import Base


class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    
    # Core user-requested fields
    patient_name = Column(String(120), nullable=False, index=True)
    patient_age = Column(Integer, nullable=False)
    reason = Column(Text, nullable=False)
    
    # Doctor & scheduling details
    doctor_name = Column(String(120), nullable=False, index=True)
    department = Column(String(100), nullable=False, default="General Medicine")
    appointment_date = Column(DateTime(timezone=True), nullable=False)
    time_slot = Column(String(50), nullable=False, default="09:00 AM - 10:00 AM")
    
    # Contact information
    contact_phone = Column(String(30), nullable=True)
    contact_email = Column(String(120), nullable=True)
    
    # Status: PENDING, CONFIRMED, COMPLETED, CANCELLED
    status = Column(String(30), nullable=False, default="CONFIRMED")
    notes = Column(Text, nullable=True)

    # Auditing timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    def __repr__(self) -> str:
        return f"<Appointment(id={self.id}, patient='{self.patient_name}', doctor='{self.doctor_name}', status='{self.status}')>"

