import random
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from app.models.models import QuizSession, QuizQuestion, DifficultyLevel, QuestionType
from app.models.schemas import QuizQuestionResponse

class AdaptiveEngine:
    """
    Service for managing adaptive quiz difficulty and student progression.
    """
    
    def __init__(self):
        self.motivational_messages = {
            "fast_correct": [
                "⚡ Great thinking!",
                "🔥 Fast learner!",
                "🚀 You're on fire!",
                "👏 Excellent speed!",
                "⭐ Brilliant work!",
                "🎯 Perfect timing!"
            ],
            "slow_correct": [
                "💡 Good thinking!",
                "🌟 Well done!",
                "👍 Nice work!",
                "✅ Correct!",
                "🎉 Great job!",
                "💪 Keep it up!"
            ],
            "fast_incorrect": [
                "🤔 Quick thinking, but let's try again!",
                "💭 Good attempt, take your time!",
                "🎯 Almost there, think carefully!",
                "📚 Close one, review the concept!",
                "🔍 Good try, double-check!",
                "⚖️ Nice effort, consider carefully!"
            ],
            "slow_incorrect": [
                "📖 Keep practicing!",
                "🎓 Learning takes time!",
                "🌱 You're improving!",
                "💪 Don't give up!",
                "📚 Every mistake helps you learn!",
                "🌟 Keep trying!"
            ]
        }
    
    def update_difficulty(self, session: QuizSession, is_correct: bool) -> Optional[str]:
        """
        Update difficulty level based on student performance.
        """
        try:
            # Get recent answers for this session
            recent_answers = session.student_answers[-5:] if hasattr(session, 'student_answers') else []
            
            # Level progression logic
            if is_correct:
                # Correct answer - check for level up
                if session.questions_answered % 5 == 0:  # Every 5 questions
                    recent_correct = sum(1 for ans in recent_answers[-5:] if ans.is_correct)
                    if recent_correct >= 4:  # 4/5 correct
                        if session.current_level < 4:
                            session.current_level += 1
                            return f"Level up! Now at Level {session.current_level}"
            else:
                # Incorrect answer - check for level down
                if session.questions_answered % 2 == 0:  # Every 2 questions
                    recent_incorrect = sum(1 for ans in recent_answers[-2:] if not ans.is_correct)
                    if recent_incorrect == 2:  # First 2 questions wrong
                        if session.current_level > 1:
                            session.current_level -= 1
                            return f"Level adjusted to Level {session.current_level} for review"
            
            return None
            
        except Exception as e:
            print(f"Error updating difficulty: {str(e)}")
            return None
    
    def get_motivational_message(self, is_correct: bool, response_time: float) -> str:
        """
        Get motivational message based on answer correctness and response time.
        """
        try:
            # Fast response = less than 5 seconds
            is_fast = response_time < 5.0
            
            if is_correct and is_fast:
                return random.choice(self.motivational_messages["fast_correct"])
            elif is_correct and not is_fast:
                return random.choice(self.motivational_messages["slow_correct"])
            elif not is_correct and is_fast:
                return random.choice(self.motivational_messages["fast_incorrect"])
            else:  # not correct and not fast
                return random.choice(self.motivational_messages["slow_incorrect"])
                
        except Exception:
            return "Keep up the great work!"
    
    def get_next_question(self, session: QuizSession, db: Session) -> Optional[QuizQuestionResponse]:
        """
        Get the next question based on adaptive difficulty and student performance.
        """
        try:
            # Determine difficulty based on current level
            difficulty_map = {
                1: DifficultyLevel.EASY,
                2: DifficultyLevel.MEDIUM,
                3: DifficultyLevel.HARD,
                4: DifficultyLevel.EXPERT
            }
            
            target_difficulty = difficulty_map.get(session.current_level, DifficultyLevel.EASY)
            
            # Get questions of appropriate difficulty
            # Prefer questions from topics the student struggles with
            weak_topics = self._get_weak_topics(session.student_id, db)
            
            query = db.query(QuizQuestion).filter(QuizQuestion.is_active == True)
            
            # Filter by difficulty
            if target_difficulty:
                query = query.filter(QuizQuestion.difficulty == target_difficulty)
            
            # Filter by weak topics if available
            if weak_topics and session.questions_answered > 3:
                # 70% chance to get question from weak topic
                if random.random() < 0.7:
                    query = query.filter(QuizQuestion.source.has(topic=weak_topics[0]))
            
            # Exclude questions already answered in this session
            answered_question_ids = [
                ans.question_id for ans in session.student_answers
            ] if hasattr(session, 'student_answers') else []
            
            if answered_question_ids:
                query = query.filter(QuizQuestion.id.notin_(answered_question_ids))
            
            # Get random question
            questions = query.all()
            if not questions:
                # Fallback to any difficulty if no questions found
                query = db.query(QuizQuestion).filter(QuizQuestion.is_active == True)
                if answered_question_ids:
                    query = query.filter(QuizQuestion.id.notin_(answered_question_ids))
                questions = query.limit(10).all()
            
            if not questions:
                return None
            
            selected_question = random.choice(questions)
            
            return QuizQuestionResponse(
                id=selected_question.id,
                question=selected_question.question,
                question_type=selected_question.question_type,
                options=eval(selected_question.options) if selected_question.options else None,
                difficulty=selected_question.difficulty
            )
            
        except Exception as e:
            print(f"Error getting next question: {str(e)}")
            return None
    
    def _get_weak_topics(self, student_id: str, db: Session) -> list:
        """
        Identify topics where the student needs improvement.
        """
        try:
            from sqlalchemy import func
            
            # Get performance by topic
            topic_performance = db.query(
                QuizQuestion.source.has(topic=QuizQuestion.source.topic),
                func.count(StudentAnswer.id).label('total'),
                func.sum(func.cast(StudentAnswer.is_correct, int)).label('correct')
            ).join(StudentAnswer).filter(
                StudentAnswer.student_id == student_id
            ).group_by(QuizQuestion.source.has(topic=QuizQuestion.source.topic)).all()
            
            weak_topics = []
            for perf in topic_performance:
                if perf.total > 0:
                    accuracy = (perf.correct / perf.total) * 100
                    if accuracy < 70:  # Below 70% accuracy
                        weak_topics.append(perf[0])
            
            return weak_topics[:3]  # Return top 3 weak topics
            
        except Exception as e:
            print(f"Error identifying weak topics: {str(e)}")
            return []
    
    def calculate_confidence_score(self, session: QuizSession) -> float:
        """
        Calculate student's confidence score based on recent performance.
        """
        try:
            if session.questions_answered == 0:
                return 0.0
            
            # Base confidence on accuracy
            accuracy = session.correct_answers / session.questions_answered
            
            # Adjust for response time (faster correct answers increase confidence)
            avg_response_time = session.total_response_time / session.questions_answered
            time_bonus = max(0, (10 - avg_response_time) / 20)  # Bonus for fast responses
            
            # Adjust for difficulty level
            difficulty_bonus = (session.current_level - 1) * 0.1
            
            confidence = accuracy + time_bonus + difficulty_bonus
            return min(confidence, 1.0)
            
        except Exception:
            return 0.5  # Default confidence
    
    def recommend_study_focus(self, student_id: str, db: Session) -> Dict[str, Any]:
        """
        Recommend areas for study focus based on performance.
        """
        try:
            weak_topics = self._get_weak_topics(student_id, db)
            
            # Get recent session performance
            recent_sessions = db.query(QuizSession).filter(
                QuizSession.student_id == student_id,
                QuizSession.status == 'completed'
            ).order_by(QuizSession.start_time.desc()).limit(5).all()
            
            recommendations = {
                "focus_topics": weak_topics,
                "recommended_difficulty": 1,
                "study_suggestions": []
            }
            
            if recent_sessions:
                avg_level = sum(s.current_level for s in recent_sessions) / len(recent_sessions)
                recommendations["recommended_difficulty"] = max(1, int(avg_level))
            
            # Generate study suggestions
            for topic in weak_topics[:3]:
                suggestions = [
                    f"Review {topic} fundamentals",
                    f"Practice more {topic} problems",
                    f"Study {topic} examples and explanations"
                ]
                recommendations["study_suggestions"].extend(suggestions)
            
            return recommendations
            
        except Exception as e:
            print(f"Error generating recommendations: {str(e)}")
            return {
                "focus_topics": [],
                "recommended_difficulty": 1,
                "study_suggestions": ["Continue practicing to improve your skills!"]
            }
    
    def get_performance_trend(self, student_id: str, db: Session) -> Dict[str, Any]:
        """
        Analyze performance trend over time.
        """
        try:
            from sqlalchemy import func, desc
            from datetime import datetime, timedelta
            
            # Get last 30 days of sessions
            thirty_days_ago = datetime.utcnow() - timedelta(days=30)
            
            sessions = db.query(QuizSession).filter(
                QuizSession.student_id == student_id,
                QuizSession.start_time >= thirty_days_ago,
                QuizSession.status == 'completed'
            ).order_by(QuizSession.start_time).all()
            
            if not sessions:
                return {"trend": "insufficient_data"}
            
            # Calculate trend
            accuracies = []
            for session in sessions:
                if session.questions_answered > 0:
                    accuracy = session.correct_answers / session.questions_answered
                    accuracies.append(accuracy)
            
            if len(accuracies) < 2:
                return {"trend": "insufficient_data"}
            
            # Simple trend calculation
            recent_avg = sum(accuracies[-5:]) / len(accuracies[-5:])
            earlier_avg = sum(accuracies[:-5]) / len(accuracies[:-5]) if len(accuracies) > 5 else accuracies[0]
            
            if recent_avg > earlier_avg + 0.1:
                trend = "improving"
            elif recent_avg < earlier_avg - 0.1:
                trend = "declining"
            else:
                trend = "stable"
            
            return {
                "trend": trend,
                "recent_accuracy": recent_avg,
                "earlier_accuracy": earlier_avg,
                "total_sessions": len(sessions),
                "improvement_rate": recent_avg - earlier_avg
            }
            
        except Exception as e:
            print(f"Error analyzing performance trend: {str(e)}")
            return {"trend": "error"}
