import React from 'react'
import Head from 'next/head'
import Link from 'next/link'
import HeroSection from '../components/HeroSection'
import FeaturesSection from '../components/FeaturesSection'
import HowItWorksSection from '../components/HowItWorksSection'
import Header from '../components/Header'
import Footer from '../components/Footer'

export default function Home() {
  return (
    <>
      <Head>
        <title>AI Adaptive Quiz Learning Platform - Learn Smarter</title>
        <meta name="description" content="Transform your learning with AI-powered adaptive quizzes that adjust to your level" />
        <meta name="keywords" content="adaptive learning, AI quiz, educational platform, personalized learning" />
      </Head>
      
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
        <Header />
        
        <main>
          <HeroSection />
          <FeaturesSection />
          <HowItWorksSection />
          
          {/* CTA Section */}
          <section className="py-20 bg-gradient-to-r from-primary-600 to-secondary-600 text-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <h2 className="text-4xl font-bold mb-4">Ready to Start Learning?</h2>
              <p className="text-xl mb-8 opacity-90">
                Join thousands of students who are already learning smarter with our adaptive platform
              </p>
              {/* CTA Buttons */}
              <div className="space-x-4">
                <Link href="/auth/login">
                  <span className="bg-white text-primary-600 hover:bg-gray-100 font-bold py-3 px-8 rounded-lg transition-colors duration-200 inline-block cursor-pointer">
                    Start Learning Now
                  </span>
                </Link>
                <Link href="/demo">
                  <span className="border-2 border-white text-white hover:bg-white hover:text-primary-600 font-bold py-3 px-8 rounded-lg transition-colors duration-200 inline-block cursor-pointer">
                    Try Demo
                  </span>
                </Link>
              </div>
            </div>
          </section>
        </main>
        
        <Footer />
      </div>
    </>
  )
}
