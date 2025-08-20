from fastapi import APIRouter, HTTPException, Body
import os
import re
from typing import List, Dict, Any


def generate_fallback_insights(selection: str, matches: List[Dict[str, Any]]) -> Dict[str, List[str]]:
    """Generate intelligent fallback insights when LLM is not available"""
    insights = []
    
    # Analyze the selection text
    selection_lower = selection.lower()
    words = re.findall(r'\b\w+\b', selection_lower)
    word_freq = {}
    for word in words:
        if len(word) > 3:  # Skip short words
            word_freq[word] = word_freq.get(word, 0) + 1
    
    # Get key terms (most frequent words)
    key_terms = sorted(word_freq.items(), key=lambda x: x[1], reverse=True)[:5]
    key_terms = [term for term, freq in key_terms if freq > 1]
    
    # Generate insights based on content analysis
    if key_terms:
        insights.append(f"🔑 Key Terms: The text focuses on {', '.join(key_terms[:3])} as central concepts")
    
    # Analyze document connections
    if matches:
        pdf_names = set()
        pages = set()
        for match in matches:
            pdf_names.add(match.get('pdf_name', match.get('filename', 'Unknown')))
            pages.add(match.get('page', 0))
        
        if len(pdf_names) > 1:
            insights.append(f"📚 Cross-Document Connection: Found relevant content across {len(pdf_names)} different documents")
        
        if len(pages) > 1:
            insights.append(f"📄 Multi-Page Relevance: Content spans {len(pages)} different pages, indicating broad topic coverage")
    
    # Content length insights
    if len(selection) > 200:
        insights.append("📝 Comprehensive Selection: Your text selection is substantial, providing rich context for analysis")
    elif len(selection) < 50:
        insights.append("🎯 Focused Selection: Your concise text selection allows for precise, targeted analysis")
    
    # Topic-based insights
    if any(word in selection_lower for word in ['network', 'system', 'architecture']):
        insights.append("🏗️ Technical Architecture: The content appears to discuss system design or network structures")
    elif any(word in selection_lower for word in ['research', 'study', 'analysis']):
        insights.append("🔬 Research Focus: This appears to be research-oriented content with analytical depth")
    elif any(word in selection_lower for word in ['business', 'strategy', 'management']):
        insights.append("💼 Business Context: The content seems to relate to business strategy or management concepts")
    
    # Add generic insights if we don't have enough
    while len(insights) < 4:
        if len(insights) == 0:
            insights.append("💡 Content Analysis: Your selected text provides a foundation for deeper document exploration")
        elif len(insights) == 1:
            insights.append("🔍 Semantic Search: Use the search functionality to find more related content across your document library")
        elif len(insights) == 2:
            insights.append("📊 Pattern Recognition: Look for recurring themes or concepts across multiple documents")
        else:
            insights.append("🎯 Focus Areas: Consider exploring related sections for comprehensive understanding")
    
    return {"insights": insights[:6]}


router = APIRouter()


@router.post("/insights")
async def insights(
    selection: str = Body(..., embed=True),
    matches: List[Dict[str, Any]] = Body(default=[], embed=True),
):
    provider = os.environ.get("LLM_PROVIDER", "")
    model_name = os.environ.get("GEMINI_MODEL", "gemini-2.5-flash")
    if provider.lower() != "gemini":
        # Graceful fallback
        return {
            "insights": [
                "LLM disabled. Provide LLM_PROVIDER=gemini and Google API credentials to enable insights.",
            ]
        }

    try:
        import google.generativeai as genai  # type: ignore
    except Exception:
        return {
            "insights": [
                "Gemini client not installed in this image. Please add google-generativeai to requirements.",
            ]
        }

    api_key = os.environ.get("GOOGLE_API_KEY") or os.environ.get("GOOGLE_API_KEY_GEMINI") or os.environ.get("GOOGLE_APPLICATION_CREDENTIALS")
    # google-generativeai expects API key via genai.configure
    api_key_env = os.environ.get("GOOGLE_API_KEY") or os.environ.get("GEMINI_API_KEY")
    if not api_key_env:
        # Generate intelligent fallback insights based on content analysis
        return generate_fallback_insights(selection, matches)

    try:
        genai.configure(api_key=api_key_env)
        model = genai.GenerativeModel(model_name)
        context_parts = []
        for m in matches[:5]:
            pdf_name = m.get('pdf_name', m.get('filename', ''))
            section_heading = m.get('section_heading', m.get('title', ''))
            content = m.get('section_content', m.get('snippet', ''))[:500]  # Use more content for better insights
            context_parts.append(f"[{pdf_name} - {section_heading}, Page {m.get('page')}]:\n{content}\n")
        
        prompt = (
            "You are an expert analyst helping a user understand connections between documents. "
            "Based on the user's selected text and related document sections, generate insightful observations.\n\n"
            "INSTRUCTIONS:\n"
            "- Generate 4-6 insights that add value beyond what's explicitly stated\n"
            "- Use different insight types:\n"
            "  • 🔑 Key Takeaways: Important points or patterns across documents\n"
            "  • 💡 Did You Know?: Interesting facts or connections\n"
            "  • ⚖️ Contradictions/Counterpoints: Conflicting information or alternative views\n"
            "  • 📝 Examples: Concrete instances that illustrate concepts\n"
            "  • 🔗 Cross-Document Inspirations: Creative connections between different sources\n"
            "- Be specific and reference the source documents\n"
            "- Keep each insight concise (1-2 sentences)\n\n"
            f"USER'S SELECTED TEXT:\n{selection}\n\n"
            f"RELATED DOCUMENT SECTIONS:\n" + "\n".join(context_parts)
        )
        resp = model.generate_content(prompt)
        text = (resp.text or "").strip()
        if not text:
            return {"insights": ["No insights generated."]}
        # Split bullets by lines
        lines = [ln.strip("- • \t") for ln in text.splitlines() if ln.strip()]
        # Keep top 6
        return {"insights": lines[:6] or [text]}
    except Exception as e:
        return {"insights": [f"LLM error: {e}"]}


