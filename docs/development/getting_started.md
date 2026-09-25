# Getting Started with Connect

## Prerequisites
- Node.js 18+ (tested with Node v24)
- Python 3.11+ (tested with Python 3.14)
- Git

## Setup Instructions

### 1. Environment Configuration
```bash
cp .env.example .env
```

### 2. Install Node Dependencies
```bash
npm.cmd install
```

### 3. Install Python API Dependencies
```bash
python -m pip install -r apps/api/requirements.txt
```

### 4. Running the Development Servers
```bash
# Run Next.js Web App (port 3000)
npm.cmd run dev

# Run FastAPI Backend (port 8000)
python -m uvicorn apps.api.src.main:app --reload --port 8000
```

### 5. Running Tests
```bash
# Run backend pytest suite
pytest apps/api/tests

# Run frontend typecheck
npm.cmd run typecheck
```
