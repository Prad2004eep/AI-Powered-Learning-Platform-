import React, { useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import Head from 'next/head'

export default function DemoPage() {
  const router = useRouter()
  const [showDemoQuiz, setShowDemoQuiz] = useState(false)

  const startDemoQuiz = () => {
    // Store demo user info
    localStorage.setItem('userName', 'Demo User')
    localStorage.setItem('userEmail', 'demo@quizai.com')
    localStorage.setItem('isLoggedIn', 'true')
    localStorage.setItem('isDemo', 'true')
    
    // Redirect to quiz
    router.push('/student/quiz')
  }

  return (
    <>
      <Head>
        <title>Demo - QuizAI</title>
      </Head>
      
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <Link href="/">
                <span className="text-2xl font-bold text-gradient cursor-pointer">
                  QuizAI
                </span>
              </Link>
              <Link href="/auth/login">
                <span className="btn-primary">
                  Sign Up
                </span>
              </Link>
            </div>
          </div>
        </div>

        {/* Demo Content */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              See QuizAI in Action
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Watch our platform demo and experience adaptive learning
            </p>
          </div>

          {/* Video Section */}
          <div className="card mb-12">
            <div className="aspect-w-16 aspect-h-9 bg-gray-900 rounded-lg flex items-center justify-center">
              <div className="text-center text-white">
                <div className="text-6xl mb-4">▶️</div>
                <h3 className="text-2xl font-bold mb-2">Platform Demo Video</h3>
                <p className="text-gray-300 mb-6">
                  See how QuizAI adapts to your learning level in real-time
                </p>
                <button className="bg-white text-gray-900 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
                  Play Demo
                </button>
              </div>
            </div>
          </div>

          {/* Interactive Demo Option */}
          <div className="card">
            <div className="text-center">
              <div className="text-6xl mb-6">🚀</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Try Interactive Demo
              </h2>
              <p className="text-gray-600 mb-8">
                Take a quick 5-question demo quiz to experience our adaptive technology
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="text-center p-6 bg-blue-50 rounded-lg">
                  <div className="text-3xl mb-3">🎯</div>
                  <h3 className="font-semibold text-gray-900 mb-2">Adaptive Difficulty</h3>
                  <p className="text-sm text-gray-600">Questions adjust to your skill level in real-time</p>
                </div>
                
                <div className="text-center p-6 bg-green-50 rounded-lg">
                  <div className="text-3xl mb-3">⚡</div>
                  <h3 className="font-semibold text-gray-900 mb-2">Instant Feedback</h3>
                  <p className="text-sm text-gray-600">Get immediate explanations and motivational messages</p>
                </div>
                
                <div className="text-center p-6 bg-purple-50 rounded-lg">
                  <div className="text-3xl mb-3">📊</div>
                  <h3 className="font-semibold text-gray-900 mb-2">Performance Tracking</h3>
                  <p className="text-sm text-gray-600">See your progress and improvement areas</p>
                </div>
              </div>

              <button
                onClick={startDemoQuiz}
                className="btn-primary text-lg px-8 py-4 shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200"
              >
                Try Interactive Demo
              </button>
              
              <div className="mt-6">
                <Link href="/auth/login">
                  <span className="text-gray-600 hover:text-primary-600 cursor-pointer">
                    Or create an account for full access →
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Features Preview */}
        <div className="bg-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                What You'll Experience
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="flex items-start space-x-4">
                <div className="bg-primary-100 text-primary-600 w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="font-bold">1</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Smart Question Selection</h3>
                  <p className="text-gray-600">Our AI selects questions based on your current level</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="bg-primary-100 text-primary-600 w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="font-bold">2</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Real-time Adaptation</h3>
                  <p className="text-gray-600">Difficulty changes based on your answers</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="bg-primary-100 text-primary-600 w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="font-bold">3</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Personalized Feedback</h3>
                  <p className="text-gray-600">Get explanations tailored to your responses</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="bg-primary-100 text-primary-600 w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="font-bold">4</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Progress Insights</h3>
                  <p className="text-gray-600">See how you're improving over time</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
