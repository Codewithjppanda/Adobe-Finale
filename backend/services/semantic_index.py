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
    """Enhanced section extractor with performance optimizations."""
    
    def __init__(self):
        # Cache for processed PDFs to avoid re-processing
        self._processed_cache = {}
        # Batch processing for multiple files
        self._batch_size = 5
    
    def extract_sections(self, pdf_path: str) -> List[Tuple[str, int, str]]:
        # Check cache first
        cache_key = os.path.getmtime(pdf_path)  # Use file modification time as cache key
        if cache_key in self._processed_cache:
            print(f"⚡ CACHE HIT: Using cached sections for {os.path.basename(pdf_path)}")
            return self._processed_cache[cache_key]
        
        print(f"🔍 EXTRACTION: Starting extraction for {os.path.basename(pdf_path)}")
        
        try:
            from process_pdfs import OutlineExtractor
            extractor = OutlineExtractor()
            result = extractor.extract_outline(pdf_path)
            
            outline = result.get("outline", [])
            print(f"📋 EXTRACTION: Found {len(outline)} outline items")
            
            if not outline:
                print("⚠️  EXTRACTION: No outline found, using optimized fallback")
                sections = self._optimized_fallback_extraction(pdf_path)
            else:
                sections = self._extract_sections_from_outline(pdf_path, outline)
            
            # Cache the result
            self._processed_cache[cache_key] = sections
            print(f"✅ EXTRACTION: Extracted {len(sections)} sections (cached)")
            return sections
            
        except Exception as e:
            print(f"❌ EXTRACTION: Error with enhanced extraction: {e}")
            print(f"   Falling back to optimized extraction")
            sections = self._optimized_fallback_extraction(pdf_path)
            self._processed_cache[cache_key] = sections
            return sections
    
    def _extract_sections_from_outline(self, pdf_path: str, outline: list) -> List[Tuple[str, int, str]]:
        """Optimized outline-based extraction"""
        import fitz
        
        doc = fitz.open(pdf_path)
        sections = []
        
        # Process outline items in parallel batches
        for i, heading in enumerate(outline):
            title = heading.get("text", "").strip()
            page = heading.get("page", 1)
            
            # Extract content more efficiently
            content = self._extract_section_content_optimized(doc, heading, outline, i)
            if content and len(content.strip()) >= 30:  # Reduced minimum length
                sections.append((title, page, content.strip()))
        
        doc.close()
        return sections
    
    def _optimized_fallback_extraction(self, pdf_path: str) -> List[Tuple[str, int, str]]:
        """Ultra-fast fallback extraction for cooking recipes"""
        import fitz
        
        doc = fitz.open(pdf_path)
        sections = []
        
        # Extract text in larger chunks for speed
        chunk_size = 2000  # Increased from 1000
        overlap = 200      # Reduced overlap
        
        for page_num in range(len(doc)):
            page = doc[page_num]
            text = page.get_text()
            
            if len(text.strip()) < 50:  # Skip very short pages
                continue
            
            # Create sections based on content length
            if len(text) > chunk_size:
                # Split into chunks
                chunks = [text[i:i+chunk_size] for i in range(0, len(text), chunk_size-overlap)]
                for i, chunk in enumerate(chunks):
                    if len(chunk.strip()) >= 100:
                        title = f"Page {page_num + 1} Content (Part {i+1})"
                        sections.append((title, page_num + 1, chunk.strip()))
            else:
                # Single section for short pages
                title = f"Page {page_num + 1} Content"
                sections.append((title, page_num + 1, text.strip()))
        
        doc.close()
        return sections[:10]  # Limit to 10 sections for speed
    
    def _extract_section_content_optimized(self, doc: fitz.Document, heading: dict, all_headings: list, current_index: int) -> str:
        """Optimized content extraction with reduced processing"""
        current_page = heading.get("page", 1) - 1
        
        # Extract content from current page only for speed
        if current_page < len(doc):
            page = doc[current_page]
            text = page.get_text()
            
            # Simple content extraction - just get first 500 chars after heading
            lines = text.split('\n')
            heading_text = heading.get("text", "").strip()
            
            content_started = False
            content_lines = []
            
            for line in lines:
                if not content_started and heading_text in line:
                    content_started = True
                    continue
                if content_started and line.strip():
                    content_lines.append(line.strip())
                    if len('\n'.join(content_lines)) > 500:  # Limit content length
                        break
            
            return '\n'.join(content_lines[:200])  # Return first 200 chars
        
        return ""


