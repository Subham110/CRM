import json
import logging
import re
from datetime import datetime, timedelta, timezone
from typing import Dict, Any, List, Optional
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage, ToolMessage
from langchain_groq import ChatGroq

from app.core.config import settings
from app.mcp.tools import (
    CLINICAL_TOOLS,
    lookup_doctors,
    triage_patient_symptoms,
    check_slot_availability
)
from app.schemas.agent import (
    AgentParsedAppointment,
    ReActStep,
    AgentExecutionResponse
)
from app.services.appointment_service import DOCTORS_DATABASE

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are an expert Clinical Triage & Appointment Scheduling AI Agent operating in a hospital microservice.
Your goal is to parse natural language appointment requests from patients, reason clinically about their symptoms, match them with the right doctor using MCP tools, and produce an accurate appointment booking draft in strict JSON format.

Available MCP Tools:
1. `triage_patient_symptoms(symptoms, patient_age)`: Evaluates patient symptoms and age to suggest department and urgency.
2. `lookup_doctors(department_or_specialty)`: Finds doctors in the hospital matching the needed specialty.
3. `check_slot_availability(doctor_name, target_time_slot)`: Verifies if the requested slot is open.

ReAct Guidelines:
- Think step by step (Reasoning).
- Call tools whenever you need to triage symptoms or verify doctors/slots (Action).
- Read the tool response (Observation).
- Once satisfied, formulate the final appointment draft.

