#!/usr/bin/env python3
import json
import os
import sys
from pathlib import Path
from datetime import datetime
from persona_analyzer import FontBasedGenericAnalyzer


def load_json(path: Path):
    """Load JSON file with error handling"""
    try:
        with path.open(encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        sys.exit(f"[ERROR] cannot read {path}: {e}")


def save_json(obj, path: Path):
    """Save JSON file with error handling"""
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as f:
        json.dump(obj, f, indent=2, ensure_ascii=False)


def main():
    # Define paths
    input_dir = Path("/app/input")
    output_dir = Path("/app/output")
    
    # Load configuration
    config_path = input_dir / "challenge1b_input.json"
    if not config_path.exists():
        sys.exit(f"[ERROR] {config_path} not found")
    
    config = load_json(config_path)
    
    # Extract configuration
    persona = config.get("persona", "")
    job_to_be_done = config.get("job_to_be_done", "")
    document_files = config.get("documents", [])
    
    # Resolve document paths
    pdf_dir = input_dir / "PDFs"
    doc_paths = []
    
    for filename in document_files:
        pdf_path = pdf_dir / filename
        if pdf_path.exists():
            doc_paths.append(str(pdf_path))
        else:
            print(f"[WARN] File not found: {filename}")
    
    if not doc_paths:
        sys.exit("[ERROR] No valid PDFs to process")
    
    print(f"[INFO] Processing {len(doc_paths)} documents")
    print(f"[INFO] Persona: {persona}")
    print(f"[INFO] Job: {job_to_be_done}")
    
    try:
        # Use your existing FontBasedGenericAnalyzer
        analyzer = FontBasedGenericAnalyzer()
        result = analyzer.analyze_documents(doc_paths, persona, job_to_be_done)
        
        # Save output
        output_path = output_dir / "challenge1b_output.json"
        save_json(result, output_path)
        
        print(f"[SUCCESS] Analysis complete! Output saved to {output_path}")
        print(f"[INFO] Found {len(result.get('extracted_sections', []))} relevant sections")
        
    except Exception as e:
        print(f"[ERROR] Analysis failed: {e}")
        
        # Generate error output
        error_result = {
            "metadata": {
                "input_documents": [os.path.basename(path) for path in doc_paths],
                "persona": persona,
                "job_to_be_done": job_to_be_done,
                "processing_timestamp": datetime.now().isoformat(),
                "error": str(e)
            },
            "extracted_sections": [],
            "subsection_analysis": []
        }
        
        output_path = output_dir / "challenge1b_output.json"
        save_json(error_result, output_path)


if __name__ == "__main__":
    main()

"""
Optional helper for local testing of the analyzer and outline extractor.

Usage:
    python process_challenge1b.py /path/to/file.pdf "Persona" "Job to be done"
"""
from __future__ import annotations

import sys
from persona_analyzer import FontBasedGenericAnalyzer
from process_pdfs import OutlineExtractor


def main() -> None:
    if len(sys.argv) < 4:
        print("Usage: python process_challenge1b.py <pdf_path> <persona> <job_to_be_done>")
        sys.exit(1)
    pdf_path, persona, job = sys.argv[1:4]

    outline = OutlineExtractor().extract_outline(pdf_path)
    print("Outline sample:", outline.get("outline", [])[:5])

    result = FontBasedGenericAnalyzer().analyze_documents([pdf_path], persona, job)
    print("Top hits:")
    for sec in result.get("extracted_sections", [])[:5]:
        print(" -", sec)


if __name__ == "__main__":
    main()


