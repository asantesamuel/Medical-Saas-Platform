# NeuroScan AI — AI Medical SaaS Platform

Brain Tumor & Ischemic Stroke detection for clinicians.
Supabase-first architecture · FastAPI inference · React + Vite frontend.

---

## Architecture

```
React (Vite)          Supabase Platform          FastAPI (CPU)
─────────────    ←→   ──────────────────    ←→   ─────────────
Auth pages            Auth (JWT)                 POST /api/v1/predictions/predict
Dashboard             PostgreSQL + RLS            GET  /api/v1/predictions/
History               Storage (private)          GET  /api/v1/admin/*
Admin panel           Realtime (subscribe)       GET  /health/ready
```

FastAPI's only job is TensorFlow inference. All auth, storage, and real-time
data flow through Supabase directly from the React frontend.

---

## Quick Start

### 1 — Supabase setup (do this first)

1. Create a project at [supabase.com](https://supabase.com)
2. In **SQL Editor**, run `backend/scripts/sql/schema.sql`
3. In **SQL Editor**, run `backend/scripts/sql/audit_log.sql`
4. In **Storage**, create two **private** buckets: `scan-images` and `gradcam-maps`
5. In **Authentication → Providers**, enable Email
6. Copy `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY`
   from **Project Settings → API**

### 2 — Backend (PyCharm)

```bash
cd backend
python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
# Fill in SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and model paths

# Place your model files:
# backend/models/brain_tumor_model.h5
# backend/models/stroke_model.h5

uvicorn app.main:app --reload --port 8000
```

Open http://localhost:8000/docs to verify. The `/health/ready` endpoint
confirms both models are loaded and Supabase is reachable.

Or use the pre-configured **PyCharm run configuration**:
`Run → Run FastAPI (dev)`

### 3 — Frontend (WebStorm)

```bash
cd frontend
npm install

cp .env.example .env
# Fill in VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_API_URL

npm run dev
```

Open http://localhost:5173

Or use the pre-configured **WebStorm run configuration**:
`Run → Vite Dev Server`

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description |
|---|---|
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key — server only, never expose |
| `TUMOR_MODEL_PATH` | Path to brain tumor `.h5` model file |
| `STROKE_MODEL_PATH` | Path to stroke `.h5` model file |
| `ALLOWED_ORIGIN` | Frontend URL for CORS (e.g. `https://your-app.vercel.app`) |
| `PREDICT_RATE_LIMIT` | slowapi rate limit string (default: `10/minute`) |

### Frontend (`frontend/.env`)

| Variable | Description |
|---|---|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Anon key — safe to expose (RLS protects data) |
| `VITE_API_URL` | FastAPI base URL (e.g. `https://your-app.onrender.com`) |

---

## Running Tests

```bash
# Backend unit tests
cd backend
pytest tests/unit/ -v

# Backend with coverage report
pytest --cov=app --cov-report=html

# Frontend tests
cd frontend
npm run test

# Frontend with coverage
npm run test:coverage
```

---

## Deployment

### Backend → Render (or Railway)

1. Push `backend/` to GitHub
2. Create a new **Web Service** on Render
3. Set **Build Command**: `pip install -r requirements.txt`
4. Set **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Add all environment variables from `backend/.env`
6. Upload model files via Render's disk or use a storage URL
7. Add the Render URL to Supabase **Project Settings → API → CORS**

### Frontend → Vercel

1. Push `frontend/` to GitHub
2. Import project on [vercel.com](https://vercel.com)
3. Set **Framework**: Vite
4. Add all `VITE_*` environment variables
5. Add the Vercel domain to Supabase **Authentication → URL Configuration**

---

## HIPAA Compliance Notes

- The `SUPABASE_SERVICE_ROLE_KEY` bypasses all RLS — it is **never** logged,
  returned in API responses, or exposed to the frontend.
- The audit log (`audit_log` table) records user_id + event_type only — no PHI.
- Prediction logs record `model_type` and `model_version` only — not result text.
- All storage buckets are private; images are accessed via short-lived presigned URLs.
- RLS is enabled on every table from day one — cross-user data access is blocked
  at the database level even if application bugs exist.
- Review your Supabase BAA (Business Associate Agreement) before going to production.

---

## API Reference

### `POST /api/v1/predictions/predict`

**Headers**: `Authorization: Bearer <supabase_jwt>`

**Body**:
```json
{
  "image_path": "scan-images/{user_id}/{uuid}.jpg",
  "model_type": "tumor",
  "user_id": "{uuid}"
}
```

**Response**:
```json
{
  "prediction_id": "uuid",
  "result": "Glioma Detected",
  "confidence_score": 0.87,
  "top_3_results": [
    { "label": "Glioma Detected", "confidence": 0.87 },
    { "label": "No Tumor",        "confidence": 0.08 },
    { "label": "Meningioma",      "confidence": 0.05 }
  ],
  "image_path": "scan-images/...",
  "gradcam_path": "gradcam-maps/...",
  "model_version": "tumor_v2",
  "low_confidence_warning": false
}
```

`low_confidence_warning: true` when `confidence_score < 0.40` — the frontend
displays a prominent warning banner in this case.

### `GET /api/v1/predictions/`

Returns the authenticated user's prediction history (RLS-filtered).

### `GET /api/v1/admin/stats` · `GET /api/v1/admin/users` · `GET /api/v1/admin/audit`

Admin-only (role = `'admin'` in `profiles` table). Returns platform stats,
user list with scan counts, and HIPAA audit events.

### `GET /health/` · `GET /health/ready`

Liveness and readiness probes used by Render/Railway health checks.

---

*NeuroScan AI · v0.1.0 · AI predictions do not constitute medical advice.*
*For clinical use only under qualified supervision.*
