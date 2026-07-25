from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
import uuid
import json
from app.database.database import get_db
from app.models.models import Source, ContentChunk
from app.models.schemas import SourceCreate, Source as SourceSchema, IngestionRequest, IngestionResponse, APIResponse, ContentChunk as ContentChunkSchema
from app.services.pdf_processor import PDFProcessor
from app.services.chunking_service import ChunkingService
from app.services.learning_service import LearningService

router = APIRouter()

@router.post("/ingest", response_model=APIResponse)
async def ingest_pdf(
    file: UploadFile = File(...),
    grade: int = None,
    subject: str = None,
    topic: str = None,
    db: Session = Depends(get_db)
):
    """
    Upload and ingest a PDF file for quiz generation.
    """
    try:
        # Validate file type
        if not file.filename.endswith('.pdf'):
            raise HTTPException(status_code=400, detail="Only PDF files are allowed")
        
        # Generate source ID
        source_id = f"SRC_{uuid.uuid4().hex[:8].upper()}"
        
        # Create source record
        source_data = SourceCreate(
            filename=file.filename,
            grade=grade,
            subject=subject,
            topic=topic
        )
        
        db_source = Source(
            id=source_id,
            **source_data.dict(),
            status="processing"
        )
        db.add(db_source)
        db.commit()
        db.refresh(db_source)
        
        # Process PDF
        pdf_processor = PDFProcessor()
        extracted_text = await pdf_processor.extract_text(file)
        
        # Classify PDF content
        content_info = pdf_processor.classify_content(extracted_text, file.filename)
        
        # Use classified information if not provided
        detected_subject = content_info.get("subject", subject)
        detected_grade = content_info.get("grade_level", f"Grade {grade}" if grade else None)
        detected_topics = content_info.get("topics", [])
        
        # Update source with detected information
        if detected_subject and not subject:
            db_source.subject = detected_subject
        if detected_grade and not grade:
            # Extract grade number from detected grade
            grade_match = extracted_grade = ''.join(filter(str.isdigit, detected_grade))
            if grade_match:
                db_source.grade = int(grade_match)
        if detected_topics and not topic:
            db_source.topic = ', '.join(detected_topics[:3])  # Use top 3 topics
        
        # Clean and chunk text
        chunking_service = ChunkingService()
        chunks = chunking_service.chunk_text(extracted_text, source_id, db_source.grade, db_source.subject, db_source.topic)
        
        # Make AI learn from this PDF
        learning_service = LearningService()
        learning_result = learning_service.learn_from_pdf(content_info, chunks)
        
        # Save chunks to database
        chunk_count = 0
        for chunk_data in chunks:
            db_chunk = ContentChunk(**chunk_data)
            db.add(db_chunk)
            chunk_count += 1
        
        # Update source status
        db_source.status = "completed"
        db.commit()
        
        return APIResponse(
            success=True,
            message=f"Successfully ingested PDF: {file.filename}",
            data={
                "source_id": source_id,
                "chunks_extracted": chunk_count,
                "status": "completed",
                "detected_subject": detected_subject,
                "detected_grade": detected_grade,
                "detected_topics": detected_topics,
                "content_confidence": content_info.get("confidence", 0.0),
                "ai_learning": learning_result
            }
        )
        
    except Exception as e:
        # Update source status to failed if source exists
        if 'db_source' in locals():
            db_source.status = "failed"
            db.commit()
        
        raise HTTPException(status_code=500, detail=f"Ingestion failed: {str(e)}")

@router.get("/sources", response_model=List[SourceSchema])
async def get_sources(db: Session = Depends(get_db)):
    """
    Get all uploaded sources.
    """
    sources = db.query(Source).all()
    return sources

@router.get("/sources/{source_id}/chunks", response_model=List[ContentChunkSchema])
async def get_source_chunks(source_id: str, db: Session = Depends(get_db)):
    """
    Get all content chunks for a specific source.
    """
    chunks = db.query(ContentChunk).filter(ContentChunk.source_id == source_id).all()
    if not chunks:
        raise HTTPException(status_code=404, detail="No chunks found for this source")
    return chunks

@router.get("/learning-summary", response_model=APIResponse)
async def get_learning_summary():
    """
    Get AI learning summary and knowledge base status.
    """
    try:
        learning_service = LearningService()
        summary = learning_service.get_knowledge_summary()
        
        return APIResponse(
            success=True,
            message="AI learning summary retrieved successfully",
            data=summary
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get learning summary: {str(e)}")

@router.delete("/learning-cache", response_model=APIResponse)
async def clear_learning_cache():
    """
    Clear AI learning cache (for testing/reset purposes).
    """
    try:
        import os
        learning_service = LearningService()
        if os.path.exists(learning_service.learning_file):
            os.remove(learning_service.learning_file)
        
        return APIResponse(
            success=True,
            message="AI learning cache cleared successfully",
            data={"cache_cleared": True}
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to clear learning cache: {str(e)}")

@router.delete("/sources/{source_id}", response_model=APIResponse)
async def delete_source(source_id: str, db: Session = Depends(get_db)):
    """
    Delete a source and all its associated data.
    """
    source = db.query(Source).filter(Source.id == source_id).first()
    if not source:
        raise HTTPException(status_code=404, detail="Source not found")
    
    # Delete associated chunks (cascade will handle questions and answers)
    db.query(ContentChunk).filter(ContentChunk.source_id == source_id).delete()
    
    # Delete source
    db.delete(source)
    db.commit()
    
    return APIResponse(
        success=True,
        message=f"Source {source_id} and all associated data deleted successfully"
    )
