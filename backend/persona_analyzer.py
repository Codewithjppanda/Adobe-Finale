#!/usr/bin/env python3
import json
import os
import re
import fitz  # PyMuPDF
from datetime import datetime
from collections import defaultdict, Counter
from dataclasses import dataclass
from typing import List, Dict, Any, Tuple

@dataclass
class DocumentSection:
    document: str
    page_number: int
    section_title: str
    content: str
    importance_rank: int
    section_id: str
    relevance_score: float

@dataclass
class SubSectionAnalysis:
    document: str
    section_id: str
    refined_text: str
    page_number: int

class FontBasedGenericAnalyzer:
    def __init__(self):
        self.documents = []
        self.persona_keywords = []
        self.job_keywords = []
        
    def extract_string_value(self, field_value):
        """Extract string value from any input format"""
        if isinstance(field_value, dict):
            for key in ['role', 'task', 'description', 'type', 'name', 'title']:
                if key in field_value:
                    return str(field_value[key])
            for value in field_value.values():
                if isinstance(value, str):
                    return value
            return str(field_value)
        return str(field_value)
    
    def extract_adaptive_keywords(self, text: str) -> List[str]:
        """Extract keywords adaptively in a generalized way (no domain bias).

        Produces a mix of unigrams and frequent bi/tri-grams while filtering stop words.
        """
        if not text:
            return []
        text = text.lower()

        # Unigrams
        words = re.findall(r"[a-zA-Z]{3,}", text)

        # Bi/Tri-grams built from consecutive words (kept short and generic)
        tokens = words
        bigrams = [f"{tokens[i]} {tokens[i+1]}" for i in range(len(tokens)-1)]
        trigrams = [f"{tokens[i]} {tokens[i+1]} {tokens[i+2]}" for i in range(len(tokens)-2)]

        # Remove common stop words
        stop_words = {
            'the','and','for','are','but','not','you','all','any','can','our','your','their','his','her',
            'this','that','with','from','they','have','been','very','much','will','would','could','should',
            'what','when','where','which','into','about','over','under','than','then','them','there','here',
        }

        def keep(token: str) -> bool:
            if len(token) < 3:
                return False
            return token not in stop_words

        unigrams = [w for w in tokens if keep(w)]
        # Keep only a few most informative ngrams by length and uniqueness
        ngrams = []
        for seq in bigrams + trigrams:
            # skip if any token is a stop word
            if any(t in stop_words for t in seq.split()):
                continue
            ngrams.append(seq)

        # Deduplicate while preserving relative order
        seen = set()
        all_terms: List[str] = []
        for t in unigrams + ngrams:
            if t not in seen:
                seen.add(t)
                all_terms.append(t)
        return all_terms
    
    def analyze_document_fonts(self, pdf_path: str) -> Dict[str, Any]:
        """Analyze font characteristics using PyMuPDF (similar to pdfminer approach)"""
        doc = fitz.open(pdf_path)
        font_stats = defaultdict(int)
        text_blocks = []
        
        for page_num in range(len(doc)):
            page = doc[page_num]
            
            # Extract text with font information
            blocks = page.get_text("dict")
            
            for block in blocks.get("blocks", []):
                if "lines" in block:
                    for line in block["lines"]:
                        for span in line["spans"]:
                            text = span.get("text", "").strip()
                            if not text:
                                continue
                            
                            font_size = span.get("size", 12)
                            font_flags = span.get("flags", 0)
                            font_name = span.get("font", "")
                            
                            # Detect bold (flag 16 is bold)
                            is_bold = bool(font_flags & 16)
                            
                            # Get position
                            bbox = span.get("bbox", [0, 0, 0, 0])
                            x, y = bbox[0], bbox[1]
                            
                            block_info = {
                                'text': text,
                                'page': page_num + 1,
                                'size': round(font_size, 1),
                                'font_name': font_name,
                                'is_bold': is_bold,
                                'x': x,
                                'y': y,
                                'length': len(text),
                                'word_count': len(text.split()),
                                'lines': text.count('\n') + 1
                            }
                            
                            text_blocks.append(block_info)
                            font_stats[round(font_size, 1)] += 1
        
        doc.close()
        
        # Determine body text size (most common)
        body_size = max(font_stats.items(), key=lambda x: x[1])[0] if font_stats else 12.0
        
        return {
            'text_blocks': text_blocks,
            'font_stats': font_stats,
            'body_size': body_size
        }
    
    def is_valid_heading_generic(self, block: Dict, body_size: float) -> bool:
        """Generic heading validation without domain hardcoding"""
        text = block['text'].strip()
        text_lower = text.lower()
        
        # Basic filters
        if len(text) < 3 or len(text) > 150:
            return False
        
        # Skip obvious non-headings (universal patterns)
        skip_patterns = [
            r'^\.+$', r'^\d+\.?\s*$', r'^[a-z]\)?\s*$',
            r'^page \d+ of \d+$', r'^version \d+\.\d+$',
            r'^\d{1,2} \w+ \d{4}$', r'^copyright.*\d{4}$',
            r'^www\.', r'^http[s]?://', r'^email:', r'^tel:',
            r'^\d+$', r'^[ivx]+$'
        ]
        
        if any(re.match(pattern, text_lower) for pattern in skip_patterns):
            return False
        
        # Font-based criteria (the key improvement)
        size_ratio = block['size'] / body_size if body_size > 0 else 1
        
        # Universal heading indicators
        heading_score = 0
        
        # Font size larger than body text
        if size_ratio >= 1.2:
            heading_score += 3
        elif size_ratio >= 1.1:
            heading_score += 2
        elif size_ratio >= 1.05:
            heading_score += 1
        
        # Bold text
        if block['is_bold']:
            heading_score += 2
        
        # Appropriate length for headings
        word_count = len(text.split())
        if 2 <= word_count <= 8:
            heading_score += 2
        elif 8 < word_count <= 12:
            heading_score += 1
        
        # Structural patterns (universal)
        if re.match(r'^\d+\.?\s+[A-Z]', text):  # "1. Heading"
            heading_score += 3
        elif re.match(r"^[A-Z][A-Za-z\s\-\'\"(),]+$", text) and word_count >= 2:  # "Title Case"
            heading_score += 2
        elif text.isupper() and word_count >= 2:  # "ALL CAPS"
            heading_score += 2
        elif text.endswith(':') and len(text) > 8:  # "Heading:"
            heading_score += 1
        
        # Return true if score is high enough
        return heading_score >= 3
    
    def group_text_blocks_into_lines(self, text_blocks: List[Dict]) -> List[Dict]:
        """Group text blocks that are on the same line"""
        # Sort blocks by page, then y position (top to bottom), then x position
        sorted_blocks = sorted(text_blocks, key=lambda b: (b['page'], -b['y'], b['x']))
        
        grouped_lines = []
        current_line = []
        current_y = None
        current_page = None
        
        for block in sorted_blocks:
            # Check if this block is on the same line as the current line
            if (current_page == block['page'] and 
                current_y is not None and 
                abs(current_y - block['y']) < 5):  # 5-point tolerance for same line
                current_line.append(block)
            else:
                # Start new line
                if current_line:
                    # Combine text from current line
                    combined_text = ' '.join([b['text'] for b in current_line])
                    # Use properties from first block in line
                    line_block = current_line[0].copy()
                    line_block['text'] = combined_text
                    line_block['word_count'] = len(combined_text.split())
                    line_block['length'] = len(combined_text)
                    grouped_lines.append(line_block)
                
                current_line = [block]
                current_y = block['y']
                current_page = block['page']
        
        # Add final line
        if current_line:
            combined_text = ' '.join([b['text'] for b in current_line])
            line_block = current_line[0].copy()
            line_block['text'] = combined_text
            line_block['word_count'] = len(combined_text.split())
            line_block['length'] = len(combined_text)
            grouped_lines.append(line_block)
        
        return grouped_lines
    
    def extract_content_between_headings(self, all_blocks: List[Dict], 
                                       heading_block: Dict, next_heading_block: Dict = None) -> str:
        """Extract content between two headings"""
        heading_page = heading_block['page']
        heading_y = heading_block['y']
        
        # Find end boundary
        if next_heading_block:
            end_page = next_heading_block['page']
            end_y = next_heading_block['y']
        else:
            end_page = heading_page
            end_y = -1000  # Very low y value to capture rest of page
        
        # Collect content blocks
        content_blocks = []
        for block in all_blocks:
            # Check if block is between the two headings
            is_between = False
            
            if block['page'] == heading_page:
                if next_heading_block and next_heading_block['page'] == heading_page:
                    # Same page scenario
                    is_between = block['y'] < heading_y and block['y'] > end_y
                else:
                    # Heading is on this page, content extends to next pages
                    is_between = block['y'] < heading_y
            elif next_heading_block and block['page'] > heading_page and block['page'] < end_page:
                # Content on intermediate pages
                is_between = True
            elif next_heading_block and block['page'] == end_page and block['y'] > end_y:
                # Content on final page up to next heading
                is_between = True
            
            if is_between and block != heading_block:
                content_blocks.append(block['text'])
        
        return '\n'.join(content_blocks[:30])  # Limit content size
    
    # --- TF-IDF utilities (lightweight, no external deps) ---
    @staticmethod
    def _tokenize(text: str) -> List[str]:
        text = text.lower()
        return re.findall(r"[a-zA-Z]{3,}", text)

    @staticmethod
    def _tf(tokens: List[str]) -> Dict[str, float]:
        c = Counter(tokens)
        total = float(sum(c.values()) or 1)
        return {t: n / total for t, n in c.items()}

    @staticmethod
    def _cosine(a: Dict[str, float], b: Dict[str, float]) -> float:
        # dot
        dot = 0.0
        for t, wa in a.items():
            wb = b.get(t)
            if wb:
                dot += wa * wb
        # norms
        na = (sum(v * v for v in a.values()) or 0.0) ** 0.5
        nb = (sum(v * v for v in b.values()) or 0.0) ** 0.5
        if na == 0 or nb == 0:
            return 0.0
        return dot / (na * nb)

    def _build_idf(self, docs_tokens: List[List[str]]) -> Dict[str, float]:
        N = max(1, len(docs_tokens))
        df: Counter[str] = Counter()
        for toks in docs_tokens:
            df.update(set(toks))
        idf: Dict[str, float] = {}
        for t, d in df.items():
            idf[t] = max(0.0, (1.0 + (N / (1 + d))) )  # simple smooth idf
        return idf

    def _tfidf_vec(self, tokens: List[str], idf: Dict[str, float]) -> Dict[str, float]:
        tf = self._tf(tokens)
        return {t: tfv * idf.get(t, 0.0) for t, tfv in tf.items()}

    def calculate_contextual_relevance(self, title: str, content: str,
                                       persona_keywords: List[str], job_keywords: List[str],
                                       idf: Dict[str, float], filename: str) -> float:
        """Hybrid relevance score combining TF-IDF cosine, title/filename matches,
        coverage and simple density. Generalized, no domain-specific priors."""

        title_lower = title.lower()
        content_lower = content.lower()
        filename_lower = filename.lower()

        # Query tokens from persona + job (unigrams only for cosine)
        query_text = " ".join(persona_keywords + job_keywords)
        query_tokens = self._tokenize(query_text)
        content_tokens = self._tokenize(content_lower)

        # TF-IDF cosine between query and section content
        q_vec = self._tfidf_vec(query_tokens, idf)
        s_vec = self._tfidf_vec(content_tokens, idf)
        cosine = self._cosine(q_vec, s_vec)

        score = 0.0
        score += 10.0 * cosine  # primary signal

        # Title and filename soft matching boosts
        title_matches = 0
        for kw in persona_keywords + job_keywords:
            if kw in title_lower:
                score += 1.25
                title_matches += 1
            if kw in filename_lower:
                score += 1.5  # filename often very indicative

        # Keyword coverage in content
        unique_query = set(query_tokens)
        if unique_query:
            hits = sum(1 for t in unique_query if t in content_tokens)
            coverage = hits / len(unique_query)
            score += 3.0 * coverage

        # Light density bonus (normalized)
        if content_tokens:
            density = sum(content_lower.count(kw) for kw in (persona_keywords + job_keywords)) / max(1, len(content_tokens))
            score += min(2.0, density * 5.0)

        # Quality heuristics
        title_words = len(title.split())
        if 3 <= title_words <= 12:
            score += 0.5
        if title_matches >= 2:
            score *= 1.05

        return float(score)
    
    def extract_sections_from_document(self, document_path: str, 
                                     persona_keywords: List[str], job_keywords: List[str], idf: Dict[str, float]) -> List[DocumentSection]:
        """Extract sections using font-based analysis"""
        filename = os.path.basename(document_path)
        
        # Analyze document fonts
        font_analysis = self.analyze_document_fonts(document_path)
        text_blocks = font_analysis['text_blocks']
        body_size = font_analysis['body_size']
        
        if not text_blocks:
            return []
        
        print(f"[DEBUG] Processing {filename}: {len(text_blocks)} text blocks, body size: {body_size}")
        
        # Group text blocks into lines
        line_blocks = self.group_text_blocks_into_lines(text_blocks)
        
        # Identify headings
        headings = []
        for block in line_blocks:
            if self.is_valid_heading_generic(block, body_size):
                headings.append(block)
        
        print(f"[DEBUG] Found {len(headings)} headings in {filename}")
        for heading in headings[:5]:
            print(f"  - '{heading['text'][:50]}...' (size: {heading['size']}, bold: {heading['is_bold']})")
        
        # Extract sections
        sections = []
        for i, heading in enumerate(headings):
            next_heading = headings[i + 1] if i + 1 < len(headings) else None
            
            # Extract content for this heading
            section_content = self.extract_content_between_headings(line_blocks, heading, next_heading)
            
            if len(section_content.strip()) < 20:
                continue
            
            # Calculate relevance using hybrid scorer
            relevance = self.calculate_contextual_relevance(
                heading['text'], section_content, persona_keywords, job_keywords, idf, filename
            )
            
            print(f"[DEBUG] '{heading['text'][:40]}...': relevance = {relevance:.3f}")
            
            if relevance > 1.0:  # Reasonable threshold
                section_id = f"{filename.replace('.pdf', '').replace(' ', '_')}_h{i+1}"
                
                sections.append(DocumentSection(
                    document=filename,
                    page_number=heading['page'],
                    section_title=heading['text'],
                    content=f"{heading['text']}\n\n{section_content}",
                    importance_rank=0,
                    section_id=section_id,
                    relevance_score=relevance
                ))
        
        return sections
    
    def intelligent_section_ranking(self, sections: List[DocumentSection]) -> List[DocumentSection]:
        """Rank sections intelligently with diversity"""
        if not sections:
            return []
        
        # Sort by relevance
        sections.sort(key=lambda x: x.relevance_score, reverse=True)
        
        final_sections = []
        document_count = Counter()
        seen_titles = set()
        
        for section in sections:
            # Check for title diversity
            title_words = set(section.section_title.lower().split())
            
            is_duplicate = False
            for seen_title_str in seen_titles:
                seen_words = set(seen_title_str.split())
                overlap = len(title_words.intersection(seen_words))
                if overlap > len(title_words) * 0.8:
                    is_duplicate = True
                    break
            
            # Add if not duplicate and within document limits
            if not is_duplicate and document_count[section.document] < 2:
                final_sections.append(section)
                document_count[section.document] += 1
                seen_titles.add(' '.join(sorted(title_words)))
                
                if len(final_sections) >= 5:
                    break
        
        # Fill remaining slots if needed
        if len(final_sections) < 5:
            for section in sections:
                if section not in final_sections and len(final_sections) < 5:
                    final_sections.append(section)
        
        # Assign ranks
        for rank, section in enumerate(final_sections, 1):
            section.importance_rank = rank
        
        return final_sections
    
    def generate_quality_analysis(self, sections: List[DocumentSection]) -> List[SubSectionAnalysis]:
        """Generate high-quality subsection analysis"""
        subsections = []
        
        for section in sections[:5]:
            content = section.content
            title = section.section_title
            
            # Extract quality sentences
            sentences = re.split(r'[.!?]+', content)
            quality_sentences = []
            
            for sentence in sentences:
                sentence = sentence.strip()
                if 25 <= len(sentence) <= 300:
                    sentence_lower = sentence.lower()
                    
                    # Score by keyword presence and usefulness
                    score = 0
                    score += sum(2 for kw in self.persona_keywords + self.job_keywords if kw in sentence_lower)
                    score += sum(0.5 for word in ['to', 'click', 'select', 'choose', 'from', 'use'] if word in sentence_lower)
                    score += sum(1.0 for word in ['create', 'fill', 'sign', 'convert', 'manage'] if word in sentence_lower)
                    
                    if score > 1.0:
                        quality_sentences.append((sentence, score))
            
            # Build refined text
            if quality_sentences:
                quality_sentences.sort(key=lambda x: x[1], reverse=True)
                best_sentences = [s[0] for s in quality_sentences[:4]]
                refined_text = f"{title}. " + " ".join(best_sentences)
            else:
                # Fallback: use first part of content
                content_lines = content.split('\n')
                useful_lines = [line.strip() for line in content_lines[1:4] if len(line.strip()) > 15]
                refined_text = f"{title}. " + " ".join(useful_lines)
            
            # Clean up
            refined_text = re.sub(r'\s+', ' ', refined_text).strip()
            if not refined_text.endswith('.'):
                refined_text += '.'
            
            subsections.append(SubSectionAnalysis(
                document=section.document,
                section_id=section.section_id,
                refined_text=refined_text,
                page_number=section.page_number
            ))
        
        return subsections
    
    def analyze_documents(self, document_paths: List[str], persona, job_description) -> Dict[str, Any]:
        """Main analysis method using font-based approach"""
        print(f"[DEBUG] Starting FONT-BASED GENERIC analysis")
        
        # Convert inputs
        persona_str = self.extract_string_value(persona)
        job_str = self.extract_string_value(job_description)
        
        print(f"[DEBUG] Persona: {persona_str}")
        print(f"[DEBUG] Job: {job_str}")
        
        # Extract keywords adaptively
        self.persona_keywords = self.extract_adaptive_keywords(persona_str)
        self.job_keywords = self.extract_adaptive_keywords(job_str)
        
        print(f"[DEBUG] Keywords: {(self.persona_keywords + self.job_keywords)[:20]}")
        
        # Build a temporary corpus to compute IDF across documents at the section level.
        # We first do a quick text extraction per document to approximate tokens for IDF.
        preview_tokens_per_doc: List[List[str]] = []
        for doc_path in document_paths:
            try:
                # lightweight page text extraction using PyMuPDF
                d = fitz.open(doc_path)
                text = []
                for p in d:
                    if len(text) > 5:  # limit to first ~6 pages for speed
                        break
                    text.append(p.get_text() or "")
                d.close()
                preview_tokens_per_doc.append(self._tokenize("\n".join(text)))
            except Exception:
                preview_tokens_per_doc.append([])

        idf = self._build_idf(preview_tokens_per_doc)

        # Extract sections from all documents using the computed IDF
        all_sections = []
        for doc_path in document_paths:
            try:
                doc_sections = self.extract_sections_from_document(doc_path, self.persona_keywords, self.job_keywords, idf)
                all_sections.extend(doc_sections)
            except Exception as e:
                print(f"[ERROR] Processing {doc_path}: {e}")
                continue
        
        print(f"[DEBUG] Total sections found: {len(all_sections)}")
        
        if not all_sections:
            return {
                "metadata": {
                    "input_documents": [os.path.basename(path) for path in document_paths],
                    "persona": persona_str,
                    "job_to_be_done": job_str,
                    "processing_timestamp": datetime.now().isoformat(),
                    "note": "No relevant sections found"
                },
                "extracted_sections": [],
                "subsection_analysis": []
            }
        
        # Rank sections intelligently
        final_sections = self.intelligent_section_ranking(all_sections)
        
        # Generate analysis
        subsection_analysis = self.generate_quality_analysis(final_sections)
        
        # Prepare result
        result = {
            "metadata": {
                "input_documents": [os.path.basename(path) for path in document_paths],
                "persona": persona_str,
                "job_to_be_done": job_str,
                "processing_timestamp": datetime.now().isoformat()
            },
            "extracted_sections": [
                {
                    "document": section.document,
                    "section_title": section.section_title,
                    "importance_rank": section.importance_rank,
                    "page_number": section.page_number
                }
                for section in final_sections[:5]
            ],
            "subsection_analysis": [
                {
                    "document": sub.document,
                    "refined_text": sub.refined_text,
                    "page_number": sub.page_number
                }
                for sub in subsection_analysis
            ]
        }
        
        print(f"[DEBUG] Final result: {len(result['extracted_sections'])} sections")
        for section in result['extracted_sections']:
            print(f"  - {section['section_title'][:60]}...")
        
        return result

# Maintain compatibility
PersonaDocumentAnalyzer = FontBasedGenericAnalyzer

def main():
    import sys
    
    if len(sys.argv) < 4:
        print("Usage: python persona_analyzer.py <persona> <job_description> <pdf1> [pdf2] ...")
        return
    
    persona = sys.argv[1]
    job_description = sys.argv[2]
    document_paths = sys.argv[3:]
    
    analyzer = FontBasedGenericAnalyzer()
    result = analyzer.analyze_documents(document_paths, persona, job_description)
    
    print(json.dumps(result, indent=2, ensure_ascii=False))

if __name__ == "__main__":
    main()


