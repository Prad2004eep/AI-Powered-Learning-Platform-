import React, { useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import Head from 'next/head'
import { supabase } from '../../utils/supabase'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })

      if (error) {
        setError(error.message)
      } else {
        setSuccess('Password reset instructions have been sent to your email.')
      }
    } catch (error) {
      setError('Failed to send reset instructions. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Head>
        <title>Forgot Password - QuizAI</title>
      </Head>
      
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          {/* Forgot Password Card */}
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            {/* Header */}
            <div className="text-center mb-8">
              <Link href="/">
                <span className="text-3xl font-bold text-gradient cursor-pointer">
                  QuizAI
                </span>
              </Link>
              <h2 className="mt-6 text-3xl font-bold text-gray-900">
                Reset your password
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                Enter your email address and we'll send you a link to reset your password.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              {success && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-green-600 text-sm">{success}</p>
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field"
                  placeholder="Enter your email"
                />
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Sending...' : 'Send reset instructions'}
                </button>
              </div>
            </form>

            {/* Back to login */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Remember your password?{' '}
                <Link href="/auth/login">
                  <span className="font-medium text-primary-600 hover:text-primary-500 cursor-pointer">
                    Back to login
                  </span>
                </Link>
              </p>
            </div>
          </div>

          {/* Back to home */}
          <div className="text-center">
            <Link href="/">
              <span className="text-gray-500 hover:text-gray-700 text-sm cursor-pointer">
                ← Back to home
              </span>
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
