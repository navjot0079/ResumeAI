import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import api from '../api/axios'
import { validateFile, formatFileSize } from '../utils/validators'
import LoadingSpinner from '../components/LoadingSpinner'
import {
  Upload,
  FileText,
  X,
  Sparkles,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'

function Analyzer() {
  const navigate = useNavigate()
  const fileInputRef = useRef(null)

  const [file, setFile] = useState(null)
  const [resumeId, setResumeId] = useState(null)
  const [jobDescription, setJobDescription] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploaded, setUploaded] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [dragActive, setDragActive] = useState(false)

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0])
    }
  }

  const handleFileSelect = (selectedFile) => {
    const validation = validateFile(selectedFile)
    if (!validation.isValid) {
      validation.errors.forEach((err) => toast.error(err))
      return
    }
    setFile(selectedFile)
    setUploaded(false)
    setResumeId(null)
  }

  const handleUpload = async () => {
    if (!file) return

    setUploading(true)
    setUploadProgress(0)

    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await api.post('/resume/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          )
          setUploadProgress(progress)
        },
      })

      setResumeId(response.data.id)
      setUploaded(true)
      toast.success('Resume uploaded successfully!')
    } catch (error) {
      const message = error.response?.data?.detail || 'Upload failed'
      toast.error(message)
    } finally {
      setUploading(false)
    }
  }

  const handleAnalyze = async () => {
    if (!resumeId) {
      toast.error('Please upload a resume first')
      return
    }
    if (!jobDescription.trim()) {
      toast.error('Please enter a job description')
      return
    }

    setAnalyzing(true)

    try {
      const response = await api.post('/analysis', {
        resumeId,
        jobDescription,
      })

      toast.success('Analysis complete!')
      navigate(`/analysis/${response.data.id}`)
    } catch (error) {
      const message = error.response?.data?.detail || 'Analysis failed'
      toast.error(message)
    } finally {
      setAnalyzing(false)
    }
  }

  const removeFile = () => {
    setFile(null)
    setUploaded(false)
    setResumeId(null)
    setUploadProgress(0)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
          Resume Analyzer
        </h1>
        <p className="text-gray-500 mb-8">
          Upload your resume and paste a job description to get AI-powered insights
        </p>

        {/* Step 1: Upload */}
        <div className="card mb-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 bg-gray-900 rounded-lg flex items-center justify-center text-white text-xs font-bold">
              1
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Upload Resume</h2>
          </div>

          {!file ? (
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              id="upload-dropzone"
              className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-200
                ${
                  dragActive
                    ? 'border-gray-900 bg-gray-50'
                    : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                }`}
            >
              <Upload className="w-10 h-10 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-700 font-medium mb-1">
                Drop your resume here or{' '}
                <span className="text-gray-900 font-semibold underline">browse</span>
              </p>
              <p className="text-sm text-gray-400">PDF only, up to 10MB</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                className="hidden"
                id="file-input"
              />
            </div>
          ) : (
            <div className="space-y-4">
              {/* File info */}
              <div className="flex items-center justify-between bg-gray-50 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-lg border border-gray-200">
                    <FileText className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{file.name}</p>
                    <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {uploaded && (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  )}
                  <button
                    onClick={removeFile}
                    className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors"
                    id="remove-file-btn"
                  >
                    <X className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
              </div>

              {/* Upload progress */}
              {uploading && (
                <div className="space-y-2">
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gray-900 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${uploadProgress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 text-right">{uploadProgress}%</p>
                </div>
              )}

              {/* Upload button */}
              {!uploaded && !uploading && (
                <button
                  onClick={handleUpload}
                  id="upload-btn"
                  className="btn-primary w-full flex items-center justify-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  Upload Resume
                </button>
              )}

              {uploaded && (
                <div className="flex items-center gap-2 text-sm text-emerald-600 font-medium">
                  <CheckCircle2 className="w-4 h-4" />
                  Resume uploaded successfully
                </div>
              )}
            </div>
          )}
        </div>

        {/* Step 2: Job Description */}
        <div className="card mb-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 bg-gray-900 rounded-lg flex items-center justify-center text-white text-xs font-bold">
              2
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Job Description</h2>
          </div>
          <textarea
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder="Paste the job description here...&#10;&#10;Include the full job posting with requirements, qualifications, and responsibilities for the best analysis results."
            rows={10}
            id="job-description-input"
            className="input-field resize-none !rounded-xl"
          />
          <p className="text-xs text-gray-400 mt-2 text-right">
            {jobDescription.length} characters
          </p>
        </div>

        {/* Step 3: Analyze */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <button
            onClick={handleAnalyze}
            disabled={!uploaded || !jobDescription.trim() || analyzing}
            id="analyze-btn"
            className="btn-primary w-full flex items-center justify-center gap-3 !py-4 text-base"
          >
            {analyzing ? (
              <>
                <LoadingSpinner size="sm" />
                <span>Analyzing with AI...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Analyze Resume
              </>
            )}
          </button>

          {analyzing && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center text-sm text-gray-400 mt-3"
            >
              This may take 10-20 seconds. We're using AI to deeply analyze your resume.
            </motion.p>
          )}

          {(!uploaded || !jobDescription.trim()) && !analyzing && (
            <div className="flex items-center gap-2 justify-center mt-3">
              <AlertCircle className="w-4 h-4 text-gray-400" />
              <p className="text-sm text-gray-400">
                {!uploaded
                  ? 'Upload your resume first'
                  : 'Enter a job description to continue'}
              </p>
            </div>
          )}
        </motion.div>
      </motion.div>
    </div>
  )
}

export default Analyzer
