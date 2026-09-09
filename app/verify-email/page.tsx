"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle, XCircle, Loader2, ArrowLeft, Mail } from "lucide-react";
import Link from "next/link";
import { authApi } from "../../lib/api";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (token) {
      verifyEmail(token);
    } else {
      setStatus("error");
      setMessage("No verification token provided");
    }
  }, [token]);

  const verifyEmail = async (verificationToken: string) => {
    try {
      const response = await authApi.verifyEmail(verificationToken);
      if (response.success) {
        setStatus("success");
        setMessage(response.message || "Email verified successfully!");
        // Redirect to dashboard after 3 seconds
        setTimeout(() => {
          router.push("/dashboard");
        }, 3000);
      } else {
        setStatus("error");
        setMessage(response.message || "Verification failed");
      }
    } catch (error: unknown) {
      setStatus("error");
      const errorMessage =
        error instanceof Error ? error.message : "Verification failed";
      setMessage(errorMessage);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-crypto-dark via-crypto-charcoal to-crypto-navy flex items-center justify-center p-4">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative z-10 max-w-md w-full"
      >
        <div className="bg-crypto-charcoal/80 backdrop-blur-xl rounded-3xl border border-white/10 p-8 shadow-2xl text-center">
          {status === "loading" && (
            <>
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-emerald-400 animate-spin" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">
                Verifying Your Email
              </h1>
              <p className="text-white/60">
                Please wait while we verify your email address...
              </p>
            </>
          )}

          {status === "success" && (
            <>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.2 }}
                className="w-20 h-20 mx-auto mb-6 rounded-full bg-emerald-500/20 flex items-center justify-center"
              >
                <CheckCircle className="w-10 h-10 text-emerald-400" />
              </motion.div>
              <h1 className="text-2xl font-bold text-white mb-2">
                Email Verified!
              </h1>
              <p className="text-white/60 mb-6">{message}</p>
              <p className="text-emerald-400 text-sm">
                Redirecting to dashboard...
              </p>
            </>
          )}

          {status === "error" && (
            <>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.2 }}
                className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-500/20 flex items-center justify-center"
              >
                <XCircle className="w-10 h-10 text-red-400" />
              </motion.div>
              <h1 className="text-2xl font-bold text-white mb-2">
                Verification Failed
              </h1>
              <p className="text-white/60 mb-6">{message}</p>
              <div className="space-y-3">
                <Link
                  href="/login"
                  className="flex items-center justify-center space-x-2 w-full py-3 bg-gradient-to-r from-emerald-600 to-green-500 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-emerald-500/25 transition-all"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Login</span>
                </Link>
                <button
                  onClick={() => router.push("/dashboard")}
                  className="flex items-center justify-center space-x-2 w-full py-3 bg-white/10 text-white rounded-xl font-semibold hover:bg-white/20 transition-all"
                >
                  <Mail className="w-4 h-4" />
                  <span>Request New Verification Email</span>
                </button>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-crypto-dark via-crypto-charcoal to-crypto-navy flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
