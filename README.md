📄 Document Intelligence Platform

A full-stack application that processes PDFs, generates outlines, provides contextual recommendations, and integrates with LLMs and TTS engines.
The project consists of a FastAPI backend and a Next.js (Tailwind v4) frontend, packaged into a single Docker container for easy deployment.

🚀 Features

PDF Outline Extraction – Automatically generate structured headings (Title, H1, H2, H3)

Contextual Recommendations – Personalized insights based on persona and job inputs

Semantic Search – Index and query across PDFs for relevant matches

LLM Integration – Configurable with Gemini (default) or other providers

Text-to-Speech (TTS) – Azure TTS integration for voice output

Single-Container Deployment – Frontend and backend bundled into one Docker image

📂 Project Structure
.
├── backend/      # FastAPI application
├── frontend/     # Next.js + Tailwind v4 application
└── store/        # PDF persistence (runtime)

⚙️ Environment Setup

Before running the project, configure environment variables for both frontend and backend.

1. Frontend

Create frontend/.env.local:

NEXT_PUBLIC_ADOBE_EMBED_CLIENT_ID=your_adobe_client_id

2. Backend

Create backend/.env:

# API Keys
GOOGLE_API_KEY=your_google_api_key
GEMINI_API_KEY=your_gemini_api_key
AZURE_TTS_KEY=your_azure_tts_key
AZURE_TTS_REGION=your_azure_region

# Features
LLM_PROVIDER=gemini
TTS_PROVIDER=azure
GEMINI_MODEL=gemini-2.5-flash


👉 Replace the placeholders (your_*) with your actual credentials.

🐳 Docker Deployment

Clone or download the project.

Open a terminal in the project root.

Build and run the container:

docker build --platform linux/amd64 -t doc-intelligence .
docker run -d --name doc-intelligence-app \
  -e ADOBE_EMBED_API_KEY=your_adobe_client_id \
  -e LLM_PROVIDER=gemini \
  -e GEMINI_MODEL=gemini-2.5-flash \
  -e TTS_PROVIDER=azure \
  -e AZURE_TTS_KEY=your_azure_tts_key \
  -e AZURE_TTS_ENDPOINT=your_azure_tts_endpoint \
  -p 8080:8080 doc-intelligence


Open http://localhost:8080
 in your browser.

🖥️ Development Setup
Backend (FastAPI)
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
# Runs at http://localhost:8000

Frontend (Next.js + Tailwind v4)
cd frontend
npm install
npm run dev
# Runs at http://localhost:3000

📡 API Endpoints
Outline & Files

POST /v1/outline → Upload a PDF or use docId to get structured outline

GET /v1/files/{docId} → Serve persisted PDFs

Persona & Recommendations

POST /v1/persona/analyze → Analyze persona & job input for recommendations

Semantic Search

POST /v1/search/ingest → Index PDFs for semantic search

POST /v1/search/query → Query relevant sections across indexed PDFs

Insights

POST /v1/insights → (Optional) LLM-based insights on selected content

📝 Runtime Notes

PDFs are persisted under backend/store/ using a content-hash as docId.

The frontend is exported statically and served by FastAPI at /.

Current setup is CPU-only and offline; can be extended with external LLM integrations.

📄 Example .env.example

To make sharing safer, you can include example environment files:

frontend/.env.local.example

NEXT_PUBLIC_ADOBE_EMBED_CLIENT_ID=your_adobe_client_id


backend/.env.example

GOOGLE_API_KEY=your_google_api_key
GEMINI_API_KEY=your_gemini_api_key
AZURE_TTS_KEY=your_azure_tts_key
AZURE_TTS_REGION=your_azure_region

LLM_PROVIDER=gemini
TTS_PROVIDER=azure
GEMINI_MODEL=gemini-2.5-flash

📌 Tech Stack

Backend: FastAPI, Uvicorn, Python

Frontend: Next.js, Tailwind v4

AI/ML: Google Gemini, Azure TTS

Deployment: Docker (single container)
