import React, { createContext, useState, useEffect } from 'react'
import { authAPI } from '../api/auth'
import { clearAccessToken } from '../api/config'

export const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Initialize from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser))
      } catch (err) {
        console.error('Failed to parse stored user:', err)
      }
    }
    setLoading(false)
  }, [])

  const register = async (name, email, phone, password, role) => {
    setLoading(true)
    setError(null)
    try {
      const response = await authAPI.register(name, email, phone, password, role)
      const userData = response.data.user
      setUser(userData)
      localStorage.setItem('user', JSON.stringify(userData))
      return { success: true, user: userData }
    } catch (err) {
      const message = err.response?.data?.message || 'Registration failed'
      setError(message)
      return { success: false, error: message }
    } finally {
      setLoading(false)
    }
  }

  const login = async (email, password) => {
    setLoading(true)
    setError(null)
    try {
      const response = await authAPI.login(email, password)
      const userData = response.data.user
      setUser(userData)
      localStorage.setItem('user', JSON.stringify(userData))
      return { success: true, user: userData }
    } catch (err) {
      const message = err.response?.data?.message || 'Login failed'
      setError(message)
      return { success: false, error: message }
    } finally {
      setLoading(false)
    }
  }

  const googleLogin = async (credential, role) => {
    setLoading(true)
    setError(null)
    try {
      const response = await authAPI.googleLogin(credential, role)
      const userData = response.data.user
      setUser(userData)
      localStorage.setItem('user', JSON.stringify(userData))
      return { success: true, user: userData, isNewUser: response.data.isNewUser }
    } catch (err) {
      const message = err.response?.data?.message || 'Google login failed'
      setError(message)
      return { success: false, error: message }
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    setLoading(true)
    try {
      await authAPI.logout()
    } catch (err) {
      console.error('Logout error:', err)
    } finally {
      setUser(null)
      clearAccessToken()
      localStorage.removeItem('user')
      localStorage.removeItem('accessToken')
      setLoading(false)
    }
  }

  const value = {
    user,
    loading,
    error,
    register,
    login,
    googleLogin,
    logout,
    isAuthenticated: !!user,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
