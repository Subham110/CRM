# MediCare CRM - Doctor Appointment Booking Microservice

A production-grade, containerized microservice application for booking and managing doctor consultation appointments.

---

## 🏛️ Microservice Architecture

The project is architected into isolated microservice components:

```
┌─────────────────────────────────────────────────────────────┐
│                       Client Browser                        │
└──────────────┬──────────────────────────────▲───────────────┘
               │                              │
               ▼                              │
┌──────────────────────────────┐              │
│    Frontend Microservice     │              │
│   (React JSX, Vite, Nginx)   │              │
│       Port 3000 / 80         │              │
└──────────────┬───────────────┘              │
               │ Reverse Proxy (/api)         │ Direct API
               ▼                              │
┌─────────────────────────────────────────────┴───────────────┐
│                    Backend Microservice                     │
│          (FastAPI, uv Package Manager, Python 3.13)         │
│                         Port 8000                           │
└──────────────────────────────┬──────────────────────────────┘
                               │ Async Connection Pool
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                    Database Microservice                    │
│                 (PostgreSQL 16 Alpine, ACID)                │
│                         Port 5432                           │
└─────────────────────────────────────────────────────────────┘
```

### 1. **Frontend Microservice (`/frontend`)**
* **Framework:** React (JSX - strictly no TypeScript as requested).
* **Styling & UI:** Tailwind CSS, Lucide React icons, Responsive Glassmorphism.
* **Key Features:**
  * **Doctor Appointment Booking Form**:
    * **Patient Name** (Full name validation)
    * **Age** (Numeric range validation 1-125)
    * **Reason for Visit** (Symptoms, chief complaints, character limit, and 8 one-click quick-pick tags)
    * **Doctor Selection** (Visiting specialist selection with department, room, and rating)
    * **Date & Preferred Time Slot**
    * **Contact Phone & Email**
  * **Appointments Management / Ledger**:
    * Live querying of all appointments from PostgreSQL.
    * Real-time search by patient name, reason, or physician.
    * Status filtering (`CONFIRMED`, `PENDING`, `COMPLETED`, `CANCELLED`).
    * One-click cancellation with confirmation prompt.
  * **Specialist Doctor Directory**:
    * Directory cards with qualifications, clinical experience, room locations, and direct booking trigger.
* **Production Deployment:** Multi-stage build served by Nginx Alpine with Gzip compression and security headers.

### 2. **Backend Microservice (`/backend`)**
* **Framework:** FastAPI with Python 3.13.
* **Package & Dependency Manager:** Astral `uv` (`uv init` / `uv add` — no `pip` used).
* **Database Driver & ORM:** PostgreSQL with `asyncpg` and SQLAlchemy 2.0 Async IO.
* **Validation & Schemas:** Pydantic v2 with strict type coercion and regex validation.
* **Endpoints:**
  * `POST /api/v1/appointments/` - Book a new appointment
  * `GET /api/v1/appointments/` - List appointments with pagination & search
  * `GET /api/v1/appointments/{id}` - Fetch single appointment
  * `PATCH /api/v1/appointments/{id}` - Update appointment details or status
  * `DELETE /api/v1/appointments/{id}` - Cancel appointment
  * `GET /api/v1/doctors/` - List available doctors
  * `GET /health` & `GET /api/v1/health/ready` - Kubernetes / Docker health & readiness probes
* **Production Deployment:** Multi-stage Docker container with non-root security user (`appuser`).

### 3. **Database Microservice (`postgres`)**
* PostgreSQL 16 Alpine with healthcheck probe (`pg_isready`) and persistent volume storage.

---

## 🚀 Quick Start with Docker Compose (Recommended)

To start the entire microservices stack in one command:

```bash
# From the root directory
docker compose up --build -d
```

### Accessing the Services:
| Service | URL | Description |
|---|---|---|
| **Frontend Portal** | `http://localhost:3000` | React JSX Appointment Booking UI |
| **Backend API** | `http://localhost:8000` | FastAPI Microservice |
| **Interactive API Docs** | `http://localhost:8000/docs` | Swagger / OpenAPI Explorer |
| **PostgreSQL** | `localhost:5432` | Database (`crm_db`) |

To check container statuses:
```bash
docker compose ps
```

To stop all services:
```bash
docker compose down
```

---

## 🛠️ Local Development (Without Docker)

### Prerequisites:
- `uv` (v0.6+)
- `node` (v20+) & `npm`
- Running PostgreSQL database (or fallback sqlite for testing)

### 1. Run Backend Service
```bash
cd backend

# uv manages the environment automatically:
uv run uvicorn app.main:app --reload --port 8000
```
Run backend tests:
```bash
cd backend
uv run pytest
```

### 2. Run Frontend Service
```bash
cd frontend

# Install dependencies (if not already done)
npm install

# Start Vite dev server
npm run dev
```
Open `http://localhost:3000` or `http://localhost:5173`.

---

## 🧪 Testing and Verification

Unit and integration tests have been implemented and validated with `pytest` and `httpx`:
- Health check endpoints (`/health`)
- Doctor list retrieval (`/api/v1/doctors/`)
- Appointment booking creation validation (`patient_name`, `patient_age`, `reason`)
- 422 Unprocessable Entity boundary validation for invalid inputs

