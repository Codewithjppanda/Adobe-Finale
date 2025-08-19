import hashlib
import os
import shutil
from typing import Literal, Optional
from pathlib import Path

# Storage type definitions
StorageType = Literal["bulk", "fresh", "viewer"]

# Base storage directory
STORE_BASE = os.environ.get("STORE_DIR", os.path.abspath("./store"))

# Separate directories for different upload types
STORAGE_DIRS = {
    "bulk": os.environ.get("BULK_STORE_DIR", os.path.join(STORE_BASE, "bulk_uploads")),
    "fresh": os.environ.get("FRESH_STORE_DIR", os.path.join(STORE_BASE, "fresh_uploads")),
    "viewer": os.environ.get("VIEWER_STORE_DIR", os.path.join(STORE_BASE, "viewer_uploads")),
}

# Ensure all directories exist
for storage_type, directory in STORAGE_DIRS.items():
    os.makedirs(directory, exist_ok=True)

# Also ensure base store directory exists for semantic index
os.makedirs(STORE_BASE, exist_ok=True)


def _sha1(path: str) -> str:
    """Generate SHA1 hash for file"""
    h = hashlib.sha1()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1_048_576), b""):
            h.update(chunk)
    return h.hexdigest()[:16]


def save_and_get_docid(
    temp_path: str, 
    original_filename: str | None = None, 
    storage_type: StorageType = "fresh"
) -> str:
    """
    Save a PDF file and return its document ID.
    
    Args:
        temp_path: Path to temporary file
        original_filename: Original filename 
        storage_type: Type of storage (bulk, fresh, or viewer)
    """
    doc_id = _sha1(temp_path)
    storage_dir = STORAGE_DIRS[storage_type]
    
    # Use original filename if provided, otherwise use hash
    if original_filename:
        # Clean the filename to be filesystem-safe
        safe_filename = "".join(c for c in original_filename if c.isalnum() or c in (' ', '-', '_', '.')).rstrip()
        safe_filename = safe_filename.replace(' ', '_')
        
        # If filename already exists, append hash to make it unique
        base_name = os.path.splitext(safe_filename)[0]
        extension = os.path.splitext(safe_filename)[1]
        
        # Include storage type in filename for identification
        dest = os.path.join(storage_dir, f"{storage_type}_{base_name}_{doc_id}{extension}")
        
        # Ensure the filename is unique
        counter = 1
        while os.path.exists(dest):
            dest = os.path.join(storage_dir, f"{storage_type}_{base_name}_{doc_id}_{counter}{extension}")
            counter += 1
    else:
        dest = os.path.join(storage_dir, f"{storage_type}_{doc_id}.pdf")
    
    if not os.path.exists(dest):
        shutil.copyfile(temp_path, dest)
    
    return doc_id


def get_pdf_path(doc_id: str, storage_type: Optional[StorageType] = None) -> str:
    """
    Get the path to a PDF file by document ID.
    
    Args:
        doc_id: Document ID
        storage_type: Optional storage type hint. If not provided, searches all directories.
    """
    # If storage type is specified, search only in that directory
    if storage_type:
        storage_dir = STORAGE_DIRS[storage_type]
        for filename in os.listdir(storage_dir):
            if filename.endswith(".pdf") and doc_id in filename:
                return os.path.join(storage_dir, filename)
    else:
        # Search all storage directories
        for stype, storage_dir in STORAGE_DIRS.items():
            if os.path.exists(storage_dir):
                for filename in os.listdir(storage_dir):
                    if filename.endswith(".pdf") and doc_id in filename:
                        return os.path.join(storage_dir, filename)
    
    # Fallback to old storage pattern in base directory
    fallback_path = os.path.join(STORE_BASE, f"{doc_id}.pdf")
    if os.path.exists(fallback_path):
        return fallback_path
    
    # Return expected path even if file doesn't exist (for error handling)
    if storage_type:
        return os.path.join(STORAGE_DIRS[storage_type], f"{storage_type}_{doc_id}.pdf")
    else:
        return os.path.join(STORAGE_DIRS["fresh"], f"fresh_{doc_id}.pdf")


def get_storage_type_from_path(file_path: str) -> StorageType:
    """Determine storage type from file path"""
    filename = os.path.basename(file_path)
    if filename.startswith("bulk_"):
        return "bulk"
    elif filename.startswith("viewer_"):
        return "viewer"
    else:
        return "fresh"  # Default


