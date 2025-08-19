from fastapi import APIRouter, HTTPException, Body
import os
from typing import List, Dict, Any


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
        return {"insights": ["Missing GOOGLE_API_KEY/GEMINI_API_KEY. Returning without LLM."]}

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


