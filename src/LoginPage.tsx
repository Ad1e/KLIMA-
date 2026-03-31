import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import authBg from './assets/auth-bg.jpg';
import bsuLogo from './assets/bsu-logo.png';

interface LoginPageProps {
  onLogin: () => void;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [isResetOpen, setIsResetOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetStatus, setResetStatus] = useState<'idle' | 'sent'>('idle');
  const [emailError, setEmailError] = useState('');

  const backendBaseUrl = import.meta.env.VITE_BACKEND_API_URL ?? 'http://localhost:4000';

  const closeResetModal = () => {
    setIsResetOpen(false);
    setResetEmail('');
    setResetStatus('idle');
    setEmailError('');
  };

  const handleSignIn = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !password.trim()) {
      setLoginError('Enter both email and password.');
      return;
    }

    setIsSubmitting(true);
    setLoginError('');

    try {
      const response = await fetch(`${backendBaseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalizedEmail, password }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('token', data.token);
        onLogin();
        navigate('/dashboard');
      } else {
        setLoginError(data.message || 'Sign in failed. Please try again.');
      }
    } catch {
      setLoginError('Cannot connect to the server. Please check your connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(resetEmail)) {
      setEmailError('Please enter a valid email address.');
      return;
    }
    setEmailError('');
    setResetStatus('sent');
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#414042] font-sans">
      <img
        src={authBg}
        alt="Background"
        className="absolute inset-0 h-full w-full object-cover opacity-60 mix-blend-overlay"
      />
      <div className="absolute inset-0 bg-gradient-to-br from-[#414042]/85 via-[#414042]/65 to-[#911d1f]/75 backdrop-blur-[2px]" />

      <div className="relative z-10 flex items-center justify-between px-8 py-6 sm:px-12 lg:px-20">
        <div className="group flex cursor-pointer items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/20 bg-white/10 shadow-lg backdrop-blur-md transition-all duration-300 group-hover:scale-105 group-hover:bg-white/20">
            <img src={bsuLogo} alt="Logo" className="h-8 w-8 object-contain" />
          </div>
          <div>
            <span className="block text-base font-bold tracking-tight text-white sm:text-lg">
              Batangas State University
            </span>
            <span className="block text-[11px] font-medium uppercase tracking-widest text-white/70">
              Risk Intelligence
            </span>
          </div>
        </div>
      </div>

      <div className="relative z-10 flex min-h-[calc(100vh-100px)] flex-col items-center justify-between gap-12 px-8 py-12 sm:px-12 lg:flex-row lg:px-20">
        <div className="w-full max-w-2xl flex-1 text-center lg:text-left">
          <p className="mb-4 text-sm font-bold uppercase tracking-[0.3em] text-white/80">
            Platform Overview
          </p>
          <h1 className="mb-6 text-5xl font-black leading-[1.1] tracking-tight text-white sm:text-7xl">
            Explore <br className="hidden lg:block" />
            <span className="bg-gradient-to-r from-[#d2232a] to-[#911d1f] bg-clip-text text-transparent">
              Horizons
            </span>
          </h1>
          <p className="mx-auto max-w-lg text-lg font-light leading-relaxed text-white/80 lg:mx-0">
            Access real-time risk assessments and make informed decisions with our
            comprehensive intelligence platform.
          </p>
        </div>

        <div className="w-full max-w-md shrink-0">
          <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-[0_8px_32px_rgba(0,0,0,0.4)] backdrop-blur-2xl sm:p-10">
            <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#d2232a]/25 blur-3xl" />

            <div className="relative z-10 mb-8">
              <h2 className="text-3xl font-bold tracking-tight text-white">Welcome back</h2>
              <p className="mt-2 text-sm text-white/65">
                Enter your credentials to access your dashboard
              </p>
            </div>

            <form className="relative z-10 space-y-6" onSubmit={handleSignIn}>
              <div className="group relative">
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="peer block w-full rounded-xl border border-white/20 bg-white px-4 pb-2.5 pt-6 text-sm text-black placeholder-black transition-all duration-300 focus:border-[#d2232a] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#d2232a]"
                  placeholder=" "
                />
                <label
                  htmlFor="email"
                  className="absolute start-4 top-4 z-10 origin-[0] -translate-y-3 scale-75 transform text-sm text-black duration-300 peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100 peer-focus:-translate-y-3 peer-focus:scale-75 peer-focus:text-[#d2232a]"
                >
                  Email Address
                </label>
              </div>

              <div className="group relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="peer block w-full rounded-xl border border-white/20 bg-white px-4 pb-2.5 pt-6 pr-12 text-sm text-black placeholder-black transition-all duration-300 focus:border-[#d2232a] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#d2232a]"
                  placeholder=" "
                />
                <label
                  htmlFor="password"
                  className="absolute start-4 top-4 z-10 origin-[0] -translate-y-3 scale-75 transform text-sm text-black duration-300 peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100 peer-focus:-translate-y-3 peer-focus:scale-75 peer-focus:text-[#d2232a]"
                >
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-700 transition-colors hover:text-[#d2232a] focus:outline-none"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {loginError && (
                <div className="flex items-center gap-2 rounded-lg border border-[#d2232a]/35 bg-[#d2232a]/15 p-3 text-sm text-[#d2232a]">
                  <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#d2232a]" />
                  {loginError}
                </div>
              )}

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsResetOpen(true)}
                  className="text-xs font-semibold text-[#d2232a] transition-colors hover:text-white"
                >
                  Forgot password?
                </button>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-xl bg-[#d2232a] px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-[#d2232a]/35 transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#911d1f] hover:shadow-[#911d1f]/45 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
              >
                {isSubmitting ? 'Authenticating...' : 'Sign In'}
              </button>
            </form>

            <p className="relative z-10 mt-8 text-center text-sm text-white/65">
              New to the platform?{' '}
              <span className="font-semibold text-[#d2232a]">
                Request access through the sign up form on the same page
              </span>
            </p>
          </div>
        </div>
      </div>

      {isResetOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#414042]/80 p-4 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#414042] p-8 shadow-2xl">
            <h3 className="mb-2 text-2xl font-bold text-white">Reset Password</h3>
            <p className="mb-6 text-sm text-white/65">
              Enter your email to receive recovery instructions.
            </p>

            {resetStatus === 'sent' ? (
              <div className="rounded-xl border border-white/25 bg-white/10 p-4">
                <p className="text-sm font-medium text-white">
                  Instructions sent! Please check your inbox. The link expires in 1 hour.
                </p>
              </div>
            ) : (
              <form onSubmit={handleResetSubmit} className="space-y-5">
                <div className="group relative">
                  <input
                    type="email"
                    id="resetEmail"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="peer block w-full rounded-xl border border-white/20 bg-[#414042]/55 px-4 pb-2.5 pt-6 text-sm text-white transition-all focus:border-[#d2232a] focus:outline-none focus:ring-1 focus:ring-[#d2232a]"
                    placeholder=" "
                  />
                  <label
                    htmlFor="resetEmail"
                    className="absolute start-4 top-4 z-10 origin-[0] -translate-y-3 scale-75 transform text-sm text-white/60 duration-300 peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100 peer-focus:-translate-y-3 peer-focus:scale-75 peer-focus:text-[#d2232a]"
                  >
                    Email Address
                  </label>
                </div>

                {emailError && (
                  <p className="text-sm font-medium text-[#d2232a]">{emailError}</p>
                )}

                <button
                  type="submit"
                  className="w-full rounded-xl bg-[#d2232a] px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-[#d2232a]/35 transition-all hover:-translate-y-0.5 hover:bg-[#911d1f]"
                >
                  Send Recovery Link
                </button>
              </form>
            )}

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={closeResetModal}
                className="rounded-lg px-4 py-2 text-sm font-medium text-white/70 transition-colors hover:bg-white/5 hover:text-white"
              >
                {resetStatus === 'sent' ? 'Close' : 'Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}