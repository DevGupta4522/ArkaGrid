import api, { setAccessToken } from './config'

export const authAPI = {
  register: async (name, email, phone, password, role) => {
    const response = await api.post('/auth/register', {
      name,
      email,
      phone,
      password,
      role,
    })
    if (response.data.data.accessToken) {
      setAccessToken(response.data.data.accessToken)
    }
    return response.data
  },

  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password })
    if (response.data.data.accessToken) {
      setAccessToken(response.data.data.accessToken)
    }
    return response.data
  },

  googleLogin: async (credential, role) => {
    const response = await api.post('/auth/google', { credential, role })
    if (response.data.data.accessToken) {
      setAccessToken(response.data.data.accessToken)
    }
    return response.data
  },

  refresh: async () => {
    const response = await api.post('/auth/refresh')
    if (response.data.data.accessToken) {
      setAccessToken(response.data.data.accessToken)
    }
    return response.data
  },

  logout: async () => {
    const response = await api.post('/auth/logout')
    return response.data
  },

  getMe: async () => {
    const response = await api.get('/auth/me')
    return response.data
  },
}
