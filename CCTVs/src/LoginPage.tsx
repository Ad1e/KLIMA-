import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Lock, Mail } from 'lucide-react'
import bsuEntrance from './assets/bsu-entrance.jpg'
import bsuLogo from './assets/bsu-logo.png'

interface LoginPageProps {
  onLogin: () => void
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const navigate = useNavigate()
  const [isResetOpen, setIsResetOpen] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [resetStatus, setResetStatus] = useState<'idle' | 'sent'>('idle')
  const [emailError, setEmailError] = useState('')

  const closeResetModal = () => {
    setIsResetOpen(false)
    setResetEmail('')
    setResetStatus('idle')
    setEmailError('')
  }

  const handleForgotPassword = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    setIsResetOpen(true)
  }

  const handleSignIn = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    onLogin()
    navigate('/dashboard')
  }

  const handleResetSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const email = resetEmail.trim().toLowerCase()
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    if (!emailPattern.test(email)) {
      setEmailError('Please enter a valid email address.')
      return
    }

    setEmailError('')
    setResetStatus('sent')
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
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/85">
              </p>
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

          <div
            className="relative z-10 w-full max-w-md overflow-hidden rounded-[28px] border border-white/50 bg-white p-8 shadow-[0_18px_60px_rgba(15,23,42,0.12)] sm:p-10"
          >
            <div className="absolute inset-0 bg-white/90" />

            <div className="relative z-10">
              <div className="mb-8">
                <h1 className="text-4xl font-bold tracking-tight text-slate-900">Sign In</h1>
              </div>

              <form className="space-y-5 pb-1" onSubmit={handleSignIn}>
                <div className="group relative">
                  <label className="absolute -top-2.5 left-4 bg-white px-2 text-xs font-medium text-slate-500 transition-all group-focus-within:text-indigo-600">
                    Email
                  </label>
                  <div className="flex items-center rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm transition-all duration-200 group-focus-within:border-indigo-500 group-focus-within:shadow-[0_0_0_6px_rgba(99,102,241,0.08)]">
                    <Mail className="mr-3 h-5 w-5 text-slate-400" />
                    <input
                      type="email"
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
                      type="password"
                      placeholder="Enter your password"
                      className="w-full bg-transparent text-slate-800 placeholder:text-slate-400 outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center gap-2 text-slate-500">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-slate-300 accent-red-700 focus:ring-red-500"
                    />
                    Remember me
                  </label>
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="font-medium text-red-700 hover:text-red-800"
                  >
                    Forgot password?
                  </button>
                </div>

                <button
                  type="submit"
                  className="group relative flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#b91c1c] to-[#ef4444] px-5 py-4 text-base font-semibold text-white shadow-[0_12px_30px_rgba(239,68,68,0.35)] transition-all duration-200 hover:scale-[1.01] hover:shadow-[0_16px_40px_rgba(239,68,68,0.45)] active:scale-[0.99]"
                >
                  Sign In
                  <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                  <span className="absolute inset-0 rounded-2xl bg-white/10 opacity-0 blur-xl transition-opacity duration-300 group-hover:opacity-100" />
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {isResetOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-6">
          <div className="w-full max-w-md rounded-3xl border border-red-100 bg-white p-7 shadow-[0_20px_80px_rgba(15,23,42,0.3)]">
            <h3 className="text-2xl font-bold text-slate-900">Reset Password</h3>
            <p className="mt-2 text-sm text-slate-600">
              Enter your email address and we will send a password reset link.
            </p>

            {resetStatus === 'sent' ? (
              <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
                Reset link sent to <span className="font-semibold">{resetEmail}</span>.
              </div>
            ) : (
              <form className="mt-5 space-y-4" onSubmit={handleResetSubmit}>
                <div className="group relative">
                  <label className="absolute -top-2.5 left-4 bg-white px-2 text-xs font-medium text-slate-500">
                    Recovery Email
                  </label>
                  <div className="flex items-center rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm transition-all duration-200 group-focus-within:border-red-500 group-focus-within:shadow-[0_0_0_6px_rgba(239,68,68,0.12)]">
                    <Mail className="mr-3 h-5 w-5 text-slate-400" />
                    <input
                      type="email"
                      value={resetEmail}
                      onChange={(event) => setResetEmail(event.target.value)}
                      placeholder="name@school.edu"
                      className="w-full bg-transparent text-slate-800 placeholder:text-slate-400 outline-none"
                    />
                  </div>
                </div>

                {emailError ? <p className="text-sm text-red-600">{emailError}</p> : null}

                <button
                  type="submit"
                  className="w-full rounded-2xl bg-gradient-to-r from-[#b91c1c] to-[#ef4444] px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(239,68,68,0.35)] transition hover:brightness-105"
                >
                  Send Reset Link
                </button>
              </form>
            )}

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={closeResetModal}
                className="rounded-xl px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
              >
                {resetStatus === 'sent' ? 'Close' : 'Cancel'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
