import React, { useState, useEffect } from 'react'
import './PasswordProtection.css'

const CORRECT_PASSWORD = 'gdgc#328'
const PASSWORD_KEY = 'ctf_app_password'

function PasswordProtection({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const storedPassword = localStorage.getItem(PASSWORD_KEY)
    if (storedPassword && storedPassword === CORRECT_PASSWORD) {
      setIsAuthenticated(true)
    }
    setIsLoading(false)
  }, [])

  const handleSubmit = (e) => {
    e.preventDefault()

    if (password === CORRECT_PASSWORD) {
      localStorage.setItem(PASSWORD_KEY, password)
      setIsAuthenticated(true)
      setError('')
    } else {
      setError('Incorrect password. Please try again.')
      setPassword('')
    }
  }

  if (isLoading) {
    return (
      <div className="password-protection-loading">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="password-protection-overlay">
        <div className="password-protection-modal">
          <div className="password-protection-header">
            <h1>🔒 Protected Access</h1>
          </div>

          <form onSubmit={handleSubmit} className="password-form">
            <div className="input-group">
              <label htmlFor="password">Enter Password:</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter the access password"
                required
                autoFocus
              />
            </div>

            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            <button type="submit" className="submit-button">
              Access Application
            </button>
          </form>

          <div className="password-protection-footer">
            <p> This application requires a password to access.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="authenticated-app">
      {children}
    </div>
  )
}

export default PasswordProtection