import os
import json
from dataclasses import dataclass, asdict
from typing import List, Dict, Any, Tuple, Optional

import numpy as np
import fitz  # PyMuPDF
from collections import defaultdict

try:
    from fastembed import TextEmbedding
except Exception:
    TextEmbedding = None  # type: ignore


STORE_DIR = os.environ.get("STORE_DIR", os.path.abspath("./store"))
INDEX_DIR = os.path.join(STORE_DIR, "semantic_index")
os.makedirs(INDEX_DIR, exist_ok=True)


@dataclass
class IndexedSection:
    section_id: str
    doc_id: str
    filename: str
    page: int
    title: str
    text: str
    snippet: str
    vector_offset: int
    pdf_name: str = ""  # Added for structured data requirement
    section_heading: str = ""  # Added for structured data requirement
    section_content: str = ""  # Added for structured data requirement


def _split_into_sentences(text: str) -> List[str]:
    """Enhanced sentence splitting with better context preservation"""
    import re
    
    # More sophisticated sentence splitting
    # Handle abbreviations, numbers, etc.
    text = re.sub(r'([.!?])\s+([A-Z])', r'\1\n\2', text)
    text = re.sub(r'([.!?])\s+([0-9])', r'\1\n\2', text)
    
    # Split on sentence boundaries
    sentences = re.split(r'\n+', text.strip())
    
    # Clean and filter sentences
    cleaned_sentences = []
    for sentence in sentences:
        sentence = sentence.strip()
        if len(sentence) >= 10 and len(sentence) <= 1000:  # Reasonable length
            # Remove common PDF artifacts
            if not re.match(r'^[0-9\s\-_]+$', sentence):  # Not just numbers/dashes
                cleaned_sentences.append(sentence)
    
    return cleaned_sentences


def _make_snippet(text: str, min_sentences: int = 2, max_sentences: int = 4) -> str:
    """Enhanced snippet generation for better contextual matching"""
    sentences = _split_into_sentences(text)
    if not sentences:
        return text[:400]  # Increased from 300 for better context
    
    # Select best sentences (prefer early substantive content)
    best_sentences = []
    for i, sentence in enumerate(sentences):
        # Skip very short sentences or obvious headers
        if len(sentence) < 20 or 'page ' in sentence.lower():
            continue
        
        # Prefer sentences with good content indicators
        if any(word in sentence.lower() for word in ['include', 'such as', 'example', 'important', 'main']):
            best_sentences.insert(0, sentence)  # Prioritize
        else:
            best_sentences.append(sentence)
            
        if len(best_sentences) >= max_sentences:
            break
    
    if len(best_sentences) < min_sentences and len(sentences) >= min_sentences:
        best_sentences = sentences[:max_sentences]
    
    snippet = " ".join(best_sentences[:max_sentences])
    return snippet[:800]  # Maintain size limit

def _create_semantic_chunks(text: str, chunk_size: int = 512, overlap: int = 100) -> List[str]:
    """Create overlapping semantic chunks for better context preservation"""
    sentences = _split_into_sentences(text)
    if not sentences:
        return [text[:chunk_size]]
    
    chunks = []
    current_chunk = ""
    
    for sentence in sentences:
        # If adding this sentence would exceed chunk size
        if len(current_chunk) + len(sentence) > chunk_size and current_chunk:
            chunks.append(current_chunk.strip())
            # Start new chunk with overlap from previous
            if overlap > 0 and current_chunk:
                # Take last few sentences for overlap
                last_sentences = current_chunk.split('.')[-3:]  # Last 3 sentences
                overlap_text = '. '.join([s.strip() for s in last_sentences if s.strip()])
                current_chunk = overlap_text + ". " + sentence
            else:
                current_chunk = sentence
        else:
            current_chunk += " " + sentence if current_chunk else sentence
    
    # Add the last chunk
    if current_chunk.strip():
        chunks.append(current_chunk.strip())
    
    return chunks if chunks else [text[:chunk_size]]


