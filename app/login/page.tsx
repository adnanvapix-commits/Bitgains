"use client";

import { useState, useEffect, useCallback } from "react";
import { Eye, EyeOff, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../../contexts/AuthContext.js";
import Image from "next/image";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const { login, isAuthenticated, user, error, clearError } = useAuth();
  const router = useRouter();

  // Prefetch dashboard for faster navigation
  useEffect(() => {
    router.prefetch("/dashboard");
    router.prefetch("/admin");
  }, [router]);

  // Redirect if already authenticated based on role - use replace for instant navigation
  useEffect(() => {
    if (isAuthenticated && user) {
      const targetRoute = user.role === "admin" ? "/admin" : "/dashboard";
      router.replace(targetRoute);
    }
  }, [isAuthenticated, user, router]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      // Prevent double submission
      if (isSubmitting) return;

      setIsSubmitting(true);
      setLocalError(null);
      clearError();

      try {
        const result = await login(formData);

        if (result.success) {
          // Immediate redirect with replace (faster than push)
          const targetRoute =
            result.user?.role === "admin" ? "/admin" : "/dashboard";
          router.replace(targetRoute);
        } else {
          setLocalError(result.message || "Login failed");
          setIsSubmitting(false);
        }
      } catch (err) {
        setLocalError("Login failed. Please try again.");
        setIsSubmitting(false);
      }
    },
    [formData, login, router, clearError, isSubmitting]
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

  const displayError = localError || error;

  return (
    <div className="min-h-screen gradient-crypto animated-bg flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-md">
        {/* Header - Simplified animations for mobile performance */}
        <div className="text-center mb-6 sm:mb-8 animate-fadeIn">
          <Link
            href="/"
            className="inline-flex items-center text-white/80 hover:text-white transition-colors mb-4 sm:mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            <span className="text-sm sm:text-base">Back to Home</span>
          </Link>

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
            <h1 className="text-2xl sm:text-3xl font-bold text-white relative">
              <span className="bg-gradient-to-r from-emerald-400 via-green-400 to-emerald-300 bg-clip-text text-transparent drop-shadow-lg">
                BitGains
              </span>
            </h1>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">
            Welcome Back
          </h2>
          <p className="text-white/70 text-sm sm:text-base">
            Sign in to continue earning with your USDT
          </p>
        </div>

        {/* Login Form - Simplified for mobile performance */}
        <div className="glass-card-strong p-6 sm:p-8 animate-slideUp">
          {displayError && (
            <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-3 sm:p-4 mb-4 sm:mb-6 animate-fadeIn">
              <p className="text-red-400 text-sm sm:text-base">
                {displayError}
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-3 sm:px-4 py-3 sm:py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all duration-200 text-sm sm:text-base"
                placeholder="Enter your email"
                required
                autoComplete="email"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-3 sm:px-4 py-3 sm:py-4 pr-10 sm:pr-12 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all duration-200 text-sm sm:text-base"
                  placeholder="Enter your password"
                  required
                  autoComplete="current-password"
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" />
                  ) : (
                    <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-emerald-500 bg-transparent border-emerald-500/30 rounded focus:ring-emerald-500/20 focus:ring-2"
                />
                <span className="ml-2 text-sm text-white/80">Remember me</span>
              </label>
              <Link
                href="/forgot-password"
                className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !formData.email || !formData.password}
              className={`w-full py-3 sm:py-4 px-4 sm:px-6 rounded-xl font-bold text-base sm:text-lg transition-all duration-200 ${
                isSubmitting
                  ? "bg-white/20 text-white/50 cursor-not-allowed"
                  : "bg-gradient-to-r from-emerald-500 to-green-400 text-black shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 hover:scale-[1.01] active:scale-[0.99]"
              }`}
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center space-x-2">
                  <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                  <span>Signing In...</span>
                </div>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          <div className="mt-6 sm:mt-8 text-center">
            <p className="text-white/70 text-sm sm:text-base">
              Don&apos;t have an account?{" "}
              <Link
                href="/signup"
                className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
              >
                Sign Up
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Simplified background - CSS only for better mobile performance */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-4 sm:left-10 w-16 sm:w-20 h-16 sm:h-20 bg-emerald-500/20 rounded-full blur-xl animate-float" />
        <div className="absolute top-40 right-4 sm:right-20 w-24 sm:w-32 h-24 sm:h-32 bg-cyan-500/20 rounded-full blur-xl animate-float-delayed" />
        <div className="absolute bottom-20 left-1/4 w-12 sm:w-16 h-12 sm:h-16 bg-green-500/20 rounded-full blur-xl animate-float-slow" />
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
            transform: translateY(-30px) rotate(10deg);
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
        @keyframes float-slow {
          0%,
          100% {
            transform: translateY(0) translateX(0);
          }
          50% {
            transform: translateY(-20px) translateX(15px);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
        .animate-float {
          animation: float 8s ease-in-out infinite;
        }
        .animate-float-delayed {
          animation: float-delayed 10s ease-in-out infinite;
        }
        .animate-float-slow {
          animation: float-slow 12s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
