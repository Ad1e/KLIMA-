// --- REWRITTEN SIGNUP PAGE ---
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

  const backendBaseUrl =
    import.meta.env.VITE_BACKEND_API_URL ?? 'http://localhost:4000'

  const handleSignUp = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const trimmedFullName = fullName.trim()
    const normalizedEmail = email.trim().toLowerCase()
    const trimmedPassword = password.trim()
    const trimmedConfirmPassword = confirmPassword.trim()

    if (!trimmedFullName) {
      setSignUpError('Full name is required.')
      setSignUpSuccess('')
      return
    }

    if (!normalizedEmail) {
      setSignUpError('Email is required.')
      setSignUpSuccess('')
      return
    }

    if (trimmedPassword.length < 6) {
      setSignUpError('Password must be at least 6 characters long.')
      setSignUpSuccess('')
      return
    }

    if (trimmedPassword !== trimmedConfirmPassword) {
      setSignUpError('Passwords do not match.')
      setSignUpSuccess('')
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
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/20 bg-white/10 backdrop-blur-md transition hover:bg-white/15">
            <img src={bsuLogo} alt="Logo" className="h-9 w-9 object-contain" />
          </div>

          <div>
            <span className="block text-lg font-black tracking-[-0.01em] text-white">
              BatstateU
            </span>
            <span className="block text-[10px] uppercase tracking-[0.15em] text-white/60">
              Risk Intelligence
            </span>
          </div>
        </div>

        <button className="rounded-xl bg-white px-8 py-2.5 text-sm font-bold text-slate-900 shadow-[0_12px_32px_rgba(255,255,255,0.2)] transition hover:bg-white/95 hover:shadow-[0_16px_40px_rgba(255,255,255,0.3)]">
          Get in touch
        </button>
      </div>

      <div className="relative z-10 flex min-h-[calc(100vh-80px)] items-center justify-between gap-12 px-8 py-12 sm:px-12 md:px-16 lg:px-20">
        <div className="max-w-2xl flex-1 text-white">
          <div className="space-y-6">
            <div>
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.4em] text-white/70 drop-shadow-lg">
                Platform Overview
              </p>
              <h1 className="text-6xl font-black leading-[0.95] tracking-tight drop-shadow-[0_4px_12px_rgba(0,0,0,0.4)] sm:text-7xl md:text-8xl">
                EXPLORE
                <br />
                HORIZONS
              </h1>
            </div>

            <p className="max-w-lg text-lg font-light leading-relaxed text-white/90 drop-shadow-md">
              Join thousands accessing real-time risk assessments and intelligent
              insights for your area.
            </p>

            <div className="flex gap-4 pt-4">
              <div className="h-1 w-12 rounded-full bg-gradient-to-r from-blue-400 to-transparent" />
            </div>
          </div>
        </div>

        <div className="w-full max-w-sm shrink-0">
          <div className="rounded-[30px] border border-white/15 bg-white/10 p-10 pb-9 shadow-[0_30px_60px_rgba(0,0,0,0.28)] backdrop-blur-xl">
            <div className="mb-7">
              <h2 className="text-2xl font-black tracking-[-0.01em] text-white">
                Create Account
              </h2>
              <p className="mt-2 text-sm font-medium text-white/70">
                Join us to start exploring risk data
              </p>
            </div>

            <form className="space-y-4" onSubmit={handleSignUp}>
              <div className="space-y-2">
                <label className="block text-xs font-medium text-white/70">
                  Full Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your full name"
                  className="w-full rounded-2xl border border-white/20 bg-white/6 px-4 py-3.5 text-sm text-white placeholder:text-white/30 transition focus:border-white/35 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/10"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-medium text-white/70">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full rounded-2xl border border-white/20 bg-[#dce5f0] px-4 py-3.5 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-white/35 focus:outline-none focus:ring-2 focus:ring-white/10"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-medium text-white/70">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-2xl border border-white/20 bg-white/6 px-4 py-3.5 pr-12 text-sm text-white placeholder:text-white/30 transition focus:border-white/35 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 transition hover:text-white/75"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-medium text-white/70">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-2xl border border-white/20 bg-[#dce5f0] px-4 py-3.5 pr-12 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-white/35 focus:outline-none focus:ring-2 focus:ring-white/10"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirmPassword(!showConfirmPassword)
                    }
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="min-h-[18px]">
                {signUpError ? (
                  <p className="text-xs font-medium text-white/60">
                    {signUpError}
                  </p>
                ) : null}

                {signUpSuccess ? (
                  <p className="text-xs font-medium text-emerald-300">
                    {signUpSuccess}
                  </p>
                ) : null}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-1 w-full rounded-2xl bg-[#ef2020] px-4 py-3.5 text-sm font-bold text-white transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? 'Creating Account...' : 'Sign Up'}
              </button>

              <div className="pt-3">
                <div className="flex items-center gap-3">
                  <div className="h-px flex-1 bg-white/12" />
                  <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/50">
                    OR
                  </span>
                  <div className="h-px flex-1 bg-white/12" />
                </div>

                <p className="mt-5 text-center text-sm text-white/72">
                  Already have an account?{' '}
                  <Link
                    to="/"
                    className="font-semibold text-emerald-500 transition hover:text-emerald-600"
                  >
                    Sign In
                  </Link>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
