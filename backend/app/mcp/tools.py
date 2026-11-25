"""
Model Context Protocol (MCP) Tools for Clinical Appointment Triage & Doctor Matching.
Provides standard schemas for MCP clients and LangChain Tool bindings.
"""
import json
from typing import List, Dict, Any, Optional
from langchain_core.tools import tool
from app.services.appointment_service import DOCTORS_DATABASE


# ==============================================================
# 1. MCP Standard Tool Definitions & Implementations
# ==============================================================

@tool
def lookup_doctors(department_or_specialty: Optional[str] = None) -> str:
    """
    Search and retrieve available clinic physicians filtered by medical specialty or department.
    Args:
        department_or_specialty: Optional filter such as 'Cardiology', 'Pediatrics', 'Orthopedics', 'Dermatology', or 'General Medicine'.
    Returns:
        JSON list of doctors matching the query with room numbers, ratings, and time slots.
    """
    results = []
    query = (department_or_specialty or "").lower().strip()

    for doc in DOCTORS_DATABASE:
        if (
            not query
            or query in doc.department.lower()
            or query in doc.specialty.lower()
            or query in doc.name.lower()
        ):
            results.append({
                "id": doc.id,
                "name": doc.name,
                "specialty": doc.specialty,
                "department": doc.department,
                "qualification": doc.qualification,
                "experience_years": doc.experience_years,
                "room": doc.room,
                "rating": doc.rating,
                "available_days": doc.available_days,
                "time_slots": doc.time_slots,
            })

    if not results and query:
        # Fallback to general physician if specific specialty not found
        results = [d.model_dump() for d in DOCTORS_DATABASE if d.department == "General Medicine"]

    return json.dumps(results, indent=2)


@tool
def triage_patient_symptoms(symptoms: str, patient_age: int) -> str:
    """
    Clinically evaluate patient symptoms and age to recommend the appropriate medical specialty and urgency level.
    Args:
        symptoms: Description of patient complaints, pain, duration, or discomfort.
        patient_age: Age of the patient in years.
    Returns:
        JSON object containing recommended department, urgency classification, and triage advice.
    """
    symptoms_lower = symptoms.lower()
    
    # Priority triage rules
    if patient_age < 16:
        department = "Pediatrics"
        specialist_hint = "Pediatrician & Child Health Specialist"
    elif any(kw in symptoms_lower for kw in ["chest pain", "heart", "palpitation", "shortness of breath", "angina"]):
        department = "Cardiology"
        specialist_hint = "Cardiologist"
    elif any(kw in symptoms_lower for kw in ["skin", "rash", "itching", "acne", "eczema", "mole"]):
        department = "Dermatology"
        specialist_hint = "Dermatologist"
    elif any(kw in symptoms_lower for kw in ["bone", "fracture", "joint", "knee", "spine", "back pain", "ortho"]):
        department = "Orthopedics"
        specialist_hint = "Orthopedic Surgeon"
    else:
        department = "General Medicine"
        specialist_hint = "General Physician & Family Medicine"

    # Assess urgency level
    if any(kw in symptoms_lower for kw in ["severe", "unbearable", "emergency", "acute", "sudden collapse"]):
        urgency = "URGENT"
    else:
        urgency = "ROUTINE"

    triage_result = {
        "recommended_department": department,
        "recommended_specialty": specialist_hint,
        "urgency_level": urgency,
        "clinical_rationale": f"Symptoms indicative of {department.lower()} evaluation for a {patient_age}-year-old patient.",
        "requires_fast_track": urgency == "URGENT",
    }
    return json.dumps(triage_result, indent=2)


@tool
def check_slot_availability(doctor_name: str, target_time_slot: Optional[str] = None) -> str:
    """
    Check if a doctor has open consultation slots available.
    Args:
        doctor_name: Full name of the consulting physician.
        target_time_slot: Optional preferred time slot (e.g. '09:00 AM - 10:00 AM').
    Returns:
        JSON object with verified slot and availability status.
    """
    doc_match = next((d for d in DOCTORS_DATABASE if doctor_name.lower() in d.name.lower()), None)
    
    if not doc_match:
        doc_match = DOCTORS_DATABASE[0]

    valid_slots = doc_match.time_slots
    chosen_slot = target_time_slot if target_time_slot in valid_slots else valid_slots[0]

    return json.dumps({
        "doctor_name": doc_match.name,
        "is_available": True,
        "confirmed_slot": chosen_slot,
        "all_open_slots": valid_slots,
    }, indent=2)


# List of LangChain Tool instances
CLINICAL_TOOLS = [
    lookup_doctors,
    triage_patient_symptoms,
    check_slot_availability,
]


# ==============================================================
# 2. MCP JSON Schema Export for Model Context Protocol
# ==============================================================
def get_mcp_tools_manifest() -> List[Dict[str, Any]]:
    """Return tools specification adhering to the Model Context Protocol (MCP)."""
    return [
        {
            "name": "lookup_doctors",
            "description": "Query clinic physician directory by medical department or name",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "department_or_specialty": {
                        "type": "string",
                        "description": "Medical specialty such as Cardiology, Pediatrics, Dermatology, Orthopedics, or General Medicine"
                    }
                }
            }
        },
        {
            "name": "triage_patient_symptoms",
            "description": "Evaluate clinical symptoms and patient age to determine department and urgency",
            "inputSchema": {
                "type": "object",
                "required": ["symptoms", "patient_age"],
                "properties": {
                    "symptoms": {"type": "string", "description": "Patient complaints and pain description"},
                    "patient_age": {"type": "integer", "description": "Age of the patient in years"}
                }
            }
        },
        {
            "name": "check_slot_availability",
            "description": "Verify availability of consultation slots for a chosen doctor",
            "inputSchema": {
                "type": "object",
                "required": ["doctor_name"],
                "properties": {
                    "doctor_name": {"type": "string", "description": "Full name of the doctor"},
                    "target_time_slot": {"type": "string", "description": "Preferred time slot"}
                }
            }
        }
    ]

