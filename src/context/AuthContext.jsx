import { createContext, useContext, useState, useEffect } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'

const AuthContext = createContext()

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }) {
  const [userId, setUserId] = useState(localStorage.getItem('userId'))
  const [token, setToken] = useState(localStorage.getItem('token'))
  const [loading, setLoading] = useState(true)

  // Fetch user data from Convex (automatically updates on changes)
  const user = useQuery(
    api.auth.getMe,
    userId ? { userId } : "skip"
  )

  // Convex mutations
  const loginMutation = useMutation(api.auth.login)
  const signupMutation = useMutation(api.auth.signup)

  useEffect(() => {
    // Initial load complete
    if (userId && user !== undefined) {
      setLoading(false)
    } else if (!userId) {
      setLoading(false)
    }
  }, [userId, user])

  const login = async (email, password) => {
    try {
      const response = await loginMutation({ email, password })
      localStorage.setItem('userId', response.userId)
      localStorage.setItem('token', response.access_token)
      setUserId(response.userId)
      setToken(response.access_token)
      return response
    } catch (error) {
      console.error('Login failed:', error)
      throw error
    }
  }

  const signup = async (email, password, name) => {
    try {
      const response = await signupMutation({ email, password, name })
      localStorage.setItem('userId', response.userId)
      localStorage.setItem('token', response.access_token)
      setUserId(response.userId)
      setToken(response.access_token)
      return response
    } catch (error) {
      console.error('Signup failed:', error)
      throw error
    }
  }

  const logout = () => {
    localStorage.removeItem('userId')
    localStorage.removeItem('token')
    setUserId(null)
    setToken(null)
  }

  const value = {
    user,
    userId,
    loading,
    login,
    signup,
    logout,
    token,
    isAuthenticated: !!userId && !!user
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
