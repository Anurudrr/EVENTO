import React, { useCallback, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, User, ArrowRight, Sparkles, Eye, EyeOff, Loader2, ShieldCheck, UserCircle, Briefcase } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { GoogleLoginButton } from '../components/GoogleLoginButton';
import { getStoredUser } from '../utils/storage';

const SignupPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<'user' | 'organizer'>('user');
  const [statusMessage, setStatusMessage] = useState('');
  const [otpPreview, setOtpPreview] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const { sendOtp, verifyOtp, googleAuth, isLoading, error } = useAuth();
  const navigate = useNavigate();

  const navigateToDashboard = useCallback(() => {
    const parsedUser = getStoredUser();
    navigate(parsedUser?.role === 'organizer' ? '/dashboard/seller' : '/dashboard/buyer');
  }, [navigate]);

  const handleSendOtp = async () => {
    setStatusMessage('');
    setOtpPreview('');

    try {
      const response = await sendOtp({
        purpose: 'signup',
        name,
        email,
        password,
        role,
      });

      setOtpSent(true);
      setStatusMessage('A verification code has been sent to your email.');
      setOtpPreview(response?.otpPreview || '');
    } catch (err) {
      console.error('[signup:send-otp]', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage('');

    try {
      await verifyOtp({
        purpose: 'signup',
        email,
        otp,
      });
      navigateToDashboard();
    } catch (err) {
      console.error('[signup:verify-otp]', err);
    }
  };

  const handleGoogleSignup = useCallback(async (idToken: string) => {
    setStatusMessage('');
    try {
      await googleAuth({ idToken, role });
      navigateToDashboard();
    } catch (err) {
      console.error('[signup:google]', err);
    }
  }, [googleAuth, navigateToDashboard, role]);

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
        transition={{ duration: 0.8, ease: "circOut" }}
        className="w-full max-w-2xl bg-noir-card p-12 md:p-16 rounded-none shadow-2xl shadow-black/50 border border-noir-border relative z-10"
      >
        <div className="text-center mb-12">
          <motion.div
            initial={{ rotate: -10, scale: 0.8 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
            className="w-24 h-24 bg-noir-ink rounded-none flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-black/50 relative group border border-noir-border"
          >
            <Sparkles className="text-noir-accent w-12 h-12 transition-transform duration-500" />
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-noir-accent rounded-none border-2 border-noir-bg flex items-center justify-center">
              <ShieldCheck className="text-noir-bg w-4 h-4" />
            </div>
          </motion.div>
          <h1 className="text-xl md:text-2xl font-display font-semibold text-noir-ink mb-4 tracking-wide uppercase">Create Account</h1>
          <p className="text-noir-muted text-lg font-light">Join the global <span className="text-noir-accent font-semibold">EVENTO</span> community</p>
        </div>

        {(error || statusMessage || otpPreview) && (
          <div className={`px-6 py-4 rounded-none mb-8 text-sm font-semibold border ${
            error
              ? 'bg-red-500/10 border-red-500/20 text-red-500'
              : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
          }`}>
            <div>{error || statusMessage}</div>
            {otpPreview && <div className="mt-2 text-xs uppercase tracking-widest">Dev OTP: {otpPreview}</div>}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="flex bg-noir-bg p-2 rounded-none mb-10 border border-noir-border">
            <button
              type="button"
              onClick={() => setRole('user')}
              className={`flex-grow py-4 px-6 rounded-none font-semibold transition-all duration-500 flex items-center justify-center gap-3 uppercase tracking-widest text-xs ${
                role === 'user' ? 'bg-noir-accent text-noir-bg shadow-xl shadow-noir-accent/20' : 'text-noir-muted/40 hover:text-noir-muted/60'
              }`}
            >
              <UserCircle className="w-5 h-5" />
              Attendee
            </button>
            <button
              type="button"
              onClick={() => setRole('organizer')}
              className={`flex-grow py-4 px-6 rounded-none font-semibold transition-all duration-500 flex items-center justify-center gap-3 uppercase tracking-widest text-xs ${
                role === 'organizer' ? 'bg-noir-accent text-noir-bg shadow-xl shadow-noir-accent/20' : 'text-noir-muted/40 hover:text-noir-muted/60'
              }`}
            >
              <Briefcase className="w-5 h-5" />
              Organizer
            </button>
          </div>

          <div className="space-y-6">
            <div className="space-y-3">
              <label className="text-[10px] font-mono font-semibold text-noir-accent uppercase tracking-[0.3em] ml-4">Full Name</label>
              <div className="relative group">
                <User className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-noir-muted/30 group-focus-within:text-noir-accent transition-colors" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-noir-bg border border-noir-border rounded-none pl-16 pr-8 py-5 text-noir-ink text-lg placeholder:text-noir-muted/20 focus:outline-none focus:ring-1 focus:ring-noir-accent focus:border-noir-accent transition-all shadow-sm"
                  placeholder="John Doe"
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-mono font-semibold text-noir-accent uppercase tracking-[0.3em] ml-4">Email Address</label>
              <div className="relative group">
                <Mail className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-noir-muted/30 group-focus-within:text-noir-accent transition-colors" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-noir-bg border border-noir-border rounded-none pl-16 pr-8 py-5 text-noir-ink text-lg placeholder:text-noir-muted/20 focus:outline-none focus:ring-1 focus:ring-noir-accent focus:border-noir-accent transition-all shadow-sm"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-mono font-semibold text-noir-accent uppercase tracking-[0.3em] ml-4">Password</label>
              <div className="relative group">
                <Lock className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-noir-muted/30 group-focus-within:text-noir-accent transition-colors" />
                <input
                  type={showPassword ? "text" : "password"}
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

            <div className="space-y-3">
              <div className="flex items-center justify-between ml-4">
                <label className="text-[10px] font-mono font-semibold text-noir-accent uppercase tracking-[0.3em]">Verification Code</label>
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={isLoading || !name || !email || !password}
                  className="text-[10px] font-mono font-semibold uppercase tracking-[0.3em] text-noir-accent hover:text-noir-ink transition-colors disabled:opacity-40"
                >
                  {otpSent ? 'Resend OTP' : 'Send OTP'}
                </button>
              </div>
              <input
                type="text"
                inputMode="numeric"
                pattern="\d{6}"
                maxLength={6}
                required
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                className="w-full bg-noir-bg border border-noir-border rounded-none px-8 py-5 text-noir-ink text-lg tracking-[0.4em] placeholder:text-noir-muted/20 focus:outline-none focus:ring-1 focus:ring-noir-accent focus:border-noir-accent transition-all shadow-sm"
                placeholder="000000"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || !otpSent || otp.length !== 6}
            className="w-full btn-noir !py-6 !rounded-none flex items-center justify-center gap-4 group disabled:opacity-70 disabled:cursor-not-allowed shadow-xl shadow-black/50 text-lg uppercase font-display tracking-widest"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                Verifying...
              </>
            ) : (
              <>
                Create Account
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

        <GoogleLoginButton text="signup_with" onCredential={handleGoogleSignup} />

        <div className="mt-12 pt-10 border-t border-noir-border text-center">
          <p className="text-noir-muted text-lg font-light">
            Already have an account? <Link to="/login" className="text-noir-accent font-semibold hover:underline ml-2">Login here</Link>
          </p>
        </div>
      </motion.div>
      
      <div className="absolute top-1/2 -left-20 pointer-events-none opacity-[0.05] select-none -rotate-90">
        <h2 className="text-[25vw] font-display font-semibold text-noir-ink leading-snug tracking-wide uppercase">SIGNUP</h2>
      </div>
    </motion.div>
  );
};

export default SignupPage;
