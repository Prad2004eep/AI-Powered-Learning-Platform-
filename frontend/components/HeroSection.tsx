import React from 'react'
import Link from 'next/link'

const HeroSection = () => {
  return (
    <section className="relative py-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary-100 via-transparent to-secondary-100 opacity-50"></div>
      
      <div className="relative max-w-7xl mx-auto">
        <div className="text-center">
          {/* Badge */}
          <div className="inline-flex items-center bg-primary-100 text-primary-800 rounded-full px-4 py-2 text-sm font-medium mb-6 bounce-in">
            <span className="mr-2">🚀</span>
            New: AI-Powered Adaptive Learning
          </div>
          
          {/* Main Heading */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 fade-in">
            Learn Smarter with
            <span className="block text-gradient">AI Adaptive Quizzes</span>
          </h1>
          
          {/* Subheading */}
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto slide-up">
            Experience personalized learning that adapts to your level in real-time. 
            Our AI-powered platform creates the perfect quiz difficulty just for you, 
            helping you learn faster and retain knowledge longer.
          </p>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link href="/auth/signup">
              <span className="btn-primary text-lg px-8 py-4 shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200 inline-block cursor-pointer">
                Start Learning Free
              </span>
            </Link>
            <Link href="/auth/login">
              <span className="btn-outline text-lg px-8 py-4 inline-block cursor-pointer">
                Watch Demo
              </span>
            </Link>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-3xl mx-auto">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary-600 mb-2">10K+</div>
              <div className="text-gray-600">Active Students</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-secondary-600 mb-2">95%</div>
              <div className="text-gray-600">Success Rate</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary-600 mb-2">50K+</div>
              <div className="text-gray-600">Questions Generated</div>
            </div>
          </div>
        </div>
        
        {/* Hero Image/Illustration */}
        <div className="mt-16 relative">
          <div className="bg-gradient-to-r from-primary-500 to-secondary-500 rounded-2xl p-1 shadow-2xl">
            <div className="bg-white rounded-2xl p-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Sample Quiz Cards */}
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                  <div className="flex items-center mb-3">
                    <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">Math</span>
                    <span className="ml-auto text-xs text-gray-500">Level 1</span>
                  </div>
                  <h3 className="font-semibold text-gray-800 mb-2">Basic Geometry</h3>
                  <p className="text-sm text-gray-600">How many sides does a triangle have?</p>
                </div>
                
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
                  <div className="flex items-center mb-3">
                    <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">Science</span>
                    <span className="ml-auto text-xs text-gray-500">Level 2</span>
                  </div>
                  <h3 className="font-semibold text-gray-800 mb-2">Plant Biology</h3>
                  <p className="text-sm text-gray-600">What is photosynthesis?</p>
                </div>
                
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
                  <div className="flex items-center mb-3">
                    <span className="bg-purple-500 text-white text-xs px-2 py-1 rounded-full">History</span>
                    <span className="ml-auto text-xs text-gray-500">Level 3</span>
                  </div>
                  <h3 className="font-semibold text-gray-800 mb-2">World History</h3>
                  <p className="text-sm text-gray-600">When did World War II end?</p>
                </div>
              </div>
              
              {/* Progress Indicator */}
              <div className="mt-6 bg-gray-100 rounded-full h-2">
                <div className="bg-gradient-to-r from-primary-500 to-secondary-500 h-2 rounded-full" style={{width: '65%'}}></div>
              </div>
              <p className="text-center text-sm text-gray-600 mt-2">Your Progress: 65% Complete</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default HeroSection
