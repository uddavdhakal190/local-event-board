import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, ArrowRight, ArrowLeft, KeyRound, Lock, Eye, EyeOff, Check, ShieldCheck, AlertCircle, Info } from 'lucide-react';
import { Link } from 'react-router';
import { supabase, useAuth } from './auth-context';

type Step = 'verify' | 'emailSent' | 'reset' | 'success';

export function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>('verify');
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { verifyEmail, updatePassword } = useAuth();

  const syncRecoverySession = async () => {
    const isRecoveryUrl = window.location.hash.includes('type=recovery') || window.location.search.includes('type=recovery');
    const { data: { session } } = await supabase.auth.getSession();

    if (isRecoveryUrl && session?.user) {
      setEmail(session.user.email || '');
      setStep('reset');
      setError('');
      return true;
    }

    return false;
  };

  useEffect(() => {
    syncRecoverySession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        syncRecoverySession();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const result = await verifyEmail(email);
    setIsLoading(false);

    if (result.error) {
      setError(result.error);
    } else {
      setStep('emailSent');
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    const inRecoverySession = await syncRecoverySession();
    if (!inRecoverySession) {
      setError('Open the password recovery link from your email before setting a new password.');
      return;
    }

    setIsLoading(true);
    const result = await updatePassword(email, newPassword);
    setIsLoading(false);

    if (result.error) {
      setError(result.error);
    } else {
      setStep('success');
    }
  };

  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;
  const passwordLongEnough = newPassword.length >= 8;

  return (
    <div className="min-h-screen bg-[#9CAFA0] flex items-center justify-center px-6 py-12 relative overflow-hidden">
      {/* Background pattern */}
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
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-2xl shadow-black/10 p-8 md:p-10">
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

          <AnimatePresence mode="wait">
            {/* Step 1: Verify Email */}
            {step === 'verify' && (
              <motion.div
                key="verify"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="mb-8">
                  <div className="w-14 h-14 bg-[#9CAFA0]/10 rounded-2xl flex items-center justify-center mb-5">
                    <KeyRound className="w-7 h-7 text-[#9CAFA0]" />
                  </div>
                  <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Reset your password</h1>
                  <p className="text-gray-500 text-sm mt-1.5 leading-relaxed">
                    Enter your account email to verify your identity and reset your password.
                  </p>
                </div>

                <form onSubmit={handleVerifySubmit} className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Email address</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => { setEmail(e.target.value); setError(''); }}
                        placeholder="you@example.com"
                        required
                        className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50/50 text-gray-900 text-sm placeholder-gray-400 outline-none focus:border-[#9CAFA0] focus:ring-2 focus:ring-[#9CAFA0]/20 transition-all duration-200"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || !email}
                    className="w-full bg-[#FF9B51] hover:bg-[#F28C44] active:bg-[#E07A35] text-white py-3.5 rounded-xl font-semibold shadow-lg shadow-orange-500/20 hover:shadow-xl hover:shadow-orange-500/25 transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#FF9B51] disabled:active:scale-100"
                  >
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        Continue
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>

                <div className="mt-8 text-center">
                  <Link
                    to="/login"
                    className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 font-medium transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back to sign in
                  </Link>
                </div>
              </motion.div>
            )}

            {/* Step 1.5: Recovery email sent */}
            {step === 'emailSent' && (
              <motion.div
                key="email-sent"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="mb-6">
                  <div className="w-14 h-14 bg-[#9CAFA0]/10 rounded-2xl flex items-center justify-center mb-5">
                    <Mail className="w-7 h-7 text-[#9CAFA0]" />
                  </div>
                  <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Check your email</h1>
                  <p className="text-gray-500 text-sm mt-1.5 leading-relaxed">
                    We sent a password recovery link to <span className="font-semibold text-gray-700">{email}</span>. Open that link to continue.
                  </p>
                </div>

                <div className="mb-6 flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
                  <Info className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                  <p className="text-xs text-blue-600 leading-relaxed">
                    This page will switch to password reset automatically once the recovery session is active.
                  </p>
                </div>

                <button
                  onClick={syncRecoverySession}
                  className="w-full bg-[#FF9B51] hover:bg-[#F28C44] active:bg-[#E07A35] text-white py-3.5 rounded-xl font-semibold shadow-lg shadow-orange-500/20 hover:shadow-xl hover:shadow-orange-500/25 transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  I opened the reset link
                  <ArrowRight className="w-4 h-4" />
                </button>

                <div className="mt-6 text-center">
                  <button
                    onClick={() => { setStep('verify'); setError(''); }}
                    className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 font-medium transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Use a different email
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 2: Set New Password */}
            {step === 'reset' && (
              <motion.div
                key="reset"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="mb-6">
                  <div className="w-14 h-14 bg-[#9CAFA0]/10 rounded-2xl flex items-center justify-center mb-5">
                    <Lock className="w-7 h-7 text-[#9CAFA0]" />
                  </div>
                  <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Set new password</h1>
                  <p className="text-gray-500 text-sm mt-1.5 leading-relaxed">
                    Choose a strong password for <span className="font-semibold text-gray-700">{email}</span>
                  </p>
                </div>

                {/* Info banner */}
                <div className="mb-6 flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
                  <Info className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                  <p className="text-xs text-blue-600 leading-relaxed">
                    Your password will be updated immediately. You can sign in with your new password right after.
                  </p>
                </div>

                <form onSubmit={handleResetSubmit} className="space-y-5">
                  {/* New Password */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">New password</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => { setNewPassword(e.target.value); setError(''); }}
                        placeholder="Enter new password"
                        required
                        className="w-full pl-11 pr-12 py-3 rounded-xl border border-gray-200 bg-gray-50/50 text-gray-900 text-sm placeholder-gray-400 outline-none focus:border-[#9CAFA0] focus:ring-2 focus:ring-[#9CAFA0]/20 transition-all duration-200"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {showNewPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Confirm password</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => { setConfirmPassword(e.target.value); setError(''); }}
                        placeholder="Confirm new password"
                        required
                        className="w-full pl-11 pr-12 py-3 rounded-xl border border-gray-200 bg-gray-50/50 text-gray-900 text-sm placeholder-gray-400 outline-none focus:border-[#9CAFA0] focus:ring-2 focus:ring-[#9CAFA0]/20 transition-all duration-200"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Validation hints */}
                  {newPassword.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      transition={{ duration: 0.2 }}
                      className="space-y-2"
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center transition-colors duration-200 ${
                          passwordLongEnough ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-300'
                        }`}>
                          <Check className="w-2.5 h-2.5" />
                        </div>
                        <span className={`text-xs transition-colors duration-200 ${passwordLongEnough ? 'text-emerald-600' : 'text-gray-400'}`}>
                          At least 8 characters
                        </span>
                      </div>
                      {confirmPassword.length > 0 && (
                        <div className="flex items-center gap-2">
                          <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center transition-colors duration-200 ${
                            passwordsMatch ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-400'
                          }`}>
                            <Check className="w-2.5 h-2.5" />
                          </div>
                          <span className={`text-xs transition-colors duration-200 ${passwordsMatch ? 'text-emerald-600' : 'text-red-400'}`}>
                            {passwordsMatch ? 'Passwords match' : 'Passwords do not match'}
                          </span>
                        </div>
                      )}
                    </motion.div>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading || !passwordsMatch || !passwordLongEnough}
                    className="w-full bg-[#FF9B51] hover:bg-[#F28C44] active:bg-[#E07A35] text-white py-3.5 rounded-xl font-semibold shadow-lg shadow-orange-500/20 hover:shadow-xl hover:shadow-orange-500/25 transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#FF9B51] disabled:active:scale-100"
                  >
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        Reset password
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>

                <div className="mt-6 text-center">
                  <button
                    onClick={() => { setStep('verify'); setError(''); setNewPassword(''); setConfirmPassword(''); }}
                    className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 font-medium transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Use a different email
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 3: Success */}
            {step === 'success' && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                className="text-center py-4"
              >
                <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                  >
                    <ShieldCheck className="w-8 h-8 text-emerald-500" />
                  </motion.div>
                </div>

                <h1 className="text-2xl font-bold text-gray-900 tracking-tight mb-2">Password reset!</h1>
                <p className="text-gray-500 text-sm leading-relaxed mb-8 max-w-xs mx-auto">
                  Your password has been successfully updated. You can now sign in with your new password.
                </p>

                <Link
                  to="/login"
                  className="w-full bg-[#FF9B51] hover:bg-[#F28C44] active:bg-[#E07A35] text-white py-3.5 rounded-xl font-semibold shadow-lg shadow-orange-500/20 hover:shadow-xl hover:shadow-orange-500/25 transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  Back to sign in
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer note */}
        <p className="text-center text-xs text-white/60 mt-8">
          Remember your password?{' '}
          <Link to="/login" className="text-white/80 hover:text-white font-medium transition-colors">
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
