import { createContext, useContext, useState, useEffect } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { API_ENDPOINTS } from '../config/api'

const AuthContext = createContext()

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [token, setToken] = useState(localStorage.getItem('token'))

  // Convex mutations
  const createUserMutation = useMutation(api.auth.createUser)
  const getUserByEmailQuery = useQuery(api.auth.getUserByEmail, token ? { email: 'dummy' } : 'skip')

  useEffect(() => {
    if (token) {
      fetchUser()
    } else {
      setLoading(false)
    }
  }, [token])

  const fetchUser = async () => {
    try {
      // For now, we'll keep JWT-based auth and just validate with Convex
      // In a full Convex app, you'd use Convex auth instead
      const response = await fetch(API_ENDPOINTS.auth.me, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (response.ok) {
        const userData = await response.json()
        setUser(userData)
      } else {
        logout()
      }
    } catch (error) {
      console.error('Failed to fetch user:', error)
      logout()
    } finally {
      setLoading(false)
    }
  }

  const login = async (email, password) => {
    const response = await fetch(API_ENDPOINTS.auth.login, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    })

    if (!response.ok) {
      throw new Error('Login failed')
    }

    const { access_token } = await response.json()
    localStorage.setItem('token', access_token)
    setToken(access_token)
    await fetchUser()
  }

  const signup = async (email, password, name) => {
    const response = await fetch(API_ENDPOINTS.auth.signup, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password, name })
    })

    if (!response.ok) {
      throw new Error('Signup failed')
    }

    const data = await response.json()
    const { access_token } = data
    localStorage.setItem('token', access_token)
    setToken(access_token)
    await fetchUser()
    return data
  }

  const logout = () => {
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
  }

  const value = {
    user,
    loading,
    login,
    signup,
    logout,
    token
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