Your FINAL response MUST end with a valid JSON block enclosed in ```json ... ``` with keys:
{
  "patient_name": "string",
  "patient_age": integer (1-125),
  "reason": "clear medical complaint or symptoms",
  "doctor_name": "Dr. Name",
  "department": "Department",
  "appointment_date": "YYYY-MM-DD",
  "time_slot": "e.g. 09:00 AM - 10:00 AM",
  "contact_phone": "optional phone or null",
  "contact_email": "optional email or null",
  "urgency_level": "ROUTINE or URGENT",
  "clinical_notes": "clinical justification summary"
}
"""


class AgentService:
    @staticmethod
    async def process_booking_request(prompt: str) -> AgentExecutionResponse:
        """
        Executes ReAct Agent workflow using Groq API (or simulated fallback if API key is not yet configured).
        """
        groq_key = settings.GROQ_API_KEY.get_secret_value() if settings.GROQ_API_KEY else None

        if groq_key and not groq_key.startswith("your_") and len(groq_key) > 10:
            try:
                return await AgentService._run_groq_react_agent(prompt, groq_key)
            except Exception as e:
                logger.error(f"Groq API call encountered error: {e}. Falling back to internal MCP ReAct engine.")
                return AgentService._run_simulated_mcp_agent(prompt, str(e))
        else:
            logger.info("No active GROQ_API_KEY configured. Running deterministic MCP ReAct Agent.")
            return AgentService._run_simulated_mcp_agent(prompt)

    @staticmethod
    async def _run_groq_react_agent(prompt: str, api_key: str) -> AgentExecutionResponse:
        """Runs the ReAct Agent using Groq LLaMA 3.3 model and LangChain Tool binding."""
        llm = ChatGroq(
            model=settings.GROQ_MODEL,
            api_key=api_key,
            temperature=0.1,
            max_tokens=2048,
        )

        llm_with_tools = llm.bind_tools(CLINICAL_TOOLS)
        tool_map = {t.name: t for t in CLINICAL_TOOLS}

        messages = [
            SystemMessage(content=SYSTEM_PROMPT),
            HumanMessage(content=f"Patient Appointment Request: \"{prompt}\"")
        ]

        thought_steps: List[ReActStep] = []
        step_counter = 1

        # Step 1: Initial Thought
        thought_steps.append(ReActStep(
            step_number=step_counter,
            step_type="thought",
            title="Analyzing Input",
            content=f"Received natural language request. Initiating clinical entity extraction and symptom triage for: '{prompt}'"
        ))
        step_counter += 1

        # Execute ReAct Tool-Calling Loop (up to 4 iterations)
        for _ in range(4):
            ai_msg = await llm_with_tools.ainvoke(messages)
            messages.append(ai_msg)

            if not ai_msg.tool_calls:
                # No more tools called, agent reached conclusion
                break

            for tc in ai_msg.tool_calls:
                tool_name = tc["name"]
                tool_args = tc["args"]
                tool_id = tc["id"]

                # Log ReAct Action step
                thought_steps.append(ReActStep(
                    step_number=step_counter,
                    step_type="action",
                    title=f"Tool Call: {tool_name}",
                    content=f"Invoking MCP tool `{tool_name}` with arguments: {json.dumps(tool_args)}",
                    tool_name=tool_name,
                    tool_input=tool_args
                ))
                step_counter += 1

                # Execute MCP Tool
                tool_fn = tool_map.get(tool_name)
                tool_output = tool_fn.invoke(tool_args) if tool_fn else "{}"

                # Log ReAct Observation step
                thought_steps.append(ReActStep(
                    step_number=step_counter,
                    step_type="observation",
                    title=f"Observation from {tool_name}",
                    content=tool_output[:400] + ("..." if len(tool_output) > 400 else ""),
                    tool_name=tool_name,
                    tool_output=tool_output
                ))
                step_counter += 1

                messages.append(ToolMessage(content=str(tool_output), tool_call_id=tool_id))

        # Get final response text from agent
        final_msg = messages[-1]
        final_text = final_msg.content if isinstance(final_msg.content, str) else str(final_msg.content)

        # Extract JSON block from response
        json_match = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", final_text, re.DOTALL)
        if json_match:
            parsed_json = json.loads(json_match.group(1))
        else:
            # Fallback to direct json parse
            parsed_json = json.loads(final_text[final_text.find("{"):final_text.rfind("}")+1])

        parsed_data = AgentParsedAppointment(**parsed_json)

        thought_steps.append(ReActStep(
            step_number=step_counter,
            step_type="decision",
            title="Form Schema Generated",
            content=f"Successfully extracted all required fields: Patient '{parsed_data.patient_name}', Age {parsed_data.patient_age}, Doctor '{parsed_data.doctor_name}' ({parsed_data.department}). Waiting for Human-in-the-Loop approval."
        ))

        return AgentExecutionResponse(
            success=True,
            summary=f"ReAct agent booked triage appointment with {parsed_data.doctor_name} for {parsed_data.patient_name}.",
            parsed_data=parsed_data,
            thought_process=thought_steps,
            provider=f"groq-{settings.GROQ_MODEL}-react",
            hitl_status="PENDING_REVIEW"
        )

    @staticmethod
    def _run_simulated_mcp_agent(prompt: str, notice: Optional[str] = None) -> AgentExecutionResponse:
        """
        Deterministic ReAct engine executing the same MCP clinical tools.
        Used when Groq API key is not provided, allowing zero-setup local testing.
        """
        thought_steps: List[ReActStep] = []
        step_counter = 1

        # 1. Thought
        thought_steps.append(ReActStep(
            step_number=step_counter,
            step_type="thought",
            title="Clinical Entity Parsing",
            content=f"Analyzing prompt '{prompt}'. Extracting demographics, symptoms, and doctor preferences."
        ))
        step_counter += 1

        # Extract Age
        age_match = re.search(r'\b(?:age|aged|years old|yo)\s*[:=]?\s*(\d{1,3})\b|\b(\d{1,3})\s*(?:years old|yo|yr|yrs)\b', prompt, re.I)
        if age_match:
            age = int(age_match.group(1) or age_match.group(2))
        else:
            # Look for isolated numbers between 1 and 99
            isolated_nums = [int(n) for n in re.findall(r'\b\d{1,2}\b', prompt) if 1 <= int(n) <= 100]
            age = isolated_nums[0] if isolated_nums else 35

        # Extract Name
        name_match = re.search(r'\b(?:name is|i am|patient is|my name is)\s+([A-Za-z]+(?:\s+[A-Za-z]+)?)\b', prompt, re.I)
        if name_match:
            patient_name = name_match.group(1).title()
        else:
            patient_name = "Alex Morgan"

        # 2. Tool Call: Triage Symptoms
        thought_steps.append(ReActStep(
            step_number=step_counter,
            step_type="action",
            title="Tool Call: triage_patient_symptoms",
            content=f"Calling MCP tool triage_patient_symptoms with symptoms='{prompt}' and age={age}",
            tool_name="triage_patient_symptoms",
            tool_input={"symptoms": prompt, "patient_age": age}
        ))
        step_counter += 1

        triage_raw = triage_patient_symptoms.invoke({"symptoms": prompt, "patient_age": age})
        triage_data = json.loads(triage_raw)

        thought_steps.append(ReActStep(
            step_number=step_counter,
            step_type="observation",
            title="Triage Evaluation",
            content=f"Department: {triage_data['recommended_department']}, Urgency: {triage_data['urgency_level']}, Rationale: {triage_data['clinical_rationale']}",
            tool_name="triage_patient_symptoms",
            tool_output=triage_raw
        ))
        step_counter += 1

        # 3. Tool Call: Lookup Doctors
        dept = triage_data["recommended_department"]
        thought_steps.append(ReActStep(
            step_number=step_counter,
            step_type="action",
            title="Tool Call: lookup_doctors",
            content=f"Calling MCP tool lookup_doctors for department '{dept}'",
            tool_name="lookup_doctors",
            tool_input={"department_or_specialty": dept}
        ))
        step_counter += 1

        docs_raw = lookup_doctors.invoke({"department_or_specialty": dept})
        matching_docs = json.loads(docs_raw)
        chosen_doctor = matching_docs[0] if matching_docs else DOCTORS_DATABASE[0].model_dump()

        thought_steps.append(ReActStep(
            step_number=step_counter,
            step_type="observation",
            title="Matched Physician",
            content=f"Selected {chosen_doctor['name']} ({chosen_doctor['specialty']}) in {chosen_doctor['room']} with rating ⭐{chosen_doctor.get('rating', 4.9)}.",
            tool_name="lookup_doctors",
            tool_output=json.dumps(chosen_doctor, indent=2)
        ))
        step_counter += 1

        # 4. Tool Call: Check Slot Availability
        target_slot = chosen_doctor.get("time_slots", ["09:00 AM - 10:00 AM"])[0]
        slot_raw = check_slot_availability.invoke({"doctor_name": chosen_doctor["name"], "target_time_slot": target_slot})
        slot_data = json.loads(slot_raw)

        thought_steps.append(ReActStep(
            step_number=step_counter,
            step_type="observation",
            title="Slot Verified",
            content=f"Allocated verified slot: {slot_data['confirmed_slot']}",
            tool_name="check_slot_availability",
            tool_output=slot_raw
        ))
        step_counter += 1

        # Final Decision
        tomorrow = (datetime.now(timezone.utc) + timedelta(days=1)).strftime("%Y-%m-%d")
        parsed_data = AgentParsedAppointment(
            patient_name=patient_name,
            patient_age=age,
            reason=prompt.strip(),
            doctor_name=chosen_doctor["name"],
            department=chosen_doctor["department"],
            appointment_date=tomorrow,
            time_slot=slot_data["confirmed_slot"],
            contact_phone="+1 (555) 014-9922",
            contact_email=f"{patient_name.lower().replace(' ', '.')}@example.com",
            urgency_level=triage_data["urgency_level"],
            clinical_notes=f"Auto-triaged by MCP Agent ({triage_data['clinical_rationale']})"
        )

        thought_steps.append(ReActStep(
            step_number=step_counter,
            step_type="decision",
            title="Booking Proposal Generated",
            content=f"Form ready for auto-fill. Waiting for user approval (Human-in-the-Loop review)."
        ))

        return AgentExecutionResponse(
            success=True,
            summary=f"ReAct Agent triaged '{patient_name}' ({age} yrs) -> {chosen_doctor['name']} ({dept}).",
            parsed_data=parsed_data,
            thought_process=thought_steps,
            provider="mcp-react-clinical-engine",
            hitl_status="PENDING_REVIEW"
        )

