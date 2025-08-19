from typing import List
from persona_analyzer import FontBasedGenericAnalyzer


def analyze_persona(persona: str, job: str, input_paths: List[str]) -> dict:
    analyzer = FontBasedGenericAnalyzer()
    return analyzer.analyze_documents(input_paths, persona, job)