class EnhancedSectionExtractor:
    """Enhanced section extractor using the process_pdfs.py OutlineExtractor for better structure."""

    def extract_sections(self, pdf_path: str) -> List[Tuple[str, int, str]]:
        # Import the OutlineExtractor from process_pdfs.py
        try:
            from process_pdfs import OutlineExtractor
            extractor = OutlineExtractor()
            result = extractor.extract_outline(pdf_path)
            
            # Get outline data
            outline = result.get("outline", [])
            if not outline:
                # Fallback to simple extraction if no outline found
                return self._fallback_extraction(pdf_path)
            
            # Extract content for each heading in the outline
            sections = []
            doc = fitz.open(pdf_path)
            
            for i, heading in enumerate(outline):
                title = heading.get("text", "").strip()
                page = heading.get("page", 1)
                
                # Extract content for this section
                content = self._extract_section_content(doc, heading, outline, i)
                if content and len(content.strip()) >= 50:
                    sections.append((title, page, content.strip()))
            
            doc.close()
            return sections
            
        except Exception as e:
            print(f"Error with enhanced extraction, falling back to simple: {e}")
            return self._fallback_extraction(pdf_path)
    
    def _extract_section_content(self, doc: fitz.Document, current_heading: dict, all_headings: list, current_index: int) -> str:
        """Extract content between current heading and next heading"""
        current_page = current_heading.get("page", 1) - 1  # Convert to 0-based
        next_page = None
        
        # Find the next heading to determine content boundaries
        if current_index + 1 < len(all_headings):
            next_heading = all_headings[current_index + 1]
            next_page = next_heading.get("page", 1) - 1
        
        content_lines = []
        
        # Extract content from current page to next heading or end of document
        start_page = current_page
        end_page = next_page if next_page is not None else len(doc) - 1
        
        for page_num in range(start_page, min(end_page + 1, len(doc))):
            page = doc[page_num]
            text = page.get_text()
            
            if page_num == start_page:
                # On starting page, try to skip the heading itself
                lines = text.split('\n')
                heading_text = current_heading.get("text", "").strip()
                content_started = False
                
                for line in lines:
                    line_clean = line.strip()
                    if not content_started and heading_text in line_clean:
                        content_started = True
                        continue
                    if content_started and line_clean:
                        content_lines.append(line_clean)
            else:
                # For other pages, include all content until next heading
                lines = text.split('\n')
                for line in lines:
                    line_clean = line.strip()
                    if line_clean:
                        # If we're on the last page and have a next heading, stop at that heading
                        if page_num == end_page and next_page is not None:
                            next_heading_text = all_headings[current_index + 1].get("text", "").strip()
                            if next_heading_text in line_clean:
                                break
                        content_lines.append(line_clean)
        
        return '\n'.join(content_lines[:200])  # Increased from 100
    
    def _fallback_extraction(self, pdf_path: str) -> List[Tuple[str, int, str]]:
        """Fallback to simple extraction if outline extraction fails"""
        doc = fitz.open(pdf_path)
        text_blocks = []
        font_stats = defaultdict(int)
        
        for page_number in range(len(doc)):
            page = doc[page_number]
            blocks = page.get_text("dict")
            for block in blocks.get("blocks", []):
                if "lines" not in block:
                    continue
                for line in block["lines"]:
                    for span in line.get("spans", []):
                        text = span.get("text", "").strip()
                        if not text:
                            continue
                        size = float(span.get("size", 12.0))
                        bbox = span.get("bbox", [0, 0, 0, 0])
                        x, y = bbox[0], bbox[1]
                        text_blocks.append({
                                "text": text,
                                "page": page_number + 1,
                                "size": size,
                                "x": x,
                                "y": y,
                        })
                        font_stats[round(size, 1)] += 1
        doc.close()

        if not text_blocks:
            return []

        # Determine body font size as the mode of sizes
        body_size = max(font_stats.items(), key=lambda kv: kv[1])[0] if font_stats else 12.0

        # More flexible heading detection - look for patterns that suggest headings
        headings = []
        potential_headings = []
        
        # First pass: detect potential headings by font size or pattern
        for block in text_blocks:
            text = block["text"].strip()
            # More liberal heading detection
            if (len(text) >= 3 and len(text) <= 120 and 
                (block["size"] >= float(body_size) * 1.1 or  # Lower threshold
                 text.endswith(':') or  # Ends with colon (like "Ingredients:")
                 (text[0].isupper() and len(text.split()) <= 4))):  # Short capitalized phrases
                potential_headings.append(block)
        
        # If we found very few headings, be even more liberal
        if len(potential_headings) < 3:
            for block in text_blocks:
                text = block["text"].strip()
                if (len(text) >= 3 and len(text) <= 80 and
                    (text[0].isupper() and 
                     len(text.split()) <= 6 and 
                     not text.startswith('•') and
                     not any(char.isdigit() for char in text[:5]))):  # Not bullets or numbers
                    potential_headings.append(block)
        
        # Remove duplicates and sort by page/position
        seen_texts = set()
        for h in potential_headings:
            if h["text"] not in seen_texts:
                headings.append(h)
                seen_texts.add(h["text"])
        
        # Extract sections with actual content
        sections = []
        doc = fitz.open(pdf_path)
        
        for i, h in enumerate(headings[:15]):  # Increased limit
            title = h["text"].strip()
            page = h["page"]
            
            # Extract actual content from the PDF around this heading
            content_lines = []
            try:
                pdf_page = doc[page - 1]  # Convert to 0-based
                page_text = pdf_page.get_text()
                lines = page_text.split('\n')
                
                # Find the heading and extract content after it
                found_heading = False
                content_count = 0
                for line in lines:
                    line_clean = line.strip()
                    if not line_clean:
                        continue
                        
                    if not found_heading and title in line_clean:
                        found_heading = True
                        continue
                    
                    if found_heading:
                        content_lines.append(line_clean)
                        content_count += 1
                        # Stop at next potential heading or after reasonable content
                        if content_count > 20 or (len(line_clean) <= 80 and 
                                                any(next_h["text"] in line_clean for next_h in headings[i+1:i+3])):
                            break
                
                content = '\n'.join(content_lines[:30])  # Reasonable content size
                
                # Only include sections with substantial content
                if content and len(content.strip()) >= 30:
                    sections.append((title, page, content.strip()))
                    
            except Exception as e:
                print(f"Error extracting content for {title}: {e}")
                # Fallback to simple content
                content = f"Section: {title} (from page {page})"
                sections.append((title, page, content))
        
        doc.close()

        return sections


