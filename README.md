

---

# Document Intelligence

FastAPI backend + Next.js frontend to extract PDF outlines and surface persona-driven relevant sections. A single Docker image serves the static frontend via FastAPI.

---

## Environment Setup

Before you start the Docker container, you need to set up environment variables for both the frontend and backend.

### 1. **Frontend Setup**

In the `frontend/` directory, create a `.env.local` file and add the following line:

```ini
NEXT_PUBLIC_ADOBE_EMBED_CLIENT_ID=6ffd0d77e88743c18889c48c3064c451
```

### 2. **Backend Setup**

In the `backend/` directory, create a `.env` file and add the following configuration:

```bash
# API Keys
GOOGLE_API_KEY=AIzaSyCx6vT2usg0NUmn5HWeULfjpId1o-dK2cg
GEMINI_API_KEY=AIzaSyCx6vT2usg0NUmn5HWeULfjpId1o-dK2cg
AZURE_TTS_KEY=9D11SwxpHbQrnWCFYt73vKShJGponxUOyfUvcaHDHh6Mp8GdpjNkJQQJ99BHACGhslBXJ3w3AAAYACOGQ9Xr
AZURE_TTS_REGION=centralindia

# Enable features  
LLM_PROVIDER=gemini
TTS_PROVIDER=azure
GEMINI_MODEL=gemini-2.5-flash
```

---

## Docker Setup (Single Container)

Once you have set up the environment files, you can build and run the application using Docker.

1. **Download the ZIP file** and extract it.
2. Open the project in your code editor.
3. Open your terminal in the project root and run the following command to build and start the project:

```bash
docker build --platform linux/amd64 -t doc-intelligence . && docker run -d --name doc-intelligence-app -e ADOBE_EMBED_API_KEY=6ffd0d77e88743c18889c48c3064c451 -e LLM_PROVIDER=gemini -e GEMINI_MODEL=gemini-2.5-flash -e TTS_PROVIDER=azure -e AZURE_TTS_KEY=TTS_KEY -e AZURE_TTS_ENDPOINT=TTS_ENDPOINT -p 8080:8080 doc-intelligence
```

> **Important**: Replace `TTS_KEY` and `TTS_ENDPOINT` with your actual Azure TTS API key and endpoint.

4. Once the Docker container is running, open your browser and visit:

```url
http://localhost:8080
```

---

## Backend (FastAPI)

* **Location**: `backend/`
* **Endpoints**:

  * `POST /v1/outline` — Upload a PDF or pass `docId` to get outline `{ level, text, page }[]`
  * `GET  /v1/files/{docId}` — Serve persisted PDFs
  * `POST /v1/persona/analyze` — Persona and job inputs → `extracted_sections` and `subsection_analysis`
  * `POST /v1/search/ingest` — Index PDFs (files or docIds) for semantic search
  * `POST /v1/search/query` — Query related sections across the indexed PDFs
  * `POST /v1/insights` — Optional LLM insights from selection + matches

### Dev Run

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
# http://localhost:8000/health
```

---

## Frontend (Next.js + Tailwind v4)

* **Location**: `frontend/`
* **Configure Adobe Embed**: Create `frontend/.env.local`

```ini
NEXT_PUBLIC_ADOBE_EMBED_CLIENT_ID=6ffd0d77e88743c18889c48c3064c451
```

### Dev Run

```bash
cd frontend
npm install
npm run dev
# http://localhost:3000
```

---

## Runtime Environment (Evaluation)

Provide the following API keys and configurations in your environment:

```bash
# API Keys
GOOGLE_API_KEY=AIzaSyCx6vT2usg0NUmn5HWeULfjpId1o-dK2cg
GEMINI_API_KEY=AIzaSyCx6vT2usg0NUmn5HWeULfjpId1o-dK2cg
AZURE_TTS_KEY=9D11SwxpHbQrnWCFYt73vKShJGponxUOyfUvcaHDHh6Mp8GdpjNkJQQJ99BHACGhslBXJ3w3AAAYACOGQ9Xr
AZURE_TTS_REGION=centralindia

# Enable features  
LLM_PROVIDER=gemini
TTS_PROVIDER=azure
GEMINI_MODEL=gemini-2.5-flash
```

---

## Where Features Show Up

* **Right** “Outline” → From `backend/process_pdfs.py`
* **Left** “Contextual Recommendations” → From `backend/persona_analyzer.py`

---

## Notes

* PDFs are persisted under `backend/store/` at runtime using content hash as `docId`.
* The frontend is exported statically and served by FastAPI from `/`.
* This setup is CPU-only and offline. It is easy to augment with LLM integration later.

---


