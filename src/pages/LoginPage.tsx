import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, ArrowRight, Sparkles, Eye, EyeOff, Loader2, ShieldCheck, KeyRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { GoogleLoginButton } from '../components/GoogleLoginButton';
import { getDashboardPathForRole } from '../utils/dashboard';

const DEFAULT_OTP_COOLDOWN_SECONDS = 60;

const getCooldownFromError = (err: unknown) => {
  const value = Number((err as any)?.response?.data?.cooldownSeconds || 0);
  return Number.isFinite(value) && value > 0 ? value : 0;
};

const formatCooldown = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${String(remainingSeconds).padStart(2, '0')}`;
};

const LoginPage: React.FC = () => {
  const [mode, setMode] = useState<'password' | 'otp'>('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const { login, sendOtp, verifyOtp, googleAuth, isAuthenticated, isLoading, error, user } = useAuth();
  const navigate = useNavigate();

  const navigateToDashboard = useCallback((role?: string) => {
    navigate(getDashboardPathForRole(role));
  }, [navigate]);

  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      navigateToDashboard(user.role);
    }
  }, [isAuthenticated, isLoading, navigateToDashboard, user]);

  useEffect(() => {
    if (cooldownSeconds <= 0) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setCooldownSeconds((current) => Math.max(0, current - 1));
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [cooldownSeconds]);

  const resetOtpState = (message = '') => {
    setOtp('');
    setOtpSent(false);
    setCooldownSeconds(0);
    setStatusMessage(message);
  };

  const handleEmailChange = (value: string) => {
    const normalizedNext = value.trim().toLowerCase();
    const normalizedCurrent = email.trim().toLowerCase();

    setEmail(value);

    if (otpSent && normalizedNext !== normalizedCurrent) {
      resetOtpState('Email changed. Request a new verification code.');
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage('');
    const nextUser = await login({ email, password });
    navigateToDashboard(nextUser.role);
  };

  const handleSendOtp = async () => {
    if (!email.trim() || cooldownSeconds > 0) {
      return;
    }

    setStatusMessage('');

    try {
      const response = await sendOtp({
        purpose: 'login',
        email,
      });

      setOtp('');
      setOtpSent(true);
      setCooldownSeconds(response.cooldownSeconds || DEFAULT_OTP_COOLDOWN_SECONDS);
      setStatusMessage(`${response.message} Enter the 6-digit code below.`);
    } catch (err) {
      const nextCooldown = getCooldownFromError(err);
      if (nextCooldown > 0) {
        setCooldownSeconds(nextCooldown);
      }
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage('');
    const nextUser = await verifyOtp({
      purpose: 'login',
      email,
      otp,
    });
    navigateToDashboard(nextUser.role);
  };

  const handleGoogleLogin = useCallback(async (idToken: string) => {
    setStatusMessage('');
    const nextUser = await googleAuth({ idToken });
    navigateToDashboard(nextUser.role);
  }, [googleAuth, navigateToDashboard]);

  const handleSubmit = mode === 'password' ? handlePasswordSubmit : handleOtpSubmit;
  const otpActionLabel = cooldownSeconds > 0
    ? `Resend in ${formatCooldown(cooldownSeconds)}`
    : otpSent ? 'Resend OTP' : 'Send OTP';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen pt-20 bg-noir-bg flex items-center justify-center px-6 relative overflow-hidden"
    >
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] right-[-5%] w-[50%] h-[60%] bg-noir-accent/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[40%] h-[50%] bg-noir-accent/5 rounded-full blur-[100px]" />
        <div className="absolute inset-0 noir-pattern opacity-10" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, ease: 'circOut' }}
        className="w-full max-w-xl bg-noir-card p-12 md:p-16 rounded-none shadow-2xl shadow-black/50 border border-noir-border relative z-10"
      >
        <div className="text-center mb-12">
          <motion.div
            initial={{ rotate: -10, scale: 0.8 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
            className="w-24 h-24 bg-noir-ink rounded-none flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-black/50 relative group border border-noir-border"
          >
            <Sparkles className="text-noir-accent w-12 h-12 transition-transform duration-500" />
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-noir-accent rounded-none border-2 border-noir-bg flex items-center justify-center">
              <ShieldCheck className="text-noir-bg w-4 h-4" />
            </div>
          </motion.div>
          <h1 className="text-xl md:text-2xl font-display font-semibold text-noir-ink mb-4 tracking-wide uppercase">Welcome Back</h1>
          <p className="text-noir-muted text-lg font-light">Login to your <span className="text-noir-accent font-semibold">EVENTO</span> account</p>
        </div>

        {(error || statusMessage) && (
          <div className={`px-6 py-4 rounded-none mb-8 text-sm font-semibold border ${
            error
              ? 'bg-red-500/10 border-red-500/20 text-red-500'
              : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
          }`}>
            <div>{error || statusMessage}</div>
          </div>
        )}

        <div className="flex bg-noir-bg p-2 rounded-none mb-10 border border-noir-border">
          <button
            type="button"
            onClick={() => setMode('password')}
            className={`flex-grow py-4 px-6 rounded-none font-semibold transition-all duration-500 flex items-center justify-center gap-3 uppercase tracking-widest text-xs ${
              mode === 'password' ? 'bg-noir-accent text-noir-bg shadow-xl shadow-noir-accent/20' : 'text-noir-muted/40 hover:text-noir-muted/60'
            }`}
          >
            <Lock className="w-5 h-5" />
            Password
          </button>
          <button
            type="button"
            onClick={() => setMode('otp')}
            className={`flex-grow py-4 px-6 rounded-none font-semibold transition-all duration-500 flex items-center justify-center gap-3 uppercase tracking-widest text-xs ${
              mode === 'otp' ? 'bg-noir-accent text-noir-bg shadow-xl shadow-noir-accent/20' : 'text-noir-muted/40 hover:text-noir-muted/60'
            }`}
          >
            <KeyRound className="w-5 h-5" />
            Email OTP
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-6">
            <div className="space-y-3">
              <label className="text-[10px] font-mono font-semibold text-noir-accent uppercase tracking-[0.3em] ml-4">Email Address</label>
              <div className="relative group">
                <Mail className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-noir-muted/30 group-focus-within:text-noir-accent transition-colors" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => handleEmailChange(e.target.value)}
                  className="w-full bg-noir-bg border border-noir-border rounded-none pl-16 pr-8 py-5 text-noir-ink text-lg placeholder:text-noir-muted/20 focus:outline-none focus:ring-1 focus:ring-noir-accent focus:border-noir-accent transition-all shadow-sm"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            {mode === 'password' ? (
              <div className="space-y-3">
                <div className="flex justify-between items-center ml-4">
                  <label className="text-[10px] font-mono font-semibold text-noir-accent uppercase tracking-[0.3em]">Password</label>
                  <span className="text-xs font-semibold text-noir-muted tracking-widest">Secure Access</span>
                </div>
                <div className="relative group">
                  <Lock className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-noir-muted/30 group-focus-within:text-noir-accent transition-colors" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-noir-bg border border-noir-border rounded-none pl-16 pr-16 py-5 text-noir-ink text-lg placeholder:text-noir-muted/20 focus:outline-none focus:ring-1 focus:ring-noir-accent focus:border-noir-accent transition-all shadow-sm"
                    placeholder="Password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-6 top-1/2 -translate-y-1/2 text-noir-muted/30 hover:text-noir-accent transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-6 h-6" /> : <Eye className="w-6 h-6" />}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4 border border-noir-border bg-noir-bg/60 p-6">
                <div className="flex justify-between items-center">
                  <div>
                    <label className="text-[10px] font-mono font-semibold text-noir-accent uppercase tracking-[0.3em]">Verification Code</label>
                    <p className="mt-2 text-sm text-noir-muted">
                      Enter the 6-digit code sent to your email. Codes expire in 5 minutes.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={isLoading || !email.trim() || cooldownSeconds > 0}
                    className="text-[10px] font-mono font-semibold uppercase tracking-[0.3em] text-noir-accent hover:text-noir-ink transition-colors disabled:opacity-40"
                  >
                    {otpActionLabel}
                  </button>
                </div>
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="\d{6}"
                  maxLength={6}
                  required
                  value={otp}
                  disabled={!otpSent}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  className="w-full bg-noir-bg border border-noir-border rounded-none px-8 py-5 text-noir-ink text-lg tracking-[0.4em] placeholder:text-noir-muted/20 focus:outline-none focus:ring-1 focus:ring-noir-accent focus:border-noir-accent transition-all shadow-sm disabled:opacity-50"
                  placeholder="000000"
                />
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading || (mode === 'otp' && (!otpSent || otp.length !== 6))}
            className="w-full btn-noir !py-6 !rounded-none flex items-center justify-center gap-4 group disabled:opacity-70 disabled:cursor-not-allowed shadow-xl shadow-black/50 text-lg uppercase font-display tracking-widest"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                Authenticating...
              </>
            ) : (
              <>
                {mode === 'password' ? 'Login to Account' : 'Verify OTP'}
                <ArrowRight className="w-6 h-6 transition-transform" />
              </>
            )}
          </button>
        </form>

        <div className="my-10 flex items-center gap-4">
          <div className="h-px flex-1 bg-noir-border" />
          <span className="text-[10px] font-mono font-semibold uppercase tracking-[0.4em] text-noir-muted">Or</span>
          <div className="h-px flex-1 bg-noir-border" />
        </div>

        <GoogleLoginButton text="continue_with" onCredential={handleGoogleLogin} />

        <div className="mt-12 pt-10 border-t border-noir-border text-center">
          <p className="text-noir-muted text-lg font-light">
            Don&apos;t have an account? <Link to="/signup" className="text-noir-accent font-semibold hover:underline ml-2">Sign up for free</Link>
          </p>
        </div>
      </motion.div>

      <div className="absolute top-1/2 -left-20 pointer-events-none opacity-[0.05] select-none -rotate-90">
        <h2 className="text-[25vw] font-display font-semibold text-noir-ink leading-snug tracking-wide uppercase">LOGIN</h2>
      </div>
    </motion.div>
  );
};

export default LoginPage;
