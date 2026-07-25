import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import Head from 'next/head'
import { supabase } from '../../utils/supabase'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    // Check if we have the reset token in the URL
    const hash = window.location.hash
    if (!hash || !hash.includes('access_token')) {
      setError('Invalid or expired reset link. Please try again.')
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.')
      setLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      })

      if (error) {
        setError(error.message)
      } else {
        setSuccess('Password has been reset successfully.')
        setTimeout(() => {
          router.push('/auth/login')
        }, 2000)
      }
    } catch (error) {
      setError('Failed to reset password. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Head>
        <title>Reset Password - QuizAI</title>
      </Head>
      
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          {/* Reset Password Card */}
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            {/* Header */}
            <div className="text-center mb-8">
              <Link href="/">
                <span className="text-3xl font-bold text-gradient cursor-pointer">
                  QuizAI
                </span>
              </Link>
              <h2 className="mt-6 text-3xl font-bold text-gray-900">
                Set new password
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                Enter your new password below.
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
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  New Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field"
                  placeholder="Enter new password"
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm New Password
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="input-field"
                  placeholder="Confirm new password"
                />
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Resetting...' : 'Reset Password'}
                </button>
              </div>
            </form>

            {/* Back to login */}
            <div className="mt-6 text-center">
              <Link href="/auth/login">
                <span className="font-medium text-primary-600 hover:text-primary-500 cursor-pointer">
                  Back to login
                </span>
              </Link>
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
