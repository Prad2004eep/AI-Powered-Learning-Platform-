from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
import uuid
import random
from app.database.database import get_db
from app.models.models import QuizQuestion, QuizSession, StudentAnswer, Student
from app.models.schemas import (
    QuizRequest, QuizResponse, QuizQuestionResponse,
    AnswerSubmission, AnswerResponse, APIResponse
)
from app.services.quiz_generator import QuizGenerator
from app.services.adaptive_engine import AdaptiveEngine

router = APIRouter()

@router.post("/quiz", response_model=QuizResponse)
async def get_quiz(
    student_id: str,
    subject: str = "Study Material",
    difficulty: str = "easy",
    question_count: int = 5,
    db: Session = Depends(get_db)
):
    """
    Get quiz questions based on uploaded PDF content.
    """
    try:
        # Create quiz session
        session_id = f"QS_{uuid.uuid4().hex[:8].upper()}"
        
        # Try to get actual content from uploaded PDFs
        questions = []
        
        # Get content chunks from database to generate real questions
        try:
            from app.models.models import ContentChunk, Source
            from app.services.pdf_processor import PDFProcessor
            
            # Get chunks with source information
            chunks = db.query(ContentChunk).join(Source).order_by(ContentChunk.id).limit(10).all()
            
            if chunks:
                # Get PDF content information for enhanced question generation
                pdf_content_info = None
                if chunks and chunks[0].source:
                    source = chunks[0].source
                    pdf_content_info = {
                        "subject": source.subject or "General",
                        "grade_level": f"Grade {source.grade}" if source.grade else "Unknown",
                        "topics": source.topic.split(", ") if source.topic else [],
                        "confidence": 0.8
                    }
                
                # Use enhanced quiz generator
                quiz_generator = QuizGenerator()
                generated_questions = await quiz_generator.generate_questions_from_chunks(
                    chunks, question_count, pdf_content_info
                )
                
                # Convert generated questions to response format
                for q_data in generated_questions:
                    questions.append({
                        "id": q_data.get("id", f"Q_{uuid.uuid4().hex[:8].upper()}"),
                        "question": q_data.get("question", ""),
                        "question_type": q_data.get("question_type", "mcq"),
                        "options": q_data.get("options", {}),
                        "difficulty": q_data.get("difficulty", "easy"),
                        "correct_answer": q_data.get("correct_answer", ""),
                        "explanation": q_data.get("explanation", "")
                    })
            else:
                # Fallback to content-based questions if no chunks found
                questions = _generate_content_based_questions(subject)
        except Exception as e:
            print(f"Error accessing content chunks: {e}")
            questions = _generate_content_based_questions(subject)
        
        # Limit to requested count
        questions = questions[:question_count]
        
        # Convert to response format
        question_responses = []
        for q in questions:
            question_data = QuizQuestionResponse(
                id=q["id"],
                question=q["question"],
                question_type=q["question_type"],
                options=q["options"],
                difficulty=q["difficulty"]
            )
            question_responses.append(question_data)
        
        return QuizResponse(
            session_id=session_id,
            questions=question_responses,
            current_level=1,
            total_questions=len(question_responses)
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate quiz: {str(e)}")

def _generate_options_from_content(content: str) -> list:
    """Generate MCQ options based on content"""
    # Extract key terms from content
    words = content.split()[:20]  # Get first 20 words
    options = [
        "The main topic discussed in the content",
        "A supporting detail mentioned",
        "An unrelated concept",
        "A contradictory statement"
    ]
    return options

def _extract_key_concept(content: str) -> str:
    """Extract key concept from content"""
    # Simple extraction - first meaningful phrase
    sentences = content.split('.')
    if sentences:
        return "The main topic discussed in the content"
    return "The main topic"

def _generate_content_based_questions(subject: str) -> list:
    """Generate questions based on subject when no PDF content available"""
    if subject == "Study Material":
        return [
            {
                "id": f"Q_{uuid.uuid4().hex[:8].upper()}",
                "question": "What is a noun?",
                "question_type": "mcq",
                "options": ["A naming word", "An action word", "A describing word", "A connecting word"],
                "difficulty": "easy",
                "correct_answer": "A naming word"
            },
            {
                "id": f"Q_{uuid.uuid4().hex[:8].upper()}",
                "question": "Which of these is a verb?",
                "question_type": "mcq",
                "options": ["Book", "Run", "Beautiful", "Quickly"],
                "difficulty": "easy",
                "correct_answer": "Run"
            },
            {
                "id": f"Q_{uuid.uuid4().hex[:8].upper()}",
                "question": "A noun is a naming word.",
                "question_type": "true_false",
                "options": ["True", "False"],
                "difficulty": "easy",
                "correct_answer": "True"
            },
            {
                "id": f"Q_{uuid.uuid4().hex[:8].upper()}",
                "question": "Verbs always describe actions.",
                "question_type": "true_false",
                "options": ["True", "False"],
                "difficulty": "easy",
                "correct_answer": "False"
            },
            {
                "id": f"Q_{uuid.uuid4().hex[:8].upper()}",
                "question": "A _____ is a word that describes a noun.",
                "question_type": "fill_blank",
                "options": ["adjective", "verb", "noun", "pronoun"],
                "difficulty": "easy",
                "correct_answer": "adjective"
            },
            {
                "id": f"Q_{uuid.uuid4().hex[:8].upper()}",
                "question": "What is the past tense of 'go'?",
                "question_type": "mcq",
                "options": ["Went", "Gone", "Going", "Goes"],
                "difficulty": "easy",
                "correct_answer": "Went"
            },
            {
                "id": f"Q_{uuid.uuid4().hex[:8].upper()}",
                "question": "She _____ to school every day.",
                "question_type": "fill_blank",
                "options": ["goes", "go", "went", "going"],
                "difficulty": "easy",
                "correct_answer": "goes"
            },
            {
                "id": f"Q_{uuid.uuid4().hex[:8].upper()}",
                "question": "Which sentence is correct?",
                "question_type": "mcq",
                "options": [
                    "She go to school yesterday",
                    "She went to school yesterday",
                    "She going to school yesterday",
                    "She goes to school yesterday"
                ],
                "difficulty": "easy",
                "correct_answer": "She went to school yesterday"
            },
            {
                "id": f"Q_{uuid.uuid4().hex[:8].upper()}",
                "question": "The past tense of 'eat' is 'eated'.",
                "question_type": "true_false",
                "options": ["True", "False"],
                "difficulty": "easy",
                "correct_answer": "False"
            },
            {
                "id": f"Q_{uuid.uuid4().hex[:8].upper()}",
                "question": "What is an adjective?",
                "question_type": "mcq",
                "options": ["A describing word", "An action word", "A naming word", "A connecting word"],
                "difficulty": "easy",
                "correct_answer": "A describing word"
            }
        ]
    else:
        return [
            {
                "id": f"Q_{uuid.uuid4().hex[:8].upper()}",
                "question": f"What is the fundamental concept in {subject}?",
                "question_type": "mcq",
                "options": ["Basic principles", "Advanced theory", "Complex applications", "Specialized topics"],
                "difficulty": "easy",
                "correct_answer": "Basic principles"
            }
        ]

@router.post("/submit-answer", response_model=AnswerResponse)
async def submit_answer(
    student_id: str,
    session_id: str,
    question_id: str,
    selected_answer: str,
    response_time: float,
    db: Session = Depends(get_db)
):
    """
    Submit student answer and get adaptive response.
    """
    try:
        # Question database with explanations
        question_data = {
            "What is a noun?": {
                "correct_answer": "A naming word",
                "explanation": "A noun is a word that represents a person, place, thing, or idea. Examples: teacher, school, book, happiness."
            },
            "Which of these is a verb?": {
                "correct_answer": "Run",
                "explanation": "A verb is an action word or state of being. 'Run' shows action, while 'Book' is a noun, 'Beautiful' is an adjective, and 'Quickly' is an adverb."
            },
            "A noun is a naming word.": {
                "correct_answer": "True",
                "explanation": "This statement is correct. A noun is indeed a naming word that represents a person, place, thing, or idea."
            },
            "Verbs always describe actions.": {
                "correct_answer": "False",
                "explanation": "This statement is incorrect. Verbs can also describe states of being (like 'is', 'are', 'was') in addition to actions."
            },
            "A _____ is a word that describes a noun.": {
                "correct_answer": "adjective",
                "explanation": "An adjective is a word that describes or modifies a noun. Examples: beautiful, quick, happy, large."
            },
            "What is the past tense of 'go'?": {
                "correct_answer": "Went",
                "explanation": "'Go' is an irregular verb. Its past tense is 'went'. 'Gone' is the past participle, 'going' is the present participle, and 'goes' is the third person singular present."
            },
            "She _____ to school every day.": {
                "correct_answer": "goes",
                "explanation": "For third person singular present tense (she), we use 'goes'. The sentence indicates a daily routine, so we use present tense."
            },
            "Which sentence is correct?": {
                "correct_answer": "She went to school yesterday",
                "explanation": "For past tense actions that happened yesterday, we use the simple past tense 'went'. The other options have incorrect verb forms for past tense."
            },
            "The past tense of 'eat' is 'eated'.": {
                "correct_answer": "False",
                "explanation": "This is incorrect. 'Eat' is an irregular verb. The past tense is 'ate', not 'eated'. Regular verbs add '-ed', but irregular verbs have special forms."
            },
            "What is an adjective?": {
                "correct_answer": "A describing word",
                "explanation": "An adjective is a word that describes or modifies a noun or pronoun. Examples: beautiful, quick, happy, large."
            },
            "What are the main characteristics of living organisms?": {
                "correct_answer": "Organization and metabolism",
                "explanation": "All living organisms share seven characteristics: organization, metabolism, homeostasis, growth, reproduction, response, and adaptation. Organization and metabolism are fundamental processes."
            },
            "Which of the following is NOT a type of cell?": {
                "correct_answer": "Synthetic",
                "explanation": "The two main types of cells are prokaryotic (bacteria and archaea) and eukaryotic (plants, animals, fungi, and protists). Synthetic cells are artificially created."
            },
            "What is the function of the cell membrane?": {
                "correct_answer": "Controls what enters and leaves the cell",
                "explanation": "The cell membrane is a selectively permeable barrier that regulates the passage of substances into and out of the cell, maintaining internal balance."
            },
            "Which organelle is known as the powerhouse of the cell?": {
                "correct_answer": "Mitochondria",
                "explanation": "Mitochondria produce ATP (adenosine triphosphate) through cellular respiration, providing energy for cellular processes."
            },
            "What is homeostasis?": {
                "correct_answer": "Maintaining stable internal conditions",
                "explanation": "Homeostasis is the process by which living organisms maintain stable internal conditions (like temperature, pH, and water balance) despite environmental changes."
            },
            "What is 15 + 27?": {
                "correct_answer": "42",
                "explanation": "To add 15 and 27: 15 + 27 = 42. This is basic addition where you combine the two numbers to get their total sum."
            },
            "Which of the following is an even number?": {
                "correct_answer": "34",
                "explanation": "Even numbers are divisible by 2 without a remainder. 34 ÷ 2 = 17, making it even. The other options (17, 23, 45) are odd numbers."
            },
            "What is 8 × 7?": {
                "correct_answer": "56",
                "explanation": "8 × 7 = 56. This is multiplication where you add 8 to itself 7 times: 8 + 8 + 8 + 8 + 8 + 8 + 8 = 56."
            },
            "What is 100 ÷ 5?": {
                "correct_answer": "20",
                "explanation": "100 ÷ 5 = 20. Division is the inverse of multiplication. Since 5 × 20 = 100, the answer is 20."
            },
            "Which operation is the opposite of multiplication?": {
                "correct_answer": "Division",
                "explanation": "Division and multiplication are inverse operations. If 4 × 5 = 20, then 20 ÷ 5 = 4 and 20 ÷ 4 = 5."
            },
            "What is the smallest unit of life?": {
                "correct_answer": "Cell",
                "explanation": "The cell is the basic structural and functional unit of all living organisms. All living things are made of one or more cells."
            },
            "Which process do plants use to make their own food?": {
                "correct_answer": "Photosynthesis",
                "explanation": "Photosynthesis is the process by which plants convert sunlight, carbon dioxide, and water into glucose (food) and oxygen."
            },
            "What is the chemical formula for water?": {
                "correct_answer": "H2O",
                "explanation": "Water consists of two hydrogen atoms (H2) bonded to one oxygen atom (O), giving the chemical formula H2O."
            },
            "Which planet is known as the Red Planet?": {
                "correct_answer": "Mars",
                "explanation": "Mars appears red due to iron oxide (rust) on its surface, which gives it a reddish appearance when viewed from Earth."
            },
            "What is the largest organ in the human body?": {
                "correct_answer": "Skin",
                "explanation": "The skin is the body's largest organ, covering about 20 square feet in adults and serving as protection against external elements."
            }
        }
        
        # Find the correct answer and explanation
        correct_answer = "Option A"  # Default fallback
        explanation = "This is the correct answer based on the study material."
        
        # Get the actual question text from the database
        try:
            from app.models.models import QuizQuestion
            question_obj = db.query(QuizQuestion).filter(QuizQuestion.id == question_id).first()
            if question_obj:
                question_text = question_obj.question_text
                # Find matching question in our database
                for question, data in question_data.items():
                    if question_text == question:
                        correct_answer = data["correct_answer"]
                        explanation = data["explanation"]
                        break
        except Exception as e:
            print(f"Error fetching question from database: {e}")
        
        # Fallback: Try to match by question text directly
        if correct_answer == "Option A":
            # Get all questions from database to find the match
            try:
                questions = db.query(QuizQuestion).all()
                for q in questions:
                    if q.id == question_id:
                        for question, data in question_data.items():
                            if question in q.question_text or q.question_text in question:
                                correct_answer = data["correct_answer"]
                                explanation = data["explanation"]
                                break
                        break
            except Exception as e:
                print(f"Error in fallback matching: {e}")
        
        # Evaluate answer
        is_correct = selected_answer.strip().lower() == correct_answer.strip().lower()
        
        # Generate motivational message
        if is_correct:
            motivational_message = "Excellent! You've mastered this concept. Keep up the great work!"
        else:
            motivational_message = "Good effort! Review the explanation and try to understand the concept better."
        
        return AnswerResponse(
            is_correct=is_correct,
            correct_answer=correct_answer,
            explanation=explanation,
            motivational_message=motivational_message,
            next_question=None,
            level_progression="Continue practicing to improve!"
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to submit answer: {str(e)}")

@router.get("/quiz/{session_id}/status")
async def get_quiz_status(session_id: str, db: Session = Depends(get_db)):
    """
    Get current quiz session status.
    """
    session = db.query(QuizSession).filter(QuizSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Quiz session not found")
    
    return {
        "session_id": session.id,
        "current_level": session.current_level,
        "questions_answered": session.questions_answered,
        "correct_answers": session.correct_answers,
        "accuracy": (session.correct_answers / session.questions_answered * 100) if session.questions_answered > 0 else 0,
        "average_response_time": (session.total_response_time / session.questions_answered) if session.questions_answered > 0 else 0,
        "status": session.status
    }

@router.post("/quiz/{session_id}/complete", response_model=APIResponse)
async def complete_quiz(session_id: str, db: Session = Depends(get_db)):
    """
    Mark a quiz session as completed.
    """
    session = db.query(QuizSession).filter(QuizSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Quiz session not found")
    
    session.status = "completed"
    db.commit()
    
    return APIResponse(
        success=True,
        message="Quiz session completed successfully",
        data={
            "session_id": session_id,
            "total_questions": session.questions_answered,
            "correct_answers": session.correct_answers,
            "accuracy": (session.correct_answers / session.questions_answered * 100) if session.questions_answered > 0 else 0
        }
    )
