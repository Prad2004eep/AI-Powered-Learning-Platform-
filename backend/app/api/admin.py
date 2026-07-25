from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from typing import List, Dict, Any
from datetime import datetime, timedelta
from app.database.database import get_db
from app.models.models import Source, ContentChunk, QuizQuestion, Student, QuizSession, StudentAnswer
from app.models.schemas import APIResponse
from app.services.quiz_generator import QuizGenerator

router = APIRouter()

@router.get("/admin/dashboard")
async def get_dashboard_stats(db: Session = Depends(get_db)):
    """
    Get overall platform statistics for admin dashboard.
    """
    try:
        # Basic counts
        total_sources = db.query(Source).count()
        total_chunks = db.query(ContentChunk).count()
        total_questions = db.query(QuizQuestion).count()
        total_students = db.query(Student).count()
        total_sessions = db.query(QuizSession).count()
        
        # Active students (last 7 days)
        seven_days_ago = datetime.utcnow() - timedelta(days=7)
        active_students = db.query(Student).filter(
            Student.last_active >= seven_days_ago
        ).count()
        
        # Questions by difficulty
        questions_by_difficulty = db.query(
            QuizQuestion.difficulty,
            func.count(QuizQuestion.id).label('count')
        ).group_by(QuizQuestion.difficulty).all()
        
        # Questions by type
        questions_by_type = db.query(
            QuizQuestion.question_type,
            func.count(QuizQuestion.id).label('count')
        ).group_by(QuizQuestion.question_type).all()
        
        # Recent activity
        recent_sessions = db.query(QuizSession).order_by(
            desc(QuizSession.start_time)
        ).limit(10).all()
        
        recent_activity = []
        for session in recent_sessions:
            student = db.query(Student).filter(Student.id == session.student_id).first()
            recent_activity.append({
                "session_id": session.id,
                "student_name": student.name if student else "Unknown",
                "subject": session.subject,
                "start_time": session.start_time,
                "questions_answered": session.questions_answered,
                "accuracy": (session.correct_answers / session.questions_answered * 100) if session.questions_answered > 0 else 0
            })
        
        # Top performing students
        top_students = db.query(
            Student.name,
            func.count(StudentAnswer.id).label('total_answers'),
            func.sum(func.cast(StudentAnswer.is_correct, int)).label('correct_answers')
        ).join(StudentAnswer).group_by(
            Student.id, Student.name
        ).order_by(
            desc(func.sum(func.cast(StudentAnswer.is_correct, int)))
        ).limit(5).all()
        
        top_performers = []
        for student_data in top_students:
            accuracy = (student_data.correct_answers / student_data.total_answers * 100) if student_data.total_answers > 0 else 0
            top_performers.append({
                "name": student_data.name,
                "total_answers": student_data.total_answers,
                "correct_answers": student_data.correct_answers,
                "accuracy": accuracy
            })
        
        return {
            "overview": {
                "total_sources": total_sources,
                "total_chunks": total_chunks,
                "total_questions": total_questions,
                "total_students": total_students,
                "total_sessions": total_sessions,
                "active_students": active_students
            },
            "questions_by_difficulty": [
                {"difficulty": diff[0], "count": diff[1]} 
                for diff in questions_by_difficulty
            ],
            "questions_by_type": [
                {"type": qtype[0], "count": qtype[1]} 
                for qtype in questions_by_type
            ],
            "recent_activity": recent_activity,
            "top_performers": top_performers
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get dashboard stats: {str(e)}")

@router.post("/admin/generate-quiz/{source_id}", response_model=APIResponse)
async def generate_quiz_for_source(
    source_id: str,
    question_count: int = 20,
    db: Session = Depends(get_db)
):
    """
    Generate quiz questions for a specific source.
    """
    try:
        # Verify source exists
        source = db.query(Source).filter(Source.id == source_id).first()
        if not source:
            raise HTTPException(status_code=404, detail="Source not found")
        
        # Get content chunks
        chunks = db.query(ContentChunk).filter(ContentChunk.source_id == source_id).all()
        if not chunks:
            raise HTTPException(status_code=404, detail="No content chunks found for this source")
        
        # Generate questions using quiz generator
        quiz_generator = QuizGenerator()
        generated_questions = await quiz_generator.generate_questions_from_chunks(chunks, question_count)
        
        # Save questions to database
        questions_created = 0
        for question_data in generated_questions:
            db_question = QuizQuestion(
                id=f"Q_{datetime.utcnow().strftime('%Y%m%d%H%M%S')}_{questions_created:03d}",
                source_id=source_id,
                chunk_id=question_data["chunk_id"],
                question=question_data["question"],
                question_type=question_data["question_type"],
                options=str(question_data.get("options", [])),
                correct_answer=question_data["correct_answer"],
                difficulty=question_data["difficulty"],
                explanation=question_data.get("explanation"),
                quality_score=question_data.get("quality_score", 0.0)
            )
            db.add(db_question)
            questions_created += 1
        
        db.commit()
        
        return APIResponse(
            success=True,
            message=f"Successfully generated {questions_created} quiz questions for source {source_id}",
            data={
                "source_id": source_id,
                "questions_created": questions_created,
                "chunks_used": len(chunks)
            }
        )
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to generate quiz: {str(e)}")

@router.get("/admin/questions")
async def get_all_questions(
    skip: int = 0,
    limit: int = 50,
    difficulty: str = None,
    subject: str = None,
    db: Session = Depends(get_db)
):
    """
    Get all quiz questions with optional filtering.
    """
    try:
        query = db.query(QuizQuestion).filter(QuizQuestion.is_active == True)
        
        if difficulty:
            query = query.filter(QuizQuestion.difficulty == difficulty)
        if subject:
            query = query.filter(QuizQuestion.source.has(subject=subject))
        
        questions = query.offset(skip).limit(limit).all()
        
        question_data = []
        for q in questions:
            question_data.append({
                "id": q.id,
                "question": q.question,
                "question_type": q.question_type,
                "difficulty": q.difficulty,
                "source_id": q.source_id,
                "chunk_id": q.chunk_id,
                "quality_score": q.quality_score,
                "created_at": q.created_at
            })
        
        return question_data
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get questions: {str(e)}")

@router.put("/admin/questions/{question_id}/quality")
async def update_question_quality(
    question_id: str,
    quality_score: float,
    db: Session = Depends(get_db)
):
    """
    Update the quality score of a question.
    """
    try:
        question = db.query(QuizQuestion).filter(QuizQuestion.id == question_id).first()
        if not question:
            raise HTTPException(status_code=404, detail="Question not found")
        
        question.quality_score = quality_score
        db.commit()
        
        return APIResponse(
            success=True,
            message=f"Question quality score updated to {quality_score}"
        )
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to update question quality: {str(e)}")

@router.delete("/admin/questions/{question_id}", response_model=APIResponse)
async def delete_question(question_id: str, db: Session = Depends(get_db)):
    """
    Deactivate a question (soft delete).
    """
    try:
        question = db.query(QuizQuestion).filter(QuizQuestion.id == question_id).first()
        if not question:
            raise HTTPException(status_code=404, detail="Question not found")
        
        question.is_active = False
        db.commit()
        
        return APIResponse(
            success=True,
            message=f"Question {question_id} deactivated successfully"
        )
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to delete question: {str(e)}")

@router.get("/admin/analytics")
async def get_analytics(db: Session = Depends(get_db)):
    """
    Get detailed analytics for the platform.
    """
    try:
        # Student performance over time
        last_30_days = datetime.utcnow() - timedelta(days=30)
        
        daily_sessions = db.query(
            func.date(QuizSession.start_time).label('date'),
            func.count(QuizSession.id).label('sessions'),
            func.avg(QuizSession.correct_answers / QuizSession.questions_answered * 100).label('avg_accuracy')
        ).filter(
            QuizSession.start_time >= last_30_days
        ).group_by(
            func.date(QuizSession.start_time)
        ).order_by(
            func.date(QuizSession.start_time)
        ).all()
        
        # Subject popularity
        subject_stats = db.query(
            QuizSession.subject,
            func.count(QuizSession.id).label('sessions'),
            func.count(func.distinct(QuizSession.student_id)).label('unique_students')
        ).filter(
            QuizSession.subject.isnot(None)
        ).group_by(QuizSession.subject).order_by(
            desc(func.count(QuizSession.id))
        ).all()
        
        # Difficulty progression analysis
        difficulty_stats = db.query(
            QuizQuestion.difficulty,
            func.count(StudentAnswer.id).label('attempts'),
            func.sum(func.cast(StudentAnswer.is_correct, int)).label('correct'),
            func.avg(StudentAnswer.response_time).label('avg_time')
        ).join(StudentAnswer).group_by(
            QuizQuestion.difficulty
        ).all()
        
        # Response time distribution
        response_time_buckets = [
            {"bucket": "0-5s", "min": 0, "max": 5},
            {"bucket": "5-10s", "min": 5, "max": 10},
            {"bucket": "10-20s", "min": 10, "max": 20},
            {"bucket": "20s+", "min": 20, "max": float('inf')}
        ]
        
        time_distribution = []
        for bucket in response_time_buckets:
            if bucket["max"] == float('inf'):
                count = db.query(StudentAnswer).filter(
                    StudentAnswer.response_time >= bucket["min"]
                ).count()
            else:
                count = db.query(StudentAnswer).filter(
                    StudentAnswer.response_time >= bucket["min"],
                    StudentAnswer.response_time < bucket["max"]
                ).count()
            
            time_distribution.append({
                "bucket": bucket["bucket"],
                "count": count
            })
        
        return {
            "daily_sessions": [
                {
                    "date": str(session.date),
                    "sessions": session.sessions,
                    "avg_accuracy": float(session.avg_accuracy) if session.avg_accuracy else 0
                }
                for session in daily_sessions
            ],
            "subject_popularity": [
                {
                    "subject": stat.subject,
                    "sessions": stat.sessions,
                    "unique_students": stat.unique_students
                }
                for stat in subject_stats
            ],
            "difficulty_stats": [
                {
                    "difficulty": stat.difficulty.value,
                    "attempts": stat.attempts,
                    "correct": stat.correct,
                    "accuracy": (stat.correct / stat.attempts * 100) if stat.attempts > 0 else 0,
                    "avg_response_time": float(stat.avg_time) if stat.avg_time else 0
                }
                for stat in difficulty_stats
            ],
            "response_time_distribution": time_distribution
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get analytics: {str(e)}")
