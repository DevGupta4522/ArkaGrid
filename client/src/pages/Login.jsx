import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth, useToast } from '../hooks/useContext'
import { ErrorMessage } from '../components/EmptyState'
import GoogleLoginButton from '../components/GoogleLoginButton'
import { Eye, EyeOff, Zap, Mail, Lock, Shield, Link2, Activity } from 'lucide-react'
import AnimatedCounter from '../components/AnimatedCounter'

export default function Login() {
  const navigate = useNavigate()
  const { login, googleLogin, isAuthenticated } = useAuth()
  const toast = useToast()
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState('signin')

  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard')
  }, [isAuthenticated])

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
        toast.success('Welcome back! ⚡')
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
        toast.success(result.isNewUser ? 'Account created with Google! ⚡' : 'Welcome back! ⚡')
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
    <div className="min-h-screen flex">
      {/* Left Panel — Visual */}
      <div className="hidden lg:flex lg:w-[55%] mesh-gradient relative flex-col justify-between p-12">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-volt-green/10 border border-volt-green/30 flex items-center justify-center">
            <Zap size={20} className="text-volt-green" />
          </div>
          <span className="text-xl font-bold font-heading text-white">
            Arka<span className="text-volt-green">Grid</span>
          </span>
        </div>

        {/* Main content */}
        <div className="max-w-lg">
          <h1 className="text-4xl xl:text-5xl font-bold font-heading text-white leading-tight mb-6">
            Trade solar energy
            <br />
            <span className="text-volt-green">with your neighbours</span>
          </h1>
          <p className="text-gray-400 text-lg mb-10">
            Power your neighbour. Power your wallet.
          </p>

          {/* Animated stat counters */}
          <div className="flex gap-6 mb-10">
            <div className="text-center">
              <p className="text-2xl font-bold font-mono text-volt-green">
                <AnimatedCounter value={240000} prefix="₹" suffix="" decimals={0} />
              </p>
              <p className="text-xs text-gray-500 mt-1">Saved by traders</p>
            </div>
            <div className="w-px bg-volt-border" />
            <div className="text-center">
              <p className="text-2xl font-bold font-mono text-volt-green">
                <AnimatedCounter value={1200} suffix="+" decimals={0} />
              </p>
              <p className="text-xs text-gray-500 mt-1">kWh traded</p>
            </div>
            <div className="w-px bg-volt-border" />
            <div className="text-center">
              <p className="text-2xl font-bold font-mono text-volt-green">
                <AnimatedCounter value={340} suffix="+" decimals={0} />
              </p>
              <p className="text-xs text-gray-500 mt-1">Prosumers</p>
            </div>
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-volt-surface/60 border border-volt-border text-xs text-gray-400">
              <Shield size={14} className="text-volt-green" />
              Escrow Protected
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-volt-surface/60 border border-volt-border text-xs text-gray-400">
              <Link2 size={14} className="text-volt-green" />
              Blockchain Verified
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-volt-surface/60 border border-volt-border text-xs text-gray-400">
              <Activity size={14} className="text-volt-green" />
              Instant Settlement
            </div>
          </div>
        </div>

        {/* Bottom pattern */}
        <div className="flex items-center gap-2 text-gray-600 text-xs">
          <Zap size={14} />
          <span>© {new Date().getFullYear()} ArkaGrid — Neighbourhood Energy Trading</span>
        </div>
      </div>

      {/* Right Panel — Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 bg-volt-dark">
        <div className="w-full max-w-md animate-slide-up">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-volt-green/10 border border-volt-green/30 flex items-center justify-center">
                <Zap size={20} className="text-volt-green" />
              </div>
              <span className="text-xl font-bold font-heading text-white">
                Arka<span className="text-volt-green">Grid</span>
              </span>
            </div>
          </div>

          {/* Tab switcher */}
          <div className="flex bg-volt-surface rounded-xl p-1 mb-8 border border-volt-border">
            <button
              onClick={() => setActiveTab('signin')}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === 'signin' ? 'bg-volt-green text-volt-dark' : 'text-gray-500 hover:text-gray-300'
                }`}
            >
              Sign In
            </button>
            <Link
              to="/register"
              className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-center text-gray-500 hover:text-gray-300 transition-all"
            >
              Create Account
            </Link>
          </div>

          {/* Form Card */}
          <div className="card-glass p-8">
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
                  <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    className={`form-input pl-11 ${errors.email ? 'border-danger-400 ring-2 ring-danger-400/20' : ''}`}
                  />
                </div>
                {errors.email && <p className="text-danger-400 text-xs mt-1.5 font-medium">{errors.email}</p>}
              </div>

              {/* Password */}
              <div>
                <label className="form-label">Password</label>
                <div className="relative">
                  <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className={`form-input pl-11 pr-11 ${errors.password ? 'border-danger-400 ring-2 ring-danger-400/20' : ''}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-400 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.password && <p className="text-danger-400 text-xs mt-1.5 font-medium">{errors.password}</p>}
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full btn-primary py-3 text-base font-bold disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-volt-dark/30 border-t-volt-dark rounded-full animate-spin" />
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
              <Link to="/register" className="text-volt-green font-semibold hover:text-volt-green/80 transition-colors">
                Create account
              </Link>
            </p>
          </div>

          {/* Test Credentials */}
          <div className="mt-6 card-glass p-4">
            <p className="font-semibold text-gray-400 text-sm mb-3">🧪 Test Credentials</p>
            <div className="grid grid-cols-1 gap-2 text-xs">
              <div className="flex items-center justify-between bg-volt-dark/60 rounded-lg px-3 py-2">
                <span className="text-gray-500">Consumer</span>
                <span className="font-mono text-gray-400">consumer1@test.com / Test@123</span>
              </div>
              <div className="flex items-center justify-between bg-volt-dark/60 rounded-lg px-3 py-2">
                <span className="text-gray-500">Prosumer</span>
                <span className="font-mono text-gray-400">prosumer1@test.com / Test@123</span>
              </div>
              <div className="flex items-center justify-between bg-volt-dark/60 rounded-lg px-3 py-2">
                <span className="text-gray-500">Admin</span>
                <span className="font-mono text-gray-400">admin@test.com / Admin@123</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
