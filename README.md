# Food Subscription & Ledger Management System - Backend API

Production-ready, highly modular, mathematically stable Python 3.12+ FastAPI backend built using Clean Architecture, Repository Pattern, and Firebase Firestore Admin SDK.

---

## Key Highlights

- **Pure Backend (100% Business Logic)**: Exposes a clean REST API for any frontend (React, Flutter, Android, iOS, Web, CLI). Zero frontend/HTML/CSS code.
- **Frontend Independence**: All mathematical rules (Invoices, Cancellations, Sunday skips, Extensions, Pricing, Balances) are computed in the backend. API returns rich metadata.
- **Internet / CORS Ready**: Pre-configured with CORS middleware allowing remote frontends deployed anywhere on the internet (Vercel, Netlify, Cloud hosts, Mobile apps).
- **Windows Service & Standalone EXE**: Can be compiled into a single portable `.exe` file (`HHFXBackend.exe`) using PyInstaller, running as an auto-booting Windows Service without requiring Python on host machines.

---

## Directory Structure

```
HHFX/
├── app/
│   ├── core/           # Config, Logging, Database, Exceptions
│   ├── models/         # Pydantic Schemas (Customer, Sub, Delivery, Invoice, Ledger, Dashboard, etc.)
│   ├── repositories/   # Firestore Repositories (Customer, Sub, Delivery, Invoice, Ledger, etc.)
│   ├── services/       # 100% Business Logic Engines (Subscription, Delivery, Invoice, Ledger, etc.)
│   ├── api/            # API Layer (Middleware & REST Routers)
│   └── main.py         # FastAPI Entrypoint
├── scripts/
│   ├── build_exe.py    # PyInstaller EXE Entrypoint
│   ├── build_exe.bat    # Single-click Executable Packager Script
│   ├── HHFXBackend.spec# PyInstaller Spec configuration
│   ├── windows_service.py
│   ├── install_service.bat
│   └── uninstall_service.bat
├── docs/
│   ├── FIRESTORE_SCHEMA.md
│   ├── API_SPECIFICATION.md
│   ├── BUSINESS_RULES.md
│   ├── INTEGRATION_GUIDE.md
│   └── diagrams/      # Mermaid Sequence & ER Diagrams
├── .env.example
├── requirements.txt
└── README.md
```

---

## Quick Start (Running Locally)

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Configure Environment
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

### 3. Run FastAPI Server
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
Access Swagger UI documentation at: `http://localhost:8000/docs`

---

## Compiling to Single Standalone `.exe`

To package the entire backend into a single executable `HHFXBackend.exe`:
```cmd
cd scripts
build_exe.bat
```
The compiled executable will be generated at `scripts/dist/HHFXBackend.exe`. You can run this file directly on any Windows machine without installing Python!

---

## Installing as Windows Service

Run `scripts/install_service.bat` as Administrator:
- Registers `HHFXBackend.exe` or python service automatically.
- Sets startup type to **Automatic** (starts on boot without user login).
- Configures crash recovery (auto-restarts process if killed or crashed).
