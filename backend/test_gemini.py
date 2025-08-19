#!/usr/bin/env python3
"""
Test script for Gemini service
"""

import asyncio
from services.gemini_service import get_gemini_service

async def test_gemini():
    """Test the Gemini service with sample data"""
    
    # Sample available documents
    available_docs = [
        {
            "docId": "doc1",
            "filename": "South_of_France_-_Cities.pdf",
            "sections": [
                {
                    "title": "Nice - The Capital of the French Riviera",
                    "page": 5,
                    "text": "Nice is the largest city on the French Riviera and serves as the capital of the Alpes-Maritimes department. Known for its stunning Promenade des Anglais, beautiful beaches, and vibrant Old Town, Nice offers visitors a perfect blend of Mediterranean charm and French sophistication.",
                    "snippet": "Nice is the largest city on the French Riviera and serves as the capital of the Alpes-Maritimes department."
                },
                {
                    "title": "Cannes - Film Festival and Luxury",
                    "page": 12,
                    "text": "Cannes is world-famous for its annual film festival, but this glamorous city offers much more than just cinema. With its luxury hotels, designer boutiques, and beautiful beaches, Cannes epitomizes the sophisticated lifestyle of the French Riviera.",
                    "snippet": "Cannes is world-famous for its annual film festival, but this glamorous city offers much more than just cinema."
                }
            ]
        },
        {
            "docId": "doc2", 
            "filename": "South_of_France_-_Cuisine.pdf",
            "sections": [
                {
                    "title": "Provençal Cuisine",
                    "page": 3,
                    "text": "Provençal cuisine is characterized by its use of fresh herbs, olive oil, and Mediterranean ingredients. Dishes like ratatouille, bouillabaisse, and tapenade showcase the region's rich culinary heritage and connection to the Mediterranean Sea.",
                    "snippet": "Provençal cuisine is characterized by its use of fresh herbs, olive oil, and Mediterranean ingredients."
                }
            ]
        }
    ]
    
    # Test text selection
    selected_text = "I'm interested in visiting cities on the French Riviera with good restaurants and cultural attractions"
    
    print("Testing Gemini service...")
    print(f"Selected text: {selected_text}")
    print(f"Available documents: {len(available_docs)}")
    
    try:
        gemini_service = get_gemini_service()
        recommendations = gemini_service.generate_recommendations(
            selected_text=selected_text,
            available_documents=available_docs,
            max_recommendations=3
        )
        
        print(f"\nGenerated {len(recommendations)} recommendations:")
        for i, rec in enumerate(recommendations, 1):
            print(f"\n{i}. {rec.title}")
            print(f"   Document: {rec.filename}")
            print(f"   Page: {rec.page}")
            print(f"   Snippet: {rec.snippet}")
            print(f"   Relevance: {rec.relevance_score:.2f}")
            print(f"   Reasoning: {rec.reasoning}")
            
    except Exception as e:
        print(f"Error testing Gemini service: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_gemini())