class SemanticIndex:
    def __init__(self) -> None:
        self.embedding = None
        if TextEmbedding is not None:
            try:
                # Use a better embedding model for improved accuracy
                self.embedding = TextEmbedding(
                    model_name="BAAI/bge-small-en-v1.5",  # Better model for semantic search
                    max_length=512,  # Optimal chunk size
                    cache_dir=os.path.join(INDEX_DIR, "embeddings_cache")
                )
                print("✅ Using enhanced BGE embedding model for better accuracy")
            except Exception as e:
                print(f"⚠️ Could not load BGE model: {e}")
                try:
                    # Fallback to default model
                    self.embedding = TextEmbedding()
                    print("✅ Using default fastembed model")
                except Exception:
                    self.embedding = None
                    print("⚠️ No embedding model available, using fallback")

        # Dynamic vector dimension based on model
        self.vector_dim = 384  # Default fallback dimension
        if self.embedding:
            try:
                # Test embedding to get actual dimension
                test_emb = list(self.embedding.embed(["test"]))
                self.vector_dim = len(test_emb[0])
                print(f"✅ Embedding model dimension: {self.vector_dim}")
            except:
                pass

        self.vectors: np.ndarray = np.empty((0, self.vector_dim), dtype=np.float32)
        self.sections: List[IndexedSection] = []
        self._load()

    def _index_meta_path(self) -> str:
        return os.path.join(INDEX_DIR, "index.json")

    def _index_vec_path(self) -> str:
        return os.path.join(INDEX_DIR, "vectors.npy")

    def _load(self) -> None:
        try:
            meta_path = self._index_meta_path()
            vec_path = self._index_vec_path()
            if os.path.exists(meta_path) and os.path.exists(vec_path):
                with open(meta_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                self.sections = [IndexedSection(**x) for x in data.get("sections", [])]
                self.vectors = np.load(vec_path)
        except Exception:
            self.sections = []
            self.vectors = np.empty((0, 384), dtype=np.float32)

    def _save(self) -> None:
        tmp_meta = {"sections": [asdict(s) for s in self.sections]}
        with open(self._index_meta_path(), "w", encoding="utf-8") as f:
            json.dump(tmp_meta, f, ensure_ascii=False, indent=2)
        np.save(self._index_vec_path(), self.vectors)

    def _embed_texts(self, texts: List[str]) -> np.ndarray:
        if not texts:
            return np.empty((0, self.vector_dim), dtype=np.float32)
        if self.embedding is None:
            # Fallback: simple bag-of-words hashing for dev without model
            vecs = np.zeros((len(texts), self.vector_dim), dtype=np.float32)
            for i, t in enumerate(texts):
                for j, ch in enumerate(t.encode("utf-8", errors="ignore")):
                    vecs[i, j % self.vector_dim] += float(ch)
            # normalize
            norms = np.linalg.norm(vecs, axis=1, keepdims=True) + 1e-6
            return (vecs / norms).astype(np.float32)
        # fastembed returns generator of vectors
        embs = list(self.embedding.embed(texts))
        arr = np.array(embs, dtype=np.float32)
        # normalize
        norms = np.linalg.norm(arr, axis=1, keepdims=True) + 1e-6
        return (arr / norms).astype(np.float32)

    def ingest_documents(self, items: List[Tuple[str, str]]) -> Dict[str, Any]:
        """
        items: list of (doc_id, path)
        """
        extractor = EnhancedSectionExtractor()
        new_sections: List[IndexedSection] = []
        new_vectors: List[str] = []
        
        for doc_id, path in items:
            if not os.path.exists(path):
                continue
            
            filename = os.path.basename(path)
            
            # Clean up the filename to get a readable PDF name
            pdf_name = filename
            if "_" in filename and filename.count("_") >= 2:
                # If filename has format "name_hash_counter.pdf", extract just the name part
                parts = filename.split("_")
                if len(parts) >= 2:
                    pdf_name = parts[0].replace("_", " ").strip()
            
            pdf_name = pdf_name.replace(".pdf", "").replace("_", " ").title()
            
            sections = extractor.extract_sections(path)
            for idx, (title, page, content) in enumerate(sections):
                # Create semantic chunks for better context
                chunks = _create_semantic_chunks(content, chunk_size=512, overlap=100)
                
                for chunk_idx, chunk_content in enumerate(chunks):
                    snippet = _make_snippet(chunk_content)
                    section_id = f"{doc_id}_s{len(self.sections) + len(new_sections) + 1}_c{chunk_idx}"
                    
                    # Create chunk-specific title
                    chunk_title = f"{title} (Part {chunk_idx + 1})" if len(chunks) > 1 else title
                    
                    new_sections.append(
                        IndexedSection(
                            section_id=section_id,
                            doc_id=doc_id,
                            filename=filename,
                            page=page,
                            title=chunk_title,
                            text=chunk_content,
                            snippet=snippet,
                            vector_offset=0,
                            # Enhanced structured data fields
                            pdf_name=pdf_name,
                            section_heading=title,
                            section_content=chunk_content
                        )
                    )
                    # Use chunk content for better semantic matching
                    combined_text = f"{title}. {chunk_content}"
                    new_vectors.append(combined_text)

        # Embed snippets for speed
        vecs = self._embed_texts(new_vectors)
        # Assign offsets
        base = int(self.vectors.shape[0])
        for i, s in enumerate(new_sections):
            s.vector_offset = base + i
        # Append
        if vecs.size > 0:
            if self.vectors.size == 0:
                self.vectors = vecs
            else:
                self.vectors = np.vstack([self.vectors, vecs])
        self.sections.extend(new_sections)
        self._save()
        return {"ingested": len(new_sections)}

    def query(self, text: str, k: int = 5) -> List[Dict[str, Any]]:
        if not text or self.vectors.size == 0:
            return []
        
        # Enhanced query processing
        query_text = text.strip()
        if len(query_text) < 3:
            return []
        
        # Get semantic embeddings
        q = self._embed_texts([query_text])[0]
        
        # Calculate semantic similarity
        sims = (self.vectors @ q).astype(np.float32)
        
        # Get more candidates for better diversity and accuracy
        candidates_k = min(k * 4, len(self.sections))  # Increased from 3x to 4x
        idxs = np.argsort(-sims)[: max(1, candidates_k)]
        
        results: List[Dict[str, Any]] = []
        seen_content = set()
        
        for i in idxs:
            if i < 0 or i >= len(self.sections) or len(results) >= k:
                continue
            
            s = self.sections[i]
            semantic_score = float(sims[i])
            
            # Enhanced scoring with multiple factors
            final_score = self._calculate_enhanced_score(
                query_text=query_text,
                section=s,
                semantic_score=semantic_score
            )
            
            # Skip if overall score is too low
            if final_score < 0.25:  # Lowered threshold for better recall
                continue
            
            # Create content fingerprint for deduplication
            content_fingerprint = self._create_content_fingerprint(s)
            
            # Skip if we've seen very similar content
            if content_fingerprint in seen_content:
                continue
            
            # Generate enhanced relevance explanation
            relevance_reason = self._generate_enhanced_relevance_explanation(
                query_text=query_text,
                section=s,
                semantic_score=semantic_score,
                final_score=final_score
            )
            
            results.append(
                {
                    "docId": s.doc_id,
                    "filename": s.filename,
                    "page": s.page,
                    "title": s.title,
                    "snippet": s.snippet,
                    "score": final_score,  # Use enhanced score
                    "semantic_score": semantic_score,  # Keep original semantic score
                    # Enhanced structured data
                    "pdf_name": getattr(s, 'pdf_name', s.filename.replace('.pdf', '').replace('_', ' ').title()),
                    "section_heading": getattr(s, 'section_heading', s.title),
                    "section_content": getattr(s, 'section_content', s.text),
                    "section_id": s.section_id,
                    "relevance_reason": relevance_reason,
                    "confidence": self._calculate_confidence(final_score, semantic_score)
                }
            )
            
            seen_content.add(content_fingerprint)
        
        # Sort by enhanced score and return top k
        results.sort(key=lambda x: x["score"], reverse=True)
        return results[:k]
    
    def _generate_relevance_explanation(self, query_text: str, section: IndexedSection, score: float) -> str:
        """Generate a short explanation of why this section is relevant."""
        try:
            # Extract key terms from query
            query_terms = set(query_text.lower().split())
            query_terms = {term for term in query_terms if len(term) > 3}
            
            # Check content overlap
            content = getattr(section, 'section_content', section.text).lower()
            heading = getattr(section, 'section_heading', section.title).lower()
            
            # Find matching terms
            matching_terms = []
            for term in query_terms:
                if term in content or term in heading:
                    matching_terms.append(term)
            
            # Generate explanation based on score and matches
            if score > 0.8:
                if matching_terms:
                    return f"Highly relevant - contains: {', '.join(matching_terms[:3])}"
                return "Highly relevant - strong semantic match"
            elif score > 0.6:
                if matching_terms:
                    return f"Related content about {', '.join(matching_terms[:2])}"
                elif heading:
                    # Extract topic from heading
                    return f"Related section on {heading.split(':')[0].strip()[:30]}"
                return "Related topic with similar context"
            elif score > 0.4:
                if any(term in heading for term in query_terms):
                    return "Topic mentioned in heading"
                return "Potentially related - similar themes"
            else:
                return "Additional context on related topic"
                
        except:
            return "Related content"
    
    def _create_content_fingerprint(self, section: IndexedSection) -> str:
        """Create a content fingerprint for deduplication"""
        content = getattr(section, 'section_content', section.text) or ""
        # Create a hash of the first 300 characters for deduplication
        import hashlib
        content_preview = content[:300].strip().lower()
        return hashlib.md5(content_preview.encode()).hexdigest()[:16]
    
    def _calculate_enhanced_score(self, query_text: str, section: IndexedSection, semantic_score: float) -> float:
        """Calculate enhanced relevance score using multiple factors"""
        try:
            # Base semantic score
            score = semantic_score
            
            # 1. Keyword matching bonus (0.1 max)
            query_terms = set(query_text.lower().split())
            query_terms = {term for term in query_terms if len(term) > 2}
            
            content = getattr(section, 'section_content', section.text).lower()
            heading = getattr(section, 'section_heading', section.title).lower()
            
            keyword_matches = 0
            for term in query_terms:
                if term in content:
                    keyword_matches += 1
                if term in heading:
                    keyword_matches += 2  # Heading matches are more important
            
            keyword_bonus = min(0.1, keyword_matches * 0.02)
            score += keyword_bonus
            
            # 2. Content length bonus (0.05 max)
            content_length = len(content)
            if 100 <= content_length <= 1000:  # Optimal content length
                length_bonus = 0.05
            elif content_length > 1000:
                length_bonus = 0.02
            else:
                length_bonus = 0.0
            score += length_bonus
            
            # 3. Heading relevance bonus (0.05 max)
            if any(term in heading for term in query_terms):
                score += 0.05
            
            # 4. Semantic score weighting
            if semantic_score > 0.8:
                score *= 1.1  # Boost high semantic matches
            elif semantic_score < 0.4:
                score *= 0.9  # Reduce low semantic matches
            
            return min(1.0, max(0.0, score))  # Clamp between 0 and 1
            
        except:
            return semantic_score
    
    def _calculate_confidence(self, final_score: float, semantic_score: float) -> str:
        """Calculate confidence level for the match"""
        if final_score > 0.8:
            return "Very High"
        elif final_score > 0.6:
            return "High"
        elif final_score > 0.4:
            return "Medium"
        else:
            return "Low"
    
    def _generate_enhanced_relevance_explanation(self, query_text: str, section: IndexedSection, semantic_score: float, final_score: float) -> str:
        """Generate enhanced relevance explanation with more context"""
        try:
            # Extract key terms from query
            query_terms = set(query_text.lower().split())
            query_terms = {term for term in query_terms if len(term) > 2}
            
            # Check content overlap
            content = getattr(section, 'section_content', section.text).lower()
            heading = getattr(section, 'section_heading', section.title).lower()
            
            # Find matching terms
            matching_terms = []
            for term in query_terms:
                if term in content or term in heading:
                    matching_terms.append(term)
            
            # Generate explanation based on enhanced score
            if final_score > 0.8:
                if matching_terms:
                    return f"Highly relevant - contains key terms: {', '.join(matching_terms[:3])}"
                return "Highly relevant - strong semantic and contextual match"
            elif final_score > 0.6:
                if matching_terms:
                    return f"Strongly related - discusses: {', '.join(matching_terms[:2])}"
                elif heading:
                    return f"Related section on {heading.split(':')[0].strip()[:40]}"
                return "Strongly related topic with similar context"
            elif final_score > 0.4:
                if any(term in heading for term in query_terms):
                    return f"Topic '{', '.join([t for t in query_terms if t in heading][:2])}' mentioned in heading"
                return "Related topic with similar themes and context"
            else:
                if matching_terms:
                    return f"Potentially related - mentions: {', '.join(matching_terms[:2])}"
                return "Additional context on related topic"
                
        except:
            return "Related content with semantic similarity"


# Global singleton
_GLOBAL_INDEX: Optional[SemanticIndex] = None


def get_index() -> SemanticIndex:
    global _GLOBAL_INDEX
    if _GLOBAL_INDEX is None:
        _GLOBAL_INDEX = SemanticIndex()
    return _GLOBAL_INDEX


def reset_global_index():
    """Reset the global index cache - used for refresh functionality"""
    global _GLOBAL_INDEX
    _GLOBAL_INDEX = None


