import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth, useToast } from '../hooks/useContext'
import { ErrorMessage } from '../components/EmptyState'
import GoogleLoginButton from '../components/GoogleLoginButton'
import { Eye, EyeOff, Zap, Mail, Lock, User, Phone, CheckCircle, XCircle, Sun, Activity, Shield, Link2 } from 'lucide-react'
import AnimatedCounter from '../components/AnimatedCounter'

export default function Register() {
  const navigate = useNavigate()
  const { register, googleLogin, isAuthenticated } = useAuth()
  const toast = useToast()
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', password: '', role: 'consumer'
  })
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [touched, setTouched] = useState({})

  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard')
  }, [isAuthenticated])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }))
  }

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }))
    validateField(field)
  }

  const validateField = (field) => {
    const value = formData[field]
    let error = ''
    switch (field) {
      case 'name': if (!value.trim()) error = 'Name is required'; break
      case 'email': if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) error = 'Invalid email'; break
      case 'phone': if (!/^\d{10}$/.test(value)) error = 'Must be 10 digits'; break
      case 'password':
        if (value.length < 8) error = 'Min 8 characters'
        else if (!/[A-Z]/.test(value)) error = 'Need 1 uppercase'
        else if (!/\d/.test(value)) error = 'Need 1 number'
        break
    }
    if (error) setErrors((prev) => ({ ...prev, [field]: error }))
  }

  const getPasswordStrength = (password) => {
    let score = 0
    if (password.length >= 8) score++
    if (/[A-Z]/.test(password)) score++
    if (/\d/.test(password)) score++
    if (/[^A-Za-z0-9]/.test(password)) score++
    if (password.length >= 12) score++
    return score
  }

  const strength = getPasswordStrength(formData.password)
  const strengthLabels = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Excellent']
  const strengthColors = ['', 'bg-danger-400', 'bg-orange-500', 'bg-accent-500', 'bg-volt-green', 'bg-emerald-400']

  const passwordChecks = [
    { label: '8+ characters', met: formData.password.length >= 8 },
    { label: '1 uppercase', met: /[A-Z]/.test(formData.password) },
    { label: '1 number', met: /\d/.test(formData.password) },
    { label: '1 special char', met: /[^A-Za-z0-9]/.test(formData.password) },
  ]

  const handleSubmit = async (e) => {
    e.preventDefault()
    const newErrors = {}
    if (!formData.name.trim()) newErrors.name = 'Name is required'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Invalid email'
    if (!/^\d{10}$/.test(formData.phone)) newErrors.phone = 'Must be 10 digits'
    if (formData.password.length < 8 || !/[A-Z]/.test(formData.password) || !/\d/.test(formData.password))
      newErrors.password = 'Password doesn\'t meet requirements'
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return }

    setIsSubmitting(true)
    try {
      const result = await register(formData.name, formData.email, formData.phone, formData.password, formData.role)
      if (result.success) {
        toast.success('Welcome to ArkaGrid! ⚡')
        navigate('/dashboard')
      } else {
        setErrors({ general: result.error })
      }
    } catch (error) {
      setErrors({ general: 'Registration failed. Please try again.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Panel — Visual */}
      <div className="hidden lg:flex lg:w-[55%] mesh-gradient relative flex-col justify-between p-12">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-volt-green/10 border border-volt-green/30 flex items-center justify-center">
            <Zap size={20} className="text-volt-green" />
          </div>
          <span className="text-xl font-bold font-heading text-white">
            Arka<span className="text-volt-green">Grid</span>
          </span>
        </div>

        <div className="max-w-lg">
          <h1 className="text-4xl xl:text-5xl font-bold font-heading text-white leading-tight mb-6">
            Join India's first
            <br />
            <span className="text-volt-green">P2P energy market</span>
          </h1>
          <p className="text-gray-400 text-lg mb-10">
            Start trading clean solar energy with your neighbourhood today.
          </p>

          <div className="flex gap-6 mb-10">
            <div className="text-center">
              <p className="text-2xl font-bold font-mono text-volt-green">
                <AnimatedCounter value={240000} prefix="₹" decimals={0} />
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

          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-volt-surface/60 border border-volt-border text-xs text-gray-400">
              <Shield size={14} className="text-volt-green" /> Escrow Protected
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-volt-surface/60 border border-volt-border text-xs text-gray-400">
              <Link2 size={14} className="text-volt-green" /> Blockchain Verified
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-volt-surface/60 border border-volt-border text-xs text-gray-400">
              <Activity size={14} className="text-volt-green" /> Instant Settlement
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-gray-600 text-xs">
          <Zap size={14} />
          <span>© {new Date().getFullYear()} ArkaGrid — Neighbourhood Energy Trading</span>
        </div>
      </div>

      {/* Right Panel — Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 bg-volt-dark overflow-y-auto">
        <div className="w-full max-w-md animate-slide-up py-8">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-6">
            <div className="inline-flex items-center gap-3">
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
            <Link
              to="/login"
              className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-center text-gray-500 hover:text-gray-300 transition-all"
            >
              Sign In
            </Link>
            <button
              className="flex-1 py-2.5 rounded-lg text-sm font-semibold bg-volt-green text-volt-dark transition-all"
            >
              Create Account
            </button>
          </div>

          <div className="card-glass p-8">
            {errors.general && (
              <div className="mb-6"><ErrorMessage message={errors.general} /></div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Role Selector */}
              <div>
                <label className="form-label">I want to</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: 'consumer', icon: '⚡', label: 'Buy Energy', desc: 'Save on electricity' },
                    { value: 'prosumer', icon: '☀️', label: 'Sell Energy', desc: 'Earn from solar' },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, role: option.value }))}
                      className={`p-4 rounded-xl border-2 text-left transition-all duration-200 ${formData.role === option.value
                        ? 'border-volt-green bg-volt-green/5 shadow-glow-green'
                        : 'border-volt-border bg-volt-surface/50 hover:border-gray-500'
                        }`}
                    >
                      <span className="text-2xl mb-1 block">{option.icon}</span>
                      <p className={`font-semibold text-sm ${formData.role === option.value ? 'text-volt-green' : 'text-gray-300'}`}>{option.label}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{option.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="form-label">Full Name</label>
                <div className="relative">
                  <User size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600" />
                  <input type="text" name="name" value={formData.name}
                    onChange={handleChange} onBlur={() => handleBlur('name')}
                    placeholder="John Doe"
                    className={`form-input pl-11 ${errors.name && touched.name ? 'border-danger-400 ring-2 ring-danger-400/20' : ''}`} />
                </div>
                {errors.name && touched.name && <p className="text-danger-400 text-xs mt-1.5 font-medium">{errors.name}</p>}
              </div>

              {/* Email */}
              <div>
                <label className="form-label">Email Address</label>
                <div className="relative">
                  <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600" />
                  <input type="email" name="email" value={formData.email}
                    onChange={handleChange} onBlur={() => handleBlur('email')}
                    placeholder="you@example.com"
                    className={`form-input pl-11 ${errors.email && touched.email ? 'border-danger-400 ring-2 ring-danger-400/20' : ''}`} />
                </div>
                {errors.email && touched.email && <p className="text-danger-400 text-xs mt-1.5 font-medium">{errors.email}</p>}
              </div>

              {/* Phone */}
              <div>
                <label className="form-label">Phone Number</label>
                <div className="relative">
                  <Phone size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600" />
                  <input type="tel" name="phone" value={formData.phone}
                    onChange={handleChange} onBlur={() => handleBlur('phone')}
                    placeholder="9876543210" maxLength={10}
                    className={`form-input pl-11 ${errors.phone && touched.phone ? 'border-danger-400 ring-2 ring-danger-400/20' : ''}`} />
                </div>
                {errors.phone && touched.phone && <p className="text-danger-400 text-xs mt-1.5 font-medium">{errors.phone}</p>}
              </div>

              {/* Password */}
              <div>
                <label className="form-label">Password</label>
                <div className="relative">
                  <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600" />
                  <input type={showPassword ? 'text' : 'password'} name="password"
                    value={formData.password} onChange={handleChange} onBlur={() => handleBlur('password')}
                    placeholder="••••••••"
                    className={`form-input pl-11 pr-11 ${errors.password && touched.password ? 'border-danger-400 ring-2 ring-danger-400/20' : ''}`} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-400 transition-colors">
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                {formData.password && (
                  <div className="mt-3 space-y-2 animate-fade-in">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${i <= strength ? strengthColors[strength] : 'bg-volt-border'}`} />
                      ))}
                    </div>
                    <p className={`text-xs font-semibold ${strength <= 1 ? 'text-danger-400' : strength <= 2 ? 'text-orange-400' : strength <= 3 ? 'text-accent-400' : 'text-volt-green'}`}>
                      {strengthLabels[strength]}
                    </p>
                    <div className="grid grid-cols-2 gap-1">
                      {passwordChecks.map((check) => (
                        <div key={check.label} className="flex items-center gap-1.5 text-xs">
                          {check.met
                            ? <CheckCircle size={12} className="text-volt-green" />
                            : <XCircle size={12} className="text-gray-600" />
                          }
                          <span className={check.met ? 'text-gray-300' : 'text-gray-600'}>{check.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Submit */}
              <button type="submit" disabled={isSubmitting}
                className="w-full btn-primary py-3 text-base font-bold disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none">
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-volt-dark/30 border-t-volt-dark rounded-full animate-spin" />
                    Creating account...
                  </span>
                ) : 'Create Account'}
              </button>
            </form>

            {/* Google Sign-In */}
            <GoogleLoginButton
              onSuccess={async (credential) => {
                setIsSubmitting(true)
                try {
                  const result = await googleLogin(credential, formData.role)
                  if (result.success) {
                    toast.success(result.isNewUser ? 'Welcome to ArkaGrid! ⚡' : 'Welcome back! ⚡')
                    navigate('/dashboard')
                  } else {
                    setErrors({ general: result.error })
                  }
                } catch (error) {
                  setErrors({ general: 'Google sign-up failed. Please try again.' })
                } finally {
                  setIsSubmitting(false)
                }
              }}
              onError={(msg) => setErrors({ general: msg })}
              text="signup_with"
            />

            <p className="text-center text-gray-500 text-sm mt-6">
              Already have an account?{' '}
              <Link to="/login" className="text-volt-green font-semibold hover:text-volt-green/80 transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
