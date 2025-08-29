#!/usr/bin/env python3
"""
Production startup script for Document Intelligence Application
Handles environment variable validation and application startup
"""

import os
import sys
import uvicorn
from pathlib import Path

def validate_environment():
    """Validate required environment variables"""
    required_vars = {
        "ADOBE_EMBED_API_KEY": "Adobe PDF Embed API key is required"
    }
    
    warnings = []
    errors = []
    
    # Check required variables
    for var, message in required_vars.items():
        if not os.environ.get(var):
            errors.append(f"❌ {message} (set {var})")
    
    # Check optional but recommended variables
    llm_provider = os.environ.get("LLM_PROVIDER", "").lower()
    tts_provider = os.environ.get("TTS_PROVIDER", "").lower()
    
    if llm_provider == "gemini":
        if not os.environ.get("GOOGLE_API_KEY"):
            warnings.append("⚠️  Gemini LLM enabled but no credentials found (GOOGLE_API_KEY)")
    elif llm_provider == "ollama":
        warnings.append("ℹ️  Using Ollama for local LLM processing")
    else:
        warnings.append("ℹ️  No LLM provider configured - insights will be disabled")
    
    if tts_provider == "azure":
        if not os.environ.get("AZURE_TTS_KEY") or not os.environ.get("AZURE_TTS_ENDPOINT"):
            warnings.append("⚠️  Azure TTS enabled but missing credentials (AZURE_TTS_KEY, AZURE_TTS_ENDPOINT)")
    elif tts_provider == "gcp":
        if not os.environ.get("GOOGLE_APPLICATION_CREDENTIALS"):
            warnings.append("⚠️  GCP TTS enabled but missing GOOGLE_APPLICATION_CREDENTIALS")
    elif tts_provider == "local":
        warnings.append("ℹ️  Using local TTS implementation")
    else:
        warnings.append("ℹ️  No TTS provider configured - audio features will be disabled")
    
    # Print validation results
    if errors:
        print("🚨 Configuration Errors:")
        for error in errors:
            print(f"   {error}")
        print()
        return False
    
    if warnings:
        print("⚠️  Configuration Warnings:")
        for warning in warnings:
            print(f"   {warning}")
        print()
    
    print("✅ Environment validation passed")
    return True

def setup_directories():
    """Create necessary directories"""
    store_dir = Path(os.environ.get("STORE_DIR", "./store"))
    directories = [
        store_dir / "bulk_uploads",
        store_dir / "fresh_uploads", 
        store_dir / "viewer_uploads",
        store_dir / "semantic_index"
    ]
    
    for dir_path in directories:
        dir_path.mkdir(parents=True, exist_ok=True)
        print(f"📁 Created directory: {dir_path}")

def main():
    """Main startup function"""
    print("🚀 Starting Document Intelligence Application...")
    print(f"📍 Working directory: {os.getcwd()}")
    print(f"🐍 Python version: {sys.version}")
    print()
    
    # Validate environment
    if not validate_environment():
        print("❌ Environment validation failed. Exiting.")
        sys.exit(1)
    
    # Setup directories
    setup_directories()
    
    # For Docker multi-service setup: Always use port 8000 for backend
    # Nginx will proxy from port 10000 (Render's PORT) to this backend port
    port = int(os.environ.get("BACKEND_PORT", "8000"))
    
    # Print configuration summary
    print("📋 Configuration Summary:")
    print(f"   Host: 0.0.0.0")
    print(f"   Port: {port}")
    print(f"   LLM Provider: {os.environ.get('LLM_PROVIDER', 'none')}")
    print(f"   TTS Provider: {os.environ.get('TTS_PROVIDER', 'none')}")
    print(f"   Store Directory: {os.environ.get('STORE_DIR', './store')}")
    print()
    
    # Start the FastAPI application
    print("🌟 Starting FastAPI server...")
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        workers=1,
        log_level="info",
        access_log=True
    )

if __name__ == "__main__":
    main()
