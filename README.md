# MedRecord AI — starter build

Stack: FastAPI + SQLite (or free Postgres) + **Google Gemini API (vision + structured JSON)**
+ NIH RxNav (free drug data) + local sentence-transformers embeddings (no paid vector DB)
+ a custom clinical "chart-paper" design system on the frontend.

Gemini is a **hosted API** — no GPU, no model server to run yourself. That also makes this
build much easier to put behind a public link than the earlier self-hosted vLLM version.

## Features implemented

**1. Provenance & Conflict Graph (the differentiator)**
- Every extracted fact carries a `document_id` + exact `source_snippet` — click any citation
  to jump to the highlighted source text (`SourceViewer.jsx`, `GET /documents/{id}`).
- `conflicts.py` is a deterministic, rules-based Python engine — not an LLM guess — that groups
  medications by resolved RxNorm concept and flags **duplicates**, **dosage conflicts**, and
  **frequency conflicts**. The model is only ever handed the already-flagged result to phrase in
  plain language; it never decides whether a conflict exists.
- `ProvenanceGraph.jsx` renders this as an actual graph: documents on the outer ring, medications
  in the center, solid teal lines for provenance, dashed severity-colored lines for conflicts.
  (`GET /patients/{id}/graph`)

**2. Document ingestion & structured extraction**
- Gemini's vision/document understanding + `response_json_schema` (`extraction.py`) — not
  free-text prompting — extracts medications, dosages, frequencies, labs, diagnoses, and
  allergies into a strict JSON schema, enforced server-side by Gemini itself. PDFs are sent to
  Gemini directly (native PDF understanding, up to 50MB/1000 pages) — no page-rasterization
  needed.
- Raw text and structured JSON are stored together per document, which is what makes
  cross-document reasoning (conflicts, RAG) deterministic instead of purely retrieval-based.

**3. Patient timeline & hybrid entity normalization**
- `GET /patients/{id}/timeline` merges every document into one chronological record.
- `normalization.py` resolves name variants ("Metformin 500mg" → "metformin") with local fuzzy
  matching (rapidfuzz) first — free, instant — then falls back to RxNav's approximate-match API.
  It also has an optional scispaCy hook (`try_scispacy_entities`) that activates automatically
  *if* you `pip install scispacy` + a model; the app runs fine without it.

**4. Drug interactions via NIH RxNav**
- `rxnav.py` calls the free, no-key NIH RxNav/RxNorm API for ground-truth interaction data —
  never LLM memory. `severity_to_color()` maps RxNav's severity text to a red/amber/green
  hospital-triage scheme, rendered as `flag-tab` chips in the UI.

**5. Lab trend analysis**
- `trends.py` computes slope, percent change, and direction with plain numpy linear regression —
  no LLM math — plus per-point in/out-of-range flags.
- `TrendChart.jsx` (Recharts) plots the line with a shaded reference-range band; out-of-range
  points render in amber/red.
- `LabTestPicker.jsx` gives you a `<datalist>` autocomplete and clickable quick-filter chips,
  backed by `GET /patients/{id}/lab-tests` (distinct test names for that patient).

**6. RAG follow-up Q&A**
- `rag.py` uses local `sentence-transformers` embeddings + numpy cosine similarity — free, no
  vector DB service. Confidence is derived from retrieval similarity, not invented by the model.
  Every answer cites which document(s) it drew from.

**7. Custom clinical UI design system**
- `styles.css` — exam-room pale green-grey background (`#EEF1EE`), chart-paper white panels,
  deep ink text (`#14231F`), teal accent (`#1F5D50`), red/amber/green triage flag tabs.
- IBM Plex Serif for headers, IBM Plex Sans for body prose, **IBM Plex Mono used exclusively for
  exact data values** (doses, lab numbers, dates, citations) so raw document data is always
  visually distinct from generated explanation text.

## What's here

```
backend/
  main.py           FastAPI app — all endpoints
  extraction.py     Gemini vision/document extraction (OCR + structured JSON)
  normalization.py  Fuzzy matching + optional scispaCy hybrid NLP
  rxnav.py          Free NIH RxNav client — drug normalization, interactions, severity color
  conflicts.py      Deterministic duplicate/dosage/frequency conflict engine
  trends.py         Deterministic lab trend calc (numpy linear regression)
  rag.py            Free local embeddings (sentence-transformers) + cosine retrieval
  models.py         SQLAlchemy models (Patient, Document, Medication, LabResult)
  db.py             DB session setup (SQLite by default, Postgres via env var)
  schema.sql        Reference schema (auto-created by SQLAlchemy, kept for inspection)
  requirements.txt
  .env.example      Copy to .env and fill in your Gemini API key

frontend/
  src/
    App.jsx             Main app — wires every endpoint above into the UI
    styles.css          The clinical chart-paper design system (colors, type, components)
    ProvenanceGraph.jsx Custom SVG provenance & conflict graph (the signature visual)
    TrendChart.jsx       Recharts lab trend line with reference-range band
    LabTestPicker.jsx    Autocomplete + quick-select chips for lab tests
    SourceViewer.jsx     Modal that highlights the exact cited snippet in a document
  .env.example      Copy to .env and set VITE_API_BASE when deploying
```

