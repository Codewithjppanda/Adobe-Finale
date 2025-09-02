1. Frontend Setup

In the frontend/ directory, create a .env.local file and add the following line:

NEXT_PUBLIC_ADOBE_EMBED_CLIENT_ID=your_adobe_client_id

2. Backend Setup

In the backend/ directory, create a .env file and add the following configuration:

# API Keys
GOOGLE_API_KEY=your_google_api_key
GEMINI_API_KEY=your_gemini_api_key
AZURE_TTS_KEY=your_azure_tts_key
AZURE_TTS_REGION=your_azure_region

# Enable features
LLM_PROVIDER=gemini
TTS_PROVIDER=azure
GEMINI_MODEL=gemini-2.5-flash

Docker Setup (Single Container)

Once you have set up the environment files, you can build and run the application using Docker.

Download the ZIP file and extract it.

Open the project in your code editor.

Open your terminal in the project root and run the following command to build and start the project:

docker build --platform linux/amd64 -t doc-intelligence . && docker run -d --name doc-intelligence-app -e ADOBE_EMBED_API_KEY=your_adobe_client_id -e LLM_PROVIDER=gemini -e GEMINI_MODEL=gemini-2.5-flash -e TTS_PROVIDER=azure -e AZURE_TTS_KEY=your_azure_tts_key -e AZURE_TTS_ENDPOINT=your_azure_tts_endpoint -p 8080:8080 doc-intelligence


Important: Replace the placeholders (your_*) with your actual keys and endpoints.

Once the Docker container is running, open your browser and visit:

http://localhost:8080

Backend (FastAPI)

Location: backend/

Endpoints:

POST /v1/outline — Upload a PDF or pass docId to get outline { level, text, page }[]

GET /v1/files/{docId} — Serve persisted PDFs

POST /v1/persona/analyze — Persona and job inputs → extracted_sections and subsection_analysis

POST /v1/search/ingest — Index PDFs (files or docIds) for semantic search

POST /v1/search/query — Query related sections across the indexed PDFs

POST /v1/insights — Optional LLM insights from selection + matches

Dev Run
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
# http://localhost:8000/health

Frontend (Next.js + Tailwind v4)

Location: frontend/

Configure Adobe Embed: Create frontend/.env.local

NEXT_PUBLIC_ADOBE_EMBED_CLIENT_ID=your_adobe_client_id

Dev Run
cd frontend
npm install
npm run dev
# http://localhost:3000

Runtime Environment (Evaluation)

Provide the following API keys and configurations in your environment:

# API Keys
GOOGLE_API_KEY=your_google_api_key
GEMINI_API_KEY=your_gemini_api_key
AZURE_TTS_KEY=your_azure_tts_key
AZURE_TTS_REGION=your_azure_region

# Enable features
LLM_PROVIDER=gemini
TTS_PROVIDER=azure
GEMINI_MODEL=gemini-2.5-flash

Where Features Show Up

Right “Outline” → From backend/process_pdfs.py

Left “Contextual Recommendations” → From backend/persona_analyzer.py
