import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import authBg from './assets/auth-bg.jpg'
import bsuLogo from './assets/bsu-logo.png'

interface SignUpPageProps {
  onSignUp: () => void
}

export default function SignUpPage({ onSignUp }: SignUpPageProps) {
  const navigate = useNavigate()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [signUpError, setSignUpError] = useState('')
  const [signUpSuccess, setSignUpSuccess] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const backendBaseUrl = import.meta.env.VITE_BACKEND_API_URL ?? 'http://localhost:4000'

  const handleSignUp = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const trimmedFullName = fullName.trim()
    const normalizedEmail = email.trim().toLowerCase()
    const trimmedPassword = password.trim()

    if (!trimmedFullName) {
      setSignUpError('Full name is required.')
      return
    }

    if (!normalizedEmail) {
      setSignUpError('Email is required.')
      return
    }

    if (trimmedPassword.length < 6) {
      setSignUpError('Password must be at least 6 characters long.')
      return
    }

    if (trimmedPassword !== confirmPassword.trim()) {
      setSignUpError('Passwords do not match.')
      return
    }

    setIsSubmitting(true)
    setSignUpError('')
    setSignUpSuccess('')

    try {
      const response = await fetch(`${backendBaseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: trimmedFullName,
          email: normalizedEmail,
          password: trimmedPassword,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setSignUpSuccess('Account created successfully! Redirecting...')
        setTimeout(() => {
          localStorage.setItem('user', JSON.stringify(data.user))
          localStorage.setItem('token', data.token)
          onSignUp()
          navigate('/dashboard')
        }, 1000)
      } else {
        setSignUpError(data.message || 'Sign up failed. Please try again.')
      }
    } catch {
      setSignUpError('Cannot connect to the server. Please check your connection.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-white">
      <img
        src={authBg}
        alt="Background"
        className="absolute inset-0 h-full w-full object-cover"
      />

      <div className="absolute inset-0 bg-gradient-to-r from-slate-900/45 via-slate-900/25 to-transparent" />

      <div className="relative z-10 flex items-center justify-between border-b border-white/15 bg-white/5 px-8 py-6 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 backdrop-blur-md border border-white/20 transition hover:bg-white/15">
            <img src={bsuLogo} alt="Logo" className="h-9 w-9 object-contain" />
          </div>
          <div>
            <span className="block text-lg font-black text-white tracking-[-0.01em]">BatstateU</span>
            <span className="block text-[10px] uppercase tracking-[0.15em] text-white/60">Risk Intelligence</span>
          </div>
        </div>
        <button className="rounded-xl bg-white px-8 py-2.5 text-sm font-bold text-slate-900 shadow-[0_12px_32px_rgba(255,255,255,0.2)] transition hover:bg-white/95 hover:shadow-[0_16px_40px_rgba(255,255,255,0.3)]">
          Get in touch
        </button>
      </div>

      <div className="relative z-10 flex min-h-[calc(100vh-80px)] items-center justify-between gap-12 px-8 sm:px-12 md:px-16 lg:px-20 py-12">
        <div className="max-w-2xl text-white flex-1">
          <div className="space-y-6">
            <div>
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.4em] text-white/70 drop-shadow-lg">Platform Overview</p>
              <h1 className="text-6xl sm:text-7xl md:text-8xl font-black leading-[0.95] tracking-tight drop-shadow-[0_4px_12px_rgba(0,0,0,0.4)]">
                EXPLORE
                <br />
                HORIZONS
              </h1>
            </div>
            <p className="max-w-lg text-lg text-white/90 font-light leading-relaxed drop-shadow-md">
              Join thousands accessing real-time risk assessments and intelligent insights for your area.
            </p>
            <div className="flex gap-4 pt-4">
              <div className="h-1 w-12 bg-gradient-to-r from-blue-400 to-transparent rounded-full" />
            </div>
          </div>
        </div>

        <div className="w-full max-w-sm shrink-0 flex-shrink-0 min-h-[540px]">
          <div className="rounded-2xl border border-white/25 bg-white/97 backdrop-blur-xl shadow-[0_40px_80px_rgba(0,0,0,0.35),0_0_1px_rgba(255,255,255,0.5)] p-10 pb-12">
            <div className="mb-8">
              <h2 className="text-2xl font-black text-slate-900 tracking-[-0.01em]">Create Account</h2>
              <p className="mt-2 text-sm text-slate-500 font-medium">Join us to start exploring risk data</p>
            </div>

            <form className="space-y-5" onSubmit={handleSignUp}>
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-[0.1em]">Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your full name"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 transition focus:bg-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-[0.1em]">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 transition focus:bg-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-[0.1em]">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 transition focus:bg-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-[0.1em]">Confirm Password</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 transition focus:bg-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {signUpError ? <p className="text-sm text-rose-600 font-medium">{signUpError}</p> : null}
              {signUpSuccess ? <p className="text-sm text-emerald-700 font-medium">{signUpSuccess}</p> : null}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3.5 text-sm font-bold text-white shadow-[0_16px_32px_rgba(37,99,235,0.3)] transition hover:shadow-[0_20px_40px_rgba(37,99,235,0.4)] hover:brightness-105 disabled:opacity-60 uppercase tracking-[0.05em]"
              >
                {isSubmitting ? 'Creating Account...' : 'CREATE ACCOUNT'}
              </button>
            </form>

            <div className="flex flex-col gap-4 mt-6">
              <div className="flex items-center gap-4">
                <div className="h-px flex-1 bg-white/10" />
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">or</span>
                <div className="h-px flex-1 bg-white/10" />
              </div>
              {/* Google sign up removed as requested */}
              <p className="text-center text-sm text-slate-600 font-medium">
                Already have an account?{' '}
                <Link to="/" className="font-bold text-blue-600 hover:text-blue-700 transition">
                  Sign In
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
