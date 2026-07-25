from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.models.models import Student
from app.models.schemas import Student as StudentSchema, StudentCreate, PerformanceMetrics
from app.services.supabase_service import supabase_service
from typing import Dict, Any, List
import uuid

router = APIRouter()

@router.post("/students", response_model=StudentSchema)
async def create_student(student: StudentCreate, db: Session = Depends(get_db)):
    """
    Create a new student.
    """
    try:
        # Create student in local database
        db_student = Student(
            id=str(uuid.uuid4()),
            name=student.name,
            email=student.email,
            grade=student.grade
        )
        db.add(db_student)
        db.commit()
        db.refresh(db_student)
        
        # Also create profile in Supabase
        supabase_result = await supabase_service.create_user_profile(
            user_id=db_student.id,
            name=student.name,
            email=student.email,
            role="student",
            grade=student.grade
        )
        
        if not supabase_result["success"]:
            # Rollback local database changes if Supabase fails
            db.delete(db_student)
            db.commit()
            raise HTTPException(status_code=500, detail=f"Failed to create Supabase profile: {supabase_result['error']}")
        
        return db_student
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create student: {str(e)}")

@router.get("/students", response_model=List[StudentSchema])
async def get_students(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """
    Get all students.
    """
    students = db.query(Student).offset(skip).limit(limit).all()
    return students

@router.get("/students/{student_id}", response_model=StudentSchema)
async def get_student(student_id: str, db: Session = Depends(get_db)):
    """
    Get student information.
    """
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return student

@router.get("/students/{student_id}/progress", response_model=PerformanceMetrics)
async def get_student_progress(student_id: str, db: Session = Depends(get_db)):
    """
    Get student performance metrics from Supabase.
    """
    try:
        # Get dashboard stats from Supabase
        stats = await supabase_service.get_user_dashboard_stats(student_id)
        
        # Get recent quiz sessions
        sessions = await supabase_service.get_user_quiz_sessions(student_id, limit=10)
        
        # Get achievements
        achievements = await supabase_service.get_user_achievements(student_id)
        
        # Get study streak
        streak = await supabase_service.get_user_study_streak(student_id)
        
        # Calculate performance metrics
        total_quizzes = len(sessions)
        completed_quizzes = len([s for s in sessions if s.get("status") == "completed"])
        average_accuracy = stats.get("average_accuracy", 0.0) if stats else 0.0
        current_streak = streak.get("current_streak", 0) if streak else 0
        average_response_time = float(avg_time_result) if avg_time_result else 0.0
        
        # Performance by topic
        topic_performance = db.query(
            QuizQuestion.source.has(topic=QuizQuestion.source.topic),
            func.count(StudentAnswer.id).label('total'),
            func.sum(func.cast(StudentAnswer.is_correct, int)).label('correct')
        ).join(StudentAnswer).filter(
            StudentAnswer.student_id == student_id
        ).group_by(QuizQuestion.source.has(topic=QuizQuestion.source.topic)).all()
        
        # Identify weak and strong topics
        weak_topics = []
        strong_topics = []
        
        for topic_data in topic_performance:
            if topic_data.total > 0:
                topic_accuracy = (topic_data.correct / topic_data.total) * 100
                topic_name = topic_data[0]  # topic name
                
                if topic_accuracy < 60:
                    weak_topics.append(topic_name)
                elif topic_accuracy > 80:
                    strong_topics.append(topic_name)
        
        # Difficulty progression over time
        difficulty_progression = db.query(
            QuizSession.current_level,
            func.count(QuizSession.id).label('sessions'),
            func.avg(QuizSession.correct_answers / QuizSession.questions_answered * 100).label('accuracy')
        ).filter(
            QuizSession.student_id == student_id,
            QuizSession.status == 'completed'
        ).group_by(QuizSession.current_level).order_by(QuizSession.current_level).all()
        
        progression_data = [
            {
                "level": prog.current_level,
                "sessions": prog.sessions,
                "accuracy": float(prog.accuracy) if prog.accuracy else 0.0
            }
            for prog in difficulty_progression
        ]
        
        return PerformanceMetrics(
            student_id=student_id,
            total_questions=total_answers,
            correct_answers=correct_answers,
            accuracy=accuracy,
            confidence_score=confidence_score,
            average_response_time=average_response_time,
            difficulty_progression=progression_data,
            weak_topics=weak_topics,
            strong_topics=strong_topics
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get student progress: {str(e)}")

@router.get("/students/{student_id}/sessions", response_model=List[Dict[str, Any]])
async def get_student_sessions(student_id: str, limit: int = 10, db: Session = Depends(get_db)):
    """
    Get recent quiz sessions for a student.
    """
    try:
        sessions = db.query(QuizSession).filter(
            QuizSession.student_id == student_id
        ).order_by(QuizSession.start_time.desc()).limit(limit).all()
        
        session_data = []
        for session in sessions:
            session_data.append({
                "session_id": session.id,
                "subject": session.subject,
                "topic": session.topic,
                "start_time": session.start_time,
                "end_time": session.end_time,
                "current_level": session.current_level,
                "questions_answered": session.questions_answered,
                "correct_answers": session.correct_answers,
                "accuracy": (session.correct_answers / session.questions_answered * 100) if session.questions_answered > 0 else 0,
                "status": session.status
            })
        
        return session_data
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get student sessions: {str(e)}")

@router.get("/students/{student_id}/recommendations")
async def get_recommendations(student_id: str, db: Session = Depends(get_db)):
    """
    Get personalized learning recommendations for a student.
    """
    try:
        # Get student's weak topics
        weak_topics_query = db.query(
            QuizQuestion.source.has(topic=QuizQuestion.source.topic),
            func.count(StudentAnswer.id).label('total'),
            func.sum(func.cast(StudentAnswer.is_correct, int)).label('correct')
        ).join(StudentAnswer).filter(
            StudentAnswer.student_id == student_id
        ).group_by(QuizQuestion.source.has(topic=QuizQuestion.source.topic)).all()
        
        weak_topics = []
        for topic_data in weak_topics_query:
            if topic_data.total > 0:
                topic_accuracy = (topic_data.correct / topic_data.total) * 100
                if topic_accuracy < 60:
                    weak_topics.append({
                        "topic": topic_data[0],
                        "accuracy": topic_accuracy,
                        "questions_needed": max(5, topic_data.total // 2)
                    })
        
        # Get recommended difficulty level
        recent_sessions = db.query(QuizSession).filter(
            QuizSession.student_id == student_id,
            QuizSession.status == 'completed'
        ).order_by(QuizSession.start_time.desc()).limit(5).all()
        
        if recent_sessions:
            avg_level = sum(session.current_level for session in recent_sessions) / len(recent_sessions)
            recommended_level = min(4, max(1, int(avg_level)))
        else:
            recommended_level = 1
        
        return {
            "student_id": student_id,
            "weak_topics": weak_topics,
            "recommended_difficulty_level": recommended_level,
            "focus_areas": [topic["topic"] for topic in weak_topics[:3]],
            "study_suggestions": [
                f"Focus on {topic['topic']} - current accuracy: {topic['accuracy']:.1f}%"
                for topic in weak_topics[:3]
            ]
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get recommendations: {str(e)}")

@router.put("/students/{student_id}/activity")
async def update_student_activity(student_id: str, db: Session = Depends(get_db)):
    """
    Update student's last activity timestamp.
    """
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    student.last_active = datetime.utcnow()
    db.commit()
    
    return APIResponse(
        success=True,
        message="Student activity updated successfully"
    )
