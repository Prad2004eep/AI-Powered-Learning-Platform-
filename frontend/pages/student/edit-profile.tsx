import React, { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { supabase } from '../../utils/supabase'

export default function EditProfilePage() {
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
  const [saving, setSaving] = useState(false)
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

  useEffect(() => {
    if (userId) {
      loadUserProfile()
    }
  }, [userId])

  const loadUserProfile = async () => {
    setLoading(true)
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) throw error

      if (profile) {
        setFormData({
          name: profile.name || '',
          role: profile.role || 'student',
          grade: profile.grade || '',
          bio: profile.bio || ''
        })
        setAvatarUrl(profile.avatar_url || '')
      }
    } catch (error) {
      console.error('Error loading profile:', error)
      setError('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

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
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      let uploadedAvatarUrl = avatarUrl

      // Upload new avatar if selected
      if (avatarFile) {
        const uploadedUrl = await uploadAvatar(avatarFile)
        if (uploadedUrl) {
          uploadedAvatarUrl = uploadedUrl
          setAvatarUrl(uploadedUrl)
        }
      }

      // Update profile in Supabase
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          name: formData.name,
          role: formData.role,
          grade: formData.grade || null,
          bio: formData.bio || null,
          avatar_url: uploadedAvatarUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)

      if (updateError) throw updateError

      // Update localStorage
      localStorage.setItem('userName', formData.name)
      localStorage.setItem('userRole', formData.role)
      localStorage.setItem('userAvatar', uploadedAvatarUrl || '')

      setSuccess('Profile updated successfully!')
      setAvatarFile(null)
      setPreviewUrl('')

      // Redirect if role changed
      if (formData.role === 'educator') {
        setTimeout(() => router.push('/admin/dashboard'), 1500)
      }
    } catch (error) {
      setError('Failed to update profile. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const getAvatarDisplay = (): string | undefined => {
    if (previewUrl) return previewUrl
    if (avatarUrl) return avatarUrl
    return undefined
  }

  const getAvatarPlaceholder = () => {
    return formData.name.charAt(0).toUpperCase() || userEmail.charAt(0).toUpperCase()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>Edit Profile - QuizAI</title>
      </Head>
      
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => router.back()}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ← Back
                </button>
                <h1 className="text-xl font-semibold text-gray-900">Edit Profile</h1>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-xl shadow-lg p-8">
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

              {/* Avatar Upload */}
              <div className="text-center">
                <div className="relative inline-block">
                  <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white text-4xl font-bold overflow-hidden">
                    {getAvatarDisplay() ? (
                      <img src={getAvatarDisplay()} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <span>{getAvatarPlaceholder()}</span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 bg-primary-600 hover:bg-primary-700 text-white p-3 rounded-full shadow-lg transform transition-all hover:scale-110"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
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
                <p className="mt-2 text-sm text-gray-600">Click to change profile picture</p>
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

              {/* Email (Read-only) */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={userEmail}
                  disabled
                  className="input-field bg-gray-100 cursor-not-allowed"
                  placeholder="Email cannot be changed"
                />
                <p className="mt-1 text-xs text-gray-500">Email address cannot be changed</p>
              </div>

              {/* Role */}
              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
                  Account Type
                </label>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="input-field"
                >
                  <option value="student">Student</option>
                  <option value="educator">Educator</option>
                </select>
                <p className="mt-1 text-xs text-gray-500">Changing to educator will redirect you to admin dashboard</p>
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
                  Bio
                </label>
                <textarea
                  id="bio"
                  name="bio"
                  rows={4}
                  value={formData.bio}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Tell us a little about yourself..."
                />
                <p className="mt-1 text-xs text-gray-500">Brief description about yourself (optional)</p>
              </div>

              <div className="flex space-x-4">
                <button
                  type="submit"
                  disabled={saving || !formData.name}
                  className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </>
  )
}
