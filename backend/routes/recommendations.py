from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import json

from services.gemini_service import get_gemini_service, GeminiRecommendation
from services.semantic_index import get_index

router = APIRouter()

class TextSelectionRequest(BaseModel):
    selected_text: str
    current_doc_id: str
    max_recommendations: int = 5

class RecommendationResponse(BaseModel):
    recommendations: List[dict]
    selected_text: str
    total_found: int

@router.post("/text-selection", response_model=RecommendationResponse)
async def get_text_selection_recommendations(request: TextSelectionRequest):
    """
    Get recommendations based on text selection in a PDF
    """
    try:
        if not request.selected_text.strip():
            raise HTTPException(status_code=400, detail="Selected text cannot be empty")
        
        # Get semantic index to find available documents and sections
        index = get_index()
        
        # Get all available documents and their sections
        available_docs = []
        for section in index.sections:
            # Find or create document entry
            doc_found = False
            for doc in available_docs:
                if doc["docId"] == section.doc_id:
                    doc["sections"].append({
                        "title": section.title,
                        "page": section.page,
                        "text": section.text,
                        "snippet": section.snippet
                    })
                    doc_found = True
                    break
            
            if not doc_found:
                available_docs.append({
                    "docId": section.doc_id,
                    "filename": section.filename,
                    "sections": [{
                        "title": section.title,
                        "page": section.page,
                        "text": section.text,
                        "snippet": section.snippet
                    }]
                })
        
        # Use Gemini service to generate intelligent recommendations
        gemini_service = get_gemini_service()
        recommendations = gemini_service.generate_recommendations(
            selected_text=request.selected_text,
            available_documents=available_docs,
            max_recommendations=request.max_recommendations
        )
        
        # Convert to response format
        recommendations_data = []
        for rec in recommendations:
            recommendations_data.append({
                "docId": rec.docId,
                "filename": rec.filename,
                "page": rec.page,
                "title": rec.title,
                "snippet": rec.snippet,
                "relevance_score": rec.relevance_score,
                "reasoning": rec.reasoning
            })
        
        return RecommendationResponse(
            recommendations=recommendations_data,
            selected_text=request.selected_text,
            total_found=len(recommendations_data)
        )
        
    except Exception as e:
        print(f"Error generating recommendations: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate recommendations: {str(e)}")

@router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "recommendations"}
