import pytest
from httpx import AsyncClient, ASGITransport
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from app.main import app
from app.core.database import Base, get_db

TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

test_engine = create_async_engine(TEST_DATABASE_URL, echo=False)
TestSessionLocal = async_sessionmaker(
    bind=test_engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False
)


async def override_get_db():
    async with TestSessionLocal() as session:
        yield session


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(scope="function", autouse=True)
async def setup_test_db():
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)



@pytest.mark.asyncio
async def test_health_endpoints():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/health")
        assert response.status_code == 200
        assert response.json()["status"] == "healthy"


@pytest.mark.asyncio
async def test_get_doctors_list():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/api/v1/doctors/")
        assert response.status_code == 200
        doctors = response.json()
        assert len(doctors) > 0
        assert "Dr. Evelyn Harper" in [d["name"] for d in doctors]


@pytest.mark.asyncio
async def test_book_appointment_success():
    payload = {
        "patient_name": "Jane Doe",
        "patient_age": 32,
        "reason": "Persistent severe migraine and blurred vision during mornings",
        "doctor_name": "Dr. Evelyn Harper",
        "department": "General Medicine",
        "appointment_date": datetime.now(timezone.utc).isoformat(),
        "time_slot": "10:00 AM - 11:00 AM",
        "contact_phone": "+1-555-0199",
        "contact_email": "jane.doe@example.com",
        "notes": "Prefers morning appointments."
    }

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post("/api/v1/appointments/", json=payload)
        assert response.status_code == 201
        data = response.json()
        assert data["patient_name"] == "Jane Doe"
        assert data["patient_age"] == 32
        assert "migraine" in data["reason"]
        assert data["doctor_name"] == "Dr. Evelyn Harper"
        assert data["status"] == "CONFIRMED"
        assert "id" in data


@pytest.mark.asyncio
async def test_book_appointment_validation_failure():
    # Invalid age (negative or out of bounds) and missing reason
    invalid_payload = {
        "patient_name": "A", # Too short
        "patient_age": 200, # Out of range
        "reason": "", # Missing / too short
        "doctor_name": "Dr. Test",
        "appointment_date": datetime.now(timezone.utc).isoformat(),
    }

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post("/api/v1/appointments/", json=invalid_payload)
        assert response.status_code == 422
