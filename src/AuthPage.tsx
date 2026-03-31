import { useState } from 'react'
import TypingAnimation from './components/TypingAnimation'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Eye, EyeOff } from 'lucide-react'
import authBg from './assets/auth-bg.jpg'
import bsuLogo from './assets/bsu-logo.png'

interface AuthPageProps {
  onLogin: () => void
  onSignUp: () => void
}

export default function AuthPage({ onLogin, onSignUp }: AuthPageProps) {
  const navigate = useNavigate()
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')

  // Sign In state
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [isResetOpen, setIsResetOpen] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [resetStatus, setResetStatus] = useState<'idle' | 'sent'>('idle')
  const [emailError, setEmailError] = useState('')

  // Sign Up state
  const [fullName, setFullName] = useState('')
  const [signUpEmail, setSignUpEmail] = useState('')
  const [signUpPassword, setSignUpPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [signUpError, setSignUpError] = useState('')
  const [signUpSuccess, setSignUpSuccess] = useState('')
  const [isSignUpSubmitting, setIsSignUpSubmitting] = useState(false)
  const [showSignUpPassword, setShowSignUpPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const backendBaseUrl = import.meta.env.VITE_BACKEND_API_URL ?? 'http://localhost:4000'

  const handleSignIn = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const normalizedEmail = email.trim().toLowerCase()
    if (!normalizedEmail || !password.trim()) {
      setLoginError('Enter both email and password.')
      return
    }

    setIsSubmitting(true)
    setLoginError('')

    try {
      const response = await fetch(`${backendBaseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalizedEmail, password }),
      })

      const data = await response.json()

      if (response.ok) {
        localStorage.setItem('user', JSON.stringify(data.user))
        localStorage.setItem('token', data.token)
        onLogin()
        navigate('/dashboard')
      } else {
        setLoginError(data.message || 'Sign in failed. Please try again.')
      }
    } catch {
      setLoginError('Cannot connect to the server. Please check your connection.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSignUp = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const trimmedFullName = fullName.trim()
    const normalizedEmail = signUpEmail.trim().toLowerCase()
    const trimmedPassword = signUpPassword.trim()

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

    setIsSignUpSubmitting(true)
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
        setSignUpSuccess('Redirecting...')
        setTimeout(() => {
          localStorage.setItem('user', JSON.stringify(data.user))
          localStorage.setItem('token', data.token)
          onSignUp()
          navigate('/dashboard')
        }, 1000)
      } else {
        if (data.message && data.message.toLowerCase().includes('email')) {
          setSignUpError('This email is already registered.')
        } else {
          setSignUpError(data.message || 'Sign up failed. Please try again.')
        }
      }
    } catch {
      setSignUpError('Cannot connect to the server. Please check your connection.')
    } finally {
      setIsSignUpSubmitting(false)
    }
  }

  const handleResetSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailPattern.test(resetEmail)) {
      setEmailError('Please enter a valid email address.')
      return
    }
    setEmailError('')
    setResetStatus('sent')
  }

  const closeResetModal = () => {
    setIsResetOpen(false)
    setResetEmail('')
    setResetStatus('idle')
    setEmailError('')
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#414042] font-sans">
      <img
        src={authBg}
        alt="Background"
        className="absolute inset-0 h-full w-full object-cover opacity-60 mix-blend-overlay"
      />
      <div className="absolute inset-0 bg-gradient-to-br from-[#414042]/85 via-[#414042]/65 to-[#911d1f]/75 backdrop-blur-[2px]" />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-8 py-6 sm:px-12 lg:px-20">
        <div className="flex items-center gap-4 group cursor-pointer">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 transition-all duration-300 group-hover:bg-white/20 group-hover:scale-105 shadow-lg">
            <img src={bsuLogo} alt="Logo" className="h-8 w-8 object-contain" />
          </div>
          <div>
            <span className="block text-base sm:text-lg font-bold text-white tracking-tight">Batangas State University</span>
            <span className="block text-[11px] font-medium uppercase tracking-widest text-white/70">Risk Intelligence</span>
          </div>
        </div>
      </div>

      {/* Main layout */}
      <div className="relative z-10 flex min-h-[calc(100vh-100px)] flex-col lg:flex-row items-center justify-between gap-12 px-8 py-12 sm:px-12 lg:px-20">
        {/* Left side - Hero content */}
        <div className="w-full flex-1 max-w-2xl text-center lg:text-left">
          <p className="mb-4 text-2xl sm:text-3xl font-extrabold uppercase tracking-[0.3em] text-white/90">Platform Overview</p>
          <h1 className="text-6xl sm:text-8xl font-black leading-[1.1] text-white tracking-tight mb-8">
            Explore <br className="hidden lg:block" />
            <TypingAnimation />
          </h1>
          <p className="mx-auto lg:mx-0 max-w-2xl text-2xl text-white/90 font-medium leading-relaxed">
            Access real-time risk assessments and make informed decisions with our comprehensive intelligence platform.
          </p>
        </div>

        {/* Right side - Animated card carousel */}
        <div className="w-full max-w-md shrink-0 relative h-[620px]">
          {/* Stacked Card Swap Effect */}
          <motion.div
            animate={mode === 'signin'
              ? { zIndex: 2, scale: 1, x: 0, opacity: 1, boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }
              : { zIndex: 1, scale: 0.96, x: -32, opacity: 0.7, boxShadow: '0 2px 12px rgba(0,0,0,0.18)' }
            }
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            style={{ zIndex: mode === 'signin' ? 2 : 1, position: 'absolute', inset: 0 }}
            className="rounded-[2rem] border border-white/10 bg-white/5 backdrop-blur-2xl p-8 sm:p-10 overflow-hidden"
          >
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-[#d2232a]/25 rounded-full blur-3xl pointer-events-none" />

            <div className="mb-8 relative z-10">
              <h2 className="text-3xl font-bold text-white tracking-tight">Welcome back</h2>
              <p className="mt-2 text-sm text-white/65">Enter your credentials to access your dashboard</p>
            </div>

            <form className="space-y-6 relative z-10" onSubmit={handleSignIn}>
              <div className="relative group">
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full rounded-xl border border-white/20 bg-white/5 px-4 pb-2.5 pt-6 text-sm text-white transition-all duration-300 focus:border-[#d2232a] focus:bg-white/10 focus:outline-none focus:ring-1 focus:ring-[#d2232a] peer"
                  placeholder=" "
                />
                <label
                  htmlFor="email"
                  className="absolute start-4 top-4 z-10 origin-[0] -translate-y-3 scale-75 transform text-sm text-white/60 duration-300 peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100 peer-focus:-translate-y-3 peer-focus:scale-75 peer-focus:text-[#d2232a]"
                >
                  Email Address
                </label>
              </div>

              <div className="relative group">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-xl border border-white/20 bg-white/5 px-4 pb-2.5 pt-6 text-sm text-white transition-all duration-300 focus:border-[#d2232a] focus:bg-white/10 focus:outline-none focus:ring-1 focus:ring-[#d2232a] peer pr-12"
                  placeholder=" "
                />
                <label
                  htmlFor="password"
                  className="absolute start-4 top-4 z-10 origin-[0] -translate-y-3 scale-75 transform text-sm text-white/60 duration-300 peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100 peer-focus:-translate-y-3 peer-focus:scale-75 peer-focus:text-[#d2232a]"
                >
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-white focus:outline-none"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {loginError && (
                <div className="rounded-lg bg-[#d2232a]/15 border border-[#d2232a]/35 p-3 text-sm text-[#d2232a] flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-[#d2232a] animate-pulse" />
                  {loginError}
                </div>
              )}

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsResetOpen(true)}
                  className="text-xs font-semibold text-[#d2232a] hover:text-white transition-colors"
                >
                  Forgot password?
                </button>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-xl bg-[#d2232a] px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-[#d2232a]/35 transition-all duration-300 hover:bg-[#911d1f] hover:shadow-[#911d1f]/45 hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Authenticating...' : 'Sign In'}
              </button>
            </form>

            <div className="my-8 flex items-center gap-4 relative z-10">
              <div className="h-px flex-1 bg-white/10" />
              <span className="text-xs font-medium text-white/45 uppercase tracking-wider">or</span>
              <div className="h-px flex-1 bg-white/10" />
            </div>

            <p className="mt-8 text-center text-sm text-white/65 relative z-10">
              New to the platform?{' '}
              <button
                onClick={() => setMode('signup')}
                className="font-semibold text-[#d2232a] hover:text-white transition-colors"
              >
                Create account
              </button>
            </p>
          </motion.div>

          <motion.div
            animate={mode === 'signup'
              ? { zIndex: 2, scale: 1, x: 0, opacity: 1, boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }
              : { zIndex: 1, scale: 0.96, x: 32, opacity: 0.7, boxShadow: '0 2px 12px rgba(0,0,0,0.18)' }
            }
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            style={{ zIndex: mode === 'signup' ? 2 : 1, position: 'absolute', inset: 0 }}
            className="rounded-[2rem] border border-white/10 bg-white/5 backdrop-blur-2xl p-8 sm:p-10 overflow-hidden"
          >
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-[#d2232a]/25 rounded-full blur-3xl pointer-events-none" />

            <div className="mb-8 relative z-10">
              <h2 className="text-3xl font-bold text-white tracking-tight">Create Account</h2>
              <p className="mt-2 text-sm text-white/65">Join us to start exploring risk data</p>
            </div>

            <form className="space-y-5 relative z-10 max-h-[calc(100vh-260px)] overflow-y-auto" onSubmit={handleSignUp}>
              <div className="relative group">
                <input
                  type="text"
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="block w-full rounded-xl border border-white/20 bg-white/5 px-4 pb-2.5 pt-6 text-sm text-white transition-all duration-300 focus:border-[#d2232a] focus:bg-white/10 focus:outline-none focus:ring-1 focus:ring-[#d2232a] peer"
                  placeholder=" "
                />
                <label
                  htmlFor="fullName"
                  className="absolute start-4 top-4 z-10 origin-[0] -translate-y-3 scale-75 transform text-sm text-white/60 duration-300 peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100 peer-focus:-translate-y-3 peer-focus:scale-75 peer-focus:text-[#d2232a]"
                >
                  Full Name
                </label>
              </div>

              <div className="relative group">
                <input
                  type="email"
                  id="signUpEmail"
                  value={signUpEmail}
                  onChange={(e) => setSignUpEmail(e.target.value)}
                  className="block w-full rounded-xl border border-white/20 bg-white/5 px-4 pb-2.5 pt-6 text-sm text-white transition-all duration-300 focus:border-[#d2232a] focus:bg-white/10 focus:outline-none focus:ring-1 focus:ring-[#d2232a] peer"
                  placeholder=" "
                />
                <label
                  htmlFor="signUpEmail"
                  className="absolute start-4 top-4 z-10 origin-[0] -translate-y-3 scale-75 transform text-sm text-white/60 duration-300 peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100 peer-focus:-translate-y-3 peer-focus:scale-75 peer-focus:text-[#d2232a]"
                >
                  Email Address
                </label>
              </div>

              <div className="relative group">
                <input
                  type={showSignUpPassword ? 'text' : 'password'}
                  id="signUpPassword"
                  value={signUpPassword}
                  onChange={(e) => setSignUpPassword(e.target.value)}
                  className="block w-full rounded-xl border border-white/20 bg-white/5 px-4 pb-2.5 pt-6 text-sm text-white transition-all duration-300 focus:border-[#d2232a] focus:bg-white/10 focus:outline-none focus:ring-1 focus:ring-[#d2232a] peer pr-12"
                  placeholder=" "
                />
                <label
                  htmlFor="signUpPassword"
                  className="absolute start-4 top-4 z-10 origin-[0] -translate-y-3 scale-75 transform text-sm text-white/60 duration-300 peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100 peer-focus:-translate-y-3 peer-focus:scale-75 peer-focus:text-[#d2232a]"
                >
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowSignUpPassword(!showSignUpPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-white focus:outline-none"
                >
                  {showSignUpPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              <div className="relative group">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="block w-full rounded-xl border border-white/20 bg-white/5 px-4 pb-2.5 pt-6 text-sm text-white transition-all duration-300 focus:border-[#d2232a] focus:bg-white/10 focus:outline-none focus:ring-1 focus:ring-[#d2232a] peer pr-12"
                  placeholder=" "
                />
                <label
                  htmlFor="confirmPassword"
                  className="absolute start-4 top-4 z-10 origin-[0] -translate-y-3 scale-75 transform text-sm text-white/60 duration-300 peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100 peer-focus:-translate-y-3 peer-focus:scale-75 peer-focus:text-[#d2232a]"
                >
                  Confirm Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-white focus:outline-none"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              <div className="min-h-[16px] px-1">
                {signUpError && (
                  <p className="text-[12px] font-normal leading-tight text-white/40 -mt-1">
                    {signUpError}
                  </p>
                )}
                {signUpSuccess && (
                  <p className="text-[12px] font-normal leading-tight text-white/40 -mt-1">
                    {signUpSuccess}
                  </p>
                )}
              </div>
              <button
                type="submit"
                disabled={isSignUpSubmitting}
                className={`w-full rounded-xl bg-[#d2232a] px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-[#d2232a]/35 transition-all duration-300 hover:bg-[#911d1f] hover:shadow-[#911d1f]/45 hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0 disabled:cursor-not-allowed signup-button${signUpError ? ' with-error' : ''}`}
              >
                {isSignUpSubmitting ? 'Creating Account...' : 'Sign Up'}
              </button>
            </form>

            <div className="flex flex-col gap-4 mt-6 relative z-10">
              <div className="flex items-center gap-4">
                <div className="h-px flex-1 bg-white/10" />
                <span className="text-xs font-medium text-white/45 uppercase tracking-wider">or</span>
                <div className="h-px flex-1 bg-white/10" />
              </div>
              {/* Google sign up removed as requested */}
              <p className="text-center text-sm text-white/65">
                Already have an account?
                <button
                  type="button"
                  onClick={() => setMode('signin')}
                  className="ml-2 font-semibold text-green-500 hover:text-green-400 transition-colors underline decoration-green-500 underline-offset-2"
                >
                  Sign In
                </button>
              </p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Password Reset Modal */}
      {isResetOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#414042]/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#414042] p-8 shadow-2xl">
            <h3 className="text-2xl font-bold text-white mb-2">Reset Password</h3>
            <p className="text-sm text-white/65 mb-6">Enter your email to receive recovery instructions.</p>

            {resetStatus === 'sent' ? (
              <div className="rounded-xl border border-white/25 bg-white/10 p-4">
                <p className="text-sm font-medium text-white">
                  Instructions sent! Please check your inbox. The link expires in 1 hour.
                </p>
              </div>
            ) : (
              <form onSubmit={handleResetSubmit} className="space-y-5">
                <div className="relative group">
                  <input
                    type="email"
                    id="resetEmail"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="block w-full rounded-xl border border-white/20 bg-[#414042]/55 px-4 pb-2.5 pt-6 text-sm text-white transition-all focus:border-[#d2232a] focus:outline-none focus:ring-1 focus:ring-[#d2232a] peer"
                    placeholder=" "
                  />
                  <label
                    htmlFor="resetEmail"
                    className="absolute start-4 top-4 z-10 origin-[0] -translate-y-3 scale-75 transform text-sm text-white/60 duration-300 peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100 peer-focus:-translate-y-3 peer-focus:scale-75 peer-focus:text-[#d2232a]"
                  >
                    Email Address
                  </label>
                </div>

                {emailError && <p className="text-sm text-[#d2232a] font-medium">{emailError}</p>}

                <button
                  type="submit"
                  className="w-full rounded-xl bg-[#d2232a] px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-[#d2232a]/35 transition-all hover:bg-[#911d1f] hover:-translate-y-0.5"
                >
                  Send Recovery Link
                </button>
              </form>
            )}

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={closeResetModal}
                className="rounded-lg px-4 py-2 text-sm font-medium text-white/70 transition-colors hover:text-white hover:bg-white/5"
              >
                {resetStatus === 'sent' ? 'Close' : 'Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
