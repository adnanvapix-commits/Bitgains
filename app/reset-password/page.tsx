"use client";

import { motion } from "framer-motion";
import { useState, useEffect, Suspense } from "react";
import { Eye, EyeOff, Lock, Loader2, CheckCircle, XCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { resetPassword } from "../../lib/api/auth";

function ResetPasswordForm() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [token, setToken] = useState("");
  const [tokenError, setTokenError] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();

  // Get token from URL
  useEffect(() => {
    const urlToken = searchParams.get('token');
    if (urlToken) {
      setToken(urlToken);
    } else {
      setTokenError(true);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      setError("Password must contain at least one uppercase letter, one lowercase letter, and one number");
      return;
    }

    if (!token) {
      setError("Invalid or missing reset token");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await resetPassword(token, password);
      
      if (response.success) {
        setSuccess(true);
        // Redirect to login after 3 seconds
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      } else {
        setError(response.message || "Failed to reset password. Please try again.");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const passwordRequirements = [
    { text: "At least 6 characters", met: password.length >= 6 },
    { text: "Contains uppercase letter", met: /[A-Z]/.test(password) },
    { text: "Contains lowercase letter", met: /[a-z]/.test(password) },
    { text: "Contains number", met: /\d/.test(password) },
  ];

  const passwordsMatch = password === confirmPassword && password.length > 0;

  // Show error if no token
  if (tokenError) {
    return (
      <div className="min-h-screen gradient-crypto animated-bg flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card-strong p-8 max-w-md w-full text-center"
        >
          <div className="mx-auto w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
            <XCircle className="w-10 h-10 text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">Invalid Reset Link</h2>
          <p className="text-white/70 mb-6">
            This password reset link is invalid or has expired. Please request a new one.
          </p>
          <Link href="/forgot-password">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3 rounded-xl font-medium btn-crypto"
            >
              Request New Reset Link
            </motion.button>
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-crypto animated-bg flex items-center justify-center p-4 sm:px-6 sm:py-12">
      {/* Back Button */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className="absolute top-4 left-4 sm:top-6 sm:left-6"
      >
        <Link
          href="/login"
          className="flex items-center space-x-2 text-white/80 hover:text-white transition-colors text-sm sm:text-base"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Login</span>
        </Link>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="w-full max-w-md"
      >
        {/* Logo and Title */}
        <div className="text-center mb-6 sm:mb-8">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex items-center justify-center space-x-3 mb-4 sm:mb-6"
          >
            <div className="relative">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden bg-gradient-to-br from-emerald-500/20 to-green-400/20 backdrop-blur-sm border border-emerald-400/30 p-1 shadow-lg shadow-emerald-500/25">
                <Image 
                  src="/bitgain.PNG" 
                  alt="BitGain Logo" 
                  width={56} 
                  height={56} 
                  className="w-full h-full object-contain rounded-lg"
                />
              </div>
            </div>
            <span className="text-xl sm:text-2xl font-bold text-white relative">
              <span className="bg-gradient-to-r from-emerald-400 via-green-400 to-emerald-300 bg-clip-text text-transparent drop-shadow-lg">
                BitGains
              </span>
            </span>
          </motion.div>

          {!success ? (
            <>
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                Reset Your Password
              </h1>
              <p className="text-white/70 text-sm sm:text-base">
                Enter your new password below
              </p>
            </>
          ) : (
            <>
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                Password Reset Successful!
              </h1>
              <p className="text-white/70 text-sm sm:text-base">
                Redirecting you to login...
              </p>
            </>
          )}
        </div>

        {/* Form or Success Message */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="glass-card-strong p-6 sm:p-8"
        >
          {!success ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Error Message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-red-500/20 border border-red-500/30 rounded-xl text-red-400 text-sm"
                >
                  {error}
                </motion.div>
              )}

              {/* New Password Field */}
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-white mb-2"
                >
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-crypto w-full pl-12 pr-12"
                    placeholder="Enter your new password"
                    required
                  />
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-emerald-400" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>

                {/* Password Requirements */}
                {password && (
                  <div className="mt-3 space-y-1">
                    {passwordRequirements.map((req, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <div
                          className={`w-4 h-4 rounded-full flex items-center justify-center ${
                            req.met ? "bg-emerald-500" : "bg-white/20"
                          }`}
                        >
                          {req.met && <CheckCircle className="w-3 h-3 text-white" />}
                        </div>
                        <span
                          className={`text-xs sm:text-sm ${
                            req.met ? "text-emerald-400" : "text-white/60"
                          }`}
                        >
                          {req.text}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Confirm Password Field */}
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-white mb-2"
                >
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`input-crypto w-full pl-12 pr-12 ${
                      confirmPassword && !passwordsMatch
                        ? "border-red-500/50 focus:border-red-400"
                        : confirmPassword && passwordsMatch
                        ? "border-emerald-500/50 focus:border-emerald-400"
                        : ""
                    }`}
                    placeholder="Confirm your new password"
                    required
                  />
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-emerald-400" />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white transition-colors"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>

                {confirmPassword && (
                  <div className="mt-2 flex items-center space-x-2">
                    <div
                      className={`w-4 h-4 rounded-full flex items-center justify-center ${
                        passwordsMatch ? "bg-emerald-500" : "bg-red-500"
                      }`}
                    >
                      {passwordsMatch && <CheckCircle className="w-3 h-3 text-white" />}
                    </div>
                    <span
                      className={`text-xs ${
                        passwordsMatch ? "text-emerald-400" : "text-red-400"
                      }`}
                    >
                      {passwordsMatch
                        ? "Passwords match"
                        : "Passwords do not match"}
                    </span>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <motion.button
                type="submit"
                disabled={isSubmitting || !passwordsMatch || !password}
                whileHover={{
                  scale: !isSubmitting && passwordsMatch && password ? 1.02 : 1,
                }}
                whileTap={{
                  scale: !isSubmitting && passwordsMatch && password ? 0.98 : 1,
                }}
                className={`w-full text-base sm:text-lg py-3 sm:py-4 rounded-xl font-semibold transition-all duration-300 ${
                  !isSubmitting && passwordsMatch && password
                    ? "btn-crypto"
                    : "bg-white/10 text-white/50 cursor-not-allowed"
                }`}
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center space-x-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Resetting Password...</span>
                  </div>
                ) : (
                  'Reset Password'
                )}
              </motion.button>
            </form>
          ) : (
            <div className="space-y-6">
              {/* Success Message */}
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="text-center py-8"
              >
                <div className="mx-auto w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle className="w-10 h-10 text-emerald-400" />
                </div>
                
                <h3 className="text-xl font-semibold text-white mb-3">
                  Password Reset Successfully!
                </h3>
                
                <div className="space-y-3 text-white/70 text-sm">
                  <p>
                    Your password has been changed successfully.
                  </p>
                  <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4 mt-4">
                    <p className="text-white/80 text-sm">
                      ✅ You can now log in with your new password
                    </p>
                  </div>
                  <p className="text-xs text-white/60 mt-4">
                    Redirecting to login page in 3 seconds...
                  </p>
                </div>
              </motion.div>

              {/* Login Button */}
              <Link href="/login">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-3 rounded-xl font-medium btn-crypto"
                >
                  Go to Login
                </motion.button>
              </Link>
            </div>
          )}

          {/* Additional Links */}
          {!success && (
            <div className="text-center mt-6">
              <span className="text-white/70 text-sm">Remember your password? </span>
              <Link
                href="/login"
                className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors text-sm"
              >
                Sign in
              </Link>
            </div>
          )}
        </motion.div>
      </motion.div>

      {/* Floating Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            y: [0, -25, 0],
            rotate: [0, 8, 0],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute top-32 right-16 w-20 h-20 bg-emerald-500/10 rounded-full blur-xl"
        />
        <motion.div
          animate={{
            y: [0, 25, 0],
            rotate: [0, -8, 0],
          }}
          transition={{
            duration: 14,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute bottom-32 left-16 w-28 h-28 bg-cyan-500/10 rounded-full blur-xl"
        />
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-crypto-black via-crypto-charcoal to-crypto-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
