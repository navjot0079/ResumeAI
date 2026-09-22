import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import api from '../api/axios'
import LoadingSpinner from '../components/LoadingSpinner'
import { formatDate } from '../utils/validators'
import {
  ArrowLeft,
  Target,
  FileText,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Lightbulb,
  Search,
  BarChart3,
  Zap,
  Download,
  ArrowRight,
  RefreshCw,
} from 'lucide-react'

function AnalysisDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [analysis, setAnalysis] = useState(null)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    fetchAnalysis()
  }, [id])

  const fetchAnalysis = async () => {
    try {
      const response = await api.get(`/analysis/${id}`)
      setAnalysis(response.data)
    } catch (error) {
      console.error('Failed to fetch analysis:', error)
      navigate('/history')
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async () => {
    setExporting(true)
    try {
      const response = await api.get(`/export/${id}`, {
        responseType: 'blob',
      })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      const resumeName = analysis?.resumeName?.replace(/\.[^/.]+$/, '') || 'analysis'
      link.setAttribute('download', `${resumeName}_report.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      toast.success('Report downloaded!')
    } catch (error) {
      console.error('Export failed:', error)
      toast.error('Failed to download report')
    } finally {
      setExporting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" text="Loading analysis..." />
      </div>
    )
  }

  if (!analysis) return null

  const getScoreColor = (score) => {
    if (score >= 70) return 'text-emerald-500'
    if (score >= 40) return 'text-amber-500'
    return 'text-red-500'
  }

  const getScoreRingColor = (score) => {
    if (score >= 70) return 'stroke-emerald-500'
    if (score >= 40) return 'stroke-amber-500'
    return 'stroke-red-500'
  }

  const getScoreBgColor = (score) => {
    if (score >= 70) return 'bg-emerald-500'
    if (score >= 40) return 'bg-amber-500'
    return 'bg-red-500'
  }

  const getScoreChipColor = (score) => {
    if (score >= 70) return 'bg-emerald-50 text-emerald-700'
    if (score >= 40) return 'bg-amber-50 text-amber-700'
    return 'bg-red-50 text-red-700'
  }

  const getScoreLabel = (score) => {
    if (score >= 80) return 'Excellent'
    if (score >= 70) return 'Good'
    if (score >= 50) return 'Fair'
    if (score >= 30) return 'Needs Work'
    return 'Poor'
  }

  const circumference = 2 * Math.PI * 54
  const strokeDashoffset = circumference - (analysis.atsScore / 100) * circumference

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08 },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  }

  const sectionLabels = {
    summary: 'Summary / Objective',
    experience: 'Experience',
    education: 'Education',
    skills: 'Skills',
    projects: 'Projects',
    formatting: 'Formatting & Structure',
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            id="back-btn"
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Analysis Results</h1>
            <p className="text-sm text-gray-500">
              {analysis.resumeName} • {formatDate(analysis.createdAt)}
            </p>
          </div>
        </div>
        <button
          onClick={handleExport}
          disabled={exporting}
          id="export-report-btn"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-medium
            hover:bg-gray-800 transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {exporting ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Exporting...
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              Download Report
            </>
          )}
        </button>
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-6"
      >
        {/* ATS Score */}
        <motion.div variants={itemVariants} className="card !p-8">
          <div className="flex flex-col sm:flex-row items-center gap-8">
            <div className="relative w-36 h-36 flex-shrink-0">
              <svg className="w-36 h-36 -rotate-90" viewBox="0 0 120 120">
                <circle
                  cx="60"
                  cy="60"
                  r="54"
                  fill="none"
                  stroke="#f3f4f6"
                  strokeWidth="8"
                />
                <motion.circle
                  cx="60"
                  cy="60"
                  r="54"
                  fill="none"
                  className={getScoreRingColor(analysis.atsScore)}
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  initial={{ strokeDashoffset: circumference }}
                  animate={{ strokeDashoffset }}
                  transition={{ duration: 1.2, ease: 'easeOut' }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-4xl font-bold ${getScoreColor(analysis.atsScore)}`}>
                  {analysis.atsScore}
                </span>
                <span className="text-xs text-gray-400 font-medium mt-0.5">out of 100</span>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-5 h-5 text-gray-700" />
                <h2 className="text-xl font-bold text-gray-900">ATS Compatibility Score</h2>
              </div>
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold mb-3 ${
                  analysis.atsScore >= 70
                    ? 'bg-emerald-50 text-emerald-700'
                    : analysis.atsScore >= 40
                    ? 'bg-amber-50 text-amber-700'
                    : 'bg-red-50 text-red-700'
                }`}
              >
                {getScoreLabel(analysis.atsScore)}
              </span>
              <p className="text-gray-500 text-sm leading-relaxed max-w-lg">
                Your resume has been analyzed against the job description.
                {analysis.atsScore >= 70
                  ? ' Great match! Your resume aligns well with the requirements.'
                  : analysis.atsScore >= 40
                  ? ' There is room for improvement. Review the suggestions below.'
                  : ' Significant improvements needed. Follow the AI recommendations carefully.'}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Resume Summary */}
        <motion.div variants={itemVariants} className="card">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="w-5 h-5 text-gray-700" />
            <h2 className="text-lg font-semibold text-gray-900">Resume Summary</h2>
          </div>
          <p className="text-gray-600 leading-relaxed">{analysis.resumeSummary}</p>
        </motion.div>

        {/* Section Quality Scores */}
        {analysis.sectionScores && (
          <motion.div variants={itemVariants} className="card">
            <div className="flex items-center gap-2 mb-5">
              <BarChart3 className="w-5 h-5 text-indigo-500" />
              <h2 className="text-lg font-semibold text-gray-900">Section Quality Scores</h2>
            </div>
            <div className="space-y-4">
              {Object.entries(sectionLabels).map(([key, label]) => {
                const section = analysis.sectionScores[key]
                if (!section) return null
                const score = section.score ?? 0
                return (
                  <div key={key} className="group">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-medium text-gray-700">{label}</span>
                      <span className={`text-sm font-bold ${getScoreColor(score)}`}>
                        {score}/100
                      </span>
                    </div>
                    <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden mb-1.5">
                      <motion.div
                        className={`h-full rounded-full ${getScoreBgColor(score)}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${score}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                      />
                    </div>
                    {section.feedback && (
                      <p className="text-xs text-gray-400 leading-relaxed">{section.feedback}</p>
                    )}
                  </div>
                )
              })}
            </div>
          </motion.div>
        )}

        {/* Skills Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Matching Skills */}
          <motion.div variants={itemVariants} className="card">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              <h2 className="text-lg font-semibold text-gray-900">Matching Skills</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {analysis.matchingSkills.map((skill, index) => (
                <span key={index} className="chip-green">
                  {skill}
                </span>
              ))}
              {analysis.matchingSkills.length === 0 && (
                <p className="text-sm text-gray-400">No matching skills found</p>
              )}
            </div>
          </motion.div>

          {/* Missing Skills */}
          <motion.div variants={itemVariants} className="card">
            <div className="flex items-center gap-2 mb-4">
              <XCircle className="w-5 h-5 text-red-500" />
              <h2 className="text-lg font-semibold text-gray-900">Missing Skills</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {analysis.missingSkills.map((skill, index) => (
                <span key={index} className="chip-red">
                  {skill}
                </span>
              ))}
              {analysis.missingSkills.length === 0 && (
                <p className="text-sm text-gray-400">No missing skills — great job!</p>
              )}
            </div>
          </motion.div>
        </div>

        {/* Missing Keywords */}
        <motion.div variants={itemVariants} className="card">
          <div className="flex items-center gap-2 mb-4">
            <Search className="w-5 h-5 text-amber-500" />
            <h2 className="text-lg font-semibold text-gray-900">Missing Keywords</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {analysis.missingKeywords.map((keyword, index) => (
              <span key={index} className="chip-orange">
                {keyword}
              </span>
            ))}
            {analysis.missingKeywords.length === 0 && (
              <p className="text-sm text-gray-400">All important keywords are present</p>
            )}
          </div>
        </motion.div>

        {/* Strengths & Weaknesses */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Strengths */}
          <motion.div variants={itemVariants} className="card">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-emerald-500" />
              <h2 className="text-lg font-semibold text-gray-900">Strengths</h2>
            </div>
            <ul className="space-y-3">
              {analysis.strengths.map((strength, index) => (
                <li key={index} className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2 flex-shrink-0" />
                  <span className="text-sm text-gray-600 leading-relaxed">{strength}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Weaknesses */}
          <motion.div variants={itemVariants} className="card">
            <div className="flex items-center gap-2 mb-4">
              <TrendingDown className="w-5 h-5 text-red-500" />
              <h2 className="text-lg font-semibold text-gray-900">Weaknesses</h2>
            </div>
            <ul className="space-y-3">
              {analysis.weaknesses.map((weakness, index) => (
                <li key={index} className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-2 flex-shrink-0" />
                  <span className="text-sm text-gray-600 leading-relaxed">{weakness}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>

        {/* Experience Bullet Analysis */}
        {analysis.bulletAnalysis && analysis.bulletAnalysis.length > 0 && (
          <motion.div variants={itemVariants} className="card">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-5 h-5 text-violet-500" />
              <h2 className="text-lg font-semibold text-gray-900">Experience Bullet Improvements</h2>
            </div>
            <p className="text-sm text-gray-400 mb-5">
              These bullet points could be strengthened with more specific, action-oriented language
            </p>
            <div className="space-y-5">
              {analysis.bulletAnalysis.map((bullet, index) => (
                <div
                  key={index}
                  className="bg-gray-50 rounded-xl p-5 border border-gray-100"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-6 h-6 bg-violet-100 text-violet-600 rounded-lg flex items-center justify-center text-xs font-bold">
                      {index + 1}
                    </span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700`}>
                      {bullet.issue}
                    </span>
                  </div>

                  {/* Original */}
                  <div className="mb-3">
                    <span className="text-xs font-semibold text-red-500 uppercase tracking-wider">Original</span>
                    <p className="text-sm text-gray-600 mt-1 line-through decoration-red-300">
                      {bullet.original}
                    </p>
                  </div>

                  {/* Arrow */}
                  <div className="flex items-center gap-2 mb-3">
                    <ArrowRight className="w-4 h-4 text-emerald-500" />
                    <span className="text-xs text-emerald-600 font-medium">Suggested Improvement</span>
                  </div>

                  {/* Improved */}
                  <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-100">
                    <p className="text-sm text-emerald-800 font-medium leading-relaxed">
                      {bullet.improved}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* AI Recommendations */}
        <motion.div variants={itemVariants} className="card border-gray-900/10">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="w-5 h-5 text-amber-500" />
            <h2 className="text-lg font-semibold text-gray-900">AI Recommendations</h2>
          </div>
          <ol className="space-y-4">
            {analysis.suggestions.map((suggestion, index) => (
              <li key={index} className="flex items-start gap-4">
                <span className="w-7 h-7 bg-gray-100 rounded-lg flex items-center justify-center text-xs font-bold text-gray-600 flex-shrink-0">
                  {index + 1}
                </span>
                <span className="text-sm text-gray-600 leading-relaxed pt-1">{suggestion}</span>
              </li>
            ))}
          </ol>
        </motion.div>

        {/* Download Report CTA */}
        <motion.div variants={itemVariants} className="card !p-0 overflow-hidden">
          <div className="bg-gray-900 p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/10 rounded-xl">
                <Download className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Export Improvement Report</h3>
                <p className="text-gray-400 text-sm mt-0.5">
                  Download a structured PDF with all scores, skill gaps, and bullet rewrites
                </p>
              </div>
            </div>
            <button
              onClick={handleExport}
              disabled={exporting}
              id="export-cta-btn"
              className="inline-flex items-center gap-2 bg-white text-gray-900 px-6 py-3 rounded-xl font-medium
                hover:bg-gray-100 transition-all duration-200 active:scale-[0.98] text-sm disabled:opacity-50"
            >
              {exporting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Download PDF
                </>
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}

export default AnalysisDetails
