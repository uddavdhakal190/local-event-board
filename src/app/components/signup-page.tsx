import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Chrome, User, Check, AlertCircle } from 'lucide-react';
import { Link } from 'react-router';
import { useAuth } from './auth-context';
import { useNavigate } from 'react-router';

const passwordRequirements = [
  { label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
  { label: 'One uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
  { label: 'One number', test: (p: string) => /\d/.test(p) },
];

export function SignupPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [error, setError] = useState('');
  const { signup, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const result = await signup(fullName || 'User', email, password);
    setIsLoading(false);

    if (result.error) {
      setError(result.error);
    } else {
      navigate('/');
    }
  };

  const handleGoogleSignup = async () => {
    setError('');
    setIsGoogleLoading(true);
    const result = await loginWithGoogle();
    if (result.error) {
      setError(result.error);
      setIsGoogleLoading(false);
    }
    // If no error, user will be redirected to Google OAuth
  };

  const passwordStrength = passwordRequirements.filter(r => r.test(password)).length;
  const showPasswordHints = password.length > 0;

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
          <p className="text-white/80 mt-3 text-sm">Create your account to get started</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-2xl shadow-black/10 p-8 md:p-10">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Create account</h1>
            <p className="text-gray-500 text-sm mt-1.5">Join thousands discovering local events</p>
          </div>

          {/* Error message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 flex items-start gap-3 bg-red-50 border border-red-100 rounded-xl px-4 py-3"
            >
              <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
              <div className="text-sm text-red-600">
                <p>{error}</p>
                {error.toLowerCase().includes('already exists') && (
                  <Link to="/login" className="text-[#FF9B51] hover:underline font-semibold mt-1 inline-block">
                    Go to Sign In &rarr;
                  </Link>
                )}
              </div>
            </motion.div>
          )}

          {/* Social Signup */}
          <button
            onClick={handleGoogleSignup}
            disabled={isGoogleLoading}
            className="w-full flex items-center justify-center gap-3 bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700 px-6 py-3 rounded-xl text-sm font-medium transition-all duration-200 active:scale-[0.98] shadow-sm hover:shadow disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isGoogleLoading ? (
              <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
            ) : (
              <Chrome className="w-5 h-5" />
            )}
            Sign up with Google
          </button>

          {/* Divider */}
          <div className="flex items-center gap-4 my-8">
            <div className="flex-1 h-px bg-gray-100" />
            <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">or</span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Full Name */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Full name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50/50 text-gray-900 text-sm placeholder-gray-400 outline-none focus:border-[#9CAFA0] focus:ring-2 focus:ring-[#9CAFA0]/20 transition-all duration-200"
                />
              </div>
            </div>

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
              <label className="text-sm font-medium text-gray-700">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a strong password"
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

              {/* Password strength */}
              {showPasswordHints && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  transition={{ duration: 0.2 }}
                  className="space-y-2.5 pt-1"
                >
                  {/* Strength bar */}
                  <div className="flex gap-1.5">
                    {[1, 2, 3].map((level) => (
                      <div
                        key={level}
                        className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                          passwordStrength >= level
                            ? passwordStrength === 1
                              ? 'bg-red-400'
                              : passwordStrength === 2
                              ? 'bg-amber-400'
                              : 'bg-emerald-400'
                            : 'bg-gray-100'
                        }`}
                      />
                    ))}
                  </div>
                  {/* Requirements checklist */}
                  <div className="space-y-1">
                    {passwordRequirements.map((req) => {
                      const met = req.test(password);
                      return (
                        <div key={req.label} className="flex items-center gap-2">
                          <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center transition-colors duration-200 ${
                            met ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-300'
                          }`}>
                            <Check className="w-2.5 h-2.5" />
                          </div>
                          <span className={`text-xs transition-colors duration-200 ${met ? 'text-emerald-600' : 'text-gray-400'}`}>
                            {req.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </div>

            {/* Terms */}
            <div className="flex items-start gap-2.5">
              <input
                type="checkbox"
                id="terms"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-[#FF9B51] focus:ring-[#FF9B51]/20 cursor-pointer accent-[#FF9B51] mt-0.5"
              />
              <label htmlFor="terms" className="text-sm text-gray-500 cursor-pointer select-none leading-snug">
                I agree to the{' '}
                <Link to="/terms" className="text-[#FF9B51] hover:text-[#F28C44] font-medium transition-colors">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link to="/privacy" className="text-[#FF9B51] hover:text-[#F28C44] font-medium transition-colors">
                  Privacy Policy
                </Link>
              </label>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading || !agreedToTerms || !email || !password}
              className="w-full bg-[#FF9B51] hover:bg-[#F28C44] active:bg-[#E07A35] text-white py-3.5 rounded-xl font-semibold shadow-lg shadow-orange-500/20 hover:shadow-xl hover:shadow-orange-500/25 transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#FF9B51] disabled:hover:shadow-lg disabled:active:scale-100"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Create account
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Sign in link */}
          <p className="text-center text-sm text-gray-500 mt-8">
            Already have an account?{' '}
            <Link to="/login" className="text-[#FF9B51] hover:text-[#F28C44] font-semibold transition-colors">
              Sign in
            </Link>
          </p>
        </div>

        {/* Footer note */}
        <p className="text-center text-xs text-white/60 mt-8">
          By creating an account, you agree to our Terms of Service and Privacy Policy.
        </p>
      </motion.div>
    </div>
  );
}