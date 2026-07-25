import re
import uuid
from typing import List, Dict, Any

class ChunkingService:
    """
    Service for splitting text into meaningful chunks for quiz generation.
    """
    
    def __init__(self):
        self.min_chunk_size = 100  # Minimum characters per chunk
        self.max_chunk_size = 500  # Maximum characters per chunk
        self.overlap_size = 50     # Overlap between chunks
    
    def chunk_text(self, text: str, source_id: str, grade: int = None, subject: str = None, topic: str = None) -> List[Dict[str, Any]]:
        """
        Split text into meaningful chunks with metadata.
        """
        try:
            # Preprocess text
            processed_text = self._preprocess_text(text)
            
            # Split into sentences
            sentences = self._split_into_sentences(processed_text)
            
            # Create chunks
            chunks = self._create_chunks(sentences, source_id, grade, subject, topic)
            
            return chunks
            
        except Exception as e:
            raise Exception(f"Text chunking failed: {str(e)}")
    
    def _preprocess_text(self, text: str) -> str:
        """
        Preprocess text for better chunking.
        """
        # Normalize whitespace
        text = re.sub(r'\s+', ' ', text)
        
        # Ensure proper spacing after punctuation
        text = re.sub(r'([.!?])\s*', r'\1 ', text)
        
        # Remove excessive whitespace
        text = re.sub(r'\s+', ' ', text)
        
        return text.strip()
    
    def _split_into_sentences(self, text: str) -> List[str]:
        """
        Split text into sentences using punctuation patterns.
        """
        # Simple sentence splitting - can be enhanced with NLP libraries
        sentences = re.split(r'(?<=[.!?])\s+', text)
        
        # Filter out empty sentences and very short ones
        sentences = [s.strip() for s in sentences if len(s.strip()) > 10]
        
        return sentences
    
    def _create_chunks(self, sentences: List[str], source_id: str, grade: int = None, subject: str = None, topic: str = None) -> List[Dict[str, Any]]:
        """
        Create chunks from sentences with optimal sizing.
        """
        chunks = []
        current_chunk = ""
        chunk_index = 0
        
        for i, sentence in enumerate(sentences):
            # Check if adding this sentence would exceed max chunk size
            if len(current_chunk) + len(sentence) > self.max_chunk_size and current_chunk:
                # Save current chunk if it meets minimum size
                if len(current_chunk) >= self.min_chunk_size:
                    chunk_data = self._create_chunk_data(
                        current_chunk.strip(),
                        source_id,
                        chunk_index,
                        grade,
                        subject,
                        topic
                    )
                    chunks.append(chunk_data)
                    chunk_index += 1
                
                # Start new chunk with overlap
                current_chunk = self._create_overlap_chunk(current_chunk, sentence)
            else:
                # Add sentence to current chunk
                current_chunk += " " + sentence if current_chunk else sentence
        
        # Don't forget the last chunk
        if current_chunk and len(current_chunk) >= self.min_chunk_size:
            chunk_data = self._create_chunk_data(
                current_chunk.strip(),
                source_id,
                chunk_index,
                grade,
                subject,
                topic
            )
            chunks.append(chunk_data)
        
        return chunks
    
    def _create_overlap_chunk(self, previous_chunk: str, new_sentence: str) -> str:
        """
        Create a new chunk with overlap from previous chunk.
        """
        # Get the last few words from previous chunk for context
        words = previous_chunk.split()
        overlap_words = words[-self.overlap_size:] if len(words) > self.overlap_size else words
        
        overlap_text = " ".join(overlap_words)
        return overlap_text + " " + new_sentence
    
    def _create_chunk_data(self, text: str, source_id: str, chunk_index: int, grade: int = None, subject: str = None, topic: str = None) -> Dict[str, Any]:
        """
        Create chunk data dictionary with metadata.
        """
        chunk_id = f"{source_id}_CH_{chunk_index:02d}"
        
        # Extract metadata from text
        extracted_metadata = self._extract_metadata_from_text(text)
        
        chunk_data = {
            "id": chunk_id,
            "source_id": source_id,
            "chunk_index": chunk_index,
            "text": text,
            "grade": grade or extracted_metadata.get("grade"),
            "subject": subject or extracted_metadata.get("subject"),
            "topic": topic or extracted_metadata.get("topic")
        }
        
        return chunk_data
    
    def _extract_metadata_from_text(self, text: str) -> Dict[str, Any]:
        """
        Extract metadata from text content.
        """
        metadata = {}
        
        # Look for grade indicators
        grade_patterns = [
            r'grade\s*(\d+)',
            r'Grade\s*(\d+)',
            r'level\s*(\d+)',
            r'Level\s*(\d+)'
        ]
        
        for pattern in grade_patterns:
            match = re.search(pattern, text)
            if match:
                metadata["grade"] = int(match.group(1))
                break
        
        # Look for subject indicators
        subject_keywords = {
            "mathematics": "Mathematics",
            "math": "Mathematics",
            "geometry": "Mathematics",
            "algebra": "Mathematics",
            "science": "Science",
            "physics": "Science",
            "chemistry": "Science",
            "biology": "Science",
            "history": "History",
            "geography": "Geography",
            "english": "English",
            "literature": "English",
            "grammar": "English"
        }
        
        text_lower = text.lower()
        for keyword, subject in subject_keywords.items():
            if keyword in text_lower:
                metadata["subject"] = subject
                break
        
        # Look for topic indicators
        topic_patterns = [
            r'(shapes|geometry|triangles|squares|circles)',
            r'(numbers|counting|addition|subtraction)',
            r'(measurement|length|weight|time)',
            r'(fractions|decimals|percentages)',
            r'(algebra|equations|variables)'
        ]
        
        for pattern in topic_patterns:
            match = re.search(pattern, text_lower)
            if match:
                metadata["topic"] = match.group(1).capitalize()
                break
        
        return metadata
    
    def get_chunk_statistics(self, chunks: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Get statistics about the generated chunks.
        """
        if not chunks:
            return {"total_chunks": 0}
        
        total_chunks = len(chunks)
        chunk_sizes = [len(chunk["text"]) for chunk in chunks]
        
        stats = {
            "total_chunks": total_chunks,
            "min_chunk_size": min(chunk_sizes),
            "max_chunk_size": max(chunk_sizes),
            "avg_chunk_size": sum(chunk_sizes) / total_chunks,
            "total_characters": sum(chunk_sizes)
        }
        
        # Subject distribution
        subjects = [chunk.get("subject") for chunk in chunks if chunk.get("subject")]
        subject_counts = {}
        for subject in subjects:
            subject_counts[subject] = subject_counts.get(subject, 0) + 1
        
        stats["subject_distribution"] = subject_counts
        
        # Grade distribution
        grades = [chunk.get("grade") for chunk in chunks if chunk.get("grade")]
        grade_counts = {}
        for grade in grades:
            grade_counts[grade] = grade_counts.get(grade, 0) + 1
        
        stats["grade_distribution"] = grade_counts
        
        return stats
