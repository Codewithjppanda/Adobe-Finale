# Environment Setup Instructions

## Backend Environment Configuration

Create a `.env` file in the `backend/` directory with the following content:

```bash
# LLM Configuration
LLM_PROVIDER=gemini
GEMINI_MODEL=gemini-2.5-flash
GOOGLE_API_KEY=your_gemini_api_key_here

# Text-to-Speech Configuration (Optional)
TTS_PROVIDER=azure
AZURE_TTS_KEY=your_azure_tts_key_here
AZURE_TTS_REGION=eastus
AZURE_TTS_ENDPOINT=https://eastus.tts.speech.microsoft.com/

# Storage Configuration
STORE_DIR=./store
BULK_STORE_DIR=./store/bulk_uploads
FRESH_STORE_DIR=./store/fresh_uploads
VIEWER_STORE_DIR=./store/viewer_uploads

# Store cleanup settings (optional)
STORE_TTL_SECONDS=0
STORE_SWEEP_INTERVAL_SECONDS=60

# Development settings
DEBUG=true
```

## Frontend Environment Configuration

Create a `.env.local` file in the `frontend/` directory with:

```bash
# Adobe PDF Embed API Configuration
NEXT_PUBLIC_ADOBE_EMBED_CLIENT_ID=your_adobe_client_id_here

# API Endpoint Configuration (for development)
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

## API Keys Setup Instructions

### 1. Adobe PDF Embed API (Required)
1. Go to [Adobe Developer Console](https://developer.adobe.com/console)
2. Create a new project or use existing one
3. Add "PDF Embed API" service
4. Copy the Client ID to the frontend `.env.local` file

### 2. Google Gemini API (For AI Insights)
1. Go to [Google AI Studio](https://aistudio.google.com/)
2. Create an API key
3. Add it to the backend `.env` file as `GOOGLE_API_KEY`

### 3. Azure Text-to-Speech (For Audio Features - Optional)
1. Create an Azure Cognitive Services resource
2. Get the subscription key and region
3. Add them to the backend `.env` file

## Storage Directory Structure

The application now uses separate storage directories:

```
store/
├── bulk_uploads/     # Reference documents for cross-referencing
├── fresh_uploads/    # Documents for immediate reading
├── viewer_uploads/   # Documents from the viewer/new page
└── semantic_index/   # Vector embeddings and search index
```

## Testing Storage Setup

After setting up the environment, you can test the storage system:

1. Start the backend: `cd backend && uvicorn main:app --reload --port 8000`
2. Check storage health: `curl http://localhost:8000/v1/storage/health`
3. View storage status: `curl http://localhost:8000/v1/storage/status`
4. Migrate existing files: `curl -X POST http://localhost:8000/v1/storage/migrate`

## Usage

### Bulk Upload
- Use for reference documents that will be indexed for cross-referencing
- Files stored in `store/bulk_uploads/`
- Prefixed with `bulk_` in filename

### Fresh Upload
- Use for immediate reading and processing
- Files stored in `store/fresh_uploads/`
- Prefixed with `fresh_` in filename

### Viewer Upload
- Files from the existing viewer/new page
- Files stored in `store/viewer_uploads/`
- Prefixed with `viewer_` in filename

## Migration

If you have existing files in the old storage structure, run the migration:

```bash
curl -X POST http://localhost:8000/v1/storage/migrate
```

This will move existing files to the `viewer_uploads` directory by default.
