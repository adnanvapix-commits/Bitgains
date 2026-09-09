"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { ArrowLeft, Mail, Loader2, CheckCircle } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { forgotPassword } from "../../lib/api/auth";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    setSuccessMessage("");

    try {
      const formattedEmail = email.trim().toLowerCase();
      const response = await forgotPassword(formattedEmail);
      
      if (response.success) {
        setEmail(formattedEmail);
        setSuccess(true);
        setSuccessMessage(response.message || "If an account exists with this email, a password reset link has been sent.");
      } else {
        setError(response.message || "Failed to send reset email. Please try again.");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An error occurred. Please try again.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

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
                Forgot Password?
              </h1>
              <p className="text-white/70 text-sm sm:text-base">
                No worries! Enter your email and we’ll send you reset instructions.
              </p>
            </>
          ) : (
            <>
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                Check Your Email
              </h1>
              <p className="text-white/70 text-sm sm:text-base">
                {successMessage}
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

              {/* Email Field */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-white mb-2"
                >
                  Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-crypto w-full pl-12"
                    placeholder="Enter your email address"
                    required
                  />
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-emerald-400" />
                </div>
                <p className="mt-2 text-xs text-white/60">
                  Enter the email address associated with your account
                </p>
              </div>

              {/* Submit Button */}
              <motion.button
                type="submit"
                disabled={isSubmitting || !email}
                whileHover={{
                  scale: !isSubmitting && email ? 1.02 : 1,
                }}
                whileTap={{
                  scale: !isSubmitting && email ? 0.98 : 1,
                }}
                className={`w-full text-base sm:text-lg py-3 sm:py-4 rounded-xl font-semibold transition-all duration-300 ${
                  !isSubmitting && email
                    ? "btn-crypto"
                    : "bg-white/10 text-white/50 cursor-not-allowed"
                }`}
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center space-x-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Sending...</span>
                  </div>
                ) : (
                  'Send Reset Link'
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
                  Email Sent Successfully!
                </h3>
                
                <div className="space-y-3 text-white/70 text-sm">
                  <p>
                    We’ve sent a password reset link to:
                  </p>
                  <p className="text-emerald-400 font-medium text-base">
                    {email}
                  </p>
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mt-4">
                    <p className="text-white/80 text-sm">
                      <strong>📧 Next Steps:</strong>
                    </p>
                    <ul className="text-left mt-2 space-y-1 text-xs text-white/70">
                      <li>• Check your email inbox</li>
                      <li>• Click the reset link in the email</li>
                      <li>• Create a new password</li>
                      <li>• Link expires in 1 hour</li>
                    </ul>
                  </div>
                  <p className="text-xs text-white/60 mt-4">
                    Didn’t receive the email? Check your spam folder or try again.
                  </p>
                </div>
              </motion.div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <motion.button
                  onClick={() => {
                    setSuccess(false);
                    setEmail("");
                    setError("");
                    setSuccessMessage("");
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-3 rounded-xl font-medium bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-colors"
                >
                  Send Another Email
                </motion.button>
                
                <Link href="/login">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full py-3 rounded-xl font-medium btn-crypto"
                  >
                    Back to Login
                  </motion.button>
                </Link>
              </div>
            </div>
          )}

          {/* Additional Links */}
          {!success && (
            <div className="text-center mt-6 space-y-3">
              <div>
                <span className="text-white/70 text-sm">Remember your password? </span>
                <Link
                  href="/login"
                  className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors text-sm"
                >
                  Sign in
                </Link>
              </div>
              <div>
                <span className="text-white/70 text-sm">Don’t have an account? </span>
                <Link
                  href="/signup"
                  className="text-blue-400 hover:text-blue-300 font-medium transition-colors text-sm"
                >
                  Sign up
                </Link>
              </div>
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
