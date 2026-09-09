"use client";

import { useState, useEffect, Suspense, useCallback, useMemo } from "react";
import { Eye, EyeOff, ArrowLeft, Check, Loader2, Gift } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "../../contexts/AuthContext.js";
import Image from "next/image";

function SignupForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    referralCode: "",
    password: "",
    confirmPassword: "",
    acceptTerms: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [referralFromUrl, setReferralFromUrl] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const { register, isAuthenticated, error, clearError } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Prefetch dashboard for faster navigation after signup
  useEffect(() => {
    router.prefetch("/dashboard");
  }, [router]);

  // Check for referral code in URL and auto-fill
  useEffect(() => {
    const refCode = searchParams.get("ref");
    if (refCode && refCode.trim()) {
      setFormData((prev) => ({
        ...prev,
        referralCode: refCode.trim().toUpperCase(),
      }));
      setReferralFromUrl(true);
    }
  }, [searchParams]);

  // Redirect if already authenticated - use replace for instant navigation
  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, router]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      // Prevent double submission
      if (isSubmitting) return;

      if (formData.password !== formData.confirmPassword) {
        setLocalError("Passwords do not match");
        return;
      }

      if (!formData.acceptTerms) {
        setLocalError("Please accept the terms and conditions");
        return;
      }

      if (!formData.referralCode.trim()) {
        setLocalError("Referral code is required");
        return;
      }

      setIsSubmitting(true);
      setLocalError(null);
      clearError();

      try {
        const result = await register({
          name: formData.fullName,
          email: formData.email,
          password: formData.password,
          referralCode: formData.referralCode.trim(),
        });

        if (result.success) {
          // Immediate redirect with replace (faster than push)
          router.replace("/dashboard");
        } else {
          setLocalError(result.message || "Registration failed");
          setIsSubmitting(false);
        }
      } catch (err) {
        setLocalError("Registration failed. Please try again.");
        setIsSubmitting(false);
      }
    },
    [formData, register, router, clearError, isSubmitting]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
      // Clear error when user types
      if (localError) setLocalError(null);
    },
    [localError]
  );

  const handleCheckboxChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, checked } = e.target;
      setFormData((prev) => ({
        ...prev,
        [name]: checked,
      }));
    },
    []
  );

  // Memoize password requirements calculation
  const passwordRequirements = useMemo(
    () => [
      { text: "At least 8 characters", met: formData.password.length >= 8 },
      {
        text: "Contains uppercase letter",
        met: /[A-Z]/.test(formData.password),
      },
      {
        text: "Contains lowercase letter",
        met: /[a-z]/.test(formData.password),
      },
      { text: "Contains number", met: /\d/.test(formData.password) },
    ],
    [formData.password]
  );

  const passwordsMatch = useMemo(
    () =>
      formData.password === formData.confirmPassword &&
      formData.password.length > 0,
    [formData.password, formData.confirmPassword]
  );

  const displayError = localError || error;

  return (
    <div className="min-h-screen gradient-crypto animated-bg flex items-center justify-center p-4 sm:px-6 sm:py-12">
      {/* Back to Home */}
      <div className="absolute top-4 left-4 sm:top-6 sm:left-6 animate-fadeIn">
        <Link
          href="/"
          className="flex items-center space-x-2 text-white/80 hover:text-white transition-colors text-sm sm:text-base"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </Link>
      </div>

      <div className="w-full max-w-md animate-slideUp">
        {/* Logo and Title */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="flex items-center justify-center space-x-3 mb-4 sm:mb-6">
            <div className="relative">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden bg-gradient-to-br from-emerald-500/20 to-green-400/20 backdrop-blur-sm border border-emerald-400/30 p-1 shadow-lg shadow-emerald-500/25">
                <Image
                  src="/bitgain.PNG"
                  alt="BitGain Logo"
                  width={56}
                  height={56}
                  className="w-full h-full object-contain rounded-lg"
                  priority
                />
              </div>
            </div>
            <span className="text-xl sm:text-2xl font-bold text-white relative">
              <span className="bg-gradient-to-r from-emerald-400 via-green-400 to-emerald-300 bg-clip-text text-transparent drop-shadow-lg">
                BitGains
              </span>
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
            Create Account
          </h1>
          <p className="text-white/70 text-sm sm:text-base">
            Join thousands of users earning with USDT staking
          </p>
        </div>

        {/* Signup Form */}
        <div className="glass-card-strong p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            {/* Error Message */}
            {displayError && (
              <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-xl text-red-400 text-sm animate-fadeIn">
                {displayError}
              </div>
            )}

            {/* Full Name Field */}
            <div>
              <label
                htmlFor="fullName"
                className="block text-sm font-medium text-white mb-2"
              >
                Full Name
              </label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                className="input-crypto w-full"
                placeholder="Enter your full name"
                required
              />
            </div>

            {/* Email Field */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-white mb-2"
              >
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="input-crypto w-full"
                placeholder="Enter your email"
                required
              />
            </div>

            {/* Referral Code Field */}
            <div>
              <label
                htmlFor="referralCode"
                className="block text-sm font-medium text-white mb-2"
              >
                Referral Code <span className="text-red-400">*</span>
                {referralFromUrl && (
                  <span className="ml-2 text-emerald-400 text-xs">
                    ✓ Auto-filled from referral link
                  </span>
                )}
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="referralCode"
                  name="referralCode"
                  value={formData.referralCode}
                  onChange={handleChange}
                  className={`input-crypto w-full pl-12 ${
                    referralFromUrl
                      ? "border-emerald-500/50 bg-emerald-500/10"
                      : ""
                  }`}
                  placeholder="Enter your referral code"
                  required
                />
                <Gift
                  className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 ${
                    referralFromUrl ? "text-emerald-400" : "text-emerald-400"
                  }`}
                />
              </div>

              {!formData.referralCode && (
                <div className="mt-2 flex items-center space-x-2">
                  <div className="w-4 h-4 rounded-full bg-red-500/20 flex items-center justify-center">
                    <span className="text-red-400 text-xs">!</span>
                  </div>
                  <span className="text-xs text-red-400">
                    Referral code is required to create an account
                  </span>
                </div>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-white mb-2"
              >
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="input-crypto w-full pr-12"
                  placeholder="Create a strong password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" />
                  ) : (
                    <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
                  )}
                </button>
              </div>

              {/* Password Requirements */}
              {formData.password && (
                <div className="mt-3 space-y-1">
                  {passwordRequirements.map((req, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <div
                        className={`w-4 h-4 rounded-full flex items-center justify-center ${
                          req.met ? "bg-emerald-500" : "bg-white/20"
                        }`}
                      >
                        {req.met && (
                          <Check className="w-2 h-2 sm:w-3 sm:h-3 text-black" />
                        )}
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
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`input-crypto w-full pr-12 ${
                    formData.confirmPassword && !passwordsMatch
                      ? "border-red-500/50 focus:border-red-400"
                      : formData.confirmPassword && passwordsMatch
                      ? "border-emerald-500/50 focus:border-emerald-400"
                      : ""
                  }`}
                  placeholder="Confirm your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white transition-colors"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" />
                  ) : (
                    <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
                  )}
                </button>
              </div>

              {formData.confirmPassword && (
                <div className="mt-2 flex items-center space-x-2">
                  <div
                    className={`w-4 h-4 rounded-full flex items-center justify-center ${
                      passwordsMatch ? "bg-emerald-500" : "bg-red-500"
                    }`}
                  >
                    {passwordsMatch && <Check className="w-3 h-3 text-black" />}
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

            {/* Terms and Conditions */}
            <div className="flex items-start space-x-3">
              <input
                type="checkbox"
                id="acceptTerms"
                name="acceptTerms"
                checked={formData.acceptTerms}
                onChange={handleCheckboxChange}
                className="w-4 h-4 text-emerald-500 bg-card border-emerald-500/30 rounded focus:ring-emerald-500/20 focus:ring-2 mt-1"
                required
              />
              <label htmlFor="acceptTerms" className="text-sm text-white/80">
                I agree to the{" "}
                <Link
                  href="#"
                  className="text-emerald-400 hover:text-emerald-300 transition-colors"
                >
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link
                  href="#"
                  className="text-emerald-400 hover:text-emerald-300 transition-colors"
                >
                  Privacy Policy
                </Link>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={
                !formData.acceptTerms ||
                !passwordsMatch ||
                !formData.referralCode.trim() ||
                isSubmitting
              }
              className={`w-full text-base sm:text-lg py-3 sm:py-4 rounded-xl font-semibold transition-all duration-200 ${
                formData.acceptTerms &&
                passwordsMatch &&
                formData.referralCode.trim() &&
                !isSubmitting
                  ? "btn-crypto hover:scale-[1.01] active:scale-[0.99]"
                  : "bg-white/10 text-white/50 cursor-not-allowed"
              }`}
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center space-x-2">
                  <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                  <span>Creating Account...</span>
                </div>
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          {/* Login Link */}
          <div className="text-center mt-6 sm:mt-8">
            <span className="text-white/70 text-sm sm:text-base">
              Already have an account?{" "}
            </span>
            <Link
              href="/login"
              className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors text-sm sm:text-base"
            >
              Sign in here
            </Link>
          </div>

          {/* Forgot Password Link */}
          <div className="text-center mt-3">
            <span className="text-white/70 text-sm">
              Forgot your password?{" "}
            </span>
            <Link
              href="/forgot-password"
              className="text-blue-400 hover:text-blue-300 font-medium transition-colors text-sm"
            >
              Reset it here
            </Link>
          </div>
        </div>
      </div>

      {/* Floating Elements - CSS animations for better mobile performance */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-32 right-16 w-20 h-20 bg-emerald-500/10 rounded-full blur-xl animate-float" />
        <div className="absolute bottom-32 left-16 w-28 h-28 bg-cyan-500/10 rounded-full blur-xl animate-float-delayed" />
      </div>

      {/* CSS Animations - Much lighter than Framer Motion */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes float {
          0%,
          100% {
            transform: translateY(0) rotate(0deg);
          }
          50% {
            transform: translateY(-25px) rotate(8deg);
          }
        }
        @keyframes float-delayed {
          0%,
          100% {
            transform: translateY(0) rotate(0deg);
          }
          50% {
            transform: translateY(25px) rotate(-8deg);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
        .animate-float {
          animation: float 10s ease-in-out infinite;
        }
        .animate-float-delayed {
          animation: float-delayed 14s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-crypto-black via-crypto-charcoal to-crypto-black flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
        </div>
      }
    >
      <SignupForm />
    </Suspense>
  );
}
