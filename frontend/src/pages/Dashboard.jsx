import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import LoadingSpinner from '../components/LoadingSpinner'
import { formatDate } from '../utils/validators'
import {
  FileText,
  BarChart3,
  TrendingUp,
  Clock,
  ArrowRight,
  FileSearch,
} from 'lucide-react'

function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboard()
  }, [])

  const fetchDashboard = async () => {
    try {
      const response = await api.get('/dashboard')
      setData(response.data)
    } catch (error) {
      console.error('Failed to load dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" text="Loading dashboard..." />
      </div>
    )
  }

  const stats = [
    {
      label: 'Total Resumes',
      value: data?.totalResumes || 0,
      icon: FileText,
      color: 'bg-blue-50 text-blue-600',
    },
    {
      label: 'Total Analyses',
      value: data?.totalAnalyses || 0,
      icon: BarChart3,
      color: 'bg-purple-50 text-purple-600',
    },
    {
      label: 'Highest ATS Score',
      value: data?.highestAtsScore || 0,
      icon: TrendingUp,
      color: 'bg-emerald-50 text-emerald-600',
    },
    {
      label: 'Latest Analysis',
      value: data?.latestAnalysis
        ? formatDate(data.latestAnalysis.createdAt)
        : 'No analyses yet',
      icon: Clock,
      color: 'bg-amber-50 text-amber-600',
      isText: true,
    },
  ]

  return (
    <div className="max-w-6xl mx-auto">
      {/* Welcome */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-8"
      >
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          Welcome back, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p className="text-gray-500 mt-1">Here's an overview of your resume analyses</p>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
        {stats.map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.08 }}
            className="card"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">{stat.label}</p>
                <p className={`mt-2 ${stat.isText ? 'text-sm text-gray-700' : 'text-3xl font-bold text-gray-900'}`}>
                  {stat.value}
                </p>
              </div>
              <div className={`p-2.5 rounded-xl ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Quick Action */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.35 }}
        className="card !p-0 overflow-hidden mb-10"
      >
        <div className="bg-gray-900 p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/10 rounded-xl">
              <FileSearch className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Analyze a New Resume</h3>
              <p className="text-gray-400 text-sm mt-0.5">Upload your resume and get AI-powered insights</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/analyzer')}
            id="dashboard-analyze-btn"
            className="inline-flex items-center gap-2 bg-white text-gray-900 px-6 py-3 rounded-xl font-medium
              hover:bg-gray-100 transition-all duration-200 active:scale-[0.98] text-sm"
          >
            Start Analysis
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </motion.div>

      {/* Recent Analyses */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.45 }}
      >
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Analyses</h2>

        {data?.recentAnalyses?.length > 0 ? (
          <div className="card !p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full" id="recent-analyses-table">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-4">
                      Resume
                    </th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-4">
                      ATS Score
                    </th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-4">
                      Date
                    </th>
                    <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-4">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentAnalyses.map((analysis, index) => (
                    <tr
                      key={analysis.id}
                      className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => navigate(`/analysis/${analysis.id}`)}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-gray-100 rounded-lg">
                            <FileText className="w-4 h-4 text-gray-600" />
                          </div>
                          <span className="text-sm font-medium text-gray-900">
                            {analysis.resumeName}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                            analysis.atsScore >= 70
                              ? 'bg-emerald-50 text-emerald-700'
                              : analysis.atsScore >= 40
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-red-50 text-red-700'
                          }`}
                        >
                          {analysis.atsScore}%
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {formatDate(analysis.createdAt)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <ArrowRight className="w-4 h-4 text-gray-400 inline" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="card text-center py-12">
            <FileSearch className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">No analyses yet</p>
            <p className="text-sm text-gray-400 mt-1">Upload a resume to get started</p>
          </div>
        )}
      </motion.div>
    </div>
  )
}

export default Dashboard
