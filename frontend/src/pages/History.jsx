import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import api from '../api/axios'
import LoadingSpinner from '../components/LoadingSpinner'
import { formatDate } from '../utils/validators'
import {
  FileText,
  Trash2,
  Eye,
  History as HistoryIcon,
  AlertTriangle,
  X,
} from 'lucide-react'

function History() {
  const navigate = useNavigate()
  const [analyses, setAnalyses] = useState([])
  const [loading, setLoading] = useState(true)
  const [deleteId, setDeleteId] = useState(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    fetchHistory()
  }, [])

  const fetchHistory = async () => {
    try {
      const response = await api.get('/analysis/history')
      setAnalyses(response.data)
    } catch (error) {
      console.error('Failed to load history:', error)
      toast.error('Failed to load analysis history')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    setDeleting(true)

    try {
      await api.delete(`/analysis/${deleteId}`)
      setAnalyses((prev) => prev.filter((a) => a.id !== deleteId))
      toast.success('Analysis deleted')
    } catch (error) {
      toast.error('Failed to delete analysis')
    } finally {
      setDeleting(false)
      setDeleteId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" text="Loading history..." />
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Analysis History</h1>
            <p className="text-gray-500 mt-1">
              {analyses.length} {analyses.length === 1 ? 'analysis' : 'analyses'} total
            </p>
          </div>
        </div>

        {analyses.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {analyses.map((analysis, index) => (
              <motion.div
                key={analysis.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                className="card group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-gray-100 rounded-xl group-hover:bg-gray-200 transition-colors">
                      <FileText className="w-5 h-5 text-gray-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate max-w-[160px]">
                        {analysis.resumeName}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {formatDate(analysis.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* ATS Score */}
                <div className="flex items-center gap-3 mb-5">
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <motion.div
                      className={`h-full rounded-full ${
                        analysis.atsScore >= 70
                          ? 'bg-emerald-500'
                          : analysis.atsScore >= 40
                          ? 'bg-amber-500'
                          : 'bg-red-500'
                      }`}
                      initial={{ width: 0 }}
                      animate={{ width: `${analysis.atsScore}%` }}
                      transition={{ duration: 0.8, delay: index * 0.05 + 0.3 }}
                    />
                  </div>
                  <span
                    className={`text-lg font-bold ${
                      analysis.atsScore >= 70
                        ? 'text-emerald-600'
                        : analysis.atsScore >= 40
                        ? 'text-amber-600'
                        : 'text-red-600'
                    }`}
                  >
                    {analysis.atsScore}%
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => navigate(`/analysis/${analysis.id}`)}
                    id={`view-analysis-${analysis.id}`}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-medium
                      hover:bg-gray-800 transition-all duration-200 active:scale-[0.98]"
                  >
                    <Eye className="w-4 h-4" />
                    View Details
                  </button>
                  <button
                    onClick={() => setDeleteId(analysis.id)}
                    id={`delete-analysis-${analysis.id}`}
                    className="p-2.5 border border-gray-200 rounded-xl text-gray-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50
                      transition-all duration-200"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="card text-center py-16">
            <HistoryIcon className="w-14 h-14 text-gray-200 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-1">No analyses yet</h3>
            <p className="text-sm text-gray-400 mb-6">
              Start by analyzing a resume to see your history here
            </p>
            <button
              onClick={() => navigate('/analyzer')}
              id="history-start-analysis-btn"
              className="btn-primary inline-flex items-center gap-2"
            >
              Analyze a Resume
            </button>
          </div>
        )}
      </motion.div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => !deleting && setDeleteId(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-red-50 rounded-xl">
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Delete Analysis</h3>
                </div>
                <button
                  onClick={() => setDeleteId(null)}
                  className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>

              <p className="text-sm text-gray-500 mb-6">
                Are you sure you want to delete this analysis? This action cannot be undone.
              </p>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setDeleteId(null)}
                  disabled={deleting}
                  className="btn-secondary flex-1 !py-2.5 text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  id="confirm-delete-btn"
                  className="btn-danger flex-1 !py-2.5 text-sm flex items-center justify-center gap-2"
                >
                  {deleting ? <LoadingSpinner size="sm" /> : 'Delete'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default History
