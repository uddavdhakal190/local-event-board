import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Chrome, ArrowLeft, AlertCircle } from 'lucide-react';
import { Link } from 'react-router';
import { useAuth } from './auth-context';
import { useNavigate } from 'react-router';

export function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [suggestion, setSuggestion] = useState('');
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuggestion('');
    setIsLoading(true);

    const result = await login(email, password);
    setIsLoading(false);

    if (result.error) {
      // Provide a friendlier message for invalid credentials
      if (result.error.toLowerCase().includes('invalid login credentials')) {
        setError('Invalid email or password.');
        setSuggestion('Double-check your email address (especially the @ and domain). Don\'t have an account yet?');
      } else if (result.error.toLowerCase().includes('email not confirmed')) {
        setError('Please verify your email address before logging in.');
      } else {
        setError(result.error);
      }
    } else {
      navigate('/');
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setIsGoogleLoading(true);
    const result = await loginWithGoogle();
    if (result.error) {
      setError(result.error);
      setIsGoogleLoading(false);
    }
    // If no error, user will be redirected to Google OAuth
  };

  return (
    <div className="min-h-screen bg-[#9CAFA0] flex items-center justify-center px-6 py-12 relative overflow-hidden">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
        backgroundSize: '32px 32px'
      }} />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo */}
        <div className="text-center mb-10">
          <Link to="/" className="inline-flex items-center gap-1">
            <span className="text-3xl font-bold tracking-tight text-white">Event</span>
            <span className="text-3xl font-bold tracking-tight text-[#FFB070]">Go</span>
          </Link>
          <p className="text-white/80 mt-3 text-sm">Sign in to discover local events</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-2xl shadow-black/10 p-8 md:p-10">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Welcome back</h1>
            <p className="text-gray-500 text-sm mt-1.5">Enter your credentials to continue</p>
          </div>

          {/* Error message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 flex items-start gap-3 bg-red-50 border border-red-100 rounded-xl px-4 py-3"
            >
              <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
              <p className="text-sm text-red-600">{error}</p>
            </motion.div>
          )}

          {/* Suggestion message */}
          {suggestion && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 flex items-start gap-3 bg-yellow-50 border border-yellow-100 rounded-xl px-4 py-3"
            >
              <AlertCircle className="w-4 h-4 text-yellow-500 mt-0.5 shrink-0" />
              <p className="text-sm text-yellow-600">{suggestion}</p>
            </motion.div>
          )}

          {/* Social Login */}
          <button
            onClick={handleGoogleLogin}
            disabled={isGoogleLoading}
            className="w-full flex items-center justify-center gap-3 bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700 px-6 py-3 rounded-xl text-sm font-medium transition-all duration-200 active:scale-[0.98] shadow-sm hover:shadow disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isGoogleLoading ? (
              <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
            ) : (
              <Chrome className="w-5 h-5" />
            )}
            Continue with Google
          </button>

          {/* Divider */}
          <div className="flex items-center gap-4 my-8">
            <div className="flex-1 h-px bg-gray-100" />
            <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">or</span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50/50 text-gray-900 text-sm placeholder-gray-400 outline-none focus:border-[#9CAFA0] focus:ring-2 focus:ring-[#9CAFA0]/20 transition-all duration-200"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-gray-700">Password</label>
                <Link to="/forgot-password" className="text-xs text-[#FF9B51] hover:text-[#F28C44] font-medium transition-colors">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="w-full pl-11 pr-12 py-3 rounded-xl border border-gray-200 bg-gray-50/50 text-gray-900 text-sm placeholder-gray-400 outline-none focus:border-[#9CAFA0] focus:ring-2 focus:ring-[#9CAFA0]/20 transition-all duration-200"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                </button>
              </div>
            </div>

            {/* Remember me */}
            <div className="flex items-center gap-2.5">
              <input
                type="checkbox"
                id="remember"
                className="w-4 h-4 rounded border-gray-300 text-[#FF9B51] focus:ring-[#FF9B51]/20 cursor-pointer accent-[#FF9B51]"
              />
              <label htmlFor="remember" className="text-sm text-gray-500 cursor-pointer select-none">
                Remember me for 30 days
              </label>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading || !email || !password}
              className="w-full bg-[#FF9B51] hover:bg-[#F28C44] active:bg-[#E07A35] text-white py-3.5 rounded-xl font-semibold shadow-lg shadow-orange-500/20 hover:shadow-xl hover:shadow-orange-500/25 transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Sign in
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Sign up link */}
          <p className="text-center text-sm text-gray-500 mt-8">
            Don't have an account?{' '}
            <Link to="/signup" className="text-[#FF9B51] hover:text-[#F28C44] font-semibold transition-colors">
              Create account
            </Link>
          </p>
        </div>

        {/* Footer note */}
        <p className="text-center text-xs text-white/60 mt-8">
          By signing in, you agree to our Terms of Service and Privacy Policy.
        </p>

        <div className="mt-6 text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-white/70 hover:text-white font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </Link>
        </div>
      </motion.div>
    </div>
  );
}