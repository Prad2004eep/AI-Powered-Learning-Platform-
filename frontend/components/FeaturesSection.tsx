import React from 'react'

const FeaturesSection = () => {
  const features = [
    {
      icon: '🤖',
      title: 'AI-Powered Questions',
      description: 'Our advanced AI generates unique questions tailored to your learning style and pace.',
      color: 'from-blue-500 to-blue-600'
    },
    {
      icon: '📈',
      title: 'Adaptive Difficulty',
      description: 'Questions automatically adjust to your skill level, keeping you challenged but not overwhelmed.',
      color: 'from-green-500 to-green-600'
    },
    {
      icon: '⚡',
      title: 'Real-time Feedback',
      description: 'Get instant feedback with explanations and motivational messages to keep you engaged.',
      color: 'from-yellow-500 to-yellow-600'
    },
    {
      icon: '📊',
      title: 'Progress Tracking',
      description: 'Monitor your improvement with detailed analytics and performance insights.',
      color: 'from-purple-500 to-purple-600'
    },
    {
      icon: '🎯',
      title: 'Personalized Learning',
      description: 'Focus on your weak areas with customized recommendations and study plans.',
      color: 'from-red-500 to-red-600'
    },
    {
      icon: '🏆',
      title: 'Achievement System',
      description: 'Earn badges and certificates as you reach milestones and master new topics.',
      color: 'from-indigo-500 to-indigo-600'
    }
  ]

  return (
    <section id="features" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Features That Make Learning
            <span className="block text-gradient">Effective & Fun</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Our platform combines cutting-edge AI technology with proven learning methods 
            to create an educational experience that adapts to you.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="card card-hover text-center group"
            >
              {/* Icon */}
              <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r ${feature.color} text-white text-2xl mb-6 group-hover:scale-110 transition-transform duration-300`}>
                {feature.icon}
              </div>
              
              {/* Content */}
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                {feature.title}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* Additional Features */}
        <div className="mt-16 bg-gradient-to-r from-primary-50 to-secondary-50 rounded-2xl p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                More Than Just Quizzes
              </h3>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <span className="text-green-500 mr-3 mt-1">✓</span>
                  <span className="text-gray-700">Multi-subject support including Math, Science, History, and more</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-3 mt-1">✓</span>
                  <span className="text-gray-700">Gamified learning experience with points and rewards</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-3 mt-1">✓</span>
                  <span className="text-gray-700">Mobile-friendly design for learning on the go</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-3 mt-1">✓</span>
                  <span className="text-gray-700">Safe and secure environment for all ages</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-3 mt-1">✓</span>
                  <span className="text-gray-700">Regular content updates and new features</span>
                </li>
              </ul>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <h4 className="font-semibold text-gray-900 mb-4">Student Success Metrics</h4>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Average Improvement</span>
                    <span className="font-semibold text-green-600">+45%</span>
                  </div>
                  <div className="bg-gray-200 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{width: '85%'}}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Engagement Rate</span>
                    <span className="font-semibold text-blue-600">92%</span>
                  </div>
                  <div className="bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{width: '92%'}}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Retention Score</span>
                    <span className="font-semibold text-purple-600">78%</span>
                  </div>
                  <div className="bg-gray-200 rounded-full h-2">
                    <div className="bg-purple-500 h-2 rounded-full" style={{width: '78%'}}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default FeaturesSection
