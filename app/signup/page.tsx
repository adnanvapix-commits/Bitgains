"use client";

import { useState, useEffect, useRef, Suspense, useCallback, useMemo } from "react";
import { Eye, EyeOff, ArrowLeft, Check, Loader2, Gift, Mail, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "../../contexts/AuthContext.js";
import Image from "next/image";

// ─── Step 1: Registration form ───────────────────────────────────────────────
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
  const [referralFromUrl, setReferralFromUrl] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [isSendingOtp, setIsSendingOtp] = useState(false);

  // Step 2 state
  const [step, setStep] = useState<"form" | "otp">("form");
  const [otpValues, setOtpValues] = useState(["", "", "", "", "", ""]);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [otpExpiresAt, setOtpExpiresAt] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [canResend, setCanResend] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const { isAuthenticated, error, clearError } = useAuth();
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

  // OTP countdown timer
  useEffect(() => {
    if (!otpExpiresAt) return;
    const tick = () => {
      const left = Math.max(0, Math.floor((otpExpiresAt - Date.now()) / 1000));
      setTimeLeft(left);
      if (left === 0) setCanResend(true);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [otpExpiresAt]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const id = setInterval(() => setResendCooldown(c => Math.max(0, c - 1)), 1000);
    return () => clearInterval(id);
  }, [resendCooldown]);

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

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (localError) setLocalError(null);
  }, [localError]);

  const handleCheckboxChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: checked }));
  }, []);

  // ── Step 1 submit: send OTP ──
  const handleSendOtp = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) { setLocalError("Passwords do not match"); return; }
    if (!formData.acceptTerms) { setLocalError("Please accept the terms and conditions"); return; }
    if (!formData.referralCode.trim()) { setLocalError("Referral code is required"); return; }

    setIsSendingOtp(true);
    setLocalError(null);
    clearError();

    try {
      const res = await fetch("/api/auth/send-signup-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email, name: formData.fullName }),
      });
      const json = await res.json();
      if (json.success) {
        setOtpExpiresAt(json.data.expiresAt);
        setCanResend(false);
        setResendCooldown(30);
        setStep("otp");
        setOtpValues(["", "", "", "", "", ""]);
        setTimeout(() => otpRefs.current[0]?.focus(), 100);
      } else {
        setLocalError(json.message || "Failed to send OTP");
      }
    } catch {
      setLocalError("Network error. Please try again.");
    } finally {
      setIsSendingOtp(false);
    }
  }, [formData, clearError]);

  // ── OTP input handling ──
  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const digits = value.slice(-1);
    const next = [...otpValues];
    next[index] = digits;
    setOtpValues(next);
    setOtpError(null);
    if (digits && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otpValues[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const next = ["", "", "", "", "", ""];
    for (let i = 0; i < pasted.length; i++) next[i] = pasted[i];
    setOtpValues(next);
    const focusIdx = Math.min(pasted.length, 5);
    otpRefs.current[focusIdx]?.focus();
  };

  const otpCode = otpValues.join("");

  // ── Step 2 submit: verify OTP + create account ──
  const handleVerifyOtp = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.length !== 6) { setOtpError("Please enter the 6-digit OTP"); return; }

    setIsVerifying(true);
    setOtpError(null);

    try {
      const res = await fetch("/api/auth/verify-signup-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          otp: otpCode,
          password: formData.password,
          name: formData.fullName,
          referralCode: formData.referralCode,
        }),
      });
      const json = await res.json();
      if (json.success) {
        // Use Supabase setSession so AuthContext picks it up via onAuthStateChange
        const { supabase: sb } = await import("../../lib/supabase");
        await sb.auth.setSession({
          access_token: json.data.token,
          refresh_token: json.data.refreshToken,
        });
        // AuthContext will detect SIGNED_IN via onAuthStateChange and load profile
        // Give it a moment then redirect
        setTimeout(() => router.replace("/dashboard"), 300);
      } else {
        setOtpError(json.message || "Invalid OTP");
        if (json.needsNewOtp) {
          setCanResend(true);
          setResendCooldown(0);
        }
      }
    } catch {
      setOtpError("Network error. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  }, [otpCode, formData, router]);

  // ── Resend OTP ──
  const handleResend = useCallback(async () => {
    if (resendCooldown > 0) return;
    setIsSendingOtp(true);
    setOtpError(null);
    try {
      const res = await fetch("/api/auth/send-signup-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email, name: formData.fullName }),
      });
      const json = await res.json();
      if (json.success) {
        setOtpExpiresAt(json.data.expiresAt);
        setOtpValues(["", "", "", "", "", ""]);
        setCanResend(false);
        setResendCooldown(30);
        setTimeout(() => otpRefs.current[0]?.focus(), 100);
      } else {
        setOtpError(json.message || "Failed to resend");
      }
    } catch {
      setOtpError("Network error");
    } finally {
      setIsSendingOtp(false);
    }
  }, [formData.email, formData.fullName, resendCooldown]);

  const displayError = localError || error;

  return (
    <div className="min-h-screen gradient-crypto animated-bg flex items-center justify-center p-4 sm:px-6 sm:py-12">
      {/* Back link */}
      <div className="absolute top-4 left-4 sm:top-6 sm:left-6 animate-fadeIn">
        {step === "otp" ? (
          <button onClick={() => setStep("form")} className="flex items-center space-x-2 text-foreground/70 hover:text-foreground transition-colors text-sm">
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
        ) : (
          <Link href="/" className="flex items-center space-x-2 text-foreground/70 hover:text-foreground transition-colors text-sm sm:text-base">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </Link>
        )}
      </div>

      <div className="w-full max-w-md animate-slideUp">
        {/* Logo */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="flex items-center justify-center space-x-3 mb-4 sm:mb-6">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden bg-primary/10 border border-primary/30 p-1 shadow-lg shadow-primary/20">
              <Image src="/bitgain.PNG" alt="BitGain Logo" width={56} height={56} className="w-full h-full object-contain rounded-lg" priority />
            </div>
            <span className="text-xl sm:text-2xl font-bold">
              <span className="neon-text">BitGains</span>
            </span>
          </div>
          {step === "form" ? (
            <>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Create Account</h1>
              <p className="text-muted-foreground text-sm sm:text-base">Join thousands of users earning with USDT staking</p>
            </>
          ) : (
            <>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Verify Your Email</h1>
              <p className="text-muted-foreground text-sm sm:text-base">
                We sent a 6-digit code to <span className="text-primary font-medium">{formData.email}</span>
              </p>
            </>
          )}
        </div>

        <div className="glass-card-strong p-6 sm:p-8">

          {/* ── STEP 1: Registration Form ── */}
          {step === "form" && (
            <form onSubmit={handleSendOtp} className="space-y-4 sm:space-y-5">
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
                  {referralFromUrl && <span className="ml-2 text-primary text-xs">Auto-filled</span>}
                </label>
                <div className="relative">
                  <input type="text" id="referralCode" name="referralCode" value={formData.referralCode} onChange={handleChange}
                    className={`input-crypto w-full pl-12 ${referralFromUrl ? "border-primary/50" : ""}`}
                    placeholder="Enter your referral code" required />
                  <Gift className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                </div>
                {!formData.referralCode && (
                  <p className="mt-1.5 text-xs text-destructive">Referral code is required to create an account</p>
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
                disabled={!formData.acceptTerms || !passwordsMatch || !formData.referralCode.trim() || isSendingOtp}
                className={`w-full text-base sm:text-lg py-3 sm:py-4 rounded-xl font-semibold transition-all duration-200 ${
                  formData.acceptTerms && passwordsMatch && formData.referralCode.trim() && !isSendingOtp
                    ? "btn-crypto hover:scale-[1.01] active:scale-[0.99]"
                    : "bg-muted text-muted-foreground cursor-not-allowed"
                }`}
              >
                {isSendingOtp ? (
                  <div className="flex items-center justify-center space-x-2">
                    <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                    <span>Sending OTP...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-2">
                    <Mail className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span>Send Verification Code</span>
                  </div>
                )}
              </button>
            </form>
          )}

          {/* ── STEP 2: OTP Verification ── */}
          {step === "otp" && (
            <form onSubmit={handleVerifyOtp} className="space-y-6">
              {/* Email icon */}
              <div className="flex justify-center">
                <div className="w-16 h-16 bg-primary/10 border border-primary/20 rounded-full flex items-center justify-center">
                  <Mail className="w-8 h-8 text-primary" />
                </div>
              </div>

              <p className="text-muted-foreground text-sm text-center">
                Enter the 6-digit code sent to your email. Check your spam folder if you don't see it.
              </p>

              {otpError && (
                <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-xl text-destructive text-sm text-center animate-fadeIn">
                  {otpError}
                </div>
              )}

              {/* 6-digit OTP input boxes */}
              <div className="flex gap-2 sm:gap-3 justify-center" onPaste={handleOtpPaste}>
                {otpValues.map((val, i) => (
                  <input
                    key={i}
                    ref={el => { otpRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={val}
                    onChange={e => handleOtpChange(i, e.target.value)}
                    onKeyDown={e => handleOtpKeyDown(i, e)}
                    className={`w-11 h-14 sm:w-12 sm:h-16 text-center text-xl sm:text-2xl font-bold rounded-xl border-2 bg-secondary text-foreground focus:outline-none transition-all ${
                      val ? "border-primary shadow-sm shadow-primary/20" : "border-border focus:border-primary"
                    }`}
                  />
                ))}
              </div>

              {/* Timer */}
              <div className="text-center">
                {timeLeft > 0 ? (
                  <p className="text-muted-foreground text-sm">
                    Code expires in <span className="text-primary font-semibold">{Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, "0")}</span>
                  </p>
                ) : (
                  <p className="text-destructive text-sm font-medium">Code expired. Please resend.</p>
                )}
              </div>

              {/* Verify button */}
              <button type="submit"
                disabled={otpCode.length !== 6 || isVerifying || timeLeft === 0}
                className={`w-full py-3 sm:py-4 rounded-xl font-semibold text-base transition-all ${
                  otpCode.length === 6 && !isVerifying && timeLeft > 0
                    ? "btn-crypto hover:scale-[1.01] active:scale-[0.99]"
                    : "bg-muted text-muted-foreground cursor-not-allowed"
                }`}
              >
                {isVerifying ? (
                  <div className="flex items-center justify-center space-x-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Creating Account...</span>
                  </div>
                ) : "Verify & Create Account"}
              </button>

              {/* Resend */}
              <div className="text-center">
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resendCooldown > 0 || isSendingOtp}
                  className={`flex items-center justify-center gap-2 mx-auto text-sm font-medium transition-colors ${
                    resendCooldown > 0 || isSendingOtp
                      ? "text-muted-foreground cursor-not-allowed"
                      : "text-primary hover:text-primary/80 cursor-pointer"
                  }`}
                >
                  {isSendingOtp ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</>
                  ) : resendCooldown > 0 ? (
                    <><RefreshCw className="w-4 h-4" /> Resend in {resendCooldown}s</>
                  ) : (
                    <><RefreshCw className="w-4 h-4" /> Resend Code</>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Login link */}
          <div className="text-center mt-6">
            <p className="text-muted-foreground text-sm">
              Already have an account?{" "}
              <Link href="/login" className="text-primary hover:text-primary/80 font-semibold transition-colors">Sign in here</Link>
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
