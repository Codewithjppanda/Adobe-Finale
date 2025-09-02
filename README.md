Environment Setup
Before you start the Docker container, you need to set up environment variables for both the frontend and backend.

1. Frontend Setup
In the frontend/ directory, create a .env.local file and add the following line:

Ini, TOML

NEXT_PUBLIC_ADOBE_EMBED_CLIENT_ID=<YOUR_ADOBE_CLIENT_ID>
2. Backend Setup
In the backend/ directory, create a .env file and add the following configuration:

Bash

# API Keys
GOOGLE_API_KEY=<YOUR_GOOGLE_API_KEY>
GEMINI_API_KEY=<YOUR_GEMINI_API_KEY>
AZURE_TTS_KEY=<YOUR_AZURE_TTS_KEY>
AZURE_TTS_REGION=<YOUR_AZURE_TTS_REGION>

# Enable features
LLM_PROVIDER=gemini
TTS_PROVIDER=azure
GEMINI_MODEL=gemini-2.5-flash
Docker Setup (Single Container)
Once you have set up the environment files, you can build and run the application using Docker.

Download the ZIP file and extract it.

Open the project in your code editor.

Open your terminal in the project root and run the following command to build and start the project:

Bash

docker build --platform linux/amd64 -t doc-intelligence . && docker run -d --name doc-intelligence-app -e ADOBE_EMBED_API_KEY=<YOUR_ADOBE_CLIENT_ID> -e LLM_PROVIDER=gemini -e GEMINI_MODEL=gemini-2.5-flash -e TTS_PROVIDER=azure -e AZURE_TTS_KEY=<YOUR_AZURE_TTS_KEY> -e AZURE_TTS_ENDPOINT=<YOUR_AZURE_TTS_ENDPOINT> -p 8080:8080 doc-intelligence
Important: Replace <YOUR_AZURE_TTS_KEY> and <YOUR_AZURE_TTS_ENDPOINT> with your actual Azure TTS API key and endpoint.

Once the Docker container is running, open your browser and visit:

Code snippet

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
Bash

cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
# http://localhost:8000/health
Frontend (Next.js + Tailwind v4)
Location: frontend/

Configure Adobe Embed: Create frontend/.env.local

Ini, TOML

NEXT_PUBLIC_ADOBE_EMBED_CLIENT_ID=<YOUR_ADOBE_CLIENT_ID>
Dev Run
Bash

cd frontend
npm install
npm run dev
# http://localhost:3000
Runtime Environment (Evaluation)
Provide the following API keys and configurations in your environment:

Bash

# API Keys
GOOGLE_API_KEY=<YOUR_GOOGLE_API_KEY>
GEMINI_API_KEY=<YOUR_GEMINI_API_KEY>
AZURE_TTS_KEY=<YOUR_AZURE_TTS_KEY>
AZURE_TTS_REGION=<YOUR_AZURE_TTS_REGION>

# Enable features
LLM_PROVIDER=gemini
TTS_PROVIDER=azure
GEMINI_MODEL=gemini-2.5-flash
Where Features Show Up
Right “Outline” → From backend/process_pdfs.py

Left “Contextual Recommendations” → From backend/persona_analyzer.py