def list_files_by_type(storage_type: Optional[StorageType] = None) -> dict:
    """
    List all PDF files, optionally filtered by storage type.
    
    Returns:
        Dictionary with storage types as keys and lists of file info as values
    """
    results = {}
    
    storage_types_to_check = [storage_type] if storage_type else list(STORAGE_DIRS.keys())
    
    for stype in storage_types_to_check:
        storage_dir = STORAGE_DIRS[stype]
        files = []
        
        if os.path.exists(storage_dir):
            for filename in os.listdir(storage_dir):
                if filename.endswith(".pdf"):
                    file_path = os.path.join(storage_dir, filename)
                    # Extract doc_id from filename
                    parts = filename.replace(".pdf", "").split("_")
                    if len(parts) >= 2:
                        doc_id = parts[-1] if len(parts) == 2 else "_".join(parts[-2:])
                        files.append({
                            "filename": filename,
                            "doc_id": doc_id,
                            "path": file_path,
                            "storage_type": stype,
                            "size": os.path.getsize(file_path),
                            "modified": os.path.getmtime(file_path)
                        })
        
        results[stype] = files
    
    return results


def delete_file_by_docid(doc_id: str, storage_type: Optional[StorageType] = None) -> bool:
    """
    Delete a file by document ID.
    
    Args:
        doc_id: Document ID
        storage_type: Optional storage type hint
    
    Returns:
        True if file was deleted, False otherwise
    """
    file_path = get_pdf_path(doc_id, storage_type)
    if os.path.exists(file_path):
        try:
            os.remove(file_path)
            return True
        except Exception:
            pass
    return False


def migrate_existing_files():
    """
    Migrate existing files from the old storage structure to the new separated structure.
    This should be called once during deployment.
    """
    old_store_files = []
    
    # Find files in the old store directory that aren't in subdirectories
    if os.path.exists(STORE_BASE):
        for item in os.listdir(STORE_BASE):
            item_path = os.path.join(STORE_BASE, item)
            if os.path.isfile(item_path) and item.endswith(".pdf"):
                old_store_files.append(item_path)
    
    print(f"Found {len(old_store_files)} files to migrate")
    
    # Move files to viewer directory by default (assuming they're from the old viewer)
    migrated_count = 0
    for file_path in old_store_files:
        try:
            filename = os.path.basename(file_path)
            new_path = os.path.join(STORAGE_DIRS["viewer"], f"viewer_{filename}")
            
            # Only move if destination doesn't exist
            if not os.path.exists(new_path):
                shutil.move(file_path, new_path)
                migrated_count += 1
                print(f"Migrated: {filename} -> viewer storage")
        except Exception as e:
            print(f"Failed to migrate {filename}: {e}")
    
    print(f"Successfully migrated {migrated_count} files")


# Backward compatibility aliases
def save_and_get_docid_legacy(temp_path: str, original_filename: str | None = None) -> str:
    """Legacy function for backward compatibility - defaults to fresh storage"""
    return save_and_get_docid(temp_path, original_filename, "fresh")


def get_pdf_path_legacy(doc_id: str) -> str:
    """Legacy function for backward compatibility - searches all storage types"""
    return get_pdf_path(doc_id)


def clear_all_storage():
    """
    Clear all PDF files from all storage directories.
    This is used for the refresh functionality to reset the system.
    
    Returns:
        Dictionary with clearing statistics for each storage type
    """
    cleared_stats = {}
    total_removed = 0
    
    for storage_type, directory in STORAGE_DIRS.items():
        if not os.path.exists(directory):
            cleared_stats[storage_type] = {"files_removed": 0, "error": "Directory does not exist"}
            continue
        
        files_removed = 0
        errors = []
        
        try:
            for filename in os.listdir(directory):
                if filename.endswith('.pdf'):
                    file_path = os.path.join(directory, filename)
                    try:
                        os.remove(file_path)
                        files_removed += 1
                        total_removed += 1
                        print(f"Removed {filename} from {storage_type} storage")
                    except Exception as e:
                        error_msg = f"Failed to remove {filename}: {e}"
                        print(error_msg)
                        errors.append(error_msg)
            
            cleared_stats[storage_type] = {
                "files_removed": files_removed,
                "errors": errors if errors else None
            }
            
        except Exception as e:
            cleared_stats[storage_type] = {
                "files_removed": 0, 
                "error": f"Failed to access directory: {str(e)}"
            }
    
    print(f"Total files removed across all storage types: {total_removed}")
    return cleared_stats

