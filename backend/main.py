#!/usr/bin/env python3
import os

# Load environment variables from .env file manually
def load_env_file():
    try:
        env_path = os.path.join(os.path.dirname(__file__), '.env')
        if os.path.exists(env_path):
            with open(env_path, 'r') as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith('#') and '=' in line:
                        key, value = line.split('=', 1)
                        os.environ[key.strip()] = value.strip()
    except Exception as e:
        print(f"Warning: Could not load .env file: {e}")

load_env_file()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import PlainTextResponse
from fastapi.responses import Response
from routes.outline import router as outline_router
from routes.persona import router as persona_router
from routes.search import router as search_router
from routes.insights import router as insights_router
from routes.recommendations import router as recommendations_router
from routes.audio import router as audio_router
from routes.storage import router as storage_router
import os
import threading
import time
from pathlib import Path

app = FastAPI(title="Doc Intelligence API", version="1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], allow_credentials=True,
    allow_methods=["*"], allow_headers=["*"],
)

# REMOVED: Server startup clearing - now handled by frontend on page load

@app.get("/health", response_class=PlainTextResponse)
def health():
    return "ok"

@app.get("/config.js", response_class=Response)
def get_config():
    """Serve the Adobe configuration as JavaScript"""
    adobe_key = os.environ.get("ADOBE_EMBED_API_KEY", "")
    config_js = f"""
window.__ADOBE_CLIENT_ID__ = "{adobe_key}";
console.log("Adobe PDF Embed API Key configured");
"""
    return Response(content=config_js, media_type="application/javascript")

app.include_router(outline_router, prefix="/v1", tags=["outline"])
app.include_router(persona_router, prefix="/v1", tags=["persona"])
app.include_router(search_router, prefix="/v1/search", tags=["search"])
app.include_router(insights_router, prefix="/v1", tags=["insights"])
app.include_router(recommendations_router, prefix="/v1/recommendations", tags=["recommendations"])
app.include_router(audio_router, prefix="/v1", tags=["audio"])
app.include_router(storage_router, prefix="/v1", tags=["storage"])

# Frontend is served by nginx proxy, this backend only serves API endpoints


# Background cleanup: ensure store is ephemeral
def _start_store_cleanup_thread() -> None:
    store_dir = Path(os.environ.get("STORE_DIR", os.path.abspath("./store")))
    # Set TTL to 0 (disabled) by default so files only delete when the frontend explicitly requests it
    ttl_seconds = int(os.environ.get("STORE_TTL_SECONDS", "0"))
    sweep_interval = int(os.environ.get("STORE_SWEEP_INTERVAL_SECONDS", "60"))

    # If TTL is disabled, skip starting the background sweeper entirely
    if ttl_seconds <= 0:
        print("Store cleanup sweeper disabled (STORE_TTL_SECONDS <= 0). Files are only deleted via API calls.")
        return

    def sweep() -> None:
        while True:
            try:
                now = time.time()
                if store_dir.is_dir():
                    for p in store_dir.glob("*.pdf"):
                        try:
                            mtime = p.stat().st_mtime
                            if now - mtime > ttl_seconds:
                                print(f"Deleting old file: {p}")
                                p.unlink(missing_ok=True)
                        except Exception as e:
                            print(f"Error deleting {p}: {e}")
                            # best-effort per file
                            pass
            except Exception as e:
                print(f"Store cleanup error: {e}")
                # never crash the sweeper
                pass
            time.sleep(sweep_interval)

    thread = threading.Thread(target=sweep, name="store-cleaner", daemon=True)
    thread.start()
    print(f"Started store cleanup thread with TTL: {ttl_seconds}s, interval: {sweep_interval}s")


# Start the cleanup thread immediately
_start_store_cleanup_thread()