## Prerequisites

- **Python 3.10+**
- **Node.js 18+** and npm
- **A free Gemini API key** — no credit card required. Get one at
  [aistudio.google.com/apikey](https://aistudio.google.com/apikey).

No GPU, no model server — this is the main practical upgrade over the earlier self-hosted
DeepSeek-VL2/vLLM version.

## Run it locally

### 1. Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
# edit .env and paste your GEMINI_API_KEY

uvicorn main:app --reload
```

Backend runs at `http://localhost:8000`. Visit `http://localhost:8000/docs` for interactive
Swagger UI to test every endpoint directly.

The first run creates `medrecord.db` (SQLite) automatically — zero setup.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Opens at `http://localhost:5173`. For local dev you don't need to touch `.env` — it defaults to
`http://localhost:8000`.

## Making it accessible as a public link

Two options depending on whether you want a quick temporary demo link or a real deployed app.

### Option A — quick temporary link (good for a demo today)

Use a tunnel to expose your locally running backend and frontend without deploying anywhere.
[ngrok](https://ngrok.com) is the simplest:

```bash
# with the backend running locally on :8000
ngrok http 8000
```

This gives you a public `https://xxxx.ngrok-free.app` URL for the backend. Put that URL in
`frontend/.env` as `VITE_API_BASE`, restart `npm run dev`, then tunnel the frontend too:

```bash
ngrok http 5173
```

Share the frontend's ngrok URL. Caveats: free ngrok URLs change every time you restart the
tunnel, and both your laptop and the tunnel need to stay running for the link to work — fine for
a same-day demo, not for something you want live long-term.

### Option B — real deployment (a stable link that stays up)

Since there's no GPU/model server to host yourself anymore, this is a standard two-service web
deploy:

**Backend → [Render](https://render.com) (free tier)**
1. Push this repo to GitHub.
2. In Render: New → Web Service → connect the repo, root directory `backend`.
3. Build command: `pip install -r requirements.txt`
4. Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Add environment variable `GEMINI_API_KEY` (and `DATABASE_URL` if using Postgres — see below).
6. Deploy. Note the resulting URL, e.g. `https://medrecord-backend.onrender.com`.

**Frontend → [Vercel](https://vercel.com) or [Netlify](https://netlify.com) (free tier)**
1. New project → same GitHub repo, root directory `frontend`.
2. Framework preset: Vite. Build command `npm run build`, output directory `dist`.
3. Add environment variable `VITE_API_BASE` = your Render backend URL from above.
4. Deploy. You get a public URL like `https://medrecord-ai.vercel.app` — that's your shareable
   link.

**Database note:** Render's free tier has an ephemeral filesystem, so SQLite data will be wiped
on every redeploy/restart. For anything beyond a demo, swap in free Postgres (see below) so data
persists.

**CORS note:** `main.py` already has `allow_origins=["*"]` set, so the deployed frontend can hit
the deployed backend with no extra config. Worth tightening to your actual frontend domain once
this is more than a demo.

## Swapping in free Postgres (optional but recommended for any public deployment)

1. Create a free project at [neon.tech](https://neon.tech) or [supabase.com](https://supabase.com).
2. Copy the connection string.
3. In `backend/.env` (or Render's environment variables): `DATABASE_URL=postgresql://user:password@host/dbname`
4. Restart the backend — tables are created automatically.

## Gotchas to remember

- **Free tier rate limit**: Gemini's free tier is rate-limited (low requests/minute) — fine for a
  demo, but batch-uploading many documents back-to-back may hit 429s. Add a short delay between
  uploads if that happens, or upgrade to a paid Gemini API key for higher limits.
- **Render free tier sleeps when idle** — the first request after inactivity can take ~30-60s to
  wake up. Warn viewers of your link, or ping it a minute before sharing/demoing.
- `sentence-transformers` downloads the `all-MiniLM-L6-v2` model (~90MB) on first run — this
  happens automatically during Render's build/first boot too, just budget a bit of extra startup
  time on first deploy.
- Cache/reuse extraction results while iterating on the frontend so you're not re-calling the
  Gemini API on every UI tweak.
- scispaCy is optional and *not* installed by default (it's a large download); `normalization.py`
  works fine without it via fuzzy matching + RxNav.
