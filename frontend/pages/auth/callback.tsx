import React, { useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { supabase } from '../../utils/supabase'

export default function AuthCallback() {
  const router = useRouter()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Auth callback error:', error)
          router.push('/auth/login?error=authentication_failed')
          return
        }

        if (data.session?.user) {
          // Get user profile data
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.session.user.id)
            .single()

          // Store user info in localStorage
          localStorage.setItem('userEmail', data.session.user.email || '')
          localStorage.setItem('userRole', profile?.role || 'student')
          localStorage.setItem('isLoggedIn', 'true')
          localStorage.setItem('userId', data.session.user.id)
          
          // Check if profile exists
          if (profileError || !profile) {
            // Profile doesn't exist, redirect to profile completion
            localStorage.setItem('userName', data.session.user.email?.split('@')[0] || '')
            router.push('/auth/complete-profile')
          } else {
            // Profile exists, proceed to dashboard
            localStorage.setItem('userName', profile.name || data.session.user.email?.split('@')[0] || '')
            localStorage.setItem('userAvatar', profile.avatar_url || '')
            
            // Redirect to appropriate dashboard
            if (profile.role === 'educator') {
              router.push('/admin/dashboard')
            } else {
              router.push('/student/dashboard')
            }
          }
        } else {
          // No session, redirect to login
          router.push('/auth/login')
        }
      } catch (error) {
        console.error('Auth callback error:', error)
        router.push('/auth/login?error=callback_failed')
      }
    }

    handleAuthCallback()
  }, [router])

  return (
    <>
      <Head>
        <title>Authentication Callback - QuizAI</title>
      </Head>
      
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-700">Completing authentication...</h2>
          <p className="text-gray-500 mt-2">Please wait while we sign you in.</p>
        </div>
      </div>
    </>
  )
}
