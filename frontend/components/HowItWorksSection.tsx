import React from 'react'

const HowItWorksSection = () => {
  const steps = [
    {
      step: 1,
      title: 'Upload Content',
      description: 'Educators upload PDF materials or use existing content in our library.',
      icon: '📄',
      color: 'bg-blue-100 text-blue-600'
    },
    {
      step: 2,
      title: 'AI Processing',
      description: 'Our AI analyzes and extracts key concepts, creating structured knowledge chunks.',
      icon: '🤖',
      color: 'bg-green-100 text-green-600'
    },
    {
      step: 3,
      title: 'Question Generation',
      description: 'Intelligent questions are generated across multiple difficulty levels.',
      icon: '❓',
      color: 'bg-yellow-100 text-yellow-600'
    },
    {
      step: 4,
      title: 'Adaptive Learning',
      description: 'Students take quizzes that adapt to their performance in real-time.',
      icon: '🎯',
      color: 'bg-purple-100 text-purple-600'
    }
  ]

  return (
    <section id="how-it-works" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            How QuizAI
            <span className="block text-gradient">Transforms Learning</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Our intelligent system processes educational content and creates personalized 
            learning experiences that adapt to each student's needs.
          </p>
        </div>

        {/* Steps */}
        <div className="relative">
          {/* Connection Line */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-primary-200 to-secondary-200 transform -translate-y-1/2"></div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <div
                key={index}
                className="relative text-center group"
              >
                {/* Step Number */}
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-gradient-to-r from-primary-500 to-secondary-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow-lg">
                    {step.step}
                  </div>
                </div>
                
                {/* Card */}
                <div className="card card-hover mt-8">
                  {/* Icon */}
                  <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${step.color} text-2xl mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    {step.icon}
                  </div>
                  
                  {/* Content */}
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    {step.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Technical Details */}
        <div className="mt-16 bg-white rounded-2xl p-8 shadow-lg">
          <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            Behind the Magic
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-xl">🧠</span>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Machine Learning</h4>
              <p className="text-sm text-gray-600">
                Advanced algorithms analyze learning patterns and optimize difficulty progression
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-gradient-to-r from-green-500 to-green-600 text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-xl">📊</span>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Data Analytics</h4>
              <p className="text-sm text-gray-600">
                Real-time performance tracking provides insights into student progress
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-xl">🔄</span>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Continuous Learning</h4>
              <p className="text-sm text-gray-600">
                System improves with every interaction, becoming more personalized over time
              </p>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="mt-16 text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            Ready to Experience the Future of Learning?
          </h3>
          <p className="text-lg text-gray-600 mb-8">
            Join thousands of students and educators already using QuizAI
          </p>
          <div className="inline-flex bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-lg p-1">
            <button className="bg-white text-primary-600 font-semibold py-3 px-6 rounded-md mr-1 hover:bg-gray-50 transition-colors">
              Get Started Free
            </button>
            <button className="font-semibold py-3 px-6 rounded-md ml-1 hover:bg-white hover:bg-opacity-10 transition-colors">
              Schedule Demo
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

export default HowItWorksSection
