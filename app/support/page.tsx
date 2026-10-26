"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import {
  MessageCircle,
  Send,
  Shield,
  AlertTriangle,
  CheckCircle,
  ExternalLink,
  Clock,
  HelpCircle,
  Lock,
  Globe,
  ArrowLeft,
  Copy,
  Check,
  MessageSquare,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  User,
  Headphones,
  Inbox,
  Badge,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

// ─── Types ─────────────────────────────────────────────────────────────────
interface Issue {
  id: string;
  subject: string;
  description: string;
  priority: string;
  status: string;
  admin_response: string | null;
  created_at: string;
  updated_at: string;
  metadata?: any;
}

// ─── Helpers ────────────────────────────────────────────────────────────────
const statusColor: Record<string, string> = {
  open: "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 border-yellow-500/30",
  "in-progress": "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30",
  resolved: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
};

const priorityColor: Record<string, string> = {
  low: "text-muted-foreground",
  medium: "text-yellow-500",
  high: "text-orange-500",
  urgent: "text-red-500",
};

// ─── Main Component ──────────────────────────────────────────────────────────
export default function SupportPage() {
  const [copiedHandle, setCopiedHandle] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [activeTab, setActiveTab] = useState<"contact" | "tickets">("tickets");
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loadingIssues, setLoadingIssues] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Real-time subscription ref
  const channelRef = useRef<any>(null);

  const copyToClipboard = (text: string, type: "handle" | "link") => {
    navigator.clipboard.writeText(text);
    if (type === "handle") {
      setCopiedHandle(true);
      setTimeout(() => setCopiedHandle(false), 2000);
    } else {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  // ─── Load tickets ─────────────────────────────────────────────────────────
  const fetchIssues = async () => {
    try {
      const { supabase: sb } = await import("../../lib/supabase");
      const { data: { session } } = await sb.auth.getSession();
      if (!session?.access_token) {
        setIsAuthenticated(false);
        setLoadingIssues(false);
        return;
      }
      setIsAuthenticated(true);

      const res = await fetch("/api/issues/my-issues?limit=50", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const json = await res.json();
      if (json.success) {
        setIssues(json.data.issues || []);
        // Auto-expand if there's a ticket with an unread admin reply
        const withReply = (json.data.issues || []).find(
          (i: Issue) => i.admin_response && i.status !== "resolved"
        );
        if (withReply) setExpandedId(withReply.id);
      }
    } catch (err) {
      console.error("Failed to load issues:", err);
    } finally {
      setLoadingIssues(false);
    }
  };

  // ─── Real-time subscription on issues table ───────────────────────────────
  useEffect(() => {
    fetchIssues();

    const setupRealtime = async () => {
      const { supabase: sb } = await import("../../lib/supabase");
      const { data: { session } } = await sb.auth.getSession();
      if (!session?.user?.id) return;

      const uid = session.user.id;

      channelRef.current = sb
        .channel(`issues:${uid}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "issues",
            filter: `user_id=eq.${uid}`,
          },
          (payload: any) => {
            if (payload.eventType === "INSERT") {
              setIssues((prev) => [payload.new as Issue, ...prev]);
            } else if (payload.eventType === "UPDATE") {
              setIssues((prev) =>
                prev.map((i) =>
                  i.id === payload.new.id ? (payload.new as Issue) : i
                )
              );
              // Auto-expand updated issue if it got a new admin reply
              if (payload.new.admin_response && !payload.old?.admin_response) {
                setExpandedId(payload.new.id);
                setActiveTab("tickets");
              }
            } else if (payload.eventType === "DELETE") {
              setIssues((prev) => prev.filter((i) => i.id !== payload.old.id));
            }
          }
        )
        .subscribe();
    };

    setupRealtime();

    return () => {
      if (channelRef.current) {
        import("../../lib/supabase").then(({ supabase: sb }) => {
          sb.removeChannel(channelRef.current);
        });
      }
    };
  }, []);

  const securityTips = [
    {
      icon: Shield,
      title: "Verify Official Handle",
      description: "Always verify that you are messaging @BitgainsSupport only.",
    },
    {
      icon: Lock,
      title: "Never Share Credentials",
      description: "BitGains will never ask for your passwords, private keys, or wallet seed phrases.",
    },
    {
      icon: AlertTriangle,
      title: "Beware of Impersonators",
      description: "Be cautious of impersonators and scam accounts pretending to be BitGains representatives.",
    },
    {
      icon: MessageCircle,
      title: "We Don't Initiate Contact",
      description: "BitGains will never reach out to you via unofficial Telegram groups or DMs first.",
    },
  ];

  const unreadReplies = issues.filter(
    (i) => i.admin_response && i.status !== "resolved"
  ).length;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border px-3 sm:px-6 lg:px-8 py-3 sm:py-5 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-4 min-w-0">
              <Link
                href="/dashboard"
                className="p-1.5 sm:p-2 text-muted-foreground hover:text-foreground transition-colors rounded-xl hover:bg-secondary border border-transparent hover:border-border flex-shrink-0"
              >
                <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              </Link>
              <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl overflow-hidden bg-primary/10 border border-primary/20 p-0.5 flex-shrink-0">
                  <Image
                    src="/bitgain.PNG"
                    alt="BitGains Logo"
                    width={40}
                    height={40}
                    className="w-full h-full object-contain rounded-lg"
                  />
                </div>
                <div className="min-w-0">
                  <h1 className="text-base sm:text-xl font-bold text-foreground truncate">
                    BitGains Support
                  </h1>
                  <p className="text-muted-foreground text-xs sm:text-sm hidden sm:block">
                    We&apos;re here to help you
                  </p>
                </div>
              </div>
            </div>
            <button
              onClick={fetchIssues}
              className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-xl hover:bg-secondary border border-border"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 pt-4 sm:pt-6">
        <div className="flex gap-2 bg-secondary border border-border rounded-xl p-1">
          <button
            onClick={() => setActiveTab("tickets")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
              activeTab === "tickets"
                ? "bg-card text-foreground shadow-sm border border-border"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Inbox className="w-4 h-4" />
            My Tickets
            {unreadReplies > 0 && (
              <span className="px-1.5 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full">
                {unreadReplies}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("contact")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
              activeTab === "contact"
                ? "bg-card text-foreground shadow-sm border border-border"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Headphones className="w-4 h-4" />
            Contact Us
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">

        {/* ── TICKETS TAB ─────────────────────────────────────────────── */}
        {activeTab === "tickets" && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-foreground">Support Tickets</h2>
                <p className="text-muted-foreground text-sm mt-0.5">
                  View your submitted tickets and admin replies
                </p>
              </div>
              {unreadReplies > 0 && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 border border-blue-500/30 rounded-xl text-blue-500 text-sm font-medium">
                  <MessageSquare className="w-4 h-4" />
                  {unreadReplies} {unreadReplies === 1 ? "reply" : "replies"} from admin
                </div>
              )}
            </div>

            {!isAuthenticated ? (
              <div className="bg-card border border-border rounded-2xl p-8 text-center">
                <div className="w-14 h-14 bg-primary/10 border border-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Lock className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-foreground font-semibold mb-2">Sign in to view tickets</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  You need to be logged in to view your support tickets.
                </p>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary to-accent text-primary-foreground rounded-xl text-sm font-semibold"
                >
                  Sign In
                </Link>
              </div>
            ) : loadingIssues ? (
              <div className="flex items-center justify-center py-16">
                <RefreshCw className="w-6 h-6 text-primary animate-spin" />
              </div>
            ) : issues.length === 0 ? (
              <div className="bg-card border border-border rounded-2xl p-8 text-center">
                <div className="w-14 h-14 bg-secondary border border-border rounded-full flex items-center justify-center mx-auto mb-4">
                  <Inbox className="w-7 h-7 text-muted-foreground/50" />
                </div>
                <h3 className="text-foreground font-semibold mb-2">No tickets yet</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  You haven&apos;t submitted any support tickets. Use the Raise Issue option in your dashboard or contact us via Telegram.
                </p>
                <button
                  onClick={() => setActiveTab("contact")}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary to-accent text-primary-foreground rounded-xl text-sm font-semibold"
                >
                  <MessageCircle className="w-4 h-4" />
                  Contact Support
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {issues.map((issue) => {
                  const isExpanded = expandedId === issue.id;
                  const hasAdminReply = !!issue.admin_response;
                  const isStakeCancellation = issue.metadata?.type === "stake_cancellation";

                  return (
                    <motion.div
                      key={issue.id}
                      layout
                      className={`bg-card border rounded-2xl overflow-hidden transition-all duration-200 ${
                        hasAdminReply && issue.status !== "resolved"
                          ? "border-blue-500/40 shadow-sm shadow-blue-500/10"
                          : "border-border"
                      }`}
                    >
                      {/* Ticket Header */}
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : issue.id)}
                        className="w-full text-left p-4 sm:p-5 flex items-start gap-3"
                      >
                        {/* Status indicator */}
                        <div className={`mt-0.5 w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                          issue.status === "resolved" ? "bg-emerald-500"
                          : issue.status === "in-progress" ? "bg-blue-500"
                          : "bg-yellow-500"
                        }`} />

                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <span className="text-foreground font-semibold text-sm sm:text-base truncate">
                              {issue.subject}
                            </span>
                            {isStakeCancellation && (
                              <span className="px-2 py-0.5 bg-orange-500/15 text-orange-500 border border-orange-500/30 text-[10px] font-bold rounded-full">
                                STAKE CANCEL
                              </span>
                            )}
                            {hasAdminReply && issue.status !== "resolved" && (
                              <span className="px-2 py-0.5 bg-blue-500/15 text-blue-500 border border-blue-500/30 text-[10px] font-bold rounded-full animate-pulse">
                                💬 Admin Replied
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            <span className={`px-2 py-0.5 rounded-full border text-[10px] font-medium ${statusColor[issue.status] || statusColor["open"]}`}>
                              {issue.status === "in-progress" ? "In Progress" : issue.status.charAt(0).toUpperCase() + issue.status.slice(1)}
                            </span>
                            <span className={`font-medium capitalize ${priorityColor[issue.priority] || ""}`}>
                              {issue.priority} priority
                            </span>
                            <span>{new Date(issue.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>

                        <div className="flex-shrink-0 text-muted-foreground">
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </div>
                      </button>

                      {/* Ticket Conversation */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.25 }}
                            className="overflow-hidden"
                          >
                            <div className="px-4 sm:px-5 pb-5 space-y-3 border-t border-border pt-4">

                              {/* User Message Bubble */}
                              <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                                  <User className="w-4 h-4 text-primary" />
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xs font-semibold text-foreground">You</span>
                                    <span className="text-xs text-muted-foreground/60">
                                      {new Date(issue.created_at).toLocaleString()}
                                    </span>
                                  </div>
                                  <div className="bg-secondary border border-border rounded-2xl rounded-tl-sm p-3 sm:p-4">
                                    <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                                      {issue.description}
                                    </p>
                                  </div>
                                </div>
                              </div>

                              {/* Admin Reply Bubble */}
                              {hasAdminReply ? (
                                <div className="flex items-start gap-3">
                                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary to-accent flex items-center justify-center flex-shrink-0 shadow-sm">
                                    <Headphones className="w-4 h-4 text-primary-foreground" />
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="text-xs font-semibold text-foreground">BitGains Support</span>
                                      <span className="px-1.5 py-0.5 bg-primary/10 text-primary text-[10px] font-bold rounded-full border border-primary/20">
                                        Official
                                      </span>
                                      {issue.updated_at && (
                                        <span className="text-xs text-muted-foreground/60">
                                          {new Date(issue.updated_at).toLocaleString()}
                                        </span>
                                      )}
                                    </div>
                                    <div className="bg-primary/8 border border-primary/20 rounded-2xl rounded-tl-sm p-3 sm:p-4">
                                      <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                                        {issue.admin_response}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-center gap-3 p-3 bg-secondary border border-dashed border-border rounded-xl">
                                  <Clock className="w-4 h-4 text-muted-foreground/50 flex-shrink-0" />
                                  <p className="text-muted-foreground text-xs">
                                    Awaiting response from support team. We typically reply within 24 hours.
                                  </p>
                                </div>
                              )}

                              {/* Telegram CTA when awaiting */}
                              {!hasAdminReply && (
                                <div className="flex items-center gap-2 pt-1">
                                  <a
                                    href="https://t.me/BitgainsSupport"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors"
                                  >
                                    <Send className="w-3.5 h-3.5" />
                                    Need faster help? Message us on Telegram
                                    <ExternalLink className="w-3 h-3" />
                                  </a>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {/* ── CONTACT TAB ─────────────────────────────────────────────── */}
        {activeTab === "contact" && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6 sm:space-y-8"
          >
            {/* Welcome */}
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-primary/10 border border-primary/25 rounded-full mb-4 sm:mb-6">
                <MessageCircle className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-3 px-4">
                💬 Welcome to BitGains Support
              </h2>
              <p className="text-muted-foreground text-sm sm:text-base max-w-3xl mx-auto px-4">
                We&apos;re here to help you with any questions, issues, or account-related concerns regarding the BitGains platform.
              </p>
            </div>

            {/* How to Get Help */}
            <div className="bg-card border border-border rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8">
              <div className="flex items-start space-x-3 sm:space-x-4 mb-4 sm:mb-6">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-primary to-accent rounded-xl sm:rounded-2xl flex items-center justify-center flex-shrink-0">
                  <HelpCircle className="w-5 h-5 sm:w-6 sm:h-6 text-primary-foreground" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-foreground">
                  🛠️ How to Get Help
                </h3>
              </div>

              <p className="text-foreground text-sm sm:text-base mb-4 sm:mb-6">
                At this time, <span className="text-primary font-semibold">Telegram</span> is the official channel for BitGains support.
              </p>

              <div className="space-y-3 sm:space-y-4">
                {/* Support Handle */}
                <div className="bg-primary/8 border border-primary/25 rounded-xl sm:rounded-2xl p-4 sm:p-6 hover:bg-primary/12 transition-all duration-300">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                    <div className="flex items-center space-x-3 sm:space-x-4 min-w-0">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-primary to-accent rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                        <Send className="w-5 h-5 sm:w-6 sm:h-6 text-primary-foreground" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-muted-foreground text-xs sm:text-sm mb-1">📱 Official Support Handle:</p>
                        <p className="text-primary text-base sm:text-xl font-bold font-mono break-all">@BitgainsSupport</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 self-end sm:self-auto flex-shrink-0">
                      <button
                        onClick={() => copyToClipboard("@BitgainsSupport", "handle")}
                        className="px-3 py-2 sm:px-4 bg-secondary border border-border hover:bg-primary/10 hover:border-primary/30 text-muted-foreground hover:text-foreground rounded-lg sm:rounded-xl transition-colors flex items-center space-x-1.5 sm:space-x-2 text-xs sm:text-sm"
                      >
                        {copiedHandle ? (
                          <><Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" /><span>Copied!</span></>
                        ) : (
                          <><Copy className="w-3.5 h-3.5 sm:w-4 sm:h-4" /><span>Copy</span></>
                        )}
                      </button>
                      <a
                        href="https://t.me/BitgainsSupport"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-2 sm:px-4 bg-gradient-to-r from-primary to-accent text-primary-foreground font-semibold rounded-lg sm:rounded-xl hover:opacity-90 transition-all duration-300 flex items-center space-x-1.5 sm:space-x-2 text-xs sm:text-sm"
                      >
                        <MessageCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        <span className="hidden sm:inline">Contact Support</span>
                        <span className="sm:hidden">Contact</span>
                        <ExternalLink className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </a>
                    </div>
                  </div>
                </div>

                {/* Official Page */}
                <div className="bg-secondary border border-border rounded-xl sm:rounded-2xl p-4 sm:p-6 hover:bg-primary/5 hover:border-primary/25 transition-all duration-300">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                    <div className="flex items-center space-x-3 sm:space-x-4 min-w-0">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-secondary border border-border rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                        <Globe className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-muted-foreground text-xs sm:text-sm mb-1">🌐 Official Telegram Page:</p>
                        <p className="text-foreground text-sm sm:text-xl font-bold font-mono break-all">https://t.me/BitgainsCo</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 self-end sm:self-auto flex-shrink-0">
                      <button
                        onClick={() => copyToClipboard("https://t.me/BitgainsCo", "link")}
                        className="px-3 py-2 sm:px-4 bg-secondary border border-border hover:bg-primary/10 hover:border-primary/30 text-muted-foreground hover:text-foreground rounded-lg sm:rounded-xl transition-colors flex items-center space-x-1.5 sm:space-x-2 text-xs sm:text-sm"
                      >
                        {copiedLink ? (
                          <><Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" /><span>Copied!</span></>
                        ) : (
                          <><Copy className="w-3.5 h-3.5 sm:w-4 sm:h-4" /><span>Copy</span></>
                        )}
                      </button>
                      <a
                        href="https://t.me/BitgainsCo"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-2 sm:px-4 bg-secondary border border-border hover:bg-primary/10 hover:border-primary/30 text-foreground font-semibold rounded-lg sm:rounded-xl transition-all duration-300 flex items-center space-x-1.5 sm:space-x-2 text-xs sm:text-sm"
                      >
                        <Globe className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        <span className="hidden sm:inline">Visit Page</span>
                        <span className="sm:hidden">Visit</span>
                        <ExternalLink className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-primary/8 border border-primary/20 rounded-xl">
                <p className="text-foreground text-xs sm:text-sm flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 mt-0.5 flex-shrink-0 text-primary" />
                  <span>
                    Please make sure you are contacting the correct handle listed above. We never initiate contact first or ask for your passwords, private keys, or wallet seed phrases.
                  </span>
                </p>
              </div>
            </div>

            {/* Security Notice */}
            <div className="bg-card border border-border rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8">
              <div className="flex items-center space-x-2 sm:space-x-3 mb-4 sm:mb-6">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-destructive/10 border border-destructive/20 rounded-xl sm:rounded-2xl flex items-center justify-center flex-shrink-0">
                  <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-destructive" />
                </div>
                <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground">⚠️ Security Notice</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                {securityTips.map((tip, index) => (
                  <div
                    key={index}
                    className="bg-secondary border border-border rounded-xl sm:rounded-2xl p-3 sm:p-5 hover:border-primary/30 hover:bg-primary/5 transition-all duration-300"
                  >
                    <div className="flex items-start space-x-3 sm:space-x-4">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary/10 border border-primary/20 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                        <tip.icon className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-foreground font-semibold mb-1 sm:mb-2 text-sm sm:text-base">{tip.title}</h4>
                        <p className="text-muted-foreground text-xs sm:text-sm">{tip.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA */}
            <div className="bg-primary/10 border border-primary/25 rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-12 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-primary to-accent rounded-full mb-4 sm:mb-6">
                <Send className="w-6 h-6 sm:w-8 sm:h-8 text-primary-foreground" />
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold text-foreground mb-3 sm:mb-4">📩 Contact Us Now</h3>
              <p className="text-muted-foreground text-sm sm:text-base mb-6 sm:mb-8 max-w-2xl mx-auto px-4">
                Need help right away? Tap the link below to start chatting with our verified support team:
              </p>
              <a
                href="https://t.me/BitgainsSupport"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-2 sm:space-x-3 px-6 py-3 sm:px-8 sm:py-4 bg-gradient-to-r from-primary to-accent text-primary-foreground font-bold text-sm sm:text-base lg:text-lg rounded-xl sm:rounded-2xl hover:opacity-90 hover:shadow-xl hover:shadow-primary/25 transition-all duration-300 transform hover:scale-105"
              >
                <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6" />
                <span>👉 Contact Telegram @BitgainsSupport</span>
                <ExternalLink className="w-4 h-4 sm:w-5 sm:h-5" />
              </a>
              <div className="mt-4 sm:mt-6 flex items-center justify-center space-x-2 text-muted-foreground text-xs sm:text-sm">
                <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>Our team typically responds within 24 hours</span>
              </div>
            </div>
          </motion.div>
        )}

      </div>
    </div>
  );
}
