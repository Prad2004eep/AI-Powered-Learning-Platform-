import React, { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import Head from 'next/head'
import { supabase } from '../../utils/supabase'

export default function CompleteProfilePage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [formData, setFormData] = useState({
    name: '',
    role: 'student',
    grade: '',
    bio: ''
  })
  const [avatarUrl, setAvatarUrl] = useState('')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [previewUrl, setPreviewUrl] = useState('')

  // Get user info from localStorage with SSR check
  const [userEmail, setUserEmail] = useState('')
  const [userId, setUserId] = useState('')

  useEffect(() => {
    // Only access localStorage on client side
    if (typeof window !== 'undefined') {
      const email = localStorage.getItem('userEmail') || ''
      const id = localStorage.getItem('userId') || ''
      setUserEmail(email)
      setUserId(id)
    }
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setAvatarFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const uploadAvatar = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${userId}/avatar.${fileExt}`
      
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data: publicUrl } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName)

      return publicUrl.publicUrl
    } catch (error) {
      console.error('Error uploading avatar:', error)
      return null
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      let uploadedAvatarUrl = avatarUrl

      // Upload avatar if selected
      if (avatarFile) {
        const uploadedUrl = await uploadAvatar(avatarFile)
        if (uploadedUrl) {
          uploadedAvatarUrl = uploadedUrl
        }
      }

      // Create profile in Supabase
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          name: formData.name,
          email: userEmail,
          role: formData.role,
          grade: formData.grade || null,
          bio: formData.bio || null,
          avatar_url: uploadedAvatarUrl
        })

      if (profileError) {
        setError('Failed to create profile. Please try again.')
        return
      }

      // Update localStorage
      localStorage.setItem('userName', formData.name)
      localStorage.setItem('userRole', formData.role)
      localStorage.setItem('userAvatar', uploadedAvatarUrl || '')

      // Redirect to appropriate dashboard
      if (formData.role === 'educator') {
        router.push('/admin/dashboard')
      } else {
        router.push('/student/dashboard')
      }
    } catch (error) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const getAvatarPlaceholder = () => {
    return formData.name.charAt(0).toUpperCase() || userEmail.charAt(0).toUpperCase()
  }

  return (
    <>
      <Head>
        <title>Complete Your Profile - QuizAI</title>
      </Head>
      
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          {/* Profile Card */}
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            {/* Header */}
            <div className="text-center mb-8">
              <Link href="/">
                <span className="text-3xl font-bold text-gradient cursor-pointer">
                  QuizAI
                </span>
              </Link>
              <h2 className="mt-6 text-3xl font-bold text-gray-900">
                Complete Your Profile
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                Tell us a bit about yourself to get started
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              {/* Avatar Upload */}
              <div className="text-center">
                <div className="relative inline-block">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white text-3xl font-bold overflow-hidden">
                    {previewUrl ? (
                      <img src={previewUrl} alt="Avatar preview" className="w-full h-full object-cover" />
                    ) : (
                      <span>{getAvatarPlaceholder()}</span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 bg-primary-600 hover:bg-primary-700 text-white p-2 rounded-full shadow-lg transform transition-all hover:scale-110"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </div>
                <p className="mt-2 text-sm text-gray-600">Add profile picture</p>
              </div>

              {/* Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Enter your full name"
                />
              </div>

              {/* Role */}
              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
                  I am a *
                </label>
                <select
                  id="role"
                  name="role"
                  required
                  value={formData.role}
                  onChange={handleChange}
                  className="input-field"
                >
                  <option value="student">Student</option>
                  <option value="educator">Educator</option>
                </select>
              </div>

              {/* Grade (for students) */}
              {formData.role === 'student' && (
                <div>
                  <label htmlFor="grade" className="block text-sm font-medium text-gray-700 mb-2">
                    Grade/Level
                  </label>
                  <select
                    id="grade"
                    name="grade"
                    value={formData.grade}
                    onChange={handleChange}
                    className="input-field"
                  >
                    <option value="">Select your grade</option>
                    <option value="1">Grade 1</option>
                    <option value="2">Grade 2</option>
                    <option value="3">Grade 3</option>
                    <option value="4">Grade 4</option>
                    <option value="5">Grade 5</option>
                    <option value="6">Grade 6</option>
                    <option value="7">Grade 7</option>
                    <option value="8">Grade 8</option>
                    <option value="9">Grade 9</option>
                    <option value="10">Grade 10</option>
                    <option value="11">Grade 11</option>
                    <option value="12">Grade 12</option>
                    <option value="college">College</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              )}

              {/* Bio */}
              <div>
                <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-2">
                  Bio (Optional)
                </label>
                <textarea
                  id="bio"
                  name="bio"
                  rows={3}
                  value={formData.bio}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Tell us a little about yourself..."
                />
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading || !formData.name}
                  className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Creating Profile...' : 'Complete Profile'}
                </button>
              </div>
            </form>

            {/* Skip Option */}
            <div className="text-center">
              <button
                type="button"
                onClick={() => router.push('/student/dashboard')}
                className="text-gray-500 hover:text-gray-700 text-sm"
              >
                Skip for now →
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
