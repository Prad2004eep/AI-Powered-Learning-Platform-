from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum

class DifficultyLevel(str, Enum):
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"
    EXPERT = "expert"

class QuestionType(str, Enum):
    MCQ = "mcq"
    TRUE_FALSE = "true_false"
    FILL_BLANK = "fill_blank"

# Source schemas
class SourceBase(BaseModel):
    filename: str
    grade: Optional[int] = None
    subject: Optional[str] = None
    topic: Optional[str] = None

class SourceCreate(SourceBase):
    pass

class Source(SourceBase):
    id: str
    upload_date: datetime
    status: str
    
    class Config:
        from_attributes = True

# Content Chunk schemas
class ContentChunkBase(BaseModel):
    text: str
    grade: Optional[int] = None
    subject: Optional[str] = None
    topic: Optional[str] = None

class ContentChunkCreate(ContentChunkBase):
    source_id: str
    chunk_index: int

class ContentChunk(ContentChunkBase):
    id: str
    source_id: str
    chunk_index: int
    created_at: datetime
    
    class Config:
        from_attributes = True

# Quiz Question schemas
class QuizQuestionBase(BaseModel):
    question: str
    question_type: QuestionType
    options: Optional[List[str]] = None
    correct_answer: str
    difficulty: DifficultyLevel
    explanation: Optional[str] = None

class QuizQuestionCreate(QuizQuestionBase):
    source_id: str
    chunk_id: str

class QuizQuestion(QuizQuestionBase):
    id: str
    source_id: str
    chunk_id: str
    quality_score: float
    created_at: datetime
    is_active: bool
    
    class Config:
        from_attributes = True

class QuizQuestionResponse(BaseModel):
    id: str
    question: str
    question_type: QuestionType
    options: Optional[List[str]] = None
    difficulty: DifficultyLevel
    
    class Config:
        from_attributes = True

# Student schemas
class StudentBase(BaseModel):
    name: str
    email: str
    grade: Optional[int] = None

class StudentCreate(StudentBase):
    pass

class Student(StudentBase):
    id: str
    created_at: datetime
    last_active: datetime
    
    class Config:
        from_attributes = True

# Quiz Session schemas
class QuizSessionBase(BaseModel):
    subject: Optional[str] = None
    topic: Optional[str] = None

class QuizSessionCreate(QuizSessionBase):
    student_id: str

class QuizSession(QuizSessionBase):
    id: str
    student_id: str
    start_time: datetime
    end_time: Optional[datetime] = None
    current_level: int
    questions_answered: int
    correct_answers: int
    total_response_time: float
    status: str
    
    class Config:
        from_attributes = True

# Student Answer schemas
class StudentAnswerBase(BaseModel):
    question_id: str
    selected_answer: str
    response_time: float

class StudentAnswerCreate(StudentAnswerBase):
    student_id: str
    session_id: str

class StudentAnswer(StudentAnswerBase):
    id: str
    student_id: str
    session_id: str
    is_correct: bool
    answered_at: datetime
    
    class Config:
        from_attributes = True

# Quiz Request/Response schemas
class QuizRequest(BaseModel):
    subject: Optional[str] = None
    topic: Optional[str] = None
    difficulty: Optional[DifficultyLevel] = None
    question_count: int = Field(default=5, ge=1, le=20)

class QuizResponse(BaseModel):
    session_id: str
    questions: List[QuizQuestionResponse]
    current_level: int
    total_questions: int

class AnswerSubmission(BaseModel):
    student_id: str
    session_id: str
    question_id: str
    selected_answer: str
    response_time: float

class AnswerResponse(BaseModel):
    is_correct: bool
    correct_answer: str
    explanation: Optional[str] = None
    motivational_message: Optional[str] = None
    next_question: Optional[QuizQuestionResponse] = None
    level_progression: Optional[str] = None

# Performance Metrics
class PerformanceMetrics(BaseModel):
    student_id: str
    total_questions: int
    correct_answers: int
    accuracy: float
    confidence_score: float
    average_response_time: float
    difficulty_progression: List[Dict[str, Any]]
    weak_topics: List[str]
    strong_topics: List[str]

# Ingestion schemas
class IngestionRequest(BaseModel):
    filename: str
    grade: Optional[int] = None
    subject: Optional[str] = None
    topic: Optional[str] = None

class IngestionResponse(BaseModel):
    source_id: str
    status: str
    message: str
    chunks_extracted: int = 0

# API Response schemas
class APIResponse(BaseModel):
    success: bool
    message: str
    data: Optional[Any] = None

class ErrorResponse(BaseModel):
    success: bool = False
    error: str
    details: Optional[str] = None
