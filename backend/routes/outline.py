from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Body
from fastapi.responses import FileResponse
from models.outline_models import OutlineResponse
from services.outline_service import save_and_get_docid, get_pdf_path, extract_outline_from_file
from services.storage_service import StorageType
import os
import tempfile


router = APIRouter()


@router.post("/outline", response_model=OutlineResponse)
async def outline(
    file: UploadFile | None = File(default=None),
    docId: str | None = Form(default=None),
    storage_type: str = Form(default="fresh"),  # bulk, fresh, or viewer
):
    if not file and not docId:
        raise HTTPException(400, "Provide either file or docId")

    # Validate storage type
    valid_storage_types = ["bulk", "fresh", "viewer"]
    if storage_type not in valid_storage_types:
        raise HTTPException(400, f"Invalid storage_type. Must be one of: {valid_storage_types}")
    
    storage_type_enum: StorageType = storage_type  # type: ignore

    if file:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
            tmp.write(await file.read())
            tmp_path = tmp.name
        doc_id = save_and_get_docid(tmp_path, file.filename, storage_type_enum)
        path = tmp_path
    else:
        doc_id = docId  # type: ignore
        path = get_pdf_path(doc_id)
        if not os.path.exists(path):
            raise HTTPException(404, "docId not found")

    result = extract_outline_from_file(path)
    return OutlineResponse(
        docId=doc_id, title=result.get("title", ""), outline=result.get("outline", [])
    )


@router.get("/files/{docId}")
def serve_pdf(docId: str):
    path = get_pdf_path(docId)
    if not os.path.exists(path):
        raise HTTPException(404, "PDF not found")
    return FileResponse(path, media_type="application/pdf", filename=f"{docId}.pdf")


@router.delete("/files/{docId}")
def delete_pdf(docId: str):
    path = get_pdf_path(docId)
    if os.path.exists(path):
        try:
            os.remove(path)
        except Exception:
            raise HTTPException(500, "Failed to delete file")
        return {"deleted": [docId]}
    return {"deleted": []}


@router.delete("/files")
def delete_pdfs(docIds: list[str] = Body(..., embed=True)):
    deleted: list[str] = []
    for did in docIds or []:
        path = get_pdf_path(did)
        if os.path.exists(path):
            try:
                os.remove(path)
                deleted.append(did)
            except Exception:
                # best-effort per file
                continue
    return {"deleted": deleted}


@router.post("/files/delete")
def delete_pdfs_post(docIds: list[str] = Body(..., embed=True)):
    # Beacon-friendly deletion (sendBeacon only supports POST)
    return delete_pdfs(docIds)


