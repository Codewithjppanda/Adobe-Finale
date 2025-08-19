import os
import json
import requests
from typing import List, Dict, Any
from dataclasses import dataclass

@dataclass
class GeminiRecommendation:
    docId: str
    filename: str
    page: int
    title: str
    snippet: str
    relevance_score: float
    reasoning: str

class GeminiService:
    def __init__(self):
        self.api_key = os.environ.get("GEMINI_API_KEY", "AIzaSyCx6vT2usg0NUmn5HWeULfjpId1o-dK2cg")
        if not self.api_key:
            raise ValueError("GEMINI_API_KEY environment variable is required")
        self.base_url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent"
        
    def generate_recommendations(
        self, 
        selected_text: str, 
        available_documents: List[Dict[str, Any]], 
        max_recommendations: int = 5
    ) -> List[GeminiRecommendation]:
        """
        Generate recommendations based on selected text using Gemini API
        """
        try:
            # Prepare context about available documents
            docs_context = []
            for doc in available_documents:
                docs_context.append({
                    "filename": doc.get("filename", "Unknown"),
                    "sections": doc.get("sections", []),
                    "docId": doc.get("docId", "")
                })
            
            # Create prompt for Gemini
            prompt = f"""
            You are an AI assistant helping users find relevant information across their document library.
            
            The user has selected this text from their current document:
            "{selected_text}"
            
            Based on this selection, analyze the following available documents and recommend up to {max_recommendations} most relevant sections.
            
            Available documents:
            {json.dumps(docs_context, indent=2)}
            
            For each recommendation, provide:
            1. The document filename
            2. The most relevant section/page
            3. A 2-4 sentence snippet explaining why it's relevant
            4. A relevance score from 0.0 to 1.0
            
            Return your response as a JSON array with this structure:
            [
                {{
                    "docId": "document_id",
                    "filename": "filename.pdf",
                    "page": 5,
                    "title": "Section Title",
                    "snippet": "2-4 sentence explanation of relevance",
                    "relevance_score": 0.85,
                    "reasoning": "Brief reasoning for the recommendation"
                }}
            ]
            
            Focus on semantic relevance and provide diverse, high-quality recommendations.
            """
            
            # Call Gemini API
            response = requests.post(
                f"{self.base_url}?key={self.api_key}",
                json={
                    "contents": [{
                        "parts": [{
                            "text": prompt
                        }]
                    }],
                    "generationConfig": {
                        "temperature": 0.3,
                        "topK": 40,
                        "topP": 0.95,
                        "maxOutputTokens": 2048,
                    }
                },
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code != 200:
                print(f"Gemini API error: {response.status_code} - {response.text}")
                return self._fallback_recommendations(selected_text, available_documents, max_recommendations)
            
            result = response.json()
            content = result.get("candidates", [{}])[0].get("content", {})
            parts = content.get("parts", [])
            
            if not parts:
                return self._fallback_recommendations(selected_text, available_documents, max_recommendations)
            
            # Extract text response
            response_text = parts[0].get("text", "")
            
            # Try to parse JSON from response
            try:
                # Find JSON array in the response
                start_idx = response_text.find('[')
                end_idx = response_text.rfind(']') + 1
                if start_idx != -1 and end_idx != -1:
                    json_str = response_text[start_idx:end_idx]
                    recommendations_data = json.loads(json_str)
                    
                    recommendations = []
                    for rec_data in recommendations_data[:max_recommendations]:
                        try:
                            rec = GeminiRecommendation(
                                docId=rec_data.get("docId", ""),
                                filename=rec_data.get("filename", ""),
                                page=rec_data.get("page", 1),
                                title=rec_data.get("title", ""),
                                snippet=rec_data.get("snippet", ""),
                                relevance_score=rec_data.get("relevance_score", 0.5),
                                reasoning=rec_data.get("reasoning", "")
                            )
                            recommendations.append(rec)
                        except Exception as e:
                            print(f"Error parsing recommendation: {e}")
                            continue
                    
                    return recommendations
                    
            except json.JSONDecodeError as e:
                print(f"Failed to parse Gemini response as JSON: {e}")
                print(f"Response text: {response_text}")
                
        except Exception as e:
            print(f"Error calling Gemini API: {e}")
        
        # Fallback to basic recommendations
        return self._fallback_recommendations(selected_text, available_documents, max_recommendations)
    
    def _fallback_recommendations(
        self, 
        selected_text: str, 
        available_documents: List[Dict[str, Any]], 
        max_recommendations: int
    ) -> List[GeminiRecommendation]:
        """
        Fallback recommendation system when Gemini API fails
        """
        recommendations = []
        selected_lower = selected_text.lower()
        
        for doc in available_documents[:max_recommendations]:
            sections = doc.get("sections", [])
            if sections:
                # Find section with most keyword overlap
                best_section = max(sections, key=lambda s: self._calculate_overlap(selected_lower, s.get("title", "").lower()))
                
                rec = GeminiRecommendation(
                    docId=doc.get("docId", ""),
                    filename=doc.get("filename", ""),
                    page=best_section.get("page", 1),
                    title=best_section.get("title", "Relevant Section"),
                    snippet=f"Fallback recommendation based on keyword matching with '{selected_text[:50]}...'",
                    relevance_score=0.6,
                    reasoning="Fallback recommendation due to API unavailability"
                )
                recommendations.append(rec)
        
        return recommendations
    
    def _calculate_overlap(self, text1: str, text2: str) -> int:
        """Calculate simple keyword overlap between two texts"""
        words1 = set(text1.split())
        words2 = set(text2.split())
        return len(words1.intersection(words2))

# Global instance
_gemini_service = None

def get_gemini_service() -> GeminiService:
    global _gemini_service
    if _gemini_service is None:
        _gemini_service = GeminiService()
    return _gemini_service
