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

  useEffect(() => { router.prefetch("/dashboard"); }, [router]);

  useEffect(() => {
    const refCode = searchParams.get("ref");
    if (refCode?.trim()) {
      setFormData(prev => ({ ...prev, referralCode: refCode.trim().toUpperCase() }));
      setReferralFromUrl(true);
    }
  }, [searchParams]);

  useEffect(() => {
    if (isAuthenticated) router.replace("/dashboard");
  }, [isAuthenticated, router]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (formData.password !== formData.confirmPassword) { setLocalError("Passwords do not match"); return; }
    if (!formData.acceptTerms) { setLocalError("Please accept the terms and conditions"); return; }
    if (!formData.referralCode.trim()) { setLocalError("Referral code is required"); return; }

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
        router.replace("/dashboard");
      } else {
        setLocalError(result.message || "Registration failed");
        setIsSubmitting(false);
      }
    } catch {
      setLocalError("Registration failed. Please try again.");
      setIsSubmitting(false);
    }
  }, [formData, register, router, clearError, isSubmitting]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (localError) setLocalError(null);
  }, [localError]);

  const handleCheckboxChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: checked }));
  }, []);

  const passwordRequirements = useMemo(() => [
    { text: "At least 8 characters",     met: formData.password.length >= 8 },
    { text: "Contains uppercase letter", met: /[A-Z]/.test(formData.password) },
    { text: "Contains lowercase letter", met: /[a-z]/.test(formData.password) },
    { text: "Contains number",           met: /\d/.test(formData.password) },
  ], [formData.password]);

  const passwordsMatch = useMemo(
    () => formData.password === formData.confirmPassword && formData.password.length > 0,
    [formData.password, formData.confirmPassword]
  );

  const displayError = localError || error;

  return (
    <div className="min-h-screen gradient-crypto animated-bg flex items-center justify-center p-4 sm:px-6 sm:py-12">
      {/* Back to Home */}
      <div className="absolute top-4 left-4 sm:top-6 sm:left-6 animate-fadeIn">
        <Link href="/" className="flex items-center space-x-2 text-foreground/70 hover:text-foreground transition-colors text-sm sm:text-base">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </Link>
      </div>

      <div className="w-full max-w-md animate-slideUp">
        {/* Logo and Title */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="flex items-center justify-center space-x-3 mb-4 sm:mb-6">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden bg-primary/10 border border-primary/30 p-1 shadow-lg shadow-primary/20">
              <Image src="/bitgain.PNG" alt="BitGain Logo" width={56} height={56} className="w-full h-full object-contain rounded-lg" priority />
            </div>
            <span className="text-xl sm:text-2xl font-bold">
              <span className="neon-text">BitGains</span>
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Create Account</h1>
          <p className="text-muted-foreground text-sm sm:text-base">Join thousands of users earning with USDT staking</p>
        </div>

        {/* Signup Form */}
        <div className="glass-card-strong p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            {displayError && (
              <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-xl text-destructive text-sm animate-fadeIn">
                {displayError}
              </div>
            )}

            {/* Full Name */}
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-foreground mb-2">Full Name</label>
              <input type="text" id="fullName" name="fullName" value={formData.fullName} onChange={handleChange}
                className="input-crypto w-full" placeholder="Enter your full name" required />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">Email Address</label>
              <input type="email" id="email" name="email" value={formData.email} onChange={handleChange}
                className="input-crypto w-full" placeholder="Enter your email" required />
            </div>

            {/* Referral Code */}
            <div>
              <label htmlFor="referralCode" className="block text-sm font-medium text-foreground mb-2">
                Referral Code <span className="text-destructive">*</span>
                {referralFromUrl && <span className="ml-2 text-primary text-xs">✓ Auto-filled from referral link</span>}
              </label>
              <div className="relative">
                <input type="text" id="referralCode" name="referralCode" value={formData.referralCode} onChange={handleChange}
                  className={`input-crypto w-full pl-12 ${referralFromUrl ? "border-primary/50" : ""}`}
                  placeholder="Enter your referral code" required />
                <Gift className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              </div>
              {!formData.referralCode && (
                <div className="mt-2 flex items-center space-x-2">
                  <div className="w-4 h-4 rounded-full bg-destructive/15 flex items-center justify-center">
                    <span className="text-destructive text-xs">!</span>
                  </div>
                  <span className="text-xs text-destructive">Referral code is required to create an account</span>
                </div>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">Password</label>
              <div className="relative">
                <input type={showPassword ? "text" : "password"} id="password" name="password"
                  value={formData.password} onChange={handleChange}
                  className="input-crypto w-full pr-12" placeholder="Create a strong password" required />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  {showPassword ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
                </button>
              </div>
              {formData.password && (
                <div className="mt-3 space-y-1">
                  {passwordRequirements.map((req, i) => (
                    <div key={i} className="flex items-center space-x-2">
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center ${req.met ? "bg-primary" : "bg-border"}`}>
                        {req.met && <Check className="w-2 h-2 sm:w-3 sm:h-3 text-white" />}
                      </div>
                      <span className={`text-xs sm:text-sm ${req.met ? "text-primary" : "text-muted-foreground"}`}>{req.text}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground mb-2">Confirm Password</label>
              <div className="relative">
                <input type={showConfirmPassword ? "text" : "password"} id="confirmPassword" name="confirmPassword"
                  value={formData.confirmPassword} onChange={handleChange}
                  className={`input-crypto w-full pr-12 ${
                    formData.confirmPassword && !passwordsMatch ? "!border-destructive/60" :
                    formData.confirmPassword && passwordsMatch  ? "!border-primary/60" : ""
                  }`}
                  placeholder="Confirm your password" required />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  {showConfirmPassword ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
                </button>
              </div>
              {formData.confirmPassword && (
                <div className="mt-2 flex items-center space-x-2">
                  <div className={`w-4 h-4 rounded-full flex items-center justify-center ${passwordsMatch ? "bg-primary" : "bg-destructive"}`}>
                    {passwordsMatch && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <span className={`text-xs ${passwordsMatch ? "text-primary" : "text-destructive"}`}>
                    {passwordsMatch ? "Passwords match" : "Passwords do not match"}
                  </span>
                </div>
              )}
            </div>

            {/* Terms */}
            <div className="flex items-start space-x-3">
              <input type="checkbox" id="acceptTerms" name="acceptTerms" checked={formData.acceptTerms}
                onChange={handleCheckboxChange}
                className="w-4 h-4 rounded border-primary/40 text-primary focus:ring-primary/30 mt-1" required />
              <label htmlFor="acceptTerms" className="text-sm text-foreground">
                I agree to the{" "}
                <Link href="#" className="text-primary hover:text-primary/80 transition-colors">Terms of Service</Link>
                {" "}and{" "}
                <Link href="#" className="text-primary hover:text-primary/80 transition-colors">Privacy Policy</Link>
              </label>
            </div>

            {/* Submit */}
            <button type="submit"
              disabled={!formData.acceptTerms || !passwordsMatch || !formData.referralCode.trim() || isSubmitting}
              className={`w-full text-base sm:text-lg py-3 sm:py-4 rounded-xl font-semibold transition-all duration-200 ${
                formData.acceptTerms && passwordsMatch && formData.referralCode.trim() && !isSubmitting
                  ? "btn-crypto hover:scale-[1.01] active:scale-[0.99]"
                  : "bg-muted text-muted-foreground cursor-not-allowed"
              }`}
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center space-x-2">
                  <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                  <span>Creating Account...</span>
                </div>
              ) : "Create Account"}
            </button>
          </form>

          {/* Login Link */}
          <div className="text-center mt-6 sm:mt-8">
            <p className="text-muted-foreground text-sm sm:text-base">
              Already have an account?{" "}
              <Link href="/login" className="text-primary hover:text-primary/80 font-semibold transition-colors">Sign in here</Link>
            </p>
          </div>
          <div className="text-center mt-3">
            <p className="text-muted-foreground text-sm">
              Forgot your password?{" "}
              <Link href="/forgot-password" className="text-primary hover:text-primary/80 font-semibold transition-colors">Reset it here</Link>
            </p>
          </div>
        </div>
      </div>

      {/* Background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-32 right-16 w-20 h-20 bg-primary/10 rounded-full blur-xl animate-float" />
        <div className="absolute bottom-32 left-16 w-28 h-28 bg-accent/10 rounded-full blur-xl animate-float-delayed" />
      </div>

      <style jsx>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes float { 0%,100% { transform: translateY(0) rotate(0deg); } 50% { transform: translateY(-25px) rotate(8deg); } }
        @keyframes float-delayed { 0%,100% { transform: translateY(0) rotate(0deg); } 50% { transform: translateY(25px) rotate(-8deg); } }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
        .animate-slideUp { animation: slideUp 0.3s ease-out; }
        .animate-float { animation: float 10s ease-in-out infinite; }
        .animate-float-delayed { animation: float-delayed 14s ease-in-out infinite; }
      `}</style>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    }>
      <SignupForm />
    </Suspense>
  );
}
