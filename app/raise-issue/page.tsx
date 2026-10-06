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
import Link from "next/link";
import Image from "next/image";

const getErrorMessage = (error: unknown, fallback = "An unexpected error occurred.") => {
  if (error instanceof Error) return error.message;
  if (
    typeof error === "object" && error !== null && "response" in error &&
    typeof (error as any).response === "object" && (error as any).response !== null &&
    "data" in (error as any).response && (error as any).response.data &&
    typeof (error as any).response.data === "object" &&
    "message" in (error as any).response.data &&
    typeof (error as any).response.data.message === "string"
  ) {
    return (error as any).response.data.message;
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

  useEffect(() => { loadMyIssues(); }, []);

  const loadMyIssues = async () => {
    try {
      setIsLoadingIssues(true);
      const { issueApi } = await import("../../lib/api/issues.js");
      const response = await issueApi.getMyIssues({ limit: 10 });
      setMyIssues(response?.success && response?.data ? (response.data.issues || []) : []);
    } catch (error) {
      setMyIssues([]);
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
      const response = await issueApi.createIssue({ subject: subject.trim(), description: description.trim(), priority });
      if (response?.success) {
        showNotification("success", "Issue submitted successfully! Our team will review it shortly.");
        setSubject(""); setDescription(""); setPriority("medium");
        setTimeout(() => loadMyIssues(), 500);
      } else {
        throw new Error(response?.message || "Failed to submit issue");
      }
    } catch (error) {
      showNotification("error", getErrorMessage(error, "Failed to submit issue. Please try again."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const showNotification = (type: "success" | "error" | "info", message: string) => {
    const id = Date.now();
    setNotifications(prev => [{ id, type, message }, ...prev]);
    setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 5000);
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "open":        return "bg-primary/10 border border-primary/25 text-primary";
      case "in-progress": return "bg-yellow-500/10 border border-yellow-400/25 text-yellow-600";
      case "resolved":    return "bg-emerald-500/10 border border-emerald-400/25 text-emerald-600";
      case "closed":      return "bg-secondary border border-border text-muted-foreground";
      default:            return "bg-secondary border border-border text-muted-foreground";
    }
  };

  const getPriorityStyle = (priority: string) => {
    switch (priority) {
      case "urgent": return "bg-destructive/10 border border-destructive/25 text-destructive";
      case "high":   return "bg-orange-500/10 border border-orange-400/25 text-orange-600";
      case "medium": return "bg-primary/10 border border-primary/25 text-primary";
      case "low":    return "bg-emerald-500/10 border border-emerald-400/25 text-emerald-600";
      default:       return "bg-secondary border border-border text-muted-foreground";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Notifications */}
      <AnimatePresence>
        {notifications.map(n => (
          <motion.div
            key={n.id}
            initial={{ opacity: 0, y: -50, x: 100 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            className="fixed top-4 right-4 z-50 max-w-sm"
          >
            <div className={`p-4 rounded-xl border ${
              n.type === "success" ? "bg-card border-emerald-300 text-emerald-700"
              : n.type === "error"  ? "bg-card border-destructive/30 text-destructive"
              :                       "bg-card border-primary/30 text-primary"
            }`}>
              <div className="flex items-start space-x-3">
                {n.type === "success"
                  ? <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  : <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />}
                <p className="text-sm font-medium">{n.message}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Page Header */}
      <div className="bg-card border-b border-border px-4 sm:px-6 lg:px-8 py-4 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3 min-w-0">
            <Link
              href="/dashboard"
              className="p-2 text-muted-foreground hover:text-foreground rounded-xl hover:bg-secondary border border-transparent hover:border-border transition-all flex-shrink-0"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </Link>
            <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg overflow-hidden bg-primary/10 border border-primary/20 flex-shrink-0">
                <Image src="/bitgain.PNG" alt="BitGains" width={36} height={36} className="w-full h-full object-contain" />
              </div>
              <div className="min-w-0">
                <h1 className="text-base sm:text-lg font-bold text-foreground truncate">Raise an Issue</h1>
                <p className="text-muted-foreground text-xs hidden sm:block">Report a problem or ask a question</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        {/* Page title */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-1">Submit a Support Issue</h2>
          <p className="text-muted-foreground text-sm sm:text-base">
            Have a question or concern? Let us know and we&apos;ll get back to you shortly.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Form */}
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-card border border-border rounded-2xl p-6 lg:p-8"
          >
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center flex-shrink-0">
                <MessageSquare className="w-5 h-5 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-bold text-foreground">Submit New Issue</h3>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Subject */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Subject <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  placeholder="Brief description of your issue"
                  maxLength={200}
                  autoComplete="off"
                  className="w-full px-4 py-3 bg-secondary border border-border rounded-xl text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                  required
                />
                <p className="text-muted-foreground/60 text-xs mt-1">{subject.length}/200 characters</p>
              </div>

              {/* Priority */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Priority Level</label>
                <select
                  value={priority}
                  onChange={e => setPriority(e.target.value)}
                  className="w-full px-4 py-3 bg-secondary border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all appearance-none cursor-pointer"
                >
                  <option value="low">Low — General inquiry</option>
                  <option value="medium">Medium — Standard issue</option>
                  <option value="high">High — Important matter</option>
                  <option value="urgent">Urgent — Critical issue</option>
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Description <span className="text-destructive">*</span>
                </label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Please provide detailed information about your issue..."
                  rows={6}
                  maxLength={2000}
                  autoComplete="off"
                  className="w-full px-4 py-3 bg-secondary border border-border rounded-xl text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all resize-none"
                  required
                />
                <p className="text-muted-foreground/60 text-xs mt-1">{description.length}/2000 characters</p>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting || !subject.trim() || !description.trim()}
                className="w-full py-3.5 bg-gradient-to-r from-primary to-accent text-primary-foreground font-bold rounded-xl transition-all duration-300 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 shadow-sm shadow-primary/20"
              >
                {isSubmitting ? (
                  <><Clock className="w-5 h-5 animate-spin" /><span>Submitting...</span></>
                ) : (
                  <><Send className="w-5 h-5" /><span>Submit Issue</span></>
                )}
              </button>
            </form>
          </motion.div>

          {/* My Issues */}
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-card border border-border rounded-2xl p-6 lg:p-8"
          >
            <h3 className="text-xl font-bold text-foreground mb-6">My Issues</h3>

            {isLoadingIssues ? (
              <div className="flex items-center justify-center py-12">
                <Clock className="w-8 h-8 text-primary animate-spin" />
              </div>
            ) : myIssues.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-secondary border border-border rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="w-8 h-8 text-muted-foreground/40" />
                </div>
                <p className="text-muted-foreground font-medium mb-1">No issues submitted yet</p>
                <p className="text-muted-foreground/60 text-sm">Your submitted issues will appear here</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1 scrollbar-thin">
                {myIssues.map(issue => (
                  <motion.div
                    key={issue._id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-secondary border border-border rounded-xl p-4 hover:border-primary/30 hover:bg-primary/5 transition-all duration-200"
                  >
                    <div
                      className="flex items-start justify-between cursor-pointer gap-2"
                      onClick={() => setExpandedIssue(expandedIssue === issue._id ? null : issue._id)}
                    >
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-foreground mb-2 truncate pr-2">{issue.subject}</h4>
                        <div className="flex flex-wrap gap-2 mb-2">
                          <span className={`px-2 py-0.5 rounded-lg text-xs font-medium ${getStatusStyle(issue.status)}`}>
                            {issue.status.replace("-", " ").toUpperCase()}
                          </span>
                          <span className={`px-2 py-0.5 rounded-lg text-xs font-medium ${getPriorityStyle(issue.priority)}`}>
                            {issue.priority.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-muted-foreground/60 text-xs">
                          {new Date(issue.createdAt).toLocaleDateString()} at {new Date(issue.createdAt).toLocaleTimeString()}
                        </p>
                      </div>
                      <ChevronDown className={`w-5 h-5 text-muted-foreground flex-shrink-0 transition-transform mt-0.5 ${expandedIssue === issue._id ? "rotate-180" : ""}`} />
                    </div>

                    <AnimatePresence>
                      {expandedIssue === issue._id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="mt-4 pt-4 border-t border-border space-y-3 overflow-hidden"
                        >
                          <div>
                            <p className="text-muted-foreground text-xs font-semibold mb-1 uppercase tracking-wide">Description</p>
                            <p className="text-foreground text-sm leading-relaxed">{issue.description}</p>
                          </div>
                          {issue.adminResponse && (
                            <div className="bg-primary/8 border border-primary/20 rounded-lg p-3">
                              <p className="text-primary text-xs font-semibold mb-1 uppercase tracking-wide">Admin Response</p>
                              <p className="text-foreground text-sm leading-relaxed">{issue.adminResponse}</p>
                            </div>
                          )}
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
    </div>
  );
}
