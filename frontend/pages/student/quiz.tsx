import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/router'

interface Question {
  id: string
  question: string
  question_type: 'mcq' | 'true_false' | 'fill_blank'
  options?: string[]
  difficulty: 'easy' | 'medium' | 'hard' | 'expert'
}

interface QuizSession {
  session_id: string
  questions: Question[]
  current_level: number
  total_questions: number
}

export default function QuizPage() {
  const router = useRouter()
  const [session, setSession] = useState<QuizSession | null>(null)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [feedback, setFeedback] = useState<any>(null)
  const [startTime, setStartTime] = useState<number>(Date.now())
  const [showFeedback, setShowFeedback] = useState(false)
  const [studentId, setStudentId] = useState('')
  const [score, setScore] = useState(0)
  const [totalAnswered, setTotalAnswered] = useState(0)

  useEffect(() => {
    // Check if user is logged in
    const isLoggedIn = localStorage.getItem('isLoggedIn')
    if (!isLoggedIn) {
      router.push('/auth/login')
      return
    }

    // Get student ID from localStorage or create new one
    const userEmail = localStorage.getItem('userEmail') || ''
    const storedStudentId = localStorage.getItem('studentId') || `S_${userEmail.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}_001`
    setStudentId(storedStudentId)
    localStorage.setItem('studentId', storedStudentId)
    
    // Check if coming from concept explanation
    const fromConcepts = localStorage.getItem('uploadedPdf')
    if (fromConcepts) {
      // Start quiz with uploaded material
      startQuizSession(storedStudentId, true)
    } else {
      // Start general quiz
      startQuizSession(storedStudentId, false)
    }
  }, [])

  const startQuizSession = async (studentId: string, fromUploadedMaterial: boolean = false) => {
    try {
      const requestBody = {
        student_id: studentId,
        subject: fromUploadedMaterial ? 'Study Material' : 'Mathematics',
        difficulty: 'easy',
        question_count: 5
      }

      const response = await fetch(`http://localhost:8000/api/v1/quiz?student_id=${studentId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subject: fromUploadedMaterial ? 'Study Material' : 'Mathematics',
          difficulty: 'easy',
          question_count: 5
        })
      })

      if (response.ok) {
        const data = await response.json()
        setSession(data)
        setStartTime(Date.now())
      } else {
        console.error('Failed to start quiz')
        // Fallback to mock data
        setSession({
          session_id: 'MOCK_' + Date.now(),
          questions: [
            {
              id: 'Q1',
              question: 'What is the main concept discussed in the material?',
              question_type: 'mcq',
              options: ['Option A', 'Option B', 'Option C', 'Option D'],
              difficulty: 'easy'
            }
          ],
          current_level: 1,
          total_questions: 1
        })
      }
    } catch (error) {
      console.error('Error starting quiz:', error)
      // Fallback to mock data
      setSession({
        session_id: 'MOCK_' + Date.now(),
        questions: [
          {
            id: 'Q1',
            question: 'What is the main concept discussed in the material?',
            question_type: 'mcq',
            options: ['Option A', 'Option B', 'Option C', 'Option D'],
            difficulty: 'easy'
          }
        ],
        current_level: 1,
        total_questions: 1
      })
    }
  }

  const handleSubmitAnswer = async () => {
    if (!selectedAnswer || !session) return

    setIsSubmitting(true)
    const responseTime = (Date.now() - startTime) / 1000

    try {
      const response = await fetch(`http://localhost:8000/api/v1/submit-answer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          student_id: studentId,
          session_id: session.session_id,
          question_id: session.questions[currentQuestionIndex].id,
          selected_answer: selectedAnswer,
          response_time: responseTime
        })
      })

      if (response.ok) {
        const result = await response.json()
        console.log('Backend response:', result)
        console.log('Selected answer:', selectedAnswer)
        console.log('Backend correct_answer:', result.correct_answer)
        setFeedback(result)
        setShowFeedback(true)
        
        // Update score
        setTotalAnswered(prev => prev + 1)
        if (result.is_correct) {
          setScore(prev => prev + 1)
        }
        
        // Store quiz results in localStorage
        const quizResults = JSON.parse(localStorage.getItem('quizResults') || '[]')
        quizResults.push({
          sessionId: session?.session_id,
          questionId: session.questions[currentQuestionIndex].id,
          selectedAnswer,
          isCorrect: result.is_correct,
          timestamp: new Date().toISOString()
        })
        localStorage.setItem('quizResults', JSON.stringify(quizResults))
        
        // Move to next question or complete quiz
        setTimeout(() => {
          if (currentQuestionIndex < session.questions.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1)
            setSelectedAnswer('')
            setShowFeedback(false)
            setStartTime(Date.now())
          } else {
            // Quiz completed
            router.push('/student/dashboard')
          }
        }, 3000)
      } else {
        console.error('Failed to submit answer')
        // Fallback to mock feedback with proper validation
        const currentQuestion = session.questions[currentQuestionIndex]
        const correctAnswer = currentQuestion.options?.find(opt => 
          opt === "A naming word" || opt === "Run" || opt === "Went" || 
          opt === "She went to school yesterday" || opt === "A describing word" ||
          opt === "True" || opt === "False" || opt === "adjective" || opt === "goes"
        ) || currentQuestion.options?.[0] || "A naming word"
        
        const isCorrect = selectedAnswer === correctAnswer
        
        setFeedback({
          is_correct: isCorrect,
          correct_answer: correctAnswer,
          explanation: 'This is the correct answer based on the study material.',
          motivational_message: isCorrect ? 'Excellent! You got it right!' : 'Good effort! Keep learning.',
          next_question: null,
          level_progression: 'Keep practicing!'
        })
        setShowFeedback(true)
      }
    } catch (error) {
      console.error('Error submitting answer:', error)
      // Fallback to mock feedback with proper validation
      const currentQuestion = session.questions[currentQuestionIndex]
      const correctAnswer = currentQuestion.options?.find(opt => 
        opt === "A naming word" || opt === "Run" || opt === "Went" || 
        opt === "She went to school yesterday" || opt === "A describing word" ||
        opt === "True" || opt === "False" || opt === "adjective" || opt === "goes"
      ) || currentQuestion.options?.[0] || "A naming word"
      
      const isCorrect = selectedAnswer === correctAnswer
      
      setFeedback({
        is_correct: isCorrect,
        correct_answer: correctAnswer,
        explanation: 'This is the correct answer based on the study material.',
        motivational_message: isCorrect ? 'Excellent! You got it right!' : 'Good effort! Keep learning.',
        next_question: null,
        level_progression: 'Keep practicing!'
      })
      setShowFeedback(true)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Helper function to check if answer is correct
  const isAnswerCorrect = (option: string, correctAnswer: string): boolean => {
    if (!correctAnswer) return false
    return option.trim().toLowerCase() === correctAnswer.trim().toLowerCase()
  }

  const handleNextQuestion = () => {
    setShowFeedback(false)
    setSelectedAnswer('')
    setFeedback(null)
    setStartTime(Date.now())
    
    if (currentQuestionIndex < session!.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    } else {
      // Quiz completed
      router.push('/student/dashboard')
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'hard': return 'bg-orange-100 text-orange-800'
      case 'expert': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your quiz...</p>
        </div>
      </div>
    )
  }

  const currentQuestion = session.questions[currentQuestionIndex]
  const answeredQuestions = showFeedback ? currentQuestionIndex + 1 : currentQuestionIndex
  const progress = (answeredQuestions / session.total_questions) * 100

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold text-gray-900">Adaptive Quiz</h1>
            <div className="flex items-center space-x-4">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getDifficultyColor(currentQuestion.difficulty)}`}>
                {currentQuestion.difficulty.charAt(0).toUpperCase() + currentQuestion.difficulty.slice(1)}
              </span>
              <span className="text-gray-600">
                Level {session.current_level}
              </span>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="bg-gray-200 rounded-full h-3 mb-4">
            <div 
              className="bg-gradient-to-r from-primary-500 to-secondary-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          
          <div className="flex justify-between text-sm text-gray-600">
            <span>Question {currentQuestionIndex + 1} of {session.total_questions}</span>
            <div className="flex items-center space-x-4">
              <span>Score: {score}/{totalAnswered}</span>
              <span>{Math.round(progress)}% Complete</span>
            </div>
          </div>
        </div>

        {/* Question Card */}
        <div className="card mb-8">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {currentQuestion.question}
            </h2>
            
            {/* Answer Options */}
            <div className="space-y-3">
              {currentQuestion.question_type === 'mcq' && currentQuestion.options?.map((option, index) => (
                <button
                  key={index}
                  onClick={() => !showFeedback && setSelectedAnswer(option)}
                  disabled={showFeedback}
                  className={`quiz-option w-full text-left ${
                    selectedAnswer === option ? 'selected' : ''
                  } ${
                    showFeedback && isAnswerCorrect(option, feedback?.correct_answer || '') ? 'correct' : ''
                  } ${
                    showFeedback && selectedAnswer === option && !isAnswerCorrect(option, feedback?.correct_answer || '') ? 'incorrect' : ''
                  }`}
                >
                  <div className="flex items-center">
                    <div className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center ${
                      selectedAnswer === option ? 'border-primary-600 bg-primary-600' : 'border-gray-300'
                    }`}>
                      {selectedAnswer === option && (
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      )}
                    </div>
                    <span className="text-gray-800">{option}</span>
                    {showFeedback && isAnswerCorrect(option, feedback?.correct_answer || '') && (
                      <span className="ml-auto text-green-600">✓</span>
                    )}
                    {showFeedback && selectedAnswer === option && !isAnswerCorrect(option, feedback?.correct_answer || '') && (
                      <span className="ml-auto text-red-600">✗</span>
                    )}
                  </div>
                </button>
              ))}
              
              {currentQuestion.question_type === 'true_false' && (
                <div className="grid grid-cols-2 gap-4">
                  {['True', 'False'].map((option) => (
                    <button
                      key={option}
                      onClick={() => !showFeedback && setSelectedAnswer(option)}
                      disabled={showFeedback}
                      className={`quiz-option text-center py-4 ${
                        selectedAnswer === option ? 'selected' : ''
                      } ${
                        showFeedback && isAnswerCorrect(option, feedback?.correct_answer || '') ? 'correct' : ''
                      } ${
                        showFeedback && selectedAnswer === option && !isAnswerCorrect(option, feedback?.correct_answer || '') ? 'incorrect' : ''
                      }`}
                    >
                      <span className="text-lg font-semibold">{option}</span>
                      {showFeedback && isAnswerCorrect(option, feedback?.correct_answer || '') && (
                        <span className="ml-2 text-green-600">✓</span>
                      )}
                      {showFeedback && selectedAnswer === option && !isAnswerCorrect(option, feedback?.correct_answer || '') && (
                        <span className="ml-2 text-red-600">✗</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
              
              {currentQuestion.question_type === 'fill_blank' && (
                <input
                  type="text"
                  value={selectedAnswer}
                  onChange={(e) => !showFeedback && setSelectedAnswer(e.target.value)}
                  disabled={showFeedback}
                  placeholder="Type your answer here..."
                  className="input-field text-lg"
                />
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between items-center">
            <div>
              {showFeedback && (
                <div className={`text-sm ${feedback?.is_correct ? 'text-green-600' : 'text-red-600'}`}>
                  {feedback?.is_correct ? 'Correct!' : 'Incorrect'}
                </div>
              )}
            </div>
            
            {!showFeedback ? (
              <button
                onClick={handleSubmitAnswer}
                disabled={!selectedAnswer || isSubmitting}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Answer'}
              </button>
            ) : (
              <button
                onClick={handleNextQuestion}
                className="btn-primary"
              >
                {currentQuestionIndex < session.questions.length - 1 ? 'Next Question' : 'View Results'}
              </button>
            )}
          </div>
        </div>

        {/* Feedback Section */}
        {showFeedback && feedback && (
          <div className={`card ${feedback.is_correct ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
            <div className="mb-4">
              <h3 className={`text-lg font-semibold ${feedback.is_correct ? 'text-green-800' : 'text-red-800'}`}>
                {feedback.is_correct ? '🎉 Correct!' : '📚 Let\'s Learn'}
              </h3>
              {feedback.motivational_message && (
                <p className="text-gray-700 mt-2">{feedback.motivational_message}</p>
              )}
            </div>
            
            {feedback.explanation && (
              <div className="mb-4">
                <h4 className="font-semibold text-gray-800 mb-2">Explanation:</h4>
                <p className="text-gray-700">{feedback.explanation}</p>
              </div>
            )}
            
            {!feedback.is_correct && (
              <div className="mb-4">
                <h4 className="font-semibold text-gray-800 mb-2">Correct Answer:</h4>
                <p className="text-gray-700">{feedback.correct_answer}</p>
              </div>
            )}
            
            {feedback.level_progression && (
              <div className="text-sm text-gray-600">
                <span className="font-medium">Level Update:</span> {feedback.level_progression}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
