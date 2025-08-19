from process_pdfs import OutlineExtractor
from typing import List, Optional
from .storage_service import (
    save_and_get_docid as storage_save_and_get_docid,
    get_pdf_path as storage_get_pdf_path,
    delete_file_by_docid,
    StorageType
)


# Backward compatibility functions that use the new storage service
def save_and_get_docid(
    temp_path: str, 
    original_filename: str | None = None, 
    storage_type: StorageType = "fresh"
) -> str:
    """Save file using the new storage service with type specification"""
    return storage_save_and_get_docid(temp_path, original_filename, storage_type)


def get_pdf_path(doc_id: str, storage_type: Optional[StorageType] = None) -> str:
    """Get PDF path using the new storage service"""
    return storage_get_pdf_path(doc_id, storage_type)


def extract_outline_from_file(path: str) -> dict:
    extractor = OutlineExtractor()
    return extractor.extract_outline(path)


def delete_docs_by_ids(doc_ids: List[str]) -> dict:
    """Delete documents using the new storage service"""
    removed: List[str] = []
    for did in doc_ids:
        # Try to delete from all storage types
        deleted = delete_file_by_docid(did)
        if deleted:
            removed.append(did)
    return {"removed": removed}


