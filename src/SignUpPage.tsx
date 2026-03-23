import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Eye, EyeOff, Lock, Mail, User } from 'lucide-react'
import bsuEntrance from './assets/bsu-entrance.jpg'
import bsuLogo from './assets/bsu-logo.png'

export default function SignUpPage() {
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

    const normalizedFullName = fullName.trim()
    const normalizedEmail = email.trim().toLowerCase()

    if (!normalizedFullName || !normalizedEmail || !password.trim()) {
      setSignUpError('Enter full name, email, and password.')
      setSignUpSuccess('')
      return
    }

    if (password.length < 6) {
      setSignUpError('Password must be at least 6 characters.')
      setSignUpSuccess('')
      return
    }

    if (password !== confirmPassword) {
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
          full_name: normalizedFullName,
          email: normalizedEmail,
          password,
        }),
      })

      const payload = await response.json().catch(() => ({}))
      if (!response.ok || !payload?.ok) {
        setSignUpError(payload?.message ?? 'Sign up failed. Please try again.')
        return
      }

      setSignUpSuccess('Account created successfully. You can now sign in.')
      setTimeout(() => {
        navigate('/')
      }, 1000)
    } catch {
      setSignUpError('Cannot reach backend register service. Check if backend is running.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#fff3f3] p-6">
      <div className="grid h-[90vh] w-full max-w-7xl grid-cols-1 overflow-hidden rounded-[32px] bg-white shadow-2xl lg:grid-cols-2">
        <div className="relative hidden items-center justify-center overflow-hidden bg-[linear-gradient(135deg,#4a0303_0%,#8a1111_42%,#cf2a2a_100%)] lg:flex">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(255,255,255,0.22),transparent_35%),radial-gradient(circle_at_85%_15%,rgba(255,189,189,0.22),transparent_30%),radial-gradient(circle_at_70%_75%,rgba(255,226,150,0.2),transparent_34%)]" />
          <div className="absolute inset-0 opacity-25 [background-image:linear-gradient(rgba(255,255,255,0.14)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.14)_1px,transparent_1px)] [background-size:44px_44px]" />

          <div className="relative z-10 w-full max-w-md px-8 text-white">
            <div className="mx-auto flex h-44 w-44 items-center justify-center rounded-[2rem] border border-white/30 bg-white/15 p-4 shadow-[0_20px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl">
              <img
                src={bsuLogo}
                alt="School logo"
                className="h-full w-full rounded-2xl object-contain"
              />
            </div>

            <div className="mt-8 rounded-3xl border border-white/25 bg-white/10 px-7 py-6 text-center backdrop-blur-md">
              <h2 className="mt-3 text-white">
                <span className="block text-5xl font-extrabold tracking-[0.06em]">KLIMA</span>
                <span className="mt-1 block text-xl font-semibold tracking-[0.02em] text-white/90">
                  Local Risk Assessment
                </span>
              </h2>
              <p className="mt-3 text-sm text-white/85">Batangas State University</p>
            </div>
          </div>
        </div>

        <div className="relative flex items-center justify-center overflow-hidden px-6 py-10 sm:px-10">
          <img
            src={bsuEntrance}
            alt="Batangas State University entrance"
            className="absolute inset-0 h-full w-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-black/10" />

          <div className="relative z-10 w-full max-w-md overflow-hidden rounded-[28px] border border-white/50 bg-white p-8 shadow-[0_18px_60px_rgba(15,23,42,0.12)] sm:p-10">
            <div className="absolute inset-0 bg-white/90" />

            <div className="relative z-10">
              <div className="mb-8">
                <h1 className="text-4xl font-bold tracking-tight text-slate-900">Sign Up</h1>
              </div>

              <form className="space-y-5 pb-1" onSubmit={handleSignUp}>
                <div className="group relative">
                  <label className="absolute -top-2.5 left-4 bg-white px-2 text-xs font-medium text-slate-500 transition-all group-focus-within:text-indigo-600">
                    Full Name
                  </label>
                  <div className="flex items-center rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm transition-all duration-200 group-focus-within:border-indigo-500 group-focus-within:shadow-[0_0_0_6px_rgba(99,102,241,0.08)]">
                    <User className="mr-3 h-5 w-5 text-slate-400" />
                    <input
                      type="text"
                      value={fullName}
                      onChange={(event) => setFullName(event.target.value)}
                      placeholder="Enter your full name"
                      className="w-full bg-transparent text-slate-800 placeholder:text-slate-400 outline-none"
                    />
                  </div>
                </div>

                <div className="group relative">
                  <label className="absolute -top-2.5 left-4 bg-white px-2 text-xs font-medium text-slate-500 transition-all group-focus-within:text-indigo-600">
                    Email
                  </label>
                  <div className="flex items-center rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm transition-all duration-200 group-focus-within:border-indigo-500 group-focus-within:shadow-[0_0_0_6px_rgba(99,102,241,0.08)]">
                    <Mail className="mr-3 h-5 w-5 text-slate-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="Enter your email"
                      className="w-full bg-transparent text-slate-800 placeholder:text-slate-400 outline-none"
                    />
                  </div>
                </div>

                <div className="group relative">
                  <label className="absolute -top-2.5 left-4 bg-white px-2 text-xs font-medium text-slate-500 transition-all group-focus-within:text-indigo-600">
                    Password
                  </label>
                  <div className="flex items-center rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm transition-all duration-200 group-focus-within:border-indigo-500 group-focus-within:shadow-[0_0_0_6px_rgba(99,102,241,0.08)]">
                    <Lock className="mr-3 h-5 w-5 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="Create a password"
                      className="w-full bg-transparent pr-10 text-slate-800 placeholder:text-slate-400 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((value) => !value)}
                      className="ml-2 text-slate-500 transition hover:text-slate-700"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <div className="group relative">
                  <label className="absolute -top-2.5 left-4 bg-white px-2 text-xs font-medium text-slate-500 transition-all group-focus-within:text-indigo-600">
                    Confirm Password
                  </label>
                  <div className="flex items-center rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm transition-all duration-200 group-focus-within:border-indigo-500 group-focus-within:shadow-[0_0_0_6px_rgba(99,102,241,0.08)]">
                    <Lock className="mr-3 h-5 w-5 text-slate-400" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      placeholder="Confirm your password"
                      className="w-full bg-transparent pr-10 text-slate-800 placeholder:text-slate-400 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((value) => !value)}
                      className="ml-2 text-slate-500 transition hover:text-slate-700"
                      aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                    >
                      {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                {signUpError ? <p className="text-sm text-red-600">{signUpError}</p> : null}
                {signUpSuccess ? <p className="text-sm text-emerald-700">{signUpSuccess}</p> : null}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="group relative flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#b91c1c] to-[#ef4444] px-5 py-4 text-base font-semibold text-white shadow-[0_12px_30px_rgba(239,68,68,0.35)] transition-all duration-200 hover:scale-[1.01] hover:shadow-[0_16px_40px_rgba(239,68,68,0.45)] active:scale-[0.99]"
                >
                  {isSubmitting ? 'Creating Account...' : 'Create Account'}
                  <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                  <span className="absolute inset-0 rounded-2xl bg-white/10 opacity-0 blur-xl transition-opacity duration-300 group-hover:opacity-100" />
                </button>
              </form>

              <p className="mt-6 text-center text-sm text-slate-600">
                Already have an account?{' '}
                <Link to="/" className="font-semibold text-red-700 hover:text-red-800">
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
