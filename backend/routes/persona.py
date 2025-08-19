from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from typing import List
import os
import tempfile
from services.outline_service import save_and_get_docid, get_pdf_path
from services.persona_service import analyze_persona
from models.persona_models import PersonaAnalyzeResponse


router = APIRouter()


@router.post("/persona/analyze", response_model=PersonaAnalyzeResponse)
async def persona_analyze(
    persona: str = Form(...),
    jobToBeDone: str = Form(...),
    files: List[UploadFile] | None = File(default=None),
    docIds: List[str] | None = Form(default=None),
):
    paths: List[str] = []

    if files:
        for f in files:
            with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
                tmp.write(await f.read())
                tmp_path = tmp.name
            # Persist to store and use the stored path for analysis so filenames match docIds
            doc_id = save_and_get_docid(tmp_path, f.filename)
            stored_path = get_pdf_path(doc_id)
            paths.append(stored_path)

    if docIds:
        for did in docIds:
            p = get_pdf_path(did)
            if not os.path.exists(p):
                raise HTTPException(404, f"docId not found: {did}")
            paths.append(p)

    if not paths:
        raise HTTPException(400, "No inputs (files or docIds)")
    result = analyze_persona(persona, jobToBeDone, paths)
    return PersonaAnalyzeResponse(**result)


