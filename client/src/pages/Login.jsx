import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth, useToast } from '../hooks/useContext'
import { ErrorMessage } from '../components/EmptyState'
import GoogleLoginButton from '../components/GoogleLoginButton'
import { Eye, EyeOff, Zap, Mail, Lock } from 'lucide-react'

export default function Login() {
  const navigate = useNavigate()
  const { login, googleLogin } = useAuth()
  const toast = useToast()
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const newErrors = {}
    if (!formData.email) newErrors.email = 'Email is required'
    if (!formData.password) newErrors.password = 'Password is required'
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return }

    setIsSubmitting(true)
    try {
      const result = await login(formData.email, formData.password)
      if (result.success) {
        toast.success('Welcome back! 🎉')
        navigate('/dashboard')
      } else {
        setErrors({ general: result.error })
      }
    } catch (error) {
      setErrors({ general: 'Login failed. Please try again.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleGoogleSuccess = async (credential) => {
    setIsSubmitting(true)
    setErrors({})
    try {
      const result = await googleLogin(credential)
      if (result.success) {
        toast.success(result.isNewUser ? 'Account created with Google! 🎉' : 'Welcome back! 🎉')
        navigate('/dashboard')
      } else {
        setErrors({ general: result.error })
      }
    } catch (error) {
      setErrors({ general: 'Google login failed. Please try again.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-slide-up">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-lg shadow-green-500/30 mb-4">
            <Zap size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Welcome back</h1>
          <p className="text-gray-500 mt-1">Sign in to your ArkaGrid account</p>
        </div>

        {/* Form Card */}
        <div className="card p-8">
          {errors.general && (
            <div className="mb-6">
              <ErrorMessage message={errors.general} />
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="form-label">Email Address</label>
              <div className="relative">
                <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  className={`form-input pl-11 ${errors.email ? 'border-red-400 ring-2 ring-red-100' : ''}`}
                />
              </div>
              {errors.email && <p className="text-red-500 text-xs mt-1.5 font-medium">{errors.email}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="form-label">Password</label>
              <div className="relative">
                <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className={`form-input pl-11 pr-11 ${errors.password ? 'border-red-400 ring-2 ring-red-100' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1.5 font-medium">{errors.password}</p>}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full btn-primary py-3 text-base disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : 'Sign In'}
            </button>
          </form>

          {/* Google Sign-In */}
          <GoogleLoginButton
            onSuccess={handleGoogleSuccess}
            onError={(msg) => setErrors({ general: msg })}
            text="signin_with"
          />

          {/* Register Link */}
          <p className="text-center text-gray-500 text-sm mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-green-600 font-semibold hover:text-green-700 transition-colors">
              Create account
            </Link>
          </p>
        </div>

        {/* Test Credentials */}
        <div className="mt-6 card-glass p-4">
          <p className="font-semibold text-gray-700 text-sm mb-3">🧪 Test Credentials</p>
          <div className="grid grid-cols-1 gap-2 text-xs">
            <div className="flex items-center justify-between bg-white/60 rounded-lg px-3 py-2">
              <span className="text-gray-500">Consumer</span>
              <span className="font-mono text-gray-700">consumer1@test.com / Test@123</span>
            </div>
            <div className="flex items-center justify-between bg-white/60 rounded-lg px-3 py-2">
              <span className="text-gray-500">Prosumer</span>
              <span className="font-mono text-gray-700">prosumer1@test.com / Test@123</span>
            </div>
            <div className="flex items-center justify-between bg-white/60 rounded-lg px-3 py-2">
              <span className="text-gray-500">Admin</span>
              <span className="font-mono text-gray-700">admin@test.com / Admin@123</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
