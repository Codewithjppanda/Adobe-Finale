# Docker Deployment Guide

This guide explains how to build and run the Document Intelligence application using Docker, following Adobe's requirements.

## Quick Start

### 1. Build the Docker Image

```bash
docker build --platform linux/amd64 -t doc-intelligence .
```

### 2. Run with External Services (Gemini + Azure TTS)

```bash
docker run \
  -v /path/to/credentials:/credentials \
  -e ADOBE_EMBED_API_KEY=<YOUR_ADOBE_KEY> \
  -e LLM_PROVIDER=gemini \
  -e GOOGLE_APPLICATION_CREDENTIALS=/credentials/adbe-gcp.json \
  -e GEMINI_MODEL=gemini-2.5-flash \
  -e TTS_PROVIDER=azure \
  -e AZURE_TTS_KEY=<YOUR_AZURE_KEY> \
  -e AZURE_TTS_ENDPOINT=<YOUR_AZURE_ENDPOINT> \
  -p 8080:8080 \
  doc-intelligence
```

### 3. Run with Local Services (Ollama + Local TTS)

```bash
docker run \
  -e ADOBE_EMBED_API_KEY=<YOUR_ADOBE_KEY> \
  -e LLM_PROVIDER=ollama \
  -e OLLAMA_MODEL=llama3 \
  -e TTS_PROVIDER=local \
  -p 8080:8080 \
  doc-intelligence
```

## Environment Variables

### Required
- `ADOBE_EMBED_API_KEY`: Your Adobe PDF Embed API key

### LLM Configuration
- `LLM_PROVIDER`: `gemini`, `ollama`, or leave empty to disable
- `GEMINI_MODEL`: Model name (default: `gemini-2.5-flash`)
- `GOOGLE_APPLICATION_CREDENTIALS`: Path to GCP service account JSON
- `OLLAMA_MODEL`: Ollama model name (default: `llama3`)

### TTS Configuration  
- `TTS_PROVIDER`: `azure`, `gcp`, `local`, or leave empty to disable
- `AZURE_TTS_KEY`: Azure Cognitive Services Speech key
- `AZURE_TTS_ENDPOINT`: Azure Speech service endpoint

### Optional
- `HOST`: Server host (default: `0.0.0.0`)
- `PORT`: Server port (default: `8080`)
- `STORE_DIR`: Storage directory (default: `./store`)
- `STORE_TTL_SECONDS`: File cleanup TTL (default: `0` - disabled)

## Application Architecture

The Docker container includes:
- **Frontend**: Next.js application (static export)
- **Backend**: FastAPI server serving both API and static files
- **Storage**: Local file system for PDFs and semantic index
- **Services**: PDF processing, semantic search, LLM insights, TTS audio

## Accessing the Application

Once running, access the application at:
```
http://localhost:8080
```

## Features Available

1. **PDF Upload & Processing**: Bulk and individual upload
2. **Semantic Search**: Cross-document text matching  
3. **AI Insights**: LLM-powered document analysis
4. **Audio Generation**: Text-to-speech podcast creation
5. **Document Viewer**: Adobe PDF Embed integration

## Troubleshooting

### Build Issues
- Ensure Docker has sufficient memory (4GB+ recommended)
- Check that all source files are present

### Runtime Issues
- Check environment variables are set correctly
- Verify Adobe API key is valid
- Check logs: `docker logs <container_id>`

### Performance
- For better performance, mount a volume for storage:
  ```bash
  -v /host/storage:/app/backend/store
  ```

## Development vs Production

This Dockerfile is optimized for production deployment with:
- Multi-stage build for smaller image size
- Static frontend export for better performance
- Proper environment variable handling
- Health checks and monitoring
- Security best practices
