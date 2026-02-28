import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth, useToast } from '../hooks/useContext'
import { ErrorMessage } from '../components/EmptyState'
import GoogleLoginButton from '../components/GoogleLoginButton'
import { Eye, EyeOff, Zap, Mail, Lock, User, Phone, CheckCircle, XCircle } from 'lucide-react'

export default function Register() {
  const navigate = useNavigate()
  const { register, googleLogin } = useAuth()
  const toast = useToast()
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', password: '', role: 'consumer'
  })
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [touched, setTouched] = useState({})

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

  // Password strength
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
  const strengthColors = ['', 'bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500', 'bg-emerald-500']

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
        toast.success('Account created! Welcome to ArkaGrid 🎉')
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
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 py-12">
      <div className="w-full max-w-md animate-slide-up">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-lg shadow-green-500/30 mb-4">
            <Zap size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Create account</h1>
          <p className="text-gray-500 mt-1">Join ArkaGrid and start trading energy</p>
        </div>

        {/* Form Card */}
        <div className="card p-8">
          {errors.general && (
            <div className="mb-6"><ErrorMessage message={errors.general} /></div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Role Selector */}
            <div>
              <label className="form-label">I want to</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: 'consumer', label: '🔌 Buy Energy', desc: 'Save on electricity' },
                  { value: 'prosumer', label: '☀️ Sell Energy', desc: 'Earn from solar' },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, role: option.value }))}
                    className={`p-3 rounded-xl border-2 text-left transition-all duration-200 ${formData.role === option.value
                      ? 'border-green-500 bg-green-50 shadow-sm'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                  >
                    <p className="font-semibold text-sm">{option.label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{option.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Name */}
            <div>
              <label className="form-label">Full Name</label>
              <div className="relative">
                <User size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text" name="name" value={formData.name}
                  onChange={handleChange} onBlur={() => handleBlur('name')}
                  placeholder="John Doe"
                  className={`form-input pl-11 ${errors.name && touched.name ? 'border-red-400 ring-2 ring-red-100' : ''}`}
                />
              </div>
              {errors.name && touched.name && <p className="text-red-500 text-xs mt-1.5 font-medium">{errors.name}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="form-label">Email Address</label>
              <div className="relative">
                <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email" name="email" value={formData.email}
                  onChange={handleChange} onBlur={() => handleBlur('email')}
                  placeholder="you@example.com"
                  className={`form-input pl-11 ${errors.email && touched.email ? 'border-red-400 ring-2 ring-red-100' : ''}`}
                />
              </div>
              {errors.email && touched.email && <p className="text-red-500 text-xs mt-1.5 font-medium">{errors.email}</p>}
            </div>

            {/* Phone */}
            <div>
              <label className="form-label">Phone Number</label>
              <div className="relative">
                <Phone size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="tel" name="phone" value={formData.phone}
                  onChange={handleChange} onBlur={() => handleBlur('phone')}
                  placeholder="9876543210" maxLength={10}
                  className={`form-input pl-11 ${errors.phone && touched.phone ? 'border-red-400 ring-2 ring-red-100' : ''}`}
                />
              </div>
              {errors.phone && touched.phone && <p className="text-red-500 text-xs mt-1.5 font-medium">{errors.phone}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="form-label">Password</label>
              <div className="relative">
                <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'} name="password"
                  value={formData.password} onChange={handleChange} onBlur={() => handleBlur('password')}
                  placeholder="••••••••"
                  className={`form-input pl-11 pr-11 ${errors.password && touched.password ? 'border-red-400 ring-2 ring-red-100' : ''}`}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {/* Password Strength Indicator */}
              {formData.password && (
                <div className="mt-3 space-y-2 animate-fade-in">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${i <= strength ? strengthColors[strength] : 'bg-gray-200'
                        }`} />
                    ))}
                  </div>
                  <p className={`text-xs font-semibold ${strength <= 1 ? 'text-red-600' : strength <= 2 ? 'text-orange-600' : strength <= 3 ? 'text-yellow-600' : 'text-green-600'
                    }`}>
                    {strengthLabels[strength]}
                  </p>
                  <div className="grid grid-cols-2 gap-1">
                    {passwordChecks.map((check) => (
                      <div key={check.label} className="flex items-center gap-1.5 text-xs">
                        {check.met
                          ? <CheckCircle size={12} className="text-green-500" />
                          : <XCircle size={12} className="text-gray-300" />
                        }
                        <span className={check.met ? 'text-green-700' : 'text-gray-400'}>{check.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Submit */}
            <button type="submit" disabled={isSubmitting}
              className="w-full btn-primary py-3 text-base disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none">
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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
                  toast.success(result.isNewUser ? 'Account created with Google! 🎉' : 'Welcome back! 🎉')
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
            <Link to="/login" className="text-green-600 font-semibold hover:text-green-700 transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
