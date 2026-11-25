import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.core.database import get_db
from tests.test_appointments import override_get_db

app.dependency_overrides[get_db] = override_get_db


@pytest.mark.asyncio
async def test_mcp_tools_endpoint():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/api/v1/agent/tools")
        assert response.status_code == 200
        tools = response.json()
        tool_names = [t["name"] for t in tools]
        assert "lookup_doctors" in tool_names
        assert "triage_patient_symptoms" in tool_names
        assert "check_slot_availability" in tool_names


@pytest.mark.asyncio
async def test_agent_parse_booking_react_flow():
    payload = {
        "prompt": "I am Marcus Cole, 42 years old, experiencing sudden severe chest pains and palpitations since last night. Please book Dr. Marcus Vance tomorrow."
    }
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post("/api/v1/agent/parse", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["hitl_status"] == "PENDING_REVIEW"
        
        # Verify ReAct thought steps
        assert len(data["thought_process"]) >= 3
        step_types = [s["step_type"] for s in data["thought_process"]]
        assert "thought" in step_types
        assert "action" in step_types
        assert "observation" in step_types

        # Verify parsed data
        parsed = data["parsed_data"]
        assert parsed["patient_name"] == "Marcus Cole"
        assert parsed["patient_age"] == 42
        assert "chest" in parsed["reason"].lower()
        assert parsed["doctor_name"] == "Dr. Marcus Vance"
        assert parsed["department"] == "Cardiology"
        assert parsed["urgency_level"] in ["ROUTINE", "URGENT"]

