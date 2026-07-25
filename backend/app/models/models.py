from sqlalchemy import Column, Integer, String, Text, DateTime, Float, Boolean, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database.database import Base
import enum

class DifficultyLevel(enum.Enum):
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"
    EXPERT = "expert"

class QuestionType(enum.Enum):
    MCQ = "mcq"
    TRUE_FALSE = "true_false"
    FILL_BLANK = "fill_blank"

class Source(Base):
    __tablename__ = "sources"
    
    id = Column(String, primary_key=True, index=True)
    filename = Column(String, nullable=False)
    upload_date = Column(DateTime(timezone=True), server_default=func.now())
    grade = Column(Integer)
    subject = Column(String)
    topic = Column(String)
    status = Column(String, default="uploaded")  # uploaded, processing, completed, failed
    
    # Relationships
    content_chunks = relationship("ContentChunk", back_populates="source")
    quiz_questions = relationship("QuizQuestion", back_populates="source")

class ContentChunk(Base):
    __tablename__ = "content_chunks"
    
    id = Column(String, primary_key=True, index=True)
    source_id = Column(String, ForeignKey("sources.id"), nullable=False)
    chunk_index = Column(Integer, nullable=False)
    text = Column(Text, nullable=False)
    grade = Column(Integer)
    subject = Column(String)
    topic = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    source = relationship("Source", back_populates="content_chunks")
    quiz_questions = relationship("QuizQuestion", back_populates="content_chunk")

class QuizQuestion(Base):
    __tablename__ = "quiz_questions"
    
    id = Column(String, primary_key=True, index=True)
    source_id = Column(String, ForeignKey("sources.id"), nullable=False)
    chunk_id = Column(String, ForeignKey("content_chunks.id"), nullable=False)
    question = Column(Text, nullable=False)
    question_type = Column(Enum(QuestionType), nullable=False)
    options = Column(Text)  # JSON string for MCQ options
    correct_answer = Column(String, nullable=False)
    difficulty = Column(Enum(DifficultyLevel), nullable=False)
    explanation = Column(Text)
    quality_score = Column(Float, default=0.0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    is_active = Column(Boolean, default=True)
    
    # Relationships
    source = relationship("Source", back_populates="quiz_questions")
    content_chunk = relationship("ContentChunk", back_populates="quiz_questions")
    student_answers = relationship("StudentAnswer", back_populates="question")

class Student(Base):
    __tablename__ = "students"
    
    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True)
    grade = Column(Integer)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    last_active = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    quiz_sessions = relationship("QuizSession", back_populates="student")
    student_answers = relationship("StudentAnswer", back_populates="student")

class QuizSession(Base):
    __tablename__ = "quiz_sessions"
    
    id = Column(String, primary_key=True, index=True)
    student_id = Column(String, ForeignKey("students.id"), nullable=False)
    subject = Column(String)
    topic = Column(String)
    start_time = Column(DateTime(timezone=True), server_default=func.now())
    end_time = Column(DateTime(timezone=True))
    current_level = Column(Integer, default=1)
    questions_answered = Column(Integer, default=0)
    correct_answers = Column(Integer, default=0)
    total_response_time = Column(Float, default=0.0)
    status = Column(String, default="active")  # active, completed, abandoned
    
    # Relationships
    student = relationship("Student", back_populates="quiz_sessions")
    student_answers = relationship("StudentAnswer", back_populates="quiz_session")

class StudentAnswer(Base):
    __tablename__ = "student_answers"
    
    id = Column(String, primary_key=True, index=True)
    student_id = Column(String, ForeignKey("students.id"), nullable=False)
    session_id = Column(String, ForeignKey("quiz_sessions.id"), nullable=False)
    question_id = Column(String, ForeignKey("quiz_questions.id"), nullable=False)
    selected_answer = Column(String, nullable=False)
    is_correct = Column(Boolean, nullable=False)
    response_time = Column(Float, nullable=False)  # in seconds
    answered_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    student = relationship("Student", back_populates="student_answers")
    quiz_session = relationship("QuizSession", back_populates="student_answers")
    question = relationship("QuizQuestion", back_populates="student_answers")

class Embedding(Base):
    __tablename__ = "embeddings"
    
    id = Column(String, primary_key=True, index=True)
    content_type = Column(String, nullable=False)  # "chunk" or "question"
    content_id = Column(String, nullable=False)
    embedding_vector = Column(Text, nullable=False)  # JSON string
    model_name = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
