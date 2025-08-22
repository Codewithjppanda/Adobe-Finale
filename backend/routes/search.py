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
    print(f"🔄 INGEST: Starting ingestion process...")
    print(f"   Files: {len(files) if files else 0}")
    print(f"   DocIds: {docIds}")
    print(f"   Storage type: {storage_type}")
    
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
            print(f"   📄 Prepared file: {f.filename} -> {doc_id} at {path}")
    
    if docIds:
        for did in docIds:
            path = get_pdf_path(did, storage_type_enum)
            print(f"   🔍 Checking docId {did} -> path: {path}")
            print(f"   📁 File exists: {os.path.exists(path)}")
            if not os.path.exists(path):
                # Try searching in all storage types
                print(f"   🔍 File not found in {storage_type}, searching all storage types...")
                path_found = False
                for alt_storage in ["bulk", "fresh", "viewer"]:
                    alt_path = get_pdf_path(did, alt_storage)
                    print(f"      Checking {alt_storage}: {alt_path} -> exists: {os.path.exists(alt_path)}")
                    if os.path.exists(alt_path):
                        path = alt_path
                        path_found = True
                        print(f"   ✅ Found file in {alt_storage} storage: {path}")
                        break
                
                if not path_found:
                    print(f"   ❌ File not found in any storage type for docId: {did}")
                    raise HTTPException(404, f"docId not found in any storage: {did}")
            
            items.append((did, path))
            print(f"   📄 Prepared docId: {did} at {path}")
    
    if not items:
        print("   ❌ No items to ingest")
        raise HTTPException(400, "No inputs (files or docIds)")
    
    print(f"🚀 INGEST: Processing {len(items)} items...")
    for i, (doc_id, path) in enumerate(items):
        print(f"   {i+1}. {doc_id}: {path}")
    
    idx = get_index()
    print(f"📊 INGEST: Current index state: {len(idx.sections)} sections")
    
    result = idx.ingest_documents(items)
    print(f"✅ INGEST: Completed - {result}")
    
    return result


@router.post("/query")
async def query(
    text: str = Form(...),
    k: int = Form(default=5),
):
    # Ensure k is exactly 5 for consistent results
    if k != 5:
        k = 5
    
    print(f"🔍 QUERY: Searching for '{text[:50]}...' (k={k})")
    
    idx = get_index()
    print(f"📊 QUERY: Index has {len(idx.sections)} sections available")
    
    matches = idx.query(text, k=k)
    print(f"✅ QUERY: Found {len(matches)} matches")
    
    return {"matches": matches}


@router.post("/force-reingest")
async def force_reingest():
    """Force reingest all PDFs in storage"""
    try:
        print("🚨 FORCE REINGEST: Starting complete reingestion...")
        
        from services.storage_service import list_files_by_type
        
        # Get all files from storage
        all_files = list_files_by_type()
        total_files = sum(len(files) for files in all_files.values())
        print(f"📊 FORCE REINGEST: Found {total_files} files to ingest")
        
        items = []
        for storage_type, files in all_files.items():
            for file_info in files:
                doc_id = file_info["doc_id"]
                path = file_info["path"]
                items.append((doc_id, path))
                print(f"   📄 Will ingest: {file_info['filename']} -> {doc_id}")
        
        if not items:
            return {"message": "No files found to ingest", "ingested": 0}
        
        # Force ingest all files
        idx = get_index()
        print(f"📊 FORCE REINGEST: Current index has {len(idx.sections)} sections")
        
        result = idx.ingest_documents(items)
        print(f"✅ FORCE REINGEST: Completed - {result}")
        
        return {
            "message": f"Force reingested {len(items)} files",
            "files_processed": len(items),
            **result
        }
        
    except Exception as e:
        print(f"❌ FORCE REINGEST: Failed - {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(500, f"Force reingest failed: {str(e)}")


