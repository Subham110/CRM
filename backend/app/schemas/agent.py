from typing import List, Optional, Any, Dict
from pydantic import BaseModel, Field


class AgentPromptRequest(BaseModel):
    prompt: str = Field(
        ...,
        min_length=3,
        description="Natural language request from user, e.g. 'I am John, 45, having bad knee pain, need Dr Thorne tomorrow'"
    )


class AgentParsedAppointment(BaseModel):
    patient_name: str = Field(..., description="Full Name of the patient")
    patient_age: int = Field(..., ge=1, le=125, description="Patient age in years")
    reason: str = Field(..., min_length=3, description="Symptom or consultation reason")
    doctor_name: str = Field(..., description="Selected doctor")
    department: str = Field(default="General Medicine", description="Medical department")
    appointment_date: str = Field(..., description="ISO Date string YYYY-MM-DD")
    time_slot: str = Field(default="09:00 AM - 10:00 AM", description="Time slot window")
    contact_phone: Optional[str] = None
    contact_email: Optional[str] = None
    urgency_level: str = Field(default="ROUTINE", description="ROUTINE or URGENT")
    clinical_notes: Optional[str] = None


class ReActStep(BaseModel):
    step_number: int
    step_type: str = Field(..., description="'thought' | 'action' | 'observation' | 'decision'")
    title: str
    content: str
    tool_name: Optional[str] = None
    tool_input: Optional[Dict[str, Any]] = None
    tool_output: Optional[str] = None


class AgentExecutionResponse(BaseModel):
    success: bool
    summary: str
    parsed_data: AgentParsedAppointment
    thought_process: List[ReActStep]
    provider: str = Field(default="groq-llama-3.3-react", description="Execution engine")
    hitl_status: str = Field(default="PENDING_REVIEW", description="Status for Human-in-the-Loop review")

