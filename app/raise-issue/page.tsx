"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertCircle,
  Send,
  ArrowLeft,
  CheckCircle,
  Clock,
  MessageSquare,
  ChevronDown,
} from "lucide-react";
import { useRouter } from "next/navigation";

const getErrorMessage = (
  error: unknown,
  fallback = "An unexpected error occurred."
) => {
  if (error instanceof Error) {
    return error.message;
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    typeof error.response === "object" &&
    error.response !== null &&
    "data" in error.response &&
    error.response.data &&
    typeof error.response.data === "object" &&
    "message" in error.response.data &&
    typeof error.response.data.message === "string"
  ) {
    return error.response.data.message;
  }

  return fallback;
};

interface Issue {
  _id: string;
  subject: string;
  description: string;
  priority: string;
  status: string;
  adminResponse?: string;
  createdAt: string;
  updatedAt: string;
}

interface Notification {
  id: number;
  type: "success" | "error" | "info";
  message: string;
  timestamp: Date;
}

export default function RaiseIssuePage() {
  const router = useRouter();
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [myIssues, setMyIssues] = useState<Issue[]>([]);
  const [isLoadingIssues, setIsLoadingIssues] = useState(true);
  const [expandedIssue, setExpandedIssue] = useState<string | null>(null);

  // Load user's existing issues
  useEffect(() => {
    loadMyIssues();
  }, []);

  const loadMyIssues = async () => {
    try {
      setIsLoadingIssues(true);
      const { issueApi } = await import("../../lib/api/issues.js");
      const response = await issueApi.getMyIssues({ limit: 10 });

      if (response && response.success && response.data) {
        setMyIssues(response.data.issues || []);
      } else {
        setMyIssues([]);
      }
    } catch (error: unknown) {
      // Silently fail - just show empty issues
      setMyIssues([]);

      // Log error for debugging (if console is available)
      if (typeof window !== "undefined") {
        const errMessage = getErrorMessage(error, "Unknown error");
        window.console.error?.("Error loading issues:", errMessage);
      }
    } finally {
      setIsLoadingIssues(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!subject.trim() || !description.trim()) {
      showNotification("error", "Please fill in all required fields");
      return;
    }

    try {
      setIsSubmitting(true);
      const { issueApi } = await import("../../lib/api/issues.js");

      const response = await issueApi.createIssue({
        subject: subject.trim(),
        description: description.trim(),
        priority,
      });

      // Check if response has success property
      if (response && response.success) {
        showNotification(
          "success",
          "Issue submitted successfully! Our team will review it shortly."
        );
        setSubject("");
        setDescription("");
        setPriority("medium");

        // Reload issues after a short delay to ensure backend has processed
        setTimeout(() => {
          loadMyIssues();
        }, 500);
      } else {
        throw new Error(
          response?.message || "Failed to submit issue - Invalid response"
        );
      }
    } catch (error: unknown) {
      // Show detailed error message
      const errorMessage = getErrorMessage(
        error,
        "Failed to submit issue. Please try again."
      );
      showNotification("error", errorMessage);

      // Re-enable console temporarily to see the error
      if (typeof window !== "undefined") {
        const errMessage = getErrorMessage(error, "Unknown error");
        window.console.error?.("Issue submission error:", errMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const showNotification = (
    type: "success" | "error" | "info",
    message: string
  ) => {
    const notification: Notification = {
      id: Date.now(),
      type,
      message,
      timestamp: new Date(),
    };
    setNotifications((prev) => [notification, ...prev]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== notification.id));
    }, 5000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "text-blue-400 bg-blue-500/20";
      case "in-progress":
        return "text-yellow-400 bg-yellow-500/20";
      case "resolved":
        return "text-emerald-400 bg-emerald-500/20";
      case "closed":
        return "text-gray-400 bg-gray-500/20";
      default:
        return "text-white/60 bg-white/10";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "text-red-400 bg-red-500/20";
      case "high":
        return "text-orange-400 bg-orange-500/20";
      case "medium":
        return "text-yellow-400 bg-yellow-500/20";
      case "low":
        return "text-green-400 bg-green-500/20";
      default:
        return "text-white/60 bg-white/10";
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-black via-gray-900 to-black text-white p-4 sm:p-6 lg:p-8">
      {/* Notifications */}
      <AnimatePresence>
        {notifications.map((notification) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, y: -50, x: 100 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            className="fixed top-4 right-4 z-50 max-w-md"
          >
            <div
              className={`p-4 rounded-xl border backdrop-blur-xl ${
                notification.type === "success"
                  ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-300"
                  : notification.type === "error"
                  ? "bg-red-500/20 border-red-500/50 text-red-300"
                  : "bg-blue-500/20 border-blue-500/50 text-blue-300"
              }`}
            >
              <div className="flex items-start space-x-3">
                {notification.type === "success" ? (
                  <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                )}
                <p className="text-sm font-medium">{notification.message}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <button
            onClick={() => router.push("/dashboard")}
            className="flex items-center space-x-2 text-white/60 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Dashboard</span>
          </button>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-linear-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">
            Raise an Issue
          </h1>
          <p className="text-white/60 text-sm sm:text-base">
            Have a question or concern? Let us know and we&#39;ll get back to
            you shortly.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Issue Form */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white/5 backdrop-blur-xl border border-white/20 rounded-2xl p-6 lg:p-8"
          >
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-linear-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl font-bold">Submit New Issue</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Subject */}
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Subject <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Brief description of your issue"
                  maxLength={200}
                  autoComplete="off"
                  data-form-type="other"
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
                  required
                />
                <p className="text-white/40 text-xs mt-1">
                  {subject.length}/200 characters
                </p>
              </div>

              {/* Priority */}
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Priority Level
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all appearance-none cursor-pointer"
                >
                  <option value="low" className="bg-gray-900">
                    Low - General inquiry
                  </option>
                  <option value="medium" className="bg-gray-900">
                    Medium - Standard issue
                  </option>
                  <option value="high" className="bg-gray-900">
                    High - Important matter
                  </option>
                  <option value="urgent" className="bg-gray-900">
                    Urgent - Critical issue
                  </option>
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Description <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Please provide detailed information about your issue..."
                  rows={6}
                  maxLength={2000}
                  autoComplete="off"
                  data-form-type="other"
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all resize-none"
                  required
                />
                <p className="text-white/40 text-xs mt-1">
                  {description.length}/2000 characters
                </p>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={
                  isSubmitting || !subject.trim() || !description.trim()
                }
                className="w-full py-4 bg-linear-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold rounded-xl transition-all duration-300 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-cyan-500/25"
              >
                {isSubmitting ? (
                  <>
                    <Clock className="w-5 h-5 animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    <span>Submit Issue</span>
                  </>
                )}
              </button>
            </form>
          </motion.div>

          {/* My Issues */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white/5 backdrop-blur-xl border border-white/20 rounded-2xl p-6 lg:p-8"
          >
            <h2 className="text-xl font-bold mb-6">My Issues</h2>

            {isLoadingIssues ? (
              <div className="flex items-center justify-center py-12">
                <Clock className="w-8 h-8 text-cyan-400 animate-spin" />
              </div>
            ) : myIssues.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare className="w-12 h-12 text-white/40 mx-auto mb-4" />
                <p className="text-white/60">No issues submitted yet</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                {myIssues.map((issue) => (
                  <motion.div
                    key={issue._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-all"
                  >
                    <div
                      className="flex items-start justify-between cursor-pointer"
                      onClick={() =>
                        setExpandedIssue(
                          expandedIssue === issue._id ? null : issue._id
                        )
                      }
                    >
                      <div className="flex-1">
                        <h3 className="font-semibold text-white mb-2 pr-4">
                          {issue.subject}
                        </h3>
                        <div className="flex flex-wrap gap-2 mb-2">
                          <span
                            className={`px-2 py-1 rounded-lg text-xs font-medium ${getStatusColor(
                              issue.status
                            )}`}
                          >
                            {issue.status.replace("-", " ").toUpperCase()}
                          </span>
                          <span
                            className={`px-2 py-1 rounded-lg text-xs font-medium ${getPriorityColor(
                              issue.priority
                            )}`}
                          >
                            {issue.priority.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-white/50 text-xs">
                          {new Date(issue.createdAt).toLocaleDateString()} at{" "}
                          {new Date(issue.createdAt).toLocaleTimeString()}
                        </p>
                      </div>
                      <ChevronDown
                        className={`w-5 h-5 text-white/60 transition-transform ${
                          expandedIssue === issue._id ? "rotate-180" : ""
                        }`}
                      />
                    </div>

                    <AnimatePresence>
                      {expandedIssue === issue._id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="mt-4 pt-4 border-t border-white/10"
                        >
                          <div className="space-y-3">
                            <div>
                              <p className="text-white/60 text-xs font-semibold mb-1">
                                Description:
                              </p>
                              <p className="text-white/80 text-sm">
                                {issue.description}
                              </p>
                            </div>

                            {issue.adminResponse && (
                              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3">
                                <p className="text-emerald-400 text-xs font-semibold mb-1">
                                  Admin Response:
                                </p>
                                <p className="text-emerald-300 text-sm">
                                  {issue.adminResponse}
                                </p>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(6, 182, 212, 0.5);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(6, 182, 212, 0.7);
        }
      `}</style>
    </div>
  );
}
