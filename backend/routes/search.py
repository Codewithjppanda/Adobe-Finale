from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from typing import List, Optional, Union
import os
import tempfile

from services.outline_service import save_and_get_docid, get_pdf_path
from services.storage_service import StorageType
from services.semantic_index import get_index


router = APIRouter()


@router.post("/ingest")
async def ingest(
    files: Optional[List[UploadFile]] = File(default=None),
    docIds: Optional[List[str]] = Form(default=None),
    storage_type: str = Form(default="fresh"),  # bulk, fresh, or viewer
):
    # Validate storage type
    valid_storage_types = ["bulk", "fresh", "viewer"]
    if storage_type not in valid_storage_types:
        raise HTTPException(400, f"Invalid storage_type. Must be one of: {valid_storage_types}")
    
    storage_type_enum: StorageType = storage_type  # type: ignore
    
    items = []
    if files:
        for f in files:
            with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
                tmp.write(await f.read())
                tmp_path = tmp.name
            doc_id = save_and_get_docid(tmp_path, f.filename, storage_type_enum)
            path = get_pdf_path(doc_id, storage_type_enum)
            items.append((doc_id, path))
    if docIds:
        for did in docIds:
            path = get_pdf_path(did)
            if not os.path.exists(path):
                raise HTTPException(404, f"docId not found: {did}")
            items.append((did, path))
    if not items:
        raise HTTPException(400, "No inputs (files or docIds)")
    idx = get_index()
    result = idx.ingest_documents(items)
    return result


@router.post("/query")
async def query(
    text: str = Form(...),
    k: int = Form(default=5),
):
    idx = get_index()
    matches = idx.query(text, k=k)
    return {"matches": matches}


