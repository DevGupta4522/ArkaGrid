import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Include cookies
})

// Store tokens
let accessToken = localStorage.getItem('accessToken')

// Request interceptor
api.interceptors.request.use(
  (config) => {
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor - handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 403 && error.response?.data?.code === 'INVALID_TOKEN' && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        // Try to refresh token
        const refreshResponse = await axios.post(
          `${API_BASE_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        )

        accessToken = refreshResponse.data.data.accessToken
        localStorage.setItem('accessToken', accessToken)

        // Retry original request
        originalRequest.headers.Authorization = `Bearer ${accessToken}`
        return api(originalRequest)
      } catch (refreshError) {
        // Refresh failed - logout user
        localStorage.removeItem('accessToken')
        localStorage.removeItem('user')
        // Redirect to login will be handled by the app
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

export const setAccessToken = (token) => {
  accessToken = token
  if (token) {
    localStorage.setItem('accessToken', token)
  }
}

export const clearAccessToken = () => {
  accessToken = null
  localStorage.removeItem('accessToken')
}

export default api
