from fastapi import APIRouter, HTTPException
from services.storage_service import list_files_by_type, migrate_existing_files, clear_all_storage, StorageType
from services.semantic_index import get_index, reset_global_index, reset_and_clear_index
from typing import Optional
import os  # CRITICAL FIX: Missing import
import shutil  # CRITICAL FIX: Missing import

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
    """NUCLEAR: Complete system wipe - clear everything"""
    try:
        print("🧨 NUCLEAR CLEAR: Starting complete system wipe...")
        
        # Step 1: Get current state
        all_files = list_files_by_type()
        total_files_before = sum(len(files) for files in all_files.values())
        print(f"📊 NUCLEAR: Found {total_files_before} files to destroy")
        
        # Step 2: Nuclear clear of semantic index files
        print("💥 NUCLEAR: Destroying semantic index files...")
        from services.semantic_index import clear_semantic_index_files, INDEX_DIR
        
        # Remove entire semantic index directory
        if os.path.exists(INDEX_DIR):
            shutil.rmtree(INDEX_DIR)
            print(f"💥 NUCLEAR: Destroyed entire index directory: {INDEX_DIR}")
        
        # Recreate empty directory
        os.makedirs(INDEX_DIR, exist_ok=True)
        print(f"🆕 NUCLEAR: Recreated empty index directory")
        
        # Step 3: Nuclear clear of PDF storage
        print("💥 NUCLEAR: Destroying PDF storage...")
        from services.storage_service import STORAGE_DIRS
        
        total_destroyed = 0
        for storage_type, directory in STORAGE_DIRS.items():
            if os.path.exists(directory):
                file_count = len([f for f in os.listdir(directory) if f.endswith('.pdf')])
                shutil.rmtree(directory)
                os.makedirs(directory, exist_ok=True)
                total_destroyed += file_count
                print(f"💥 NUCLEAR: Destroyed {storage_type} storage - {file_count} files")
        
        # Step 4: Reset global index cache
        print("🧠 NUCLEAR: Destroying global index cache...")
        from services.semantic_index import reset_global_index
        reset_global_index()
        
        # Step 5: Create completely new empty index
        print("🆕 NUCLEAR: Creating virgin index...")
        from services.semantic_index import get_index
        idx = get_index()  # This will be completely empty now
        idx._save()  # Save empty state
        
        print(f"🎉 NUCLEAR CLEAR COMPLETED: {total_destroyed} files obliterated")
        
        # Step 6: Verify complete destruction
        verification = list_files_by_type()
        remaining_files = sum(len(files) for files in verification.values())
        remaining_sections = len(idx.sections)
        
        if remaining_files > 0 or remaining_sections > 0:
            print(f"🚨 NUCLEAR WARNING: {remaining_files} files and {remaining_sections} sections still exist!")
        else:
            print("✅ NUCLEAR SUCCESS: Complete obliteration verified")
        
        return {
            "message": "NUCLEAR: Complete system obliteration successful",
            "files_removed": total_destroyed,  # Use files_removed for consistency
            "verification": {
                "remaining_files": remaining_files,
                "remaining_sections": remaining_sections
            },
            "nuclear_clear": True,
            "obliteration_complete": remaining_files == 0 and remaining_sections == 0
        }
        
    except Exception as e:
        print(f"🚨 NUCLEAR CLEAR FAILED: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(500, f"NUCLEAR: Failed to obliterate system: {str(e)}")


@router.get("/storage/debug")
def debug_storage_state():
    """Debug endpoint to check current storage and index state"""
    try:
        # Check file storage
        all_files = list_files_by_type()
        total_files = sum(len(files) for files in all_files.values())
        
        # Check semantic index
        idx = get_index()
        index_sections = len(idx.sections)
        
        # Check if index files exist on disk
        from services.semantic_index import INDEX_DIR
        index_meta_path = os.path.join(INDEX_DIR, "index.json")
        index_vec_path = os.path.join(INDEX_DIR, "vectors.npy")
        
        # Get sample sections for debugging
        sample_sections = []
        for s in idx.sections[:10]:  # Show first 10 sections
            sample_sections.append({
                "section_id": s.section_id,
                "doc_id": s.doc_id,
                "filename": s.filename,
                "title": s.title[:50],
                "pdf_name": getattr(s, 'pdf_name', 'Unknown'),
                "content_preview": s.text[:100] + "..." if s.text else "No content"
            })
        
        return {
            "total_pdf_files": total_files,
            "storage_breakdown": all_files,
            "semantic_index_sections": index_sections,
            "index_files_on_disk": {
                "meta_exists": os.path.exists(index_meta_path),
                "vectors_exists": os.path.exists(index_vec_path),
                "meta_path": index_meta_path,
                "vectors_path": index_vec_path
            },
            "sample_sections": sample_sections,
            "vector_shape": str(idx.vectors.shape) if idx.vectors.size > 0 else "Empty"
        }
    except Exception as e:
        print(f"❌ Debug endpoint error: {e}")
        import traceback
        traceback.print_exc()
        return {"error": str(e)}
