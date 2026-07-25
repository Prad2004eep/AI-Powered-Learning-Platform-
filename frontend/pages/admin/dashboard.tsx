import React, { useState, useEffect } from 'react'
import Head from 'next/head'

interface DashboardStats {
  overview: {
    total_sources: number
    total_chunks: number
    total_questions: number
    total_students: number
    total_sessions: number
    active_students: number
  }
  questions_by_difficulty: Array<{ difficulty: string; count: number }>
  questions_by_type: Array<{ type: string; count: number }>
  recent_activity: Array<{
    session_id: string
    student_name: string
    subject: string
    start_time: string
    questions_answered: number
    accuracy: number
  }>
  top_performers: Array<{
    name: string
    total_answers: number
    correct_answers: number
    accuracy: number
  }>
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    fetchDashboardStats()
  }, [])

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/admin/dashboard`)
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Failed to load dashboard data</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>Admin Dashboard - QuizAI</title>
      </Head>
      
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
              <div className="flex items-center space-x-4">
                <button className="btn-primary">Upload PDF</button>
                <button className="btn-outline">Generate Quiz</button>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="flex space-x-8">
              {['overview', 'content', 'students', 'analytics'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm capitalize ${
                    activeTab === tab
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {activeTab === 'overview' && (
            <div className="space-y-8">
              {/* Overview Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6">
                <div className="card text-center">
                  <div className="text-2xl font-bold text-primary-600">{stats.overview.total_sources}</div>
                  <div className="text-sm text-gray-600">Sources</div>
                </div>
                <div className="card text-center">
                  <div className="text-2xl font-bold text-blue-600">{stats.overview.total_chunks}</div>
                  <div className="text-sm text-gray-600">Chunks</div>
                </div>
                <div className="card text-center">
                  <div className="text-2xl font-bold text-green-600">{stats.overview.total_questions}</div>
                  <div className="text-sm text-gray-600">Questions</div>
                </div>
                <div className="card text-center">
                  <div className="text-2xl font-bold text-yellow-600">{stats.overview.total_students}</div>
                  <div className="text-sm text-gray-600">Students</div>
                </div>
                <div className="card text-center">
                  <div className="text-2xl font-bold text-purple-600">{stats.overview.total_sessions}</div>
                  <div className="text-sm text-gray-600">Sessions</div>
                </div>
                <div className="card text-center">
                  <div className="text-2xl font-bold text-red-600">{stats.overview.active_students}</div>
                  <div className="text-sm text-gray-600">Active Students</div>
                </div>
              </div>

              {/* Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Questions by Difficulty */}
                <div className="card">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Questions by Difficulty</h3>
                  <div className="space-y-3">
                    {stats.questions_by_difficulty.map((item) => (
                      <div key={item.difficulty} className="flex items-center">
                        <span className="w-20 text-sm text-gray-600 capitalize">{item.difficulty}</span>
                        <div className="flex-1 bg-gray-200 rounded-full h-6 ml-4">
                          <div
                            className="bg-gradient-to-r from-primary-500 to-primary-600 h-6 rounded-full flex items-center justify-center text-white text-sm font-medium"
                            style={{ width: `${(item.count / stats.overview.total_questions) * 100}%` }}
                          >
                            {item.count}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Questions by Type */}
                <div className="card">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Questions by Type</h3>
                  <div className="space-y-3">
                    {stats.questions_by_type.map((item) => (
                      <div key={item.type} className="flex items-center">
                        <span className="w-20 text-sm text-gray-600 capitalize">{item.type.replace('_', ' ')}</span>
                        <div className="flex-1 bg-gray-200 rounded-full h-6 ml-4">
                          <div
                            className="bg-gradient-to-r from-secondary-500 to-secondary-600 h-6 rounded-full flex items-center justify-center text-white text-sm font-medium"
                            style={{ width: `${(item.count / stats.overview.total_questions) * 100}%` }}
                          >
                            {item.count}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Questions</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Accuracy</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {stats.recent_activity.map((activity, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {activity.student_name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {activity.subject || 'General'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {activity.questions_answered}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              activity.accuracy >= 80 ? 'bg-green-100 text-green-800' :
                              activity.accuracy >= 60 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {activity.accuracy.toFixed(1)}%
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(activity.start_time).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Top Performers */}
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Performers</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {stats.top_performers.map((performer, index) => (
                    <div key={index} className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-4 border border-yellow-200">
                      <div className="flex items-center mb-2">
                        <div className="bg-yellow-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold mr-3">
                          {index + 1}
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">{performer.name}</h4>
                          <p className="text-sm text-gray-600">{performer.total_answers} answers</p>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Accuracy</span>
                        <span className="font-semibold text-green-600">{performer.accuracy.toFixed(1)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'content' && (
            <div className="space-y-8">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">Content Management</h2>
                <button className="btn-primary">Upload New PDF</button>
              </div>
              
              <div className="card">
                <p className="text-gray-600">Content management interface will be implemented here.</p>
              </div>
            </div>
          )}

          {activeTab === 'students' && (
            <div className="space-y-8">
              <h2 className="text-2xl font-bold text-gray-900">Student Management</h2>
              <div className="card">
                <p className="text-gray-600">Student management interface will be implemented here.</p>
              </div>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="space-y-8">
              <h2 className="text-2xl font-bold text-gray-900">Analytics</h2>
              <div className="card">
                <p className="text-gray-600">Advanced analytics will be implemented here.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
