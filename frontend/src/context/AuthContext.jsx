import { createContext, useContext, useState, useEffect } from 'react'
import api from '../api/axios'
import toast from 'react-hot-toast'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    const token = localStorage.getItem('access_token')
    const storedUser = localStorage.getItem('user')

    if (token && storedUser) {
      try {
        const response = await api.get('/auth/profile')
        const userData = response.data
        setUser(userData)
        setIsAuthenticated(true)
        localStorage.setItem('user', JSON.stringify(userData))
      } catch (error) {
        // Token invalid — clear everything
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        localStorage.removeItem('user')
        setUser(null)
        setIsAuthenticated(false)
      }
    }

    setLoading(false)
  }

  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password })
      const { access_token, user: userData } = response.data

      localStorage.setItem('access_token', access_token)
      localStorage.removeItem('refresh_token') // Ensure any legacy token is cleared
      localStorage.setItem('user', JSON.stringify(userData))

      setUser(userData)
      setIsAuthenticated(true)
      toast.success(`Welcome back, ${userData.name}!`)

      return { success: true }
    } catch (error) {
      const message = error.response?.data?.detail || 'Login failed'
      toast.error(message)
      return { success: false, error: message }
    }
  }

  const signup = async (name, email, password) => {
    try {
      const response = await api.post('/auth/signup', { name, email, password })
      const { access_token, user: userData } = response.data

      localStorage.setItem('access_token', access_token)
      localStorage.removeItem('refresh_token') // Ensure any legacy token is cleared
      localStorage.setItem('user', JSON.stringify(userData))

      setUser(userData)
      setIsAuthenticated(true)
      toast.success(`Welcome, ${userData.name}!`)

      return { success: true }
    } catch (error) {
      const message = error.response?.data?.detail || 'Signup failed'
      toast.error(message)
      return { success: false, error: message }
    }
  }

  const logout = async () => {
    try {
      await api.post('/auth/logout')
    } catch (e) {
      // Best-effort backend logout (e.g. if network or server is down)
    } finally {
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      localStorage.removeItem('user')
      setUser(null)
      setIsAuthenticated(false)
      toast.success('Logged out successfully')
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        loading,
        login,
        signup,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
