# Document Intelligence

FastAPI backend + Next.js frontend to extract PDF outlines and surface persona-driven relevant sections. Single Docker image serves the static frontend via FastAPI.

## Backend (FastAPI)

- Location: `backend/`
- Endpoints:
  - `POST /v1/outline` — upload a PDF or pass `docId` to get outline `{ level, text, page }[]`
  - `GET  /v1/files/{docId}` — serve persisted PDFs
  - `POST /v1/persona/analyze` — persona and job inputs → `extracted_sections` and `subsection_analysis`
  - `POST /v1/search/ingest` — index PDFs (files or docIds) for semantic search
  - `POST /v1/search/query` — query related sections across the indexed PDFs
  - `POST /v1/insights` — optional LLM insights from selection + matches

### Dev run

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
# http://localhost:8000/health
```

## Frontend (Next.js + Tailwind v4)

- Location: `frontend/`
- Configure Adobe Embed: create `frontend/.env.local`

```ini
NEXT_PUBLIC_ADOBE_EMBED_CLIENT_ID=YOUR_ADOBE_CLIENT_ID
```

### Dev run

```bash
cd frontend
npm i
npm run dev
# http://localhost:3000
```

## Docker (single container)

```bash
# from repo root
docker build --platform linux/amd64 -t docint-app .
docker run -p 8080:8080 -e NEXT_PUBLIC_ADOBE_EMBED_CLIENT_ID=YOUR_ADOBE_CLIENT_ID docint-app
# open http://localhost:8080
```

### Runtime env (evaluation)

Provide:

```
- ADOBE_EMBED_API_KEY or NEXT_PUBLIC_ADOBE_EMBED_CLIENT_ID
- LLM_PROVIDER=gemini
- GEMINI_MODEL=gemini-2.5-flash
- GOOGLE_API_KEY (Gemini)
- TTS_PROVIDER=azure (optional)
- AZURE_TTS_KEY (optional)
- AZURE_TTS_ENDPOINT (optional)
```

## Where features show up
- Right “Outline” → from `backend/process_pdfs.py`
- Left “Contextual Recommendations” → from `backend/persona_analyzer.py`

## Notes
- PDFs are persisted under `backend/store/` at runtime using content hash as `docId`.
- Frontend is exported static and served by FastAPI from `/`.
- CPU-only, offline baseline; easy to augment with LLM later.


