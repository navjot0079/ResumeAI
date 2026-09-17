import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor: attach access token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor: handle 401 with token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        // Refresh token is sent automatically via HttpOnly cookie (with fallback if legacy token exists in localStorage)
        const legacyRefreshToken = localStorage.getItem('refresh_token')
        const response = await axios.post(
          `${API_BASE_URL}/auth/refresh`,
          legacyRefreshToken ? { refresh_token: legacyRefreshToken } : {},
          { withCredentials: true }
        )

        const { access_token } = response.data
        localStorage.setItem('access_token', access_token)
        // Clean up any legacy refresh_token from localStorage since it is now in HttpOnly cookie
        localStorage.removeItem('refresh_token')

        originalRequest.headers.Authorization = `Bearer ${access_token}`
        return api(originalRequest)
      } catch (refreshError) {
        // Refresh failed — clear tokens and redirect to login
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        localStorage.removeItem('user')
        window.location.href = '/login'
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

export default api
