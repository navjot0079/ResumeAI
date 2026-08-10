export function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return re.test(email)
}

export function validatePassword(password) {
  const errors = []

  if (password.length < 8) {
    errors.push('At least 8 characters')
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('At least one uppercase letter')
  }
  if (!/[0-9]/.test(password)) {
    errors.push('At least one number')
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('At least one special character')
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

export function validateFile(file) {
  const errors = []
  const maxSize = 10 * 1024 * 1024 // 10MB

  if (!file) {
    errors.push('Please select a file')
    return { isValid: false, errors }
  }

  if (!file.name.toLowerCase().endsWith('.pdf')) {
    errors.push('Only PDF files are allowed')
  }

  if (file.type && file.type !== 'application/pdf') {
    errors.push('Invalid file type. Only PDF files are allowed')
  }

  if (file.size > maxSize) {
    errors.push('File size exceeds 10MB limit')
  }

  if (file.size === 0) {
    errors.push('File is empty')
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
