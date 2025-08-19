from pydantic import BaseModel
from typing import Any, Dict, List


class PersonaAnalyzeResponse(BaseModel):
    metadata: Dict[str, Any]
    extracted_sections: List[Dict[str, Any]]
    subsection_analysis: List[Dict[str, Any]]


