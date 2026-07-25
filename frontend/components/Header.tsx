import React, { useState, useEffect } from 'react'
import Link from 'next/link'

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userName, setUserName] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)

  useEffect(() => {
    const loggedIn = localStorage.getItem('isLoggedIn')
    const name = localStorage.getItem('userName')
    setIsLoggedIn(!!loggedIn)
    setUserName(name || '')
  }, [])

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/">
              <span className="text-2xl font-bold text-gradient cursor-pointer">
                QuizAI
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/#features">
              <span className="text-gray-700 hover:text-primary-600 transition-colors cursor-pointer">
                Features
              </span>
            </Link>
            <Link href="/#how-it-works">
              <span className="text-gray-700 hover:text-primary-600 transition-colors cursor-pointer">
                How It Works
              </span>
            </Link>
            <Link href="/demo">
              <span className="text-gray-700 hover:text-primary-600 transition-colors cursor-pointer">
                Demo
              </span>
            </Link>
            
            {isLoggedIn ? (
              <div className="flex items-center space-x-4">
                <Link href="/student/dashboard">
                  <span className="text-gray-700 hover:text-primary-600 transition-colors cursor-pointer">
                    Dashboard
                  </span>
                </Link>
                <div className="flex items-center space-x-2">
                  <div className="bg-primary-100 text-primary-800 w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm">
                    {userName.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-gray-700">{userName}</span>
                </div>
              </div>
            ) : (
              <div className="relative">
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="btn-primary flex items-center space-x-2"
                >
                  <span>Login/Signup</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {showDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                    <Link href="/auth/login">
                      <span className="block px-4 py-2 text-gray-700 hover:bg-gray-100 cursor-pointer">
                        Login
                      </span>
                    </Link>
                    <Link href="/auth/signup">
                      <span className="block px-4 py-2 text-gray-700 hover:bg-gray-100 cursor-pointer">
                        Create Account
                      </span>
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-700 hover:text-primary-600 focus:outline-none"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <div className="flex flex-col space-y-3">
              <Link href="/#features">
                <span className="text-gray-700 hover:text-primary-600 transition-colors cursor-pointer">
                  Features
                </span>
              </Link>
              <Link href="/#how-it-works">
                <span className="text-gray-700 hover:text-primary-600 transition-colors cursor-pointer">
                  How It Works
                </span>
              </Link>
              <Link href="/demo">
                <span className="text-gray-700 hover:text-primary-600 transition-colors cursor-pointer">
                  Demo
                </span>
              </Link>
              
              {isLoggedIn ? (
                <>
                  <Link href="/student/dashboard">
                    <span className="text-gray-700 hover:text-primary-600 transition-colors cursor-pointer">
                      Dashboard
                    </span>
                  </Link>
                  <div className="flex items-center space-x-2 pt-2">
                    <div className="bg-primary-100 text-primary-800 w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm">
                      {userName.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm font-medium text-gray-700">{userName}</span>
                  </div>
                </>
              ) : (
                <>
                  <Link href="/auth/login">
                    <span className="text-gray-700 hover:text-primary-600 transition-colors cursor-pointer">
                      Login
                    </span>
                  </Link>
                  <Link href="/auth/signup">
                    <span className="text-gray-700 hover:text-primary-600 transition-colors cursor-pointer">
                      Create Account
                    </span>
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  )
}

export default Header
