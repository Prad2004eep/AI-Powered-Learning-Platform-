import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import Head from 'next/head'

interface DashboardStats {
  totalQuizzesAttended: number
  upcomingQuizzes: number
  averageScore: number
  bestScore: number
  subjects: Array<{
    name: string
    quizzesCompleted: number
    averageScore: number
    lastActivity: string
  }>
  recentPerformance: Array<{
    date: string
    subject: string
    score: number
    totalQuestions: number
  }>
}

interface ExpandedCard {
  studyMaterials: boolean
  progressReport: boolean
  achievements: boolean
}

export default function StudentDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [expandedCard, setExpandedCard] = useState<ExpandedCard>({
    studyMaterials: false,
    progressReport: false,
    achievements: false
  })
  const [showPdfUpload, setShowPdfUpload] = useState(false)

  useEffect(() => {
    // Check if user is logged in
    const isLoggedIn = localStorage.getItem('isLoggedIn')
    const userName = localStorage.getItem('userName')
    const userEmail = localStorage.getItem('userEmail')

    if (!isLoggedIn || !userName) {
      router.push('/auth/login')
      return
    }

    setUser({ name: userName, email: userEmail })
    
    // Load real quiz data from localStorage
    const loadQuizData = () => {
      const quizResults = JSON.parse(localStorage.getItem('quizResults') || '[]')
      const uploadedPdfs = JSON.parse(localStorage.getItem('uploadedPdfs') || '[]')
      
      // Calculate stats from real data
      const totalQuizzes = quizResults.length > 0 ? 1 : 0 // Count unique sessions
      const correctAnswers = quizResults.filter((result: any) => result.isCorrect).length
      const totalAnswers = quizResults.length
      const averageScore = totalAnswers > 0 ? (correctAnswers / totalAnswers) * 100 : 0
      const bestScore = Math.max(averageScore, 85.5) // For demo purposes
      
      setStats({
        totalQuizzesAttended: totalQuizzes,
        upcomingQuizzes: 3, // Static for now
        averageScore: averageScore,
        bestScore: bestScore,
        subjects: [
          {
            name: 'English Grammar',
            quizzesCompleted: totalQuizzes,
            averageScore: averageScore,
            lastActivity: quizResults.length > 0 ? 'Just now' : '2 hours ago'
          },
          {
            name: 'Mathematics',
            quizzesCompleted: 0,
            averageScore: 0,
            lastActivity: '1 day ago'
          },
          {
            name: 'Science',
            quizzesCompleted: 0,
            averageScore: 0,
            lastActivity: '3 days ago'
          }
        ],
        recentPerformance: quizResults.slice(-5).map((result: any) => ({
          date: new Date(result.timestamp).toLocaleDateString(),
          subject: 'English Grammar',
          score: result.isCorrect ? 100 : 0,
          totalQuestions: 1
        }))
      })
      setLoading(false)
    }
    
    loadQuizData()
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn')
    localStorage.removeItem('userName')
    localStorage.removeItem('userEmail')
    router.push('/')
  }

  const handleStartQuiz = () => {
    setShowPdfUpload(true)
  }

  const toggleCard = (card: keyof ExpandedCard) => {
    setExpandedCard(prev => ({
      ...prev,
      [card]: !prev[card]
    }))
  }

  const handlePdfUpload = async (file: File) => {
    try {
      // Create FormData for file upload
      const formData = new FormData()
      formData.append('file', file)
      formData.append('grade', '1')
      formData.append('subject', 'General')
      formData.append('topic', 'Study Material')

      // Upload PDF to backend
      const response = await fetch('http://localhost:8000/api/v1/ingest', {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        // Store PDF info in localStorage
        const uploadedPdfs = JSON.parse(localStorage.getItem('uploadedPdfs') || '[]')
        uploadedPdfs.push({
          id: Date.now().toString(),
          name: file.name,
          size: file.size,
          uploadDate: new Date().toISOString(),
          subject: 'English Grammar'
        })
        localStorage.setItem('uploadedPdfs', JSON.stringify(uploadedPdfs))
        
        // Store PDF name for concept explanation
        localStorage.setItem('uploadedPdf', file.name)
        setShowPdfUpload(false)
        router.push('/student/concept-explanation')
      } else {
        console.error('Upload failed')
        alert('Failed to upload PDF. Please try again.')
      }
    } catch (error) {
      console.error('Upload error:', error)
      alert('Error uploading PDF. Please check your connection.')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  if (!user || !stats) {
    return null
  }

  return (
    <>
      <Head>
        <title>Dashboard - QuizAI</title>
      </Head>
      
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <Link href="/">
                  <span className="text-2xl font-bold text-gradient cursor-pointer">
                    QuizAI
                  </span>
                </Link>
              </div>
              
              <div className="flex items-center space-x-4">
                <div 
                  className="relative group cursor-pointer"
                  onClick={() => router.push('/student/edit-profile')}
                >
                  {user.avatar ? (
                    <img 
                      src={user.avatar} 
                      alt={user.name}
                      className="w-10 h-10 rounded-full object-cover border-2 border-primary-200 group-hover:border-primary-400 transition-colors"
                    />
                  ) : (
                    <div className="bg-primary-100 text-primary-800 w-10 h-10 rounded-full flex items-center justify-center font-semibold border-2 border-primary-200 group-hover:border-primary-400 transition-colors">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 rounded-full transition-all flex items-center justify-center">
                    <svg className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                </div>
                <div className="relative group">
                  <button
                    onClick={handleLogout}
                    className="text-gray-500 hover:text-gray-700 text-sm flex items-center space-x-1"
                  >
                    <span>Logout</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Welcome Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome back, {user.name}! 👋
            </h1>
            <p className="text-gray-600 mt-2">
              Ready to continue your learning journey?
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="card card-hover text-center">
              <div className="text-3xl font-bold text-primary-600 mb-2">
                {stats.totalQuizzesAttended}
              </div>
              <div className="text-sm text-gray-600">Quizzes Attended</div>
            </div>
            
            <div className="card card-hover text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {stats.upcomingQuizzes}
              </div>
              <div className="text-sm text-gray-600">Upcoming Quizzes</div>
            </div>
            
            <div className="card card-hover text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {stats.averageScore}%
              </div>
              <div className="text-sm text-gray-600">Average Score</div>
            </div>
            
            <div className="card card-hover text-center">
              <div className="text-3xl font-bold text-yellow-600 mb-2">
                {stats.bestScore}%
              </div>
              <div className="text-sm text-gray-600">Best Score</div>
            </div>
          </div>

          {/* Action Button */}
          <div className="mb-8">
            <button
              onClick={handleStartQuiz}
              className="btn-primary text-lg px-8 py-4 shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200"
            >
              🚀 Start New Quiz
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Subjects Performance */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Subjects Performance</h3>
              <div className="space-y-4">
                {stats.subjects.map((subject, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">{subject.name}</h4>
                      <p className="text-sm text-gray-600">
                        {subject.quizzesCompleted} quizzes • {subject.lastActivity}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold text-primary-600">
                        {subject.averageScore}%
                      </div>
                      <div className="w-16 bg-gray-200 rounded-full h-2 mt-1">
                        <div
                          className="bg-primary-600 h-2 rounded-full"
                          style={{ width: `${subject.averageScore}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Performance */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Performance</h3>
              <div className="space-y-4">
                {stats.recentPerformance.map((performance, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">{performance.subject}</h4>
                      <p className="text-sm text-gray-600">{performance.date}</p>
                    </div>
                    <div className="text-right">
                      <div className={`text-lg font-semibold ${
                        performance.score >= 80 ? 'text-green-600' :
                        performance.score >= 60 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {performance.score}%
                      </div>
                      <p className="text-xs text-gray-500">
                        {performance.score}/{performance.totalQuestions * 10} pts
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* PDF Upload Modal */}
          {showPdfUpload && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-2xl p-8 max-w-lg w-full mx-4 transform transition-all">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Upload Study Material</h3>
                <p className="text-gray-600 mb-6">
                  Upload a PDF file to get started. Our AI will explain the concepts and then create a personalized quiz for you.
                </p>
                
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary-400 transition-colors">
                  <div className="text-4xl mb-4">📄</div>
                  <p className="text-gray-600 mb-4">
                    Drag and drop your PDF here, or click to browse
                  </p>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => e.target.files?.[0] && handlePdfUpload(e.target.files[0])}
                    className="hidden"
                    id="pdf-upload"
                  />
                  <label
                    htmlFor="pdf-upload"
                    className="btn-primary cursor-pointer inline-block"
                  >
                    Choose PDF File
                  </label>
                </div>
                
                <div className="mt-6 flex justify-end space-x-4">
                  <button
                    onClick={() => setShowPdfUpload(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div 
              className="card text-center cursor-pointer transform transition-all duration-200 hover:scale-105 hover:shadow-xl gpu-accelerated smooth-animation"
              onClick={() => toggleCard('studyMaterials')}
            >
              <div className="text-3xl mb-4">📚</div>
              <h4 className="font-semibold text-gray-900 mb-2">Study Materials</h4>
              <p className="text-sm text-gray-600">Access your study resources and notes</p>
              
              {expandedCard.studyMaterials && (
                <div className="mt-4 pt-4 border-t border-gray-200 text-left animate-fade-in">
                  <p className="text-sm text-gray-600 mb-2">
                    No study materials uploaded yet. Upload your first PDF to get started!
                  </p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowPdfUpload(true)
                      setExpandedCard(prev => ({ ...prev, studyMaterials: false }))
                    }}
                    className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                  >
                    Upload Material →
                  </button>
                </div>
              )}
            </div>
            
            <div 
              className="card text-center cursor-pointer transform transition-all duration-200 hover:scale-105 hover:shadow-xl gpu-accelerated smooth-animation"
              onClick={() => toggleCard('progressReport')}
            >
              <div className="text-3xl mb-4">📊</div>
              <h4 className="font-semibold text-gray-900 mb-2">Progress Report</h4>
              <p className="text-sm text-gray-600">View detailed analytics and insights</p>
              
              {expandedCard.progressReport && (
                <div className="mt-4 pt-4 border-t border-gray-200 text-left animate-fade-in">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Total Quizzes:</span>
                      <span className="font-medium">{stats?.totalQuizzesAttended || 0}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Average Score:</span>
                      <span className="font-medium">{stats?.averageScore || 0}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Best Score:</span>
                      <span className="font-medium">{stats?.bestScore || 0}%</span>
                    </div>
                  </div>
                  {stats?.totalQuizzesAttended === 0 && (
                    <p className="text-xs text-gray-500 mt-2 italic">
                      Start your first quiz to see your progress!
                    </p>
                  )}
                </div>
              )}
            </div>
            
            <div 
              className="card text-center cursor-pointer transform transition-all duration-200 hover:scale-105 hover:shadow-xl gpu-accelerated smooth-animation"
              onClick={() => toggleCard('achievements')}
            >
              <div className="text-3xl mb-4">🏆</div>
              <h4 className="font-semibold text-gray-900 mb-2">Achievements</h4>
              <p className="text-sm text-gray-600">Check your badges and milestones</p>
              
              {expandedCard.achievements && (
                <div className="mt-4 pt-4 border-t border-gray-200 text-left animate-fade-in">
                  <p className="text-sm text-gray-600 mb-2">
                    No achievements yet. Complete quizzes to earn badges!
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <span>🎯</span>
                      <span>First Quiz - Take your first quiz</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <span>🔥</span>
                      <span>On Fire - 3 quizzes in one day</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <span>⭐</span>
                      <span>Perfect Score - 100% on a quiz</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </>
  )
}
