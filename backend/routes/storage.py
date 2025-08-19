from fastapi import APIRouter, HTTPException
from services.storage_service import list_files_by_type, migrate_existing_files, clear_all_storage, StorageType
from services.semantic_index import get_index, reset_global_index
from typing import Optional

router = APIRouter()


@router.get("/storage/status")
def get_storage_status():
    """Get overview of files in different storage types"""
    try:
        all_files = list_files_by_type()
        
        # Count files by type
        summary = {}
        total_files = 0
        total_size = 0
        
        for storage_type, files in all_files.items():
            file_count = len(files)
            storage_size = sum(f["size"] for f in files)
            total_files += file_count
            total_size += storage_size
            
            summary[storage_type] = {
                "file_count": file_count,
                "total_size_bytes": storage_size,
                "total_size_mb": round(storage_size / (1024 * 1024), 2),
                "files": [
                    {
                        "filename": f["filename"],
                        "doc_id": f["doc_id"],
                        "size_mb": round(f["size"] / (1024 * 1024), 2)
                    } for f in files
                ]
            }
        
        return {
            "summary": summary,
            "total_files": total_files,
            "total_size_mb": round(total_size / (1024 * 1024), 2),
            "storage_directories": {
                "bulk": "store/bulk_uploads",
                "fresh": "store/fresh_uploads", 
                "viewer": "store/viewer_uploads"
            }
        }
    except Exception as e:
        raise HTTPException(500, f"Failed to get storage status: {str(e)}")


@router.get("/storage/files/{storage_type}")
def get_files_by_type(storage_type: str):
    """Get files from a specific storage type"""
    valid_types = ["bulk", "fresh", "viewer"]
    if storage_type not in valid_types:
        raise HTTPException(400, f"Invalid storage_type. Must be one of: {valid_types}")
    
    try:
        files = list_files_by_type(storage_type)  # type: ignore
        return files.get(storage_type, [])
    except Exception as e:
        raise HTTPException(500, f"Failed to get files: {str(e)}")


@router.post("/storage/migrate")
def migrate_files():
    """Migrate existing files from old storage structure to new separated structure"""
    try:
        migrate_existing_files()
        return {"message": "Migration completed successfully"}
    except Exception as e:
        raise HTTPException(500, f"Migration failed: {str(e)}")


@router.get("/storage/health")
def storage_health_check():
    """Check if all storage directories exist and are writable"""
    from services.storage_service import STORAGE_DIRS
    import os
    
    health_status = {}
    all_healthy = True
    
    for storage_type, directory in STORAGE_DIRS.items():
        try:
            # Check if directory exists
            exists = os.path.exists(directory)
            
            # Check if directory is writable (try creating a test file)
            writable = False
            if exists:
                test_file = os.path.join(directory, ".test_write")
                try:
                    with open(test_file, "w") as f:
                        f.write("test")
                    os.remove(test_file)
                    writable = True
                except:
                    writable = False
            
            healthy = exists and writable
            all_healthy = all_healthy and healthy
            
            health_status[storage_type] = {
                "directory": directory,
                "exists": exists,
                "writable": writable,
                "healthy": healthy
            }
            
        except Exception as e:
            health_status[storage_type] = {
                "directory": directory,
                "exists": False,
                "writable": False,
                "healthy": False,
                "error": str(e)
            }
            all_healthy = False
    
    return {
        "healthy": all_healthy,
        "storage_types": health_status
    }


@router.post("/storage/clear")
def clear_all_storage_and_index():
    """Clear all storage directories and reset the semantic index (like refresh functionality)"""
    try:
        # Get current statistics before clearing
        all_files = list_files_by_type()
        total_files_before = sum(len(files) for files in all_files.values())
        
        # Clear all storage directories
        cleared_stats = clear_all_storage()
        
        # Reset the semantic index by clearing cached instance and creating new empty one
        reset_global_index()  # Clear the global cache
        idx = get_index()  # This will create a new empty index
        idx._save()  # Save the empty index to disk
        
        return {
            "message": "All storage cleared and index reset successfully",
            "files_removed": total_files_before,
            "storage_cleared": cleared_stats,
            "index_reset": True
        }
    except Exception as e:
        raise HTTPException(500, f"Failed to clear storage and reset index: {str(e)}")