class SemanticIndex:
    def __init__(self) -> None:
        print(f"🔧 Initializing SemanticIndex...")
        self.embedding = None
        if TextEmbedding is not None:
            try:
                # Use a better embedding model for improved accuracy
                self.embedding = TextEmbedding(
                    model_name="BAAI/bge-small-en-v1.5",  # Better model for semantic search
                    max_length=512,  # Optimal chunk size
                    cache_dir=os.path.join(INDEX_DIR, "embeddings_cache")
                )
                print("Using enhanced BGE embedding model for better accuracy")
            except Exception as e:
                print(f"Could not load BGE model: {e}")
                try:
                    # Fallback to default model
                    self.embedding = TextEmbedding()
                    print("Using default fastembed model")
                except Exception:
                    self.embedding = None
                print("No embedding model available, using fallback")

        # Dynamic vector dimension based on model
        self.vector_dim = 384  # Default fallback dimension
        if self.embedding:
            try:
                # Test embedding to get actual dimension
                test_emb = list(self.embedding.embed(["test"]))
                self.vector_dim = len(test_emb[0])
                print(f"Embedding model dimension: {self.vector_dim}")
            except:
                pass

        self.vectors: np.ndarray = np.empty((0, self.vector_dim), dtype=np.float32)
        self.sections: List[IndexedSection] = []
        
        # Load existing data (this is where old data gets loaded!)
        print(f"📂 Loading existing index data...")
        self._load()
        print(f"📊 Loaded {len(self.sections)} sections from disk")
        
        # Debug: Print some section info to identify old data
        if len(self.sections) > 0:
            print(f"🔍 Sample sections loaded:")
            for i, section in enumerate(self.sections[:3]):
                print(f"   {i+1}. {section.filename} - {section.title[:50]}...")

    def _index_meta_path(self) -> str:
        return os.path.join(INDEX_DIR, "index.json")

    def _index_vec_path(self) -> str:
        return os.path.join(INDEX_DIR, "vectors.npy")

    def _load(self) -> None:
        try:
            meta_path = self._index_meta_path()
            vec_path = self._index_vec_path()
            print(f"🔍 Checking for existing index files:")
            print(f"   Meta: {meta_path} (exists: {os.path.exists(meta_path)})")
            print(f"   Vectors: {vec_path} (exists: {os.path.exists(vec_path)})")
            
            if os.path.exists(meta_path) and os.path.exists(vec_path):
                with open(meta_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                self.sections = [IndexedSection(**x) for x in data.get("sections", [])]
                self.vectors = np.load(vec_path)
                print(f"✅ Loaded {len(self.sections)} sections from existing index")
            else:
                print("ℹ️  No existing index found - starting fresh")
        except Exception as e:
            print(f"⚠️  Error loading index, starting fresh: {e}")
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
        """Optimized document ingestion with batch processing"""
        print(f"🔄 Starting optimized ingestion for {len(items)} items...")
        
        extractor = EnhancedSectionExtractor()
        new_sections: List[IndexedSection] = []
        new_vectors: List[str] = []
        
        # Process files in batches for better performance
        batch_size = 3  # Process 3 files at a time
        
        for batch_start in range(0, len(items), batch_size):
            batch_end = min(batch_start + batch_size, len(items))
            batch_items = items[batch_start:batch_end]
            
            print(f"🔄 Processing batch {batch_start//batch_size + 1}: {len(batch_items)} files")
            
            for doc_id, path in batch_items:
                if not os.path.exists(path):
                    continue
                
                filename = os.path.basename(path)
                pdf_name = filename.replace(".pdf", "").replace("_", " ").title()
                
                # Extract sections with caching
                sections = extractor.extract_sections(path)
                
                # Create sections more efficiently
                for idx, (title, page, content) in enumerate(sections):
                    # Simplified section creation
                    section_id = f"{doc_id}_s{len(self.sections) + len(new_sections) + 1}"
                    
                    new_sections.append(
                        IndexedSection(
                            section_id=section_id,
                            doc_id=doc_id,
                            filename=filename,
                            page=page,
                            title=title,
                            text=content,
                            snippet=content[:300],  # Simplified snippet
                            vector_offset=0,
                            pdf_name=pdf_name,
                            section_heading=title,
                            section_content=content
                        )
                    )
                    
                    # Use title + first 200 chars for vectorization
                    combined_text = f"{title}. {content[:200]}"
                    new_vectors.append(combined_text)
        
        # Process embeddings in smaller batches for memory efficiency
        if len(new_vectors) >= 10:
            print(f"🔗 Processing embeddings for {len(new_vectors)} sections...")
            vecs = self._embed_texts(new_vectors)
            
            # Assign offsets
            base = int(self.vectors.shape[0])
            for i, s in enumerate(new_sections[-len(vecs):]):
                s.vector_offset = base + i
            
            # Append vectors
            if vecs.size > 0:
                if self.vectors.size == 0:
                    self.vectors = vecs
                else:
                    self.vectors = np.vstack([self.vectors, vecs])
        
        # Final embedding batch for remaining sections
        if new_vectors:
            print(f"🔗 Final embedding batch for {len(new_vectors)} sections...")
            vecs = self._embed_texts(new_vectors)
            
            base = int(self.vectors.shape[0])
            for i, s in enumerate(new_sections[-len(vecs):]):
                s.vector_offset = base + i
            
            if vecs.size > 0:
                if self.vectors.size == 0:
                    self.vectors = vecs
                else:
                    self.vectors = np.vstack([self.vectors, vecs])
        
        self.sections.extend(new_sections)
        
        # Save to disk
        print("💾 Saving optimized index to disk...")
        self._save()
        
        result = {"ingested": len(new_sections)}
        print(f"✅ Optimized ingestion completed: {result}")
        return result

    def query(self, text: str, k: int = 5) -> List[Dict[str, Any]]:
        print(f"🔍 Query started: '{text[:100]}...' (k={k})")
        print(f"📊 Current index state: {len(self.sections)} sections, {self.vectors.shape[0]} vectors")
        
        if not text or self.vectors.size == 0:
            print("❌ No text provided or no vectors in index")
            return []
        
        # Enhanced query processing
        query_text = text.strip()
        if len(query_text) < 3:
            print("❌ Query text too short")
            return []
        
        # Get semantic embeddings
        q = self._embed_texts([query_text])[0]
        
        # Calculate semantic similarity
        sims = (self.vectors @ q).astype(np.float32)
        print(f"📈 Similarity scores range: {sims.min():.3f} to {sims.max():.3f}")
        
        # Get more candidates for better diversity and accuracy
        candidates_k = min(k * 4, len(self.sections))
        idxs = np.argsort(-sims)[: max(1, candidates_k)]
        print(f"🎯 Top {len(idxs)} candidate scores: {[f'{sims[i]:.3f}' for i in idxs[:10]]}")
        
        results: List[Dict[str, Any]] = []
        seen_content = set()
        
        # CRITICAL FIX: Much lower threshold to catch any relevant content
        score_threshold = 0.05  # Lowered significantly from 0.15
        print(f"🎚️  Using score threshold: {score_threshold}")
        
        for i in idxs:
            if i < 0 or i >= len(self.sections):
                continue
            
            if len(results) >= k:
                break
            
            s = self.sections[i]
            semantic_score = float(sims[i])
            
            print(f"🔍 Evaluating section: '{s.title[:30]}...' from {s.filename} (semantic: {semantic_score:.3f})")
            
            # Enhanced scoring with multiple factors
            final_score = self._calculate_enhanced_score(
                query_text=query_text,
                section=s,
                semantic_score=semantic_score
            )
            
            print(f"   📊 Final score: {final_score:.3f} (threshold: {score_threshold})")
            
            # Skip if overall score is too low
            if final_score < score_threshold:
                print(f"   ❌ Skipped: score {final_score:.3f} below threshold {score_threshold}")
                continue
            
            # Create content fingerprint for deduplication
            content_fingerprint = self._create_content_fingerprint(s)
            
            # Skip if we've seen very similar content
            if content_fingerprint in seen_content:
                print(f"   ❌ Skipped: duplicate content")
                continue
            
            # Generate enhanced relevance explanation
            relevance_reason = self._generate_enhanced_relevance_explanation(
                query_text=query_text,
                section=s,
                semantic_score=semantic_score,
                final_score=final_score
            )
            
            print(f"   ✅ Added to results: {s.title[:30]}... (score: {final_score:.3f})")
            
            results.append(
                {
                    "docId": s.doc_id,
                    "filename": s.filename,
                    "page": s.page,
                    "title": s.title,
                    "snippet": s.snippet,
                    "score": final_score,
                    "semantic_score": semantic_score,
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
        final_results = results[:k]
        
        print(f"🎉 Query completed: {len(final_results)} results returned")
        for i, result in enumerate(final_results):
            print(f"   {i+1}. {result['filename']} - {result['title'][:30]}... (score: {result['score']:.3f})")
        
        return final_results
    
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


def clear_semantic_index_files():
    """
    Physically delete semantic index files from disk.
    This ensures a complete reset during refresh functionality.
    """
    try:
        import os
        
        # Define paths to index files
        index_meta_path = os.path.join(INDEX_DIR, "index.json")
        index_vec_path = os.path.join(INDEX_DIR, "vectors.npy")
        
        files_removed = 0
        errors = []
        
        # Remove index.json if it exists
        if os.path.exists(index_meta_path):
            try:
                os.remove(index_meta_path)
                files_removed += 1
                print(f"Removed semantic index metadata: {index_meta_path}")
            except Exception as e:
                error_msg = f"Failed to remove index.json: {e}"
                print(error_msg)
                errors.append(error_msg)
        
        # Remove vectors.npy if it exists
        if os.path.exists(index_vec_path):
            try:
                os.remove(index_vec_path)
                files_removed += 1
                print(f"Removed semantic index vectors: {index_vec_path}")
            except Exception as e:
                error_msg = f"Failed to remove vectors.npy: {e}"
                print(error_msg)
                errors.append(error_msg)
        
        # Also clear embeddings cache directory if it exists
        embeddings_cache_dir = os.path.join(INDEX_DIR, "embeddings_cache")
        if os.path.exists(embeddings_cache_dir):
            try:
                import shutil
                shutil.rmtree(embeddings_cache_dir)
                files_removed += 1
                print(f"Removed embeddings cache: {embeddings_cache_dir}")
            except Exception as e:
                error_msg = f"Failed to remove embeddings cache: {e}"
                print(error_msg)
                errors.append(error_msg)
        
        return {
            "index_files_removed": files_removed,
            "errors": errors if errors else None
        }
        
    except Exception as e:
        print(f"Error clearing semantic index files: {e}")
        return {
            "index_files_removed": 0,
            "errors": [f"Failed to clear index files: {str(e)}"]
        }


def reset_and_clear_index():
    """
    Complete reset: clear memory cache AND delete index files from disk.
    Used for refresh functionality to ensure complete cleanup.
    """
    # CRITICAL FIX: Clear files from disk FIRST, before creating new index
    print("🗑️  Clearing semantic index files from disk...")
    clear_result = clear_semantic_index_files()
    
    # Then, reset the global cache
    print("🧠 Resetting global index cache...")
    reset_global_index()
    
    # Finally, create a new empty index (it won't load anything since files are deleted)
    print("🆕 Creating new empty index...")
    idx = get_index()  # This will create a new empty index since files are deleted
    idx._save()  # Save the empty index to disk
    
    print("✅ Complete index reset finished")
    return clear_result


