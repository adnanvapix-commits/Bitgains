"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle,
  XCircle,
  X,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
  User,
  MessageSquare,
  Loader2,
  RefreshCw,
  Filter,
  LogOut,
  TrendingUp,
  Users,
  Wallet,
  Calendar,
  AlertTriangle,
  Search,
  Network,
  Gift,
  ChevronDown,
  ChevronRight,
  Trash2,
  Bell,
  History,
  DollarSign,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext.js";
import { adminApi } from "../../lib/api/admin.js";
import { useRouter } from "next/navigation";

interface Transaction {
  _id: string;
  userId: {
    name: string;
    email: string;
  };
  type: "deposit" | "withdrawal";
  amount: number;
  currency: string;
  fee?: {
    amount: number;
  };
  submittedAt: string;
  status: string;
  toAddress?: string;
  fromAddress?: string;
  network?: string;
  userTransactionId?: string;
}

interface Stats {
  transactions?: {
    pendingDeposits: number;
    pendingWithdrawals: number;
  };
  users?: {
    total: number;
    active: number;
  };
  wallets?: {
    totalBalance: number;
    totalStaked: number;
    totalEarnings: number;
    totalDeposited: number;
    totalWithdrawn: number;
    activeWallets: number;
  };
}

interface SearchTransaction {
  _id: string;
  type: string;
  amount: number;
  status: string;
  createdAt: string;
  txHash?: string;
  description?: string;
  network?: string;
  userId?: {
    _id?: string;
    name?: string;
    email?: string;
  };
}

interface SearchIssue {
  _id: string;
  subject: string;
  status: string;
  priority: string;
  createdAt: string;
  description?: string;
  userId?: {
    _id?: string;
    name?: string;
    email?: string;
  };
}

interface SearchUser {
  _id: string;
  name: string;
  email: string;
  referralCode?: string;
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
  role?: string;
  referralCount?: number;
  referralEarnings?: number;
  wallet: {
    balance: number;
    stakedAmount: number;
    availableBalance: number;
    totalEarnings: number;
    totalDeposited: number;
    totalWithdrawn: number;
    stakingStartDate?: string;
    lastStakingUpdate?: string;
  } | null;
  recentTransactions: SearchTransaction[];
}

interface GlobalSearchResults {
  query: string;
  counts: {
    users: number;
    transactions: number;
    issues: number;
  };
  results: {
    users: SearchUser[];
    transactions: SearchTransaction[];
    issues: SearchIssue[];
  };
}

export default function AdminPage() {
  const [pendingTransactions, setPendingTransactions] = useState<Transaction[]>(
    []
  );
  const [stakingTransactions, setStakingTransactions] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [issues, setIssues] = useState<any[]>([]);
  const [issueStats, setIssueStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isLoadingStaking, setIsLoadingStaking] = useState(false);
  const [isLoadingIssues, setIsLoadingIssues] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("transactions");
  const [allUsersDetailed, setAllUsersDetailed] = useState<any[]>([]);
  const [allUsersDetailedLoading, setAllUsersDetailedLoading] = useState(false);
  const [allUsersDetailedSearch, setAllUsersDetailedSearch] = useState("");
  const [allUsersDetailedError, setAllUsersDetailedError] = useState<string | null>(null);
  const [selectedUserDetail, setSelectedUserDetail] = useState<any>(null);
  const [processingTx, setProcessingTx] = useState<string | null>(null);
  const [commentModal, setCommentModal] = useState<{
    open: boolean;
    txId: string | null;
    action: string | null;
  }>({ open: false, txId: null, action: null });
  const [comment, setComment] = useState("");
  const [filter, setFilter] = useState("all");
  const [issueFilter, setIssueFilter] = useState("all");
  const [stats, setStats] = useState<Stats | null>(null);
  const [responseModal, setResponseModal] = useState<{
    open: boolean;
    issueId: string | null;
  }>({ open: false, issueId: null });
  const [adminResponse, setAdminResponse] = useState("");

  // New state for balance manager
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [balanceAmount, setBalanceAmount] = useState<string>("");
  const [balanceAction, setBalanceAction] = useState<
    "add" | "deduct" | "bonus"
  >("add");
  const [balanceReason, setBalanceReason] = useState<string>("");
  const [isProcessingBalance, setIsProcessingBalance] = useState(false);
  const [allUsers, setAllUsers] = useState<any[]>([]);

  // New state for deleted transactions
  const [deletedTransactions, setDeletedTransactions] = useState<any[]>([]);
  const [isLoadingDeleted, setIsLoadingDeleted] = useState(false);

  // New state for audit logs
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [isLoadingAuditLogs, setIsLoadingAuditLogs] = useState(false);
  const [auditLogStats, setAuditLogStats] = useState<any>(null);

  // Global search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] =
    useState<GlobalSearchResults | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);

  // Push notifications state
  const [notificationTitle, setNotificationTitle] = useState("");
  const [notificationMessage, setNotificationMessage] = useState("");
  const [notificationUserId, setNotificationUserId] = useState("all");
  const [notificationType, setNotificationType] = useState<
    "info" | "success" | "warning" | "error" | "announcement"
  >("announcement");

  // Custom dropdown open states for push notification
  const [showSendToDropdown, setShowSendToDropdown] = useState(false);
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [sendToSearch, setSendToSearch] = useState("");

  // Per-tab search/filter state
  const [pendingSearch, setPendingSearch] = useState("");
  const [stakingActivitySearch, setStakingActivitySearch] = useState("");
  const [userStakingSearch, setUserStakingSearch] = useState("");
  const [issuesSearch, setIssuesSearch] = useState("");
  const [auditLogsSearch, setAuditLogsSearch] = useState("");
  const [deletedTxSearch, setDeletedTxSearch] = useState("");
  const [payoutsSearch, setPayoutsSearch] = useState("");
  const [isSendingNotification, setIsSendingNotification] = useState(false);
  const [sentNotifications, setSentNotifications] = useState<any[]>([]);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);

  // Delete user state
  const [deleteUserModal, setDeleteUserModal] = useState<{
    open: boolean;
    userId: string | null;
    userName: string | null;
  }>({ open: false, userId: null, userName: null });
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteReason, setDeleteReason] = useState("");
  const [isDeletingUser, setIsDeletingUser] = useState(false);

  const formatCurrency = (value?: number | null) => {
    if (typeof value !== "number") {
      return "0.00";
    }

    return value.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // Safe date formatter -- returns fallback if date is invalid
  const formatDate = (val?: string | null, opts?: Intl.DateTimeFormatOptions) => {
    if (!val) return "--";
    const d = new Date(val);
    if (isNaN(d.getTime())) return "--";
    return d.toLocaleDateString(undefined, opts);
  };

  const formatDateTime = (val?: string | null) => {
    if (!val) return "--";
    const d = new Date(val);
    if (isNaN(d.getTime())) return "--";
    return d.toLocaleString();
  };

  const formatTime = (val?: string | null) => {
    if (!val) return "--";
    const d = new Date(val);
    if (isNaN(d.getTime())) return "--";
    return d.toLocaleTimeString();
  };

  const getStatusBadgeClass = (status?: string) => {
    switch (status?.toLowerCase()) {
      case "completed":
      case "resolved":
        return "bg-emerald-500/20 text-emerald-400";
      case "pending":
      case "in-progress":
        return "bg-yellow-500/20 text-yellow-300";
      case "approved":
        return "bg-blue-500/20 text-blue-300";
      default:
        return "bg-red-500/20 text-red-400";
    }
  };

  const getPriorityBadgeClass = (priority?: string) => {
    switch (priority?.toLowerCase()) {
      case "urgent":
        return "bg-red-500/20 text-red-400";
      case "high":
        return "bg-orange-500/20 text-orange-400";
      case "medium":
        return "bg-yellow-500/20 text-yellow-300";
      default:
        return "bg-emerald-500/20 text-emerald-300";
    }
  };

  const userMatches = searchResults?.results?.users ?? [];
  const transactionMatches = searchResults?.results?.transactions ?? [];
  const issueMatches = searchResults?.results?.issues ?? [];

  // Referral hierarchy state
  const [selectedUserForHierarchy, setSelectedUserForHierarchy] =
    useState<string>("");
  const [referralHierarchy, setReferralHierarchy] = useState<any>(null);
  const [hierarchyUserSearch, setHierarchyUserSearch] = useState("");
  const [balanceUserSearch, setBalanceUserSearch] = useState("");
  const [isLoadingHierarchy, setIsLoadingHierarchy] = useState(false);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  // Stake cancellation state
  const [cancelStakeModal, setCancelStakeModal] = useState<{
    open: boolean;
    user: any;
    selectedStakeId: string | null;
  }>({ open: false, user: null, selectedStakeId: null });
  const [cancelStakeReason, setCancelStakeReason] = useState("");
  const [isCancellingStake, setIsCancellingStake] = useState(false);

  // Payouts state
  const [eligibleUsers, setEligibleUsers] = useState<any[]>([]);
  const [payoutHistory, setPayoutHistory] = useState<any[]>([]);
  const [isLoadingPayouts, setIsLoadingPayouts] = useState(false);
  const [isDistributingPayouts, setIsDistributingPayouts] = useState(false);
  const [payoutPercentage, setPayoutPercentage] = useState<string>("");
  const [selectedPayoutUsers, setSelectedPayoutUsers] = useState<string[]>([]);
  const [payoutSummary, setPayoutSummary] = useState<any>(null);

  const { user, isAuthenticated, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await logout();
      router.push("/login");
    } catch (error) {
      console.error("Logout error:", error);
      // Force redirect even if API call fails
      router.push("/login");
    }
  };

  // Redirect if not admin
  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    if (user && user.role !== "admin") {
      router.push("/dashboard");
      return;
    }
  }, [isAuthenticated, user, router]);

  const fetchPendingTransactions = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [transactionsResponse, statsResponse] = await Promise.all([
        adminApi.getPendingTransactions({
          type: filter === "all" ? undefined : filter,
        }),
        adminApi.getDashboardStats(),
      ]);

      if (transactionsResponse.success) {
        // Supabase returns `id`/`created_at`, but the UI uses `_id`/`submittedAt` -- normalize here
        setPendingTransactions(
          (transactionsResponse.data.transactions || []).map((tx: any) => ({
            ...tx,
            _id: tx._id || tx.id,
            submittedAt: tx.submittedAt || tx.created_at || tx.createdAt,
            createdAt: tx.createdAt || tx.created_at,
          }))
        );
      }

      if (statsResponse.success) {
        setStats(statsResponse.data);
      }
    } catch (error) {
      console.error("Error fetching pending transactions:", error);
      setError(
        error instanceof Error ? error.message : "Failed to fetch transactions"
      );
    } finally {
      setIsLoading(false);
    }
  }, [filter]);

  const fetchUsersWithStaking = useCallback(async () => {
    try {
      setIsLoadingUsers(true);
      const response = await adminApi.getAllUsers({ limit: 50 });

      if (response.success) {
        // Filter users who have staked amounts
        const usersWithStaking = response.data.users.filter(
          (user: any) => user.wallet && user.wallet.stakedAmount > 0
        );
        setUsers(usersWithStaking);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setIsLoadingUsers(false);
    }
  }, []);

  const fetchStakingTransactions = useCallback(async () => {
    try {
      setIsLoadingStaking(true);
      const response = await adminApi.getStakingTransactions({ limit: 50 });

      if (response.success) {
        setStakingTransactions(
          (response.data.transactions || []).map((tx: any) => ({
            ...tx,
            _id: tx._id || tx.id,
            createdAt: tx.createdAt || tx.created_at,
            submittedAt: tx.submittedAt || tx.created_at || tx.createdAt,
          }))
        );
      }
    } catch (error) {
      console.error("Error fetching staking transactions:", error);
    } finally {
      setIsLoadingStaking(false);
    }
  }, []);

  const handleApprove = async (txId: string, comment = "") => {
    try {
      setProcessingTx(txId);
      // Close modal immediately for responsive UX
      setCommentModal({ open: false, txId: null, action: null });
      setComment("");
      const response = await adminApi.approveTransaction(txId, comment);

      if (response.success) {
        await fetchPendingTransactions();
      } else {
        setError(response.message || "Failed to approve transaction");
        await fetchPendingTransactions();
      }
    } catch (error) {
      console.error("Error approving transaction:", error);
      setError(
        error instanceof Error ? error.message : "Failed to approve transaction"
      );
    } finally {
      setProcessingTx(null);
    }
  };

  const handleReject = async (txId: string, comment: string) => {
    if (!comment.trim()) {
      setError("Comment is required when rejecting a transaction");
      return;
    }

    try {
      setProcessingTx(txId);
      // Close modal immediately for responsive UX
      setCommentModal({ open: false, txId: null, action: null });
      setComment("");
      const response = await adminApi.rejectTransaction(txId, comment);

      if (response.success) {
        await fetchPendingTransactions();
      } else {
        setError(response.message || "Failed to reject transaction");
        await fetchPendingTransactions();
      }
    } catch (error) {
      console.error("Error rejecting transaction:", error);
      setError(
        error instanceof Error ? error.message : "Failed to reject transaction"
      );
      await fetchPendingTransactions();
    } finally {
      setProcessingTx(null);
    }
  };

  const openCommentModal = (txId: string, action: string) => {
    setCommentModal({ open: true, txId, action });
    setComment("");
  };

  const closeCommentModal = () => {
    setCommentModal({ open: false, txId: null, action: null });
    setComment("");
  };

  // Issue handlers
  const fetchIssues = useCallback(async () => {
    try {
      setIsLoadingIssues(true);
      setError(null);
      const { issueApi } = await import("../../lib/api/issues.js");
      const params = issueFilter !== "all" ? { status: issueFilter } : {};
      const response = await issueApi.getAllIssues(params);

      if (response && response.success && response.data) {
        setIssues(
          (response.data.issues || []).map((i: any) => ({
            ...i,
            _id: i._id || i.id,
            createdAt: i.createdAt || i.created_at,
            updatedAt: i.updatedAt || i.updated_at,
          }))
        );
        setIssueStats(response.data.stats || null);
      } else {
        setIssues([]);
        setIssueStats(null);
      }
    } catch (error: any) {
      const errorMsg = error?.message || "Error fetching issues";
      setError(errorMsg);
      setIssues([]);
      setIssueStats(null);

      // Log for debugging
      if (typeof window !== "undefined") {
        window.console.error?.("Error fetching issues:", error);
      }
    } finally {
      setIsLoadingIssues(false);
    }
  }, [issueFilter]);

  const handleResolveIssue = async (issueId: string) => {
    try {
      const { issueApi } = await import("../../lib/api/issues.js");
      const response = await issueApi.resolveIssue(issueId);

      if (response.success) {
        fetchIssues();
      }
    } catch (error) {
      console.error("Error resolving issue:", error);
    }
  };

  const handleRespondToIssue = async (issueId: string, response: string) => {
    if (!response.trim()) return;

    try {
      const { issueApi } = await import("../../lib/api/issues.js");
      const result = await issueApi.respondToIssue(issueId, response);

      if (result.success) {
        setResponseModal({ open: false, issueId: null });
        setAdminResponse("");
        fetchIssues();
      }
    } catch (error) {
      console.error("Error responding to issue:", error);
    }
  };

  const handleUpdateIssueStatus = async (issueId: string, status: string) => {
    try {
      const { issueApi } = await import("../../lib/api/issues.js");
      const response = await issueApi.updateIssueStatus(issueId, status);

      if (response.success) {
        fetchIssues();
      }
    } catch (error) {
      console.error("Error updating issue status:", error);
    }
  };

  // Fetch all users for balance manager
  const fetchAllUsers = useCallback(async () => {
    try {
      const response = await adminApi.getAllUsers({ limit: 100 });
      if (response.success) {
        // Normalize Supabase 'id' -> '_id' so all UI references to user._id work
        setAllUsers(
          (response.data.users || []).map((u: any) => ({
            ...u,
            _id: u._id || u.id,
          }))
        );
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  }, []);

  // Fetch all users with full details for Total Users tab
  const fetchAllUsersDetailed = useCallback(async (search = "") => {
    setAllUsersDetailedLoading(true);
    setAllUsersDetailedError(null);
    try {
      const { supabase: sb } = await import("../../lib/supabase");
      const { data: { session } } = await sb.auth.getSession();
      if (!session?.access_token) {
        setAllUsersDetailedError("Not authenticated");
        return;
      }
      const params = new URLSearchParams({ limit: "100" });
      if (search) params.set("search", search);
      const res = await fetch(`/api/admin/users/all?${params.toString()}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const json = await res.json();
      if (json.success) {
        setAllUsersDetailed(json.data.users || []);
      } else {
        setAllUsersDetailedError(json.message || "Failed to load users");
        setAllUsersDetailed([]);
      }
    } catch (err: any) {
      setAllUsersDetailedError(err.message || "Network error");
      setAllUsersDetailed([]);
    } finally {
      setAllUsersDetailedLoading(false);
    }
  }, []);

  // Handle manual balance adjustment
  const handleBalanceAdjustment = async () => {
    if (!selectedUser || !balanceAmount || !balanceReason.trim()) {
      alert("Please fill in all fields");
      return;
    }

    const amount = parseFloat(balanceAmount);
    if (isNaN(amount) || amount <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    try {
      setIsProcessingBalance(true);
      let response;

      if (balanceAction === "add") {
        response = await adminApi.manualAddBalance(
          selectedUser,
          amount,
          balanceReason
        );
      } else if (balanceAction === "bonus") {
        response = await adminApi.manualAddBonus(
          selectedUser,
          amount,
          balanceReason
        );
      } else {
        response = await adminApi.manualDeductBalance(
          selectedUser,
          amount,
          balanceReason
        );
      }

      if (response.success) {
        const actionVerb =
          balanceAction === "add"
            ? "added"
            : balanceAction === "bonus"
            ? "credited as bonus"
            : "deducted";

        alert(`Balance ${actionVerb} successfully!`);
        // Reset form
        setSelectedUser("");
        setBalanceAmount("");
        setBalanceReason("");
        // Refresh stats
        fetchPendingTransactions();
      } else {
        alert(response.message || "Operation failed");
      }
    } catch (error: any) {
      console.error("Balance adjustment error:", error);
      alert(error.response?.data?.message || "Error adjusting balance");
    } finally {
      setIsProcessingBalance(false);
    }
  };

  // Handle stake cancellation with -10% penalty
  const handleCancelStake = async (stakeId: string | null = null) => {
    if (!cancelStakeModal.user || !cancelStakeReason.trim()) {
      alert("Please provide a reason for cancellation");
      return;
    }

    const targetStakeId = stakeId || cancelStakeModal.selectedStakeId;

    try {
      setIsCancellingStake(true);
      const response = await adminApi.cancelStake(
        cancelStakeModal.user._id,
        cancelStakeReason,
        (targetStakeId || undefined) as any
      );

      if (response.success) {
        const data = response.data.cancellation;
        const stakesCount = data.cancelledStakesCount || 1;
        alert(
          `${stakesCount} stake(s) cancelled successfully!\n\nOriginal Staked: $${data.originalStakedAmount}\nPenalty (10%): $${data.penaltyAmount}\nReturned to Balance: $${data.returnedToBalance}`
        );
        // Reset and close modal
        setCancelStakeModal({ open: false, user: null, selectedStakeId: null });
        setCancelStakeReason("");
        // Refresh staking data
        fetchUsersWithStaking();
        fetchPendingTransactions();
      } else {
        alert(response.message || "Failed to cancel stake");
      }
    } catch (error: any) {
      console.error("Cancel stake error:", error);
      alert(error.response?.data?.message || "Error cancelling stake");
    } finally {
      setIsCancellingStake(false);
    }
  };

  // Fetch deleted transactions
  const fetchDeletedTransactions = useCallback(async () => {
    try {
      setIsLoadingDeleted(true);
      const response = await adminApi.getDeletedTransactions({ limit: 50 });
      if (response.success) {
        setDeletedTransactions(response.data.transactions);
      }
    } catch (error) {
      console.error("Error fetching deleted transactions:", error);
    } finally {
      setIsLoadingDeleted(false);
    }
  }, []);

  // Handle revive transaction
  const handleReviveTransaction = async (transactionId: string) => {
    const reason = prompt(
      "Please provide a reason for reviving this transaction:"
    );
    if (!reason || !reason.trim()) {
      return;
    }

    try {
      const response = await adminApi.reviveTransaction(transactionId, reason);
      if (response.success) {
        alert("Transaction revived successfully!");
        fetchDeletedTransactions();
        fetchPendingTransactions();
      }
    } catch (error: any) {
      console.error("Revive transaction error:", error);
      alert(error.response?.data?.message || "Error reviving transaction");
    }
  };

  // Fetch audit logs
  const fetchAuditLogs = useCallback(async () => {
    try {
      setIsLoadingAuditLogs(true);
      const response = await adminApi.getAuditLogs({ limit: 50 });
      if (response.success) {
        setAuditLogs(
          (response.data.logs || []).map((l: any) => ({
            ...l,
            _id: l._id || l.id,
            createdAt: l.createdAt || l.created_at,
          }))
        );
        setAuditLogStats(response.data.stats);
      }
    } catch (error) {
      console.error("Error fetching audit logs:", error);
    } finally {
      setIsLoadingAuditLogs(false);
    }
  }, []);

  // Global search function
  const handleGlobalSearch = async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setSearchResults(null);
      setShowSearchResults(false);
      return;
    }

    try {
      setIsSearching(true);
      setShowSearchResults(true);
      const response = await adminApi.globalSearch(query);
      if (response.success) {
        setSearchResults(response.data);
      }
    } catch (error) {
      console.error("Error performing global search:", error);
    } finally {
      setIsSearching(false);
    }
  };

  // Debounced search
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (searchQuery.length >= 2) {
        handleGlobalSearch(searchQuery);
      } else {
        setSearchResults(null);
        setShowSearchResults(false);
      }
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  // Fetch referral hierarchy for a user
  const fetchReferralHierarchy = async (userId: string) => {
    if (!userId) {
      setReferralHierarchy(null);
      return;
    }

    try {
      setIsLoadingHierarchy(true);
      const response = await adminApi.getReferralHierarchy(userId);
      if (response.success) {
        setReferralHierarchy(response.data);
        // Auto-expand ALL nodes so L1, L2, L3 are all visible by default
        const allIds = new Set<string>([userId]);
        for (const u of (response.data?.downline?.level1?.users || [])) {
          if (u.id || u._id) allIds.add(u.id || u._id);
        }
        for (const u of (response.data?.downline?.level2?.users || [])) {
          if (u.id || u._id) allIds.add(u.id || u._id);
        }
        setExpandedNodes(allIds);
      }
    } catch (error) {
      console.error("Error fetching referral hierarchy:", error);
    } finally {
      setIsLoadingHierarchy(false);
    }
  };

  // Toggle expanded node in hierarchy tree
  const toggleNodeExpand = (nodeId: string) => {
    setExpandedNodes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  };

  // Fetch sent notifications
  const fetchSentNotifications = useCallback(async () => {
    try {
      setIsLoadingNotifications(true);
      const response = await adminApi.getAllNotifications({ limit: 50 });
      if (response.success) {
        setSentNotifications(
          (response.data.notifications || []).map((n: any) => ({
            ...n,
            _id: n._id || n.id,
            createdAt: n.createdAt || n.created_at,
            isBroadcast: n.isBroadcast ?? n.is_broadcast,
          }))
        );
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setIsLoadingNotifications(false);
    }
  }, []);

  // Send notification handler
  const handleSendNotification = async () => {
    if (!notificationTitle.trim() || !notificationMessage.trim()) {
      alert("Please enter both title and message");
      return;
    }

    try {
      setIsSendingNotification(true);
      const response = await adminApi.sendNotification({
        title: notificationTitle,
        message: notificationMessage,
        userId: notificationUserId === "all" ? undefined : notificationUserId,
        type: notificationType,
      });

      if (response.success) {
        alert(response.message || "Notification sent successfully!");
        setNotificationTitle("");
        setNotificationMessage("");
        setNotificationUserId("all");
        setNotificationType("announcement");
        fetchSentNotifications();
      }
    } catch (error: any) {
      alert(error.message || "Failed to send notification");
    } finally {
      setIsSendingNotification(false);
    }
  };

  // Delete user handler
  const handleDeleteUser = async () => {
    if (!deleteUserModal.userId || deleteConfirmText !== "DELETE") {
      return;
    }

    try {
      setIsDeletingUser(true);
      const response = await adminApi.deleteUser(
        deleteUserModal.userId,
        deleteReason
      );

      if (response.success) {
        alert("User deleted successfully!");
        setDeleteUserModal({ open: false, userId: null, userName: null });
        setDeleteConfirmText("");
        setDeleteReason("");
        fetchUsersWithStaking();
        fetchAllUsers();
      }
    } catch (error: any) {
      alert(error.message || "Failed to delete user");
    } finally {
      setIsDeletingUser(false);
    }
  };

  // Payout handlers
  const fetchEligibleUsers = async () => {
    try {
      setIsLoadingPayouts(true);
      const response = await adminApi.getPayoutEligibleUsers();
      if (response.success) {
        setEligibleUsers(response.data.users);
        setPayoutSummary(response.data.summary);
      }
    } catch (error: any) {
      console.error("Error fetching eligible users:", error);
      alert(error.message || "Failed to fetch eligible users");
    } finally {
      setIsLoadingPayouts(false);
    }
  };

  const fetchPayoutHistory = async () => {
    try {
      const response = await adminApi.getPayoutHistory({ limit: 50 });
      if (response.success) {
        setPayoutHistory(response.data.payouts);
      }
    } catch (error: any) {
      console.error("Error fetching payout history:", error);
    }
  };

  const handleDistributePayouts = async () => {
    if (!payoutPercentage || parseFloat(payoutPercentage) <= 0 || parseFloat(payoutPercentage) > 100) {
      alert("Please enter a valid percentage between 0.01 and 100");
      return;
    }

    const eligibleUserIds = eligibleUsers.filter(u => u.selectable).map(u => u.userId);
    const targetUserIds = selectedPayoutUsers.length > 0 ? selectedPayoutUsers : eligibleUserIds;
    
    if (targetUserIds.length === 0) {
      alert("No eligible users selected for payout");
      return;
    }

    const confirm = window.confirm(
      `Distribute ${payoutPercentage}% payout to ${targetUserIds.length} user(s)?\n\nThis action cannot be undone.`
    );

    if (!confirm) return;

    try {
      setIsDistributingPayouts(true);
      const response = await adminApi.distributePayouts(
        parseFloat(payoutPercentage),
        (targetUserIds.length > 0 ? targetUserIds : undefined) as any
      );

      if (response.success) {
        alert(
          ` Payout distributed successfully!\n\n` +
          `- Users processed: ${response.data.usersProcessed}\n` +
          `- Total distributed: $${response.data.totalDistributed.toFixed(4)}\n` +
          `- Percentage: ${response.data.percentage}%`
        );
        
        // Reset form and refresh data
        setPayoutPercentage("");
        setSelectedPayoutUsers([]);
        fetchEligibleUsers();
        fetchPayoutHistory();
        fetchPendingTransactions(); // Refresh stats
      } else {
        alert(response.message || "Payout distribution failed");
      }
    } catch (error: any) {
      console.error("Error distributing payouts:", error);
      alert(error.message || "Failed to distribute payouts");
    } finally {
      setIsDistributingPayouts(false);
    }
  };

  const handleSelectAllEligible = () => {
    const eligibleUserIds = eligibleUsers.filter(u => u.selectable).map(u => u.userId);
    setSelectedPayoutUsers(prev => 
      prev.length === eligibleUserIds.length ? [] : eligibleUserIds
    );
  };

  const handleToggleUserSelection = (userId: string) => {
    setSelectedPayoutUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  useEffect(() => {
    if (user && user.role === "admin") {
      fetchPendingTransactions();
      fetchUsersWithStaking();
      fetchStakingTransactions();
      if (activeTab === "issues") {
        fetchIssues();
      }
      if (activeTab === "balance-manager") {
        fetchAllUsers();
      }
      if (activeTab === "deleted-transactions") {
        fetchDeletedTransactions();
      }
      if (activeTab === "audit-logs") {
        fetchAuditLogs();
      }
      if (activeTab === "referral-hierarchy") {
        fetchAllUsers();
      }
      if (activeTab === "notifications") {
        fetchAllUsers();
        fetchSentNotifications();
      }
      if (activeTab === "payouts") {
        fetchEligibleUsers();
        fetchPayoutHistory();
      }
    }
  }, [
    user,
    fetchPendingTransactions,
    fetchUsersWithStaking,
    fetchStakingTransactions,
    activeTab,
    fetchIssues,
    fetchAllUsers,
    fetchDeletedTransactions,
    fetchAuditLogs,
    fetchSentNotifications,
  ]);

  // Fetch issues when filter changes
  useEffect(() => {
    if (user && user.role === "admin" && activeTab === "issues") {
      fetchIssues();
    }
  }, [issueFilter, user, activeTab, fetchIssues]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (user && user.role === "admin") {
      const interval = setInterval(() => {
        fetchPendingTransactions();
        fetchUsersWithStaking();
        fetchStakingTransactions();
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [
    user,
    fetchPendingTransactions,
    fetchUsersWithStaking,
    fetchStakingTransactions,
  ]);

  // Close custom dropdowns when clicking outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (!t.closest("[data-notif-send-to]"))  setShowSendToDropdown(false);
      if (!t.closest("[data-notif-type]"))      setShowTypeDropdown(false);
      // Close the data-dropdown panels for hierarchy/balance pickers
      if (!t.closest("[data-hierarchy-user-select]")) {
        const el = document.querySelector("[data-hierarchy-user-select] [data-dropdown]") as HTMLElement;
        if (el) el.style.display = "none";
      }
      if (!t.closest("[data-balance-user-select]")) {
        const el = document.querySelector("[data-balance-user-select] [data-dropdown]") as HTMLElement;
        if (el) el.style.display = "none";
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-cream-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
      </div>
    );
  }

  if (user.role !== "admin") {
    return (
      <div className="min-h-screen bg-cream-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-stone-900 mb-4">Access Denied</h1>
          <p className="text-stone-900/60">
            You need admin privileges to access this page.
          </p>
        </div>
      </div>
    );
  }

  // ── Filtered data for each tab ──────────────────────────────────────────
  const filteredPendingTx = pendingTransactions.filter((tx: any) => {
    if (!pendingSearch) return true;
    const q = pendingSearch.toLowerCase();
    return tx.userId?.name?.toLowerCase().includes(q) ||
           tx.userId?.email?.toLowerCase().includes(q) ||
           tx.type?.toLowerCase().includes(q);
  });
  const filteredStakingActivity = stakingTransactions.filter((tx: any) => {
    if (!stakingActivitySearch) return true;
    const q = stakingActivitySearch.toLowerCase();
    return tx.userId?.name?.toLowerCase().includes(q) ||
           tx.userId?.email?.toLowerCase().includes(q) ||
           tx.type?.toLowerCase().includes(q);
  });
  const filteredUserStaking = users.filter((u: any) => {
    if (!userStakingSearch) return true;
    const q = userStakingSearch.toLowerCase();
    return u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
  });
  const filteredIssues = issues.filter((i: any) => {
    if (!issuesSearch) return true;
    const q = issuesSearch.toLowerCase();
    return i.subject?.toLowerCase().includes(q) ||
           i.userId?.email?.toLowerCase().includes(q) ||
           i.userId?.name?.toLowerCase().includes(q);
  });
  const filteredAuditLogs = auditLogs.filter((l: any) => {
    if (!auditLogsSearch) return true;
    const q = auditLogsSearch.toLowerCase();
    return l.adminEmail?.toLowerCase().includes(q) ||
           l.targetUserEmail?.toLowerCase().includes(q) ||
           l.action?.toLowerCase().includes(q);
  });
  const filteredDeletedTx = deletedTransactions.filter((tx: any) => {
    if (!deletedTxSearch) return true;
    const q = deletedTxSearch.toLowerCase();
    return tx.userId?.name?.toLowerCase().includes(q) ||
           tx.userId?.email?.toLowerCase().includes(q) ||
           tx.type?.toLowerCase().includes(q);
  });
  const filteredPayoutUsers = eligibleUsers.filter((u: any) => {
    if (!payoutsSearch) return true;
    const q = payoutsSearch.toLowerCase();
    return u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
  });

  return (
    <div className="min-h-screen bg-cream-50">
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Header */}
        <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:items-center justify-between mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 mb-2">
              Admin Panel
            </h1>
            <p className="text-stone-900/60 text-sm sm:text-base">
              Manage pending transactions and user staking
            </p>
          </div>

          <div className="flex items-center space-x-3 sm:space-x-4">
            {/* Admin Profile */}
            <div className="flex items-center space-x-3 px-3 sm:px-4 py-2 bg-cream-100/80 rounded-xl border border-stone-300/40">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-400 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-stone-900" />
              </div>
              <div className="hidden sm:block">
                <p className="text-stone-900 font-medium text-sm">
                  {user?.name || "Admin"}
                </p>
                <p className="text-stone-900/60 text-xs">Administrator</p>
              </div>
            </div>

            <button
              onClick={() => {
                fetchPendingTransactions();
                fetchUsersWithStaking();
                fetchStakingTransactions();
              }}
              className="flex items-center space-x-2 px-3 sm:px-4 py-2 bg-emerald-500/20 text-emerald-400 rounded-xl hover:bg-emerald-500/30 transition-colors text-sm"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </button>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 px-3 sm:px-4 py-2 bg-red-500/20 text-red-400 rounded-xl hover:bg-red-500/30 transition-colors text-sm"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 mb-6 sm:mb-8 bg-cream-100/80 rounded-xl p-1 overflow-x-auto">
          <button
            onClick={() => setActiveTab("transactions")}
            className={`flex-shrink-0 px-4 py-3 rounded-lg font-medium transition-all duration-300 ${
              activeTab === "transactions"
                ? "bg-emerald-500 text-black shadow-lg"
                : "text-stone-900/70 hover:text-stone-900 hover:bg-cream-200/60"
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <Clock className="w-4 h-4" />
              <span>Pending</span>
              {pendingTransactions.length > 0 && (
                <span className="bg-red-500 text-stone-900 text-xs px-2 py-1 rounded-full">
                  {pendingTransactions.length}
                </span>
              )}
            </div>
          </button>

          <button
            onClick={() => setActiveTab("staking-activity")}
            className={`flex-shrink-0 px-4 py-3 rounded-lg font-medium transition-all duration-300 ${
              activeTab === "staking-activity"
                ? "bg-emerald-500 text-black shadow-lg"
                : "text-stone-900/70 hover:text-stone-900 hover:bg-cream-200/60"
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <TrendingUp className="w-4 h-4" />
              <span>Staking Activity</span>
              {stakingTransactions.length > 0 && (
                <span className="bg-blue-500 text-stone-900 text-xs px-2 py-1 rounded-full">
                  {stakingTransactions.length}
                </span>
              )}
            </div>
          </button>

          <button
            onClick={() => setActiveTab("staking")}
            className={`flex-shrink-0 px-4 py-3 rounded-lg font-medium transition-all duration-300 ${
              activeTab === "staking"
                ? "bg-emerald-500 text-black shadow-lg"
                : "text-stone-900/70 hover:text-stone-900 hover:bg-cream-200/60"
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <Users className="w-4 h-4" />
              <span>User Staking</span>
              {users.length > 0 && (
                <span className="bg-purple-500 text-stone-900 text-xs px-2 py-1 rounded-full">
                  {users.length}
                </span>
              )}
            </div>
          </button>

          <button
            onClick={() => setActiveTab("issues")}
            className={`flex-shrink-0 px-4 py-3 rounded-lg font-medium transition-all duration-300 ${
              activeTab === "issues"
                ? "bg-emerald-500 text-black shadow-lg"
                : "text-stone-900/70 hover:text-stone-900 hover:bg-cream-200/60"
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <MessageSquare className="w-4 h-4" />
              <span>Issues</span>
            </div>
          </button>

          <button
            onClick={() => setActiveTab("balance-manager")}
            className={`flex-shrink-0 px-4 py-3 rounded-lg font-medium transition-all duration-300 ${
              activeTab === "balance-manager"
                ? "bg-emerald-500 text-black shadow-lg"
                : "text-stone-900/70 hover:text-stone-900 hover:bg-cream-200/60"
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <Wallet className="w-4 h-4" />
              <span>Balance Manager</span>
            </div>
          </button>

          <button
            onClick={() => setActiveTab("deleted-transactions")}
            className={`flex-shrink-0 px-4 py-3 rounded-lg font-medium transition-all duration-300 ${
              activeTab === "deleted-transactions"
                ? "bg-emerald-500 text-black shadow-lg"
                : "text-stone-900/70 hover:text-stone-900 hover:bg-cream-200/60"
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <RefreshCw className="w-4 h-4" />
              <span>Deleted Txns</span>
            </div>
          </button>

          <button
            onClick={() => setActiveTab("audit-logs")}
            className={`flex-shrink-0 px-4 py-3 rounded-lg font-medium transition-all duration-300 ${
              activeTab === "audit-logs"
                ? "bg-emerald-500 text-black shadow-lg"
                : "text-stone-900/70 hover:text-stone-900 hover:bg-cream-200/60"
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <Calendar className="w-4 h-4" />
              <span>Audit Logs</span>
            </div>
          </button>

          <button
            onClick={() => setActiveTab("referral-hierarchy")}
            className={`flex-shrink-0 px-4 py-3 rounded-lg font-medium transition-all duration-300 ${
              activeTab === "referral-hierarchy"
                ? "bg-emerald-500 text-black shadow-lg"
                : "text-stone-900/70 hover:text-stone-900 hover:bg-cream-200/60"
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <Network className="w-4 h-4" />
              <span>Referral Tree</span>
            </div>
          </button>

          <button
            onClick={() => setActiveTab("notifications")}
            className={`flex-shrink-0 px-4 py-3 rounded-lg font-medium transition-all duration-300 ${
              activeTab === "notifications"
                ? "bg-emerald-500 text-black shadow-lg"
                : "text-stone-900/70 hover:text-stone-900 hover:bg-cream-200/60"
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <MessageSquare className="w-4 h-4" />
              <span>Push Notifications</span>
            </div>
          </button>

          <button
            onClick={() => setActiveTab("payouts")}
            className={`flex-shrink-0 px-4 py-3 rounded-lg font-medium transition-all duration-300 ${
              activeTab === "payouts"
                ? "bg-emerald-500 text-black shadow-lg"
                : "text-stone-900/70 hover:text-stone-900 hover:bg-cream-200/60"
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <Gift className="w-4 h-4" />
              <span>30-Day Payouts</span>
            </div>
          </button>

          <button
            onClick={() => { setActiveTab("total-users"); fetchAllUsersDetailed(); }}
            className={`flex-shrink-0 px-4 py-3 rounded-lg font-medium transition-all duration-300 ${
              activeTab === "total-users"
                ? "bg-emerald-500 text-black shadow-lg"
                : "text-stone-900/70 hover:text-stone-900 hover:bg-cream-200/60"
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <Users className="w-4 h-4" />
              <span>Total Users</span>
            </div>
          </button>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6 mb-6 sm:mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-r from-emerald-500/20 to-green-400/20  border border-emerald-500/30 rounded-xl sm:rounded-2xl p-4 sm:p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-emerald-400 text-xs sm:text-sm font-medium">
                    Pending Deposits
                  </p>
                  <p className="text-lg sm:text-2xl font-bold text-stone-900">
                    {stats.transactions?.pendingDeposits || 0}
                  </p>
                </div>
                <ArrowUpRight className="w-6 h-6 sm:w-8 sm:h-8 text-emerald-400" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-r from-red-500/20 to-orange-400/20  border border-red-500/30 rounded-xl sm:rounded-2xl p-4 sm:p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-400 text-xs sm:text-sm font-medium">
                    Pending Withdrawals
                  </p>
                  <p className="text-lg sm:text-2xl font-bold text-stone-900">
                    {stats.transactions?.pendingWithdrawals || 0}
                  </p>
                </div>
                <ArrowDownLeft className="w-6 h-6 sm:w-8 sm:h-8 text-red-400" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-r from-blue-500/20 to-cyan-400/20  border border-blue-500/30 rounded-xl sm:rounded-2xl p-4 sm:p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-400 text-xs sm:text-sm font-medium">
                    Total Users
                  </p>
                  <p className="text-lg sm:text-2xl font-bold text-stone-900">
                    {stats.users?.total || 0}
                  </p>
                </div>
                <Users className="w-6 h-6 sm:w-8 sm:h-8 text-blue-400" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-gradient-to-r from-purple-500/20 to-pink-400/20  border border-purple-500/30 rounded-xl sm:rounded-2xl p-4 sm:p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-400 text-xs sm:text-sm font-medium">
                    Total Staked
                  </p>
                  <p className="text-lg sm:text-2xl font-bold text-stone-900">
                    ${(stats.wallets?.totalStaked || 0).toLocaleString()}
                  </p>
                  <p className="text-purple-300 text-xs">
                    {users.length} users staking
                  </p>
                </div>
                <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-purple-400" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-gradient-to-r from-yellow-500/20 to-orange-400/20  border border-yellow-500/30 rounded-xl sm:rounded-2xl p-4 sm:p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-400 text-xs sm:text-sm font-medium">
                    Total Balance
                  </p>
                  <p className="text-lg sm:text-2xl font-bold text-stone-900">
                    ${(stats.wallets?.totalBalance || 0).toLocaleString()}
                  </p>
                  <p className="text-yellow-300 text-xs">Platform liquidity</p>
                </div>
                <Wallet className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-400" />
              </div>
            </motion.div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-xl text-red-400"
          >
            {error}
          </motion.div>
        )}

        {/* Tab Content */}
        {activeTab === "transactions" && (
          <>
            {/* Filters */}
            <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:items-center sm:space-x-4 mb-6">
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-stone-900/60" />
                <span className="text-stone-900/60 text-sm">Filter:</span>
              </div>

              <div className="flex flex-wrap gap-2">
                {["all", "deposit", "withdrawal"].map((filterOption) => (
                  <button
                    key={filterOption}
                    onClick={() => setFilter(filterOption)}
                    className={`px-3 sm:px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                      filter === filterOption
                        ? "bg-emerald-500 text-black"
                        : "bg-cream-200/60 text-stone-900/70 hover:bg-cream-300/60"
                    }`}
                  >
                    {filterOption.charAt(0).toUpperCase() +
                      filterOption.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Transactions Table */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-cream-100/80  border border-stone-300/50 rounded-xl sm:rounded-2xl overflow-hidden"
            >
              <div className="p-4 sm:p-6 border-b border-stone-300/40">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <h2 className="text-lg sm:text-xl font-bold text-stone-900">
                    Pending Transactions
                  </h2>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                    <input
                      type="text"
                      value={pendingSearch}
                      onChange={(e) => setPendingSearch(e.target.value)}
                      placeholder="Search by name or email..."
                      className="pl-9 pr-4 py-2 bg-cream-200/60 border border-stone-300/50 rounded-xl text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 w-full sm:w-64"
                    />
                  </div>
                </div>
              </div>

              {isLoading ? (
                <div className="p-8 sm:p-12 text-center">
                  <Loader2 className="w-8 h-8 text-emerald-400 animate-spin mx-auto mb-4" />
                  <p className="text-stone-900/60 text-sm sm:text-base">
                    Loading transactions...
                  </p>
                </div>
              ) : pendingTransactions.length === 0 ? (
                <div className="p-8 sm:p-12 text-center">
                  <Clock className="w-10 h-10 sm:w-12 sm:h-12 text-stone-900/40 mx-auto mb-4" />
                  <p className="text-stone-900/60 text-sm sm:text-base">
                    No pending transactions found
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[900px]">
                    <thead className="bg-cream-100/80">
                      <tr>
                        <th className="text-left p-3 sm:p-4 text-stone-900/80 font-medium text-sm">
                          User
                        </th>
                        <th className="text-left p-3 sm:p-4 text-stone-900/80 font-medium text-sm">
                          Type
                        </th>
                        <th className="text-left p-3 sm:p-4 text-stone-900/80 font-medium text-sm">
                          Amount
                        </th>
                        <th className="text-left p-3 sm:p-4 text-stone-900/80 font-medium text-sm">
                          Address
                        </th>
                        <th className="text-left p-3 sm:p-4 text-stone-900/80 font-medium text-sm">
                          Date
                        </th>
                        <th className="text-left p-3 sm:p-4 text-stone-900/80 font-medium text-sm">
                          Status
                        </th>
                        <th className="text-left p-3 sm:p-4 text-stone-900/80 font-medium text-sm">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPendingTx.map((tx, index) => (
                        <motion.tr
                          key={tx._id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="border-b border-stone-300/40 hover:bg-cream-100/80 transition-colors"
                        >
                          <td className="p-3 sm:p-4">
                            <div>
                              <p className="text-stone-900 font-medium text-sm sm:text-base">
                                {tx.userId?.name}
                              </p>
                              <p className="text-stone-900/60 text-xs sm:text-sm">
                                {tx.userId?.email}
                              </p>
                            </div>
                          </td>
                          <td className="p-3 sm:p-4">
                            <div className="flex items-center space-x-2">
                              {tx.type === "deposit" ? (
                                <ArrowUpRight className="w-4 h-4 text-emerald-400" />
                              ) : (
                                <ArrowDownLeft className="w-4 h-4 text-red-400" />
                              )}
                              <span
                                className={`capitalize text-sm sm:text-base ${
                                  tx.type === "deposit"
                                    ? "text-emerald-400"
                                    : "text-red-400"
                                }`}
                              >
                                {tx.type}
                              </span>
                            </div>
                          </td>
                          <td className="p-3 sm:p-4">
                            <div>
                              <p className="text-stone-900 font-bold text-sm sm:text-base">
                                {tx.amount.toLocaleString()} {tx.currency}
                              </p>
                              {tx.fee?.amount && tx.fee.amount > 0 && (
                                <p className="text-stone-900/60 text-xs">
                                  Fee: {tx.fee.amount} {tx.currency}
                                </p>
                              )}
                            </div>
                          </td>
                          <td className="p-3 sm:p-4">
                            <div>
                              {tx.type === "withdrawal" && tx.toAddress ? (
                                <div className="space-y-1">
                                  <p className="text-stone-900/60 text-xs">
                                    Withdrawal Address:
                                  </p>
                                  <p className="text-stone-900 text-xs font-mono break-all">
                                    {tx.toAddress}
                                  </p>
                                  {tx.network && (
                                    <p className="text-emerald-400 text-xs">
                                      Network: {tx.network}
                                    </p>
                                  )}
                                </div>
                              ) : tx.type === "deposit" ? (
                                <div className="space-y-2">
                                  {tx.fromAddress && (
                                    <div className="space-y-1">
                                      <p className="text-stone-900/60 text-xs">
                                        From Address:
                                      </p>
                                      <p className="text-stone-900 text-xs font-mono break-all">
                                        {tx.fromAddress}
                                      </p>
                                    </div>
                                  )}
                                  {tx.network && (
                                    <p className="text-cyan-400 text-xs">
                                      Network: {tx.network}
                                    </p>
                                  )}
                                  {tx.userTransactionId && (
                                    <div className="space-y-1 mt-2 pt-2 border-t border-stone-300/40">
                                      <p className="text-emerald-400 text-xs font-semibold">
                                        User Transaction ID:
                                      </p>
                                      <p className="text-emerald-300 text-xs font-mono break-all bg-emerald-500/10 p-1.5 rounded">
                                        {tx.userTransactionId}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span className="text-stone-900/40 text-xs">
                                  N/A
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-3 sm:p-4">
                            <div className="text-stone-900/80">
                              <p className="text-sm">
                                {formatDate(tx.submittedAt)}
                              </p>
                              <p className="text-xs text-stone-900/60">
                                {formatTime(tx.submittedAt)}
                              </p>
                            </div>
                          </td>
                          <td className="p-3 sm:p-4">
                            <span className="px-2 sm:px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-xs sm:text-sm font-medium flex items-center space-x-1 w-fit">
                              <Clock className="w-3 h-3" />
                              <span>Pending</span>
                            </span>
                          </td>
                          <td className="p-3 sm:p-4">
                            <div className="flex items-center space-x-1 sm:space-x-2">
                              <button
                                onClick={() => handleApprove(tx._id)}
                                disabled={processingTx === tx._id}
                                className="p-1.5 sm:p-2 bg-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500/30 transition-colors disabled:opacity-50"
                                title="Quick Approve"
                              >
                                {processingTx === tx._id ? (
                                  <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
                                ) : (
                                  <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                                )}
                              </button>

                              <button
                                onClick={() =>
                                  openCommentModal(tx._id, "approve")
                                }
                                disabled={processingTx === tx._id}
                                className="p-1.5 sm:p-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors disabled:opacity-50"
                                title="Approve with Comment"
                              >
                                <MessageSquare className="w-3 h-3 sm:w-4 sm:h-4" />
                              </button>

                              <button
                                onClick={() =>
                                  openCommentModal(tx._id, "reject")
                                }
                                disabled={processingTx === tx._id}
                                className="p-1.5 sm:p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors disabled:opacity-50"
                                title="Reject"
                              >
                                <XCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.div>
          </>
        )}

        {/* Staking Activity Tab */}
        {activeTab === "staking-activity" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-cream-100/80  border border-stone-300/50 rounded-xl sm:rounded-2xl overflow-hidden"
          >
            <div className="p-4 sm:p-6 border-b border-stone-300/40">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-stone-900">Staking Activity</h2>
                  <p className="text-stone-900/60 text-sm mt-1">All stake and unstake transactions</p>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                  <input type="text" value={stakingActivitySearch} onChange={(e) => setStakingActivitySearch(e.target.value)}
                    placeholder="Search by name, email, type..." className="pl-9 pr-4 py-2 bg-cream-200/60 border border-stone-300/50 rounded-xl text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 w-full sm:w-64" />
                </div>
              </div>
            </div>

            {isLoadingStaking ? (
              <div className="p-8 sm:p-12 text-center">
                <Loader2 className="w-8 h-8 text-blue-400 animate-spin mx-auto mb-4" />
                <p className="text-stone-900/60 text-sm sm:text-base">
                  Loading staking activity...
                </p>
              </div>
            ) : stakingTransactions.length === 0 ? (
              <div className="p-8 sm:p-12 text-center">
                <TrendingUp className="w-10 h-10 sm:w-12 sm:h-12 text-stone-900/40 mx-auto mb-4" />
                <p className="text-stone-900/60 text-sm sm:text-base">
                  No staking activity found
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px]">
                  <thead className="bg-cream-100/80">
                    <tr>
                      <th className="text-left p-3 sm:p-4 text-stone-900/80 font-medium text-sm">
                        User
                      </th>
                      <th className="text-left p-3 sm:p-4 text-stone-900/80 font-medium text-sm">
                        Type
                      </th>
                      <th className="text-left p-3 sm:p-4 text-stone-900/80 font-medium text-sm">
                        Amount
                      </th>
                      <th className="text-left p-3 sm:p-4 text-stone-900/80 font-medium text-sm">
                        Date & Time
                      </th>
                      <th className="text-left p-3 sm:p-4 text-stone-900/80 font-medium text-sm">
                        Status
                      </th>
                      <th className="text-left p-3 sm:p-4 text-stone-900/80 font-medium text-sm">
                        Description
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStakingActivity.map((tx, index) => (
                      <motion.tr
                        key={tx._id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="border-b border-stone-300/40 hover:bg-cream-100/80 transition-colors"
                      >
                        <td className="p-3 sm:p-4">
                          <div>
                            <p className="text-stone-900 font-medium text-sm sm:text-base">
                              {tx.userId?.name}
                            </p>
                            <p className="text-stone-900/60 text-xs sm:text-sm">
                              {tx.userId?.email}
                            </p>
                          </div>
                        </td>
                        <td className="p-3 sm:p-4">
                          <div className="flex items-center space-x-2">
                            {tx.type === "stake" ? (
                              <>
                                <ArrowUpRight className="w-4 h-4 text-blue-400" />
                                <span className="text-blue-400 font-medium capitalize">
                                  {tx.type}
                                </span>
                              </>
                            ) : tx.type === "unstake" ? (
                              <>
                                <ArrowDownLeft className="w-4 h-4 text-orange-400" />
                                <span className="text-orange-400 font-medium capitalize">
                                  {tx.type}
                                </span>
                              </>
                            ) : (
                              <>
                                <TrendingUp className="w-4 h-4 text-emerald-400" />
                                <span className="text-emerald-400 font-medium capitalize">
                                  {tx.type}
                                </span>
                              </>
                            )}
                          </div>
                        </td>
                        <td className="p-3 sm:p-4">
                          <span
                            className={`font-bold text-sm sm:text-base ${
                              tx.type === "stake"
                                ? "text-blue-400"
                                : tx.type === "unstake"
                                ? "text-orange-400"
                                : "text-emerald-400"
                            }`}
                          >
                            ${tx.amount?.toLocaleString()} {tx.currency}
                          </span>
                        </td>
                        <td className="p-3 sm:p-4">
                          <div>
                            <p className="text-stone-900 text-sm">
                              {formatDate(tx.createdAt)}
                            </p>
                            <p className="text-stone-900/60 text-xs">
                              {formatTime(tx.createdAt)}
                            </p>
                          </div>
                        </td>
                        <td className="p-3 sm:p-4">
                          <div className="flex items-center space-x-2">
                            <CheckCircle className="w-4 h-4 text-emerald-400" />
                            <span className="text-emerald-400 text-sm">
                              Completed
                            </span>
                          </div>
                        </td>
                        <td className="p-3 sm:p-4">
                          <p className="text-stone-900/80 text-sm">
                            {tx.description}
                          </p>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        )}

        {/* User Staking Tab */}
        {activeTab === "staking" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-cream-100/80  border border-stone-300/50 rounded-xl sm:rounded-2xl overflow-hidden"
          >
            <div className="p-4 sm:p-6 border-b border-stone-300/40">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <h2 className="text-lg sm:text-xl font-bold text-stone-900">
                  User Staking Overview
                </h2>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                    <input type="text" value={userStakingSearch} onChange={(e) => setUserStakingSearch(e.target.value)}
                      placeholder="Search user..." className="pl-9 pr-4 py-2 bg-cream-200/60 border border-stone-300/50 rounded-xl text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 w-52" />
                  </div>
                  <span className="text-stone-900/60 text-sm">
                    Total Staked:{" "}
                    <span className="text-emerald-400 font-bold">
                      ${(stats?.wallets?.totalStaked || 0).toLocaleString()}
                    </span>
                  </span>
                </div>
              </div>
            </div>

            {isLoadingUsers ? (
              <div className="p-8 sm:p-12 text-center">
                <Loader2 className="w-8 h-8 text-blue-400 animate-spin mx-auto mb-4" />
                <p className="text-stone-900/60 text-sm sm:text-base">
                  Loading user staking data...
                </p>
              </div>
            ) : users.length === 0 ? (
              <div className="p-8 sm:p-12 text-center">
                <TrendingUp className="w-10 h-10 sm:w-12 sm:h-12 text-stone-900/40 mx-auto mb-4" />
                <p className="text-stone-900/60 text-sm sm:text-base">
                  No users are currently staking
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1000px]">
                  <thead className="bg-cream-100/80">
                    <tr>
                      <th className="text-left p-3 sm:p-4 text-stone-900/80 font-medium text-sm">
                        User
                      </th>
                      <th className="text-left p-3 sm:p-4 text-stone-900/80 font-medium text-sm">
                        Staked Amount
                      </th>
                      <th className="text-left p-3 sm:p-4 text-stone-900/80 font-medium text-sm">
                        Staking Date
                      </th>
                      <th className="text-left p-3 sm:p-4 text-stone-900/80 font-medium text-sm">
                        Last Update
                      </th>
                      <th className="text-left p-3 sm:p-4 text-stone-900/80 font-medium text-sm">
                        Total Balance
                      </th>
                      <th className="text-left p-3 sm:p-4 text-stone-900/80 font-medium text-sm">
                        Available
                      </th>
                      <th className="text-left p-3 sm:p-4 text-stone-900/80 font-medium text-sm">
                        Total Earnings
                      </th>
                      <th className="text-left p-3 sm:p-4 text-stone-900/80 font-medium text-sm">
                        Staking %
                      </th>
                      <th className="text-left p-3 sm:p-4 text-stone-900/80 font-medium text-sm">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUserStaking.map((user, index) => (
                      <motion.tr
                        key={user._id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="border-b border-stone-300/40 hover:bg-cream-100/80 transition-colors"
                      >
                        <td className="p-3 sm:p-4">
                          <div>
                            <p className="text-stone-900 font-medium text-sm sm:text-base">
                              {user.name}
                            </p>
                            <p className="text-stone-900/60 text-xs sm:text-sm">
                              {user.email}
                            </p>
                          </div>
                        </td>
                        <td className="p-3 sm:p-4">
                          <div className="flex items-center space-x-2">
                            <TrendingUp className="w-4 h-4 text-blue-400" />
                            <span className="text-blue-400 font-bold">
                              $
                              {user.wallet?.stakedAmount?.toLocaleString() ||
                                "0"}
                            </span>
                          </div>
                        </td>
                        <td className="p-3 sm:p-4">
                          <div>
                            {user.wallet?.stakingStartDate ? (
                              <div className="flex items-start space-x-2">
                                <Calendar className="w-4 h-4 text-blue-400 mt-0.5" />
                                <div>
                                  <p className="text-stone-900 text-sm">
                                    {new Date(
                                      user.wallet.stakingStartDate
                                    ).toLocaleDateString()}
                                  </p>
                                  <p className="text-stone-900/60 text-xs">
                                    {new Date(
                                      user.wallet.stakingStartDate
                                    ).toLocaleTimeString()}
                                  </p>
                                </div>
                              </div>
                            ) : (
                              <span className="text-stone-900/40 text-sm">
                                Not staked
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-3 sm:p-4">
                          <div>
                            {user.wallet?.lastStakingUpdate ? (
                              <div className="flex items-start space-x-2">
                                <Clock className="w-4 h-4 text-orange-400 mt-0.5" />
                                <div>
                                  <p className="text-stone-900/80 text-sm">
                                    {new Date(
                                      user.wallet.lastStakingUpdate
                                    ).toLocaleDateString()}
                                  </p>
                                  <p className="text-stone-900/60 text-xs">
                                    {new Date(
                                      user.wallet.lastStakingUpdate
                                    ).toLocaleTimeString()}
                                  </p>
                                </div>
                              </div>
                            ) : (
                              <span className="text-stone-900/40 text-sm">
                                No updates
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-3 sm:p-4">
                          <div className="flex items-center space-x-2">
                            <Wallet className="w-4 h-4 text-emerald-400" />
                            <span className="text-stone-900 font-bold">
                              ${user.wallet?.balance?.toLocaleString() || "0"}
                            </span>
                          </div>
                        </td>
                        <td className="p-3 sm:p-4">
                          <span className="text-stone-900">
                            $
                            {user.wallet?.availableBalance?.toLocaleString() ||
                              "0"}
                          </span>
                        </td>
                        <td className="p-3 sm:p-4">
                          <span className="text-emerald-400 font-medium">
                            $
                            {user.wallet?.totalEarnings?.toLocaleString() ||
                              "0"}
                          </span>
                        </td>
                        <td className="p-3 sm:p-4">
                          <div className="flex items-center space-x-2">
                            <div className="w-16 bg-cream-300/60 rounded-full h-2">
                              <div
                                className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                                style={{
                                  width: `${Math.min(
                                    100,
                                    (user.wallet?.stakedAmount /
                                      user.wallet?.balance) *
                                      100
                                  )}%`,
                                }}
                              />
                            </div>
                            <span className="text-stone-900/70 text-sm">
                              {Math.round(
                                (user.wallet?.stakedAmount /
                                  user.wallet?.balance) *
                                  100
                              ) || 0}
                              %
                            </span>
                          </div>
                        </td>
                        <td className="p-3 sm:p-4">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() =>
                                setCancelStakeModal({
                                  open: true,
                                  user,
                                  selectedStakeId: null,
                                })
                              }
                              className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-sm font-medium transition-colors border border-red-500/30"
                            >
                              Cancel Stake
                            </button>
                            <button
                              onClick={() =>
                                setDeleteUserModal({
                                  open: true,
                                  userId: user._id,
                                  userName: user.name,
                                })
                              }
                              className="p-2 bg-red-600/20 hover:bg-red-600/40 text-red-500 rounded-lg transition-colors border border-red-600/30"
                              title="Delete User"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        )}

        {/* Issues Tab */}
        {activeTab === "issues" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-cream-100/80  border border-stone-300/50 rounded-xl sm:rounded-2xl overflow-hidden"
          >
            <div className="p-4 sm:p-6 border-b border-stone-300/40">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <h2 className="text-lg sm:text-xl font-bold text-stone-900">
                  User Issues
                </h2>
                <div className="flex flex-wrap items-center gap-3">
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                    <input type="text" value={issuesSearch} onChange={(e) => setIssuesSearch(e.target.value)}
                      placeholder="Search subject or email..." className="pl-9 pr-4 py-2 bg-cream-200/60 border border-stone-300/50 rounded-xl text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 w-52" />
                  </div>
                  {/* Issue Filters */}
                  <div className="flex items-center space-x-2">
                    <span className="text-stone-900/60 text-sm">Filter:</span>
                  {["all", "open", "in-progress", "resolved"].map(
                    (filterOption) => (
                      <button
                        key={filterOption}
                        onClick={() => setIssueFilter(filterOption)}
                        className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                          issueFilter === filterOption
                            ? "bg-emerald-500 text-black"
                            : "bg-cream-200/60 text-stone-900/70 hover:bg-cream-300/60"
                        }`}
                      >
                        {filterOption.replace("-", " ").toUpperCase()}
                      </button>
                    )
                  )}
                  </div>
                </div>
              </div>

              {/* Issue Stats */}
              {issueStats && (
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-4">
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                    <p className="text-blue-400 text-xs font-medium">Total</p>
                    <p className="text-stone-900 text-xl font-bold">
                      {issueStats.total || 0}
                    </p>
                  </div>
                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                    <p className="text-yellow-400 text-xs font-medium">Open</p>
                    <p className="text-stone-900 text-xl font-bold">
                      {issueStats.open || 0}
                    </p>
                  </div>
                  <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-3">
                    <p className="text-cyan-400 text-xs font-medium">
                      In Progress
                    </p>
                    <p className="text-stone-900 text-xl font-bold">
                      {issueStats.inProgress || 0}
                    </p>
                  </div>
                  <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3">
                    <p className="text-emerald-400 text-xs font-medium">
                      Resolved
                    </p>
                    <p className="text-stone-900 text-xl font-bold">
                      {issueStats.resolved || 0}
                    </p>
                  </div>
                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                    <p className="text-red-400 text-xs font-medium">Urgent</p>
                    <p className="text-stone-900 text-xl font-bold">
                      {issueStats.urgent || 0}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {isLoadingIssues ? (
              <div className="p-8 sm:p-12 text-center">
                <Loader2 className="w-8 h-8 text-emerald-400 animate-spin mx-auto mb-4" />
                <p className="text-stone-900/60 text-sm sm:text-base">
                  Loading issues...
                </p>
              </div>
            ) : issues.length === 0 ? (
              <div className="p-8 sm:p-12 text-center">
                <MessageSquare className="w-10 h-10 sm:w-12 sm:h-12 text-stone-900/40 mx-auto mb-4" />
                <p className="text-stone-900/60 text-sm sm:text-base">
                  No issues found
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px]">
                  <thead className="bg-cream-100/80">
                    <tr>
                      <th className="text-left p-3 sm:p-4 text-stone-900/80 font-medium text-sm">
                        User
                      </th>
                      <th className="text-left p-3 sm:p-4 text-stone-900/80 font-medium text-sm">
                        Subject
                      </th>
                      <th className="text-left p-3 sm:p-4 text-stone-900/80 font-medium text-sm">
                        Priority
                      </th>
                      <th className="text-left p-3 sm:p-4 text-stone-900/80 font-medium text-sm">
                        Status
                      </th>
                      <th className="text-left p-3 sm:p-4 text-stone-900/80 font-medium text-sm">
                        Date
                      </th>
                      <th className="text-left p-3 sm:p-4 text-stone-900/80 font-medium text-sm">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredIssues.map((issue: any) => (
                      <motion.tr
                        key={issue._id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="border-b border-stone-300/40 hover:bg-cream-100/80 transition-colors"
                      >
                        <td className="p-3 sm:p-4">
                          <div>
                            <p className="text-stone-900 font-medium text-sm">
                              {issue.userId?.name || "Unknown"}
                            </p>
                            <p className="text-stone-900/60 text-xs">
                              {issue.userId?.email || "N/A"}
                            </p>
                          </div>
                        </td>
                        <td className="p-3 sm:p-4">
                          <div className="max-w-xs">
                            <p className="text-stone-900 font-medium text-sm truncate">
                              {issue.subject}
                            </p>
                            <p className="text-stone-900/60 text-xs line-clamp-2">
                              {issue.description}
                            </p>
                          </div>
                        </td>
                        <td className="p-3 sm:p-4">
                          <span
                            className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium ${
                              issue.priority === "urgent"
                                ? "bg-red-500/20 text-red-400"
                                : issue.priority === "high"
                                ? "bg-orange-500/20 text-orange-400"
                                : issue.priority === "medium"
                                ? "bg-yellow-500/20 text-yellow-400"
                                : "bg-green-500/20 text-green-400"
                            }`}
                          >
                            {issue.priority.toUpperCase()}
                          </span>
                        </td>
                        <td className="p-3 sm:p-4">
                          {/* Status buttons -- avoids dark OS dropdown */}
                          <div className="flex flex-wrap gap-1">
                            {[
                              { value: "open",        label: "Open",        bg: "bg-yellow-100 text-yellow-700 border-yellow-300 hover:bg-yellow-200" },
                              { value: "in-progress", label: "In Progress", bg: "bg-blue-100 text-blue-700 border-blue-300 hover:bg-blue-200" },
                              { value: "resolved",    label: "Resolved",    bg: "bg-emerald-100 text-emerald-700 border-emerald-300 hover:bg-emerald-200" },
                              { value: "closed",      label: "Closed",      bg: "bg-stone-100 text-stone-600 border-stone-300 hover:bg-stone-200" },
                            ].map((opt) => (
                              <button
                                key={opt.value}
                                onClick={() => handleUpdateIssueStatus(issue._id, opt.value)}
                                className={`px-2 py-1 text-[10px] font-semibold rounded-lg border transition-all ${opt.bg} ${
                                  issue.status === opt.value
                                    ? "ring-2 ring-offset-1 ring-current opacity-100 scale-105"
                                    : "opacity-60"
                                }`}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        </td>
                        <td className="p-3 sm:p-4">
                          <div className="text-stone-900/80">
                            <p className="text-sm">
                              {formatDate(issue.createdAt)}
                            </p>
                            <p className="text-xs text-stone-900/60">
                              {formatTime(issue.createdAt)}
                            </p>
                          </div>
                        </td>
                        <td className="p-3 sm:p-4">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() =>
                                setResponseModal({
                                  open: true,
                                  issueId: issue._id,
                                })
                              }
                              className="p-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors text-xs"
                              title="Respond"
                            >
                              <MessageSquare className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleResolveIssue(issue._id)}
                              disabled={issue.status === "resolved"}
                              className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-xs"
                              title="Resolve"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        )}

        {/* Balance Manager Tab */}
        {activeTab === "balance-manager" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-cream-100/80  border border-stone-300/50 rounded-2xl p-4 sm:p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-stone-900 flex items-center space-x-3">
                <Wallet className="w-6 h-6 text-emerald-400" />
                <span>Manual Balance Adjustment</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Form Section */}
              <div className="bg-cream-100/80 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-stone-900 mb-4">
                  Adjust User Balance
                </h3>

                <div className="space-y-4">
                  {/* User Selection */}
                  <div>
                    <label className="block text-stone-900/80 text-sm mb-2">
                      Select User
                    </label>
                    {/* Same style as Push Notification Send To */}
                    <div className="relative" data-balance-user-select>
                      <button
                        type="button"
                        onClick={() => {
                          const el = document.querySelector("[data-balance-user-select] [data-dropdown]") as HTMLElement;
                          if (el) el.style.display = el.style.display === "none" ? "block" : "none";
                        }}
                        className="w-full px-4 py-3 bg-white border border-stone-300 rounded-xl text-stone-900 text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                      >
                        <span className="truncate text-sm">
                          {selectedUser
                            ? (() => {
                                const u = allUsers.find((u: any) => (u._id || u.id) === selectedUser);
                                return u ? `${u.name} (${u.email})` : "-- Select a user --";
                              })()
                            : "-- Select a user --"}
                        </span>
                        <ChevronDown className="w-4 h-4 text-stone-500 flex-shrink-0 ml-2" />
                      </button>

                      <div data-dropdown className="absolute z-50 w-full mt-1 bg-white border border-stone-200 rounded-xl shadow-xl hidden">
                        <div className="p-2 border-b border-stone-100">
                          <input
                            type="text"
                            value={balanceUserSearch}
                            onChange={(e) => setBalanceUserSearch(e.target.value)}
                            placeholder="Search by name or email..."
                            className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 placeholder-stone-400"
                            autoFocus
                          />
                        </div>
                        <div className="overflow-y-auto max-h-48">
                          {allUsers
                            .filter((u: any) => {
                              if (!balanceUserSearch) return true;
                              const q = balanceUserSearch.toLowerCase();
                              return u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
                            })
                            .map((u: any) => (
                              <button
                                key={u._id || u.id}
                                type="button"
                                onClick={() => {
                                  setSelectedUser(u._id || u.id);
                                  setBalanceUserSearch("");
                                  const el = document.querySelector("[data-balance-user-select] [data-dropdown]") as HTMLElement;
                                  if (el) el.style.display = "none";
                                }}
                                className={`w-full px-4 py-2.5 text-left text-sm hover:bg-emerald-50 transition-colors border-b border-stone-50 last:border-0 ${selectedUser === (u._id || u.id) ? "bg-emerald-50 font-semibold text-emerald-700" : "text-stone-900"}`}
                              >
                                <span className="font-medium">{u.name}</span>
                                <span className="text-stone-500 text-xs ml-1">({u.email})</span>
                                <span className="text-stone-400 text-xs ml-1">· ${u.wallet?.balance || 0}</span>
                              </button>
                            ))}
                          {allUsers.filter((u: any) => {
                            if (!balanceUserSearch) return true;
                            const q = balanceUserSearch.toLowerCase();
                            return u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
                          }).length === 0 && (
                            <p className="p-4 text-stone-500 text-sm text-center">No users found</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Type */}
                  <div>
                    <label className="block text-stone-900/80 text-sm mb-2">
                      Action Type
                    </label>
                    <div className="flex flex-col sm:flex-row sm:space-x-4 space-y-3 sm:space-y-0">
                      <button
                        onClick={() => setBalanceAction("add")}
                        className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all ${
                          balanceAction === "add"
                            ? "bg-emerald-500 text-black"
                            : "bg-cream-200/60 text-stone-900 hover:bg-cream-300/60"
                        }`}
                      >
                        ➕ Add Balance
                      </button>
                      <button
                        onClick={() => setBalanceAction("deduct")}
                        className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all ${
                          balanceAction === "deduct"
                            ? "bg-red-500 text-stone-900"
                            : "bg-cream-200/60 text-stone-900 hover:bg-cream-300/60"
                        }`}
                      >
                        ➖ Deduct Balance
                      </button>
                      <button
                        onClick={() => setBalanceAction("bonus")}
                        className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all ${
                          balanceAction === "bonus"
                            ? "bg-purple-500 text-stone-900"
                            : "bg-cream-200/60 text-stone-900 hover:bg-cream-300/60"
                        }`}
                      >
                        🎁 Add Bonus
                      </button>
                    </div>
                  </div>

                  {/* Amount */}
                  <div>
                    <label className="block text-stone-900/80 text-sm mb-2">
                      Amount (USDT)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={balanceAmount}
                      onChange={(e) => setBalanceAmount(e.target.value)}
                      className="w-full px-4 py-3 bg-cream-200/60 border border-stone-300/50 rounded-xl text-stone-900 placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                      placeholder="Enter amount..."
                    />
                  </div>

                  {/* Reason */}
                  <div>
                    <label className="block text-stone-900/80 text-sm mb-2">
                      Reason (Required)
                    </label>
                    <textarea
                      value={balanceReason}
                      onChange={(e) => setBalanceReason(e.target.value)}
                      className="w-full h-24 px-4 py-3 bg-cream-200/60 border border-stone-300/50 rounded-xl text-stone-900 placeholder-white/50 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                      placeholder="Provide a detailed reason for this adjustment..."
                      maxLength={500}
                    />
                    <p className="text-stone-900/40 text-xs mt-1">
                      {balanceReason.length}/500
                    </p>
                  </div>

                  {/* Submit Button */}
                  <button
                    onClick={handleBalanceAdjustment}
                    disabled={
                      !selectedUser ||
                      !balanceAmount ||
                      !balanceReason.trim() ||
                      isProcessingBalance
                    }
                    className={`w-full py-3 px-4 rounded-xl font-semibold transition-all flex items-center justify-center space-x-2 ${
                      balanceAction === "add"
                        ? "bg-emerald-500 text-black hover:bg-emerald-600"
                        : balanceAction === "bonus"
                        ? "bg-purple-500 text-stone-900 hover:bg-purple-600"
                        : "bg-red-500 text-stone-900 hover:bg-red-600"
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {isProcessingBalance ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <span>
                          {balanceAction === "add"
                            ? "Add Balance"
                            : balanceAction === "bonus"
                            ? "Add Bonus"
                            : "Deduct Balance"}
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Info Section */}
              <div className="space-y-4">
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                  <h4 className="text-blue-400 font-semibold mb-2 flex items-center space-x-2">
                    <AlertTriangle className="w-5 h-5" />
                    <span>Important Information</span>
                  </h4>
                  <ul className="text-stone-900/70 text-sm space-y-2">
                    <li>
                      - Use this feature to manually adjust user balances when
                      deposits are rejected by mistake
                    </li>
                    <li>- Or to deduct funds if approved incorrectly</li>
                    <li>- All adjustments are logged in the Audit Logs tab</li>
                    <li>- Always provide a clear reason for the adjustment</li>
                  </ul>
                </div>

                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
                  <h4 className="text-yellow-400 font-semibold mb-2">
                    Warning:️ Use Cases
                  </h4>
                  <ul className="text-stone-900/70 text-sm space-y-2">
                    <li>
                      <strong>Add Balance:</strong> When a deposit was rejected
                      but funds were received
                    </li>
                    <li>
                      <strong>Deduct Balance:</strong> When a deposit was
                      approved by mistake
                    </li>
                    <li>
                      <strong>Add Bonus:</strong> Reward users with manual
                      promos or compensate for service issues
                    </li>
                    <li>
                      <strong>Corrections:</strong> To fix any accounting errors
                    </li>
                  </ul>
                </div>

                {selectedUser &&
                  allUsers.find((u: any) => u._id === selectedUser) && (
                    <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
                      <h4 className="text-emerald-400 font-semibold mb-2">
                        Selected User Info
                      </h4>
                      {(() => {
                        const user = allUsers.find(
                          (u: any) => u._id === selectedUser
                        );
                        return (
                          <div className="text-stone-900/80 text-sm space-y-1">
                            <p>
                              <strong>Name:</strong> {user.name}
                            </p>
                            <p>
                              <strong>Email:</strong> {user.email}
                            </p>
                            <p>
                              <strong>Current Balance:</strong> $
                              {user.wallet?.balance || 0} USDT
                            </p>
                            <p>
                              <strong>Staked:</strong> $
                              {user.wallet?.stakedAmount || 0} USDT
                            </p>
                            <p>
                              <strong>Available:</strong> $
                              {user.wallet?.availableBalance || 0} USDT
                            </p>
                          </div>
                        );
                      })()}
                    </div>
                  )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Deleted Transactions Tab */}
        {activeTab === "deleted-transactions" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-cream-100/80  border border-stone-300/50 rounded-2xl p-4 sm:p-6"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-stone-900 flex items-center space-x-3">
                <RefreshCw className="w-6 h-6 text-yellow-400" />
                <span>Deleted / Rejected Transactions</span>
              </h2>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                  <input type="text" value={deletedTxSearch} onChange={(e) => setDeletedTxSearch(e.target.value)}
                    placeholder="Search..." className="pl-9 pr-4 py-2 bg-cream-200/60 border border-stone-300/50 rounded-xl text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 w-52" />
                </div>
                <button onClick={fetchDeletedTransactions} className="p-2 bg-cream-200/60 text-stone-900 rounded-lg hover:bg-cream-300/60 transition-colors" title="Refresh">
                  <RefreshCw className="w-5 h-5" />
                </button>
              </div>
            </div>

            {isLoadingDeleted ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
              </div>
            ) : deletedTransactions.length === 0 ? (
              <div className="text-center py-12">
                <XCircle className="w-12 h-12 text-stone-900/30 mx-auto mb-4" />
                <p className="text-stone-900/60">No deleted transactions found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-stone-300/40">
                      <th className="text-left p-3 sm:p-4 text-stone-900/80 font-semibold text-xs sm:text-sm">
                        User
                      </th>
                      <th className="text-left p-3 sm:p-4 text-stone-900/80 font-semibold text-xs sm:text-sm">
                        Type
                      </th>
                      <th className="text-left p-3 sm:p-4 text-stone-900/80 font-semibold text-xs sm:text-sm">
                        Amount
                      </th>
                      <th className="text-left p-3 sm:p-4 text-stone-900/80 font-semibold text-xs sm:text-sm">
                        Status
                      </th>
                      <th className="text-left p-3 sm:p-4 text-stone-900/80 font-semibold text-xs sm:text-sm">
                        Deleted At
                      </th>
                      <th className="text-left p-3 sm:p-4 text-stone-900/80 font-semibold text-xs sm:text-sm">
                        Deleted By
                      </th>
                      <th className="text-left p-3 sm:p-4 text-stone-900/80 font-semibold text-xs sm:text-sm">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDeletedTx.map((tx: any) => (
                      <motion.tr
                        key={tx._id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="border-b border-white/5 hover:bg-cream-100/80"
                      >
                        <td className="p-3 sm:p-4">
                          <div>
                            <p className="text-stone-900 text-sm">
                              {tx.userId?.name || "N/A"}
                            </p>
                            <p className="text-stone-900/60 text-xs">
                              {tx.userId?.email}
                            </p>
                          </div>
                        </td>
                        <td className="p-3 sm:p-4">
                          <span
                            className={`px-2 py-1 rounded-full text-xs ${
                              tx.type === "deposit"
                                ? "bg-emerald-500/20 text-emerald-400"
                                : "bg-red-500/20 text-red-400"
                            }`}
                          >
                            {tx.type}
                          </span>
                        </td>
                        <td className="p-3 sm:p-4">
                          <p className="text-stone-900 font-semibold">
                            ${tx.amount} USDT
                          </p>
                        </td>
                        <td className="p-3 sm:p-4">
                          <span className="px-2 py-1 rounded-full text-xs bg-gray-500/20 text-stone-600">
                            {tx.status}
                          </span>
                        </td>
                        <td className="p-3 sm:p-4">
                          <div className="text-stone-900/80">
                            <p className="text-sm">
                              {formatDate(tx.deletedAt || tx.created_at || tx.createdAt)}
                            </p>
                            <p className="text-xs text-stone-900/60">
                              {formatTime(tx.deletedAt || tx.created_at || tx.createdAt)}
                            </p>
                          </div>
                        </td>
                        <td className="p-3 sm:p-4">
                          <p className="text-stone-900/70 text-sm">
                            {tx.deletedBy?.email || "System"}
                          </p>
                        </td>
                        <td className="p-3 sm:p-4">
                          <button
                            onClick={() => handleReviveTransaction(tx._id)}
                            className="px-3 py-2 bg-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500/30 transition-colors text-xs font-semibold flex items-center space-x-1"
                          >
                            <RefreshCw className="w-3 h-3" />
                            <span>Revive</span>
                          </button>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        )}

        {/* Audit Logs Tab */}
        {activeTab === "audit-logs" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Stats Cards */}
            {auditLogStats && (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
                  <p className="text-emerald-400 text-xs font-medium mb-1">
                    Manual Additions
                  </p>
                  <p className="text-2xl font-bold text-stone-900">
                    {auditLogStats.manualAdditions?.count || 0}
                  </p>
                  <p className="text-emerald-400 text-sm">
                    $
                    {auditLogStats.manualAdditions?.totalAmount?.toFixed(2) ||
                      0}
                  </p>
                </div>
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                  <p className="text-red-400 text-xs font-medium mb-1">
                    Manual Deductions
                  </p>
                  <p className="text-2xl font-bold text-stone-900">
                    {auditLogStats.manualDeductions?.count || 0}
                  </p>
                  <p className="text-red-400 text-sm">
                    $
                    {auditLogStats.manualDeductions?.totalAmount?.toFixed(2) ||
                      0}
                  </p>
                </div>
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
                  <p className="text-yellow-400 text-xs font-medium mb-1">
                    Revived Txns
                  </p>
                  <p className="text-2xl font-bold text-stone-900">
                    {auditLogStats.revivedTransactions?.count || 0}
                  </p>
                </div>
                <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4">
                  <p className="text-purple-400 text-xs font-medium mb-1">
                    Deleted Txns
                  </p>
                  <p className="text-2xl font-bold text-stone-900">
                    {auditLogStats.deletedTransactions?.count || 0}
                  </p>
                </div>
              </div>
            )}

            {/* Audit Logs Table */}
            <div className="bg-cream-100/80  border border-stone-300/50 rounded-2xl p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
                <h2 className="text-xl sm:text-2xl font-bold text-stone-900 flex items-center space-x-3">
                  <Calendar className="w-6 h-6 text-cyan-400" />
                  <span>Admin Activity Audit Log</span>
                </h2>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                    <input type="text" value={auditLogsSearch} onChange={(e) => setAuditLogsSearch(e.target.value)}
                      placeholder="Search admin, user, action..." className="pl-9 pr-4 py-2 bg-cream-200/60 border border-stone-300/50 rounded-xl text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 w-56" />
                  </div>
                  <button onClick={fetchAuditLogs} className="p-2 bg-cream-200/60 text-stone-900 rounded-lg hover:bg-cream-300/60 transition-colors" title="Refresh">
                    <RefreshCw className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {isLoadingAuditLogs ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
                </div>
              ) : auditLogs.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="w-12 h-12 text-stone-900/30 mx-auto mb-4" />
                  <p className="text-stone-900/60">No audit logs found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-stone-300/40">
                        <th className="text-left p-3 text-stone-900/80 font-semibold text-xs">
                          Admin
                        </th>
                        <th className="text-left p-3 text-stone-900/80 font-semibold text-xs">
                          Action
                        </th>
                        <th className="text-left p-3 text-stone-900/80 font-semibold text-xs">
                          Target User
                        </th>
                        <th className="text-left p-3 text-stone-900/80 font-semibold text-xs">
                          Amount
                        </th>
                        <th className="text-left p-3 text-stone-900/80 font-semibold text-xs">
                          Reason
                        </th>
                        <th className="text-left p-3 text-stone-900/80 font-semibold text-xs">
                          Date & Time
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAuditLogs.map((log: any) => (
                        <motion.tr
                          key={log._id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="border-b border-white/5 hover:bg-cream-100/80"
                        >
                          <td className="p-3">
                            <p className="text-stone-900 text-sm">
                              {log.adminEmail}
                            </p>
                          </td>
                          <td className="p-3">
                            <span
                              className={`px-2 py-1 rounded-full text-xs ${
                                log.action === "MANUAL_ADD_BALANCE"
                                  ? "bg-emerald-500/20 text-emerald-400"
                                  : log.action === "MANUAL_DEDUCT_BALANCE"
                                  ? "bg-red-500/20 text-red-400"
                                  : log.action === "REVIVE_TRANSACTION"
                                  ? "bg-yellow-500/20 text-yellow-400"
                                  : "bg-purple-500/20 text-purple-400"
                              }`}
                            >
                              {log.action.replace(/_/g, " ")}
                            </span>
                          </td>
                          <td className="p-3">
                            <p className="text-stone-900/80 text-sm">
                              {log.targetUserEmail}
                            </p>
                          </td>
                          <td className="p-3">
                            <p className="text-stone-900 font-semibold text-sm">
                              {log.amount > 0 ? `$${log.amount}` : "-"}
                            </p>
                          </td>
                          <td className="p-3">
                            <p
                              className="text-stone-900/70 text-xs max-w-xs truncate"
                              title={log.reason}
                            >
                              {log.reason}
                            </p>
                          </td>
                          <td className="p-3">
                            <div className="text-stone-900/80 text-xs">
                              <p>
                                {formatDate(log.createdAt)}
                              </p>
                              <p className="text-stone-900/60">
                                {formatTime(log.createdAt)}
                              </p>
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Referral Hierarchy Tab */}
        {activeTab === "referral-hierarchy" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* User Selection */}
            <div className="bg-cream-100/80  border border-stone-300/50 rounded-2xl p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl sm:text-2xl font-bold text-stone-900 flex items-center space-x-3">
                  <Network className="w-6 h-6 text-purple-400" />
                  <span>Referral Hierarchy Tree</span>
                </h2>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-1">
                  <label className="block text-stone-900/80 text-sm mb-2">
                    Select User to View Hierarchy
                  </label>
                  {/* Same style as Push Notification Send To */}
                  <div className="relative" data-hierarchy-user-select>
                    <button
                      type="button"
                      onClick={() => {
                        const el = document.querySelector("[data-hierarchy-user-select] [data-dropdown]");
                        (el as HTMLElement)?.style && ((el as HTMLElement).style.display = (el as HTMLElement).style.display === "none" ? "block" : "none");
                      }}
                      className="w-full px-4 py-3 bg-white border border-stone-300 rounded-xl text-stone-900 text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                    >
                      <span className="truncate text-sm">
                        {selectedUserForHierarchy
                          ? (() => {
                              const u = allUsers.find((u: any) => (u._id || u.id) === selectedUserForHierarchy);
                              return u ? `${u.name} (${u.email})` : "-- Select a user --";
                            })()
                          : "-- Select a user --"}
                      </span>
                      <ChevronDown className="w-4 h-4 text-stone-500 flex-shrink-0 ml-2" />
                    </button>

                    <div data-dropdown className="absolute z-50 w-full mt-1 bg-white border border-stone-200 rounded-xl shadow-xl hidden">
                      <div className="p-2 border-b border-stone-100">
                        <input
                          type="text"
                          value={hierarchyUserSearch}
                          onChange={(e) => setHierarchyUserSearch(e.target.value)}
                          placeholder="Search by name or email..."
                          className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 placeholder-stone-400"
                          autoFocus
                        />
                      </div>
                      <div className="overflow-y-auto max-h-48">
                        {allUsers
                          .filter((u: any) => {
                            if (!hierarchyUserSearch) return true;
                            const q = hierarchyUserSearch.toLowerCase();
                            return u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
                          })
                          .map((u: any) => (
                            <button
                              key={u._id || u.id}
                              type="button"
                              onClick={() => {
                                const uid = u._id || u.id;
                                setSelectedUserForHierarchy(uid);
                                setHierarchyUserSearch("");
                                fetchReferralHierarchy(uid);
                                const el = document.querySelector("[data-hierarchy-user-select] [data-dropdown]") as HTMLElement;
                                if (el) el.style.display = "none";
                              }}
                              className={`w-full px-4 py-2.5 text-left text-sm hover:bg-purple-50 transition-colors border-b border-stone-50 last:border-0 ${selectedUserForHierarchy === (u._id || u.id) ? "bg-purple-50 font-semibold text-purple-700" : "text-stone-900"}`}
                            >
                              <span className="font-medium">{u.name}</span>
                              <span className="text-stone-500 text-xs ml-1">({u.email})</span>
                            </button>
                          ))}
                        {allUsers.filter((u: any) => {
                          if (!hierarchyUserSearch) return true;
                          const q = hierarchyUserSearch.toLowerCase();
                          return u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
                        }).length === 0 && (
                          <p className="p-4 text-stone-500 text-sm text-center">No users found</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Commission Structure Info */}
                <div className="lg:col-span-2 bg-purple-500/10 border border-purple-500/30 rounded-xl p-4">
                  <h4 className="text-purple-400 font-semibold mb-2 flex items-center gap-2">
                    <Gift className="w-5 h-5" />
                    3-Level Commission Structure
                  </h4>
                  <div className="grid grid-cols-3 gap-4 mt-3">
                    <div className="text-center p-3 bg-purple-500/20 rounded-lg">
                      <p className="text-2xl font-bold text-purple-400">8%</p>
                      <p className="text-stone-900/70 text-xs">Level 1 (Direct)</p>
                    </div>
                    <div className="text-center p-3 bg-blue-500/20 rounded-lg">
                      <p className="text-2xl font-bold text-blue-400">4%</p>
                      <p className="text-stone-900/70 text-xs">Level 2</p>
                    </div>
                    <div className="text-center p-3 bg-cyan-500/20 rounded-lg">
                      <p className="text-2xl font-bold text-cyan-400">2%</p>
                      <p className="text-stone-900/70 text-xs">Level 3</p>
                    </div>
                  </div>
                  <p className="text-stone-900/60 text-xs mt-3">
                    + 1% bonus on referred user&apos;s first deposit
                  </p>
                </div>
              </div>
            </div>

            {/* Hierarchy Display */}
            {isLoadingHierarchy ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
              </div>
            ) : referralHierarchy ? (
              <div className="bg-cream-100/80  border border-stone-300/50 rounded-2xl p-4 sm:p-6">
                {/* User Stats Summary */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
                    <p className="text-emerald-400 text-xs font-medium">
                      Total Referrals
                    </p>
                    <p className="text-2xl font-bold text-stone-900">
                      {referralHierarchy.downline?.total || 0}
                    </p>
                  </div>
                  <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4">
                    <p className="text-purple-400 text-xs font-medium">
                      Level 1 Referrals
                    </p>
                    <p className="text-2xl font-bold text-stone-900">
                      {referralHierarchy.downline?.level1?.count || 0}
                    </p>
                  </div>
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                    <p className="text-blue-400 text-xs font-medium">
                      Level 2 Referrals
                    </p>
                    <p className="text-2xl font-bold text-stone-900">
                      {referralHierarchy.downline?.level2?.count || 0}
                    </p>
                  </div>
                  <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-4">
                    <p className="text-cyan-400 text-xs font-medium">
                      Level 3 Referrals
                    </p>
                    <p className="text-2xl font-bold text-stone-900">
                      {referralHierarchy.downline?.level3?.count || 0}
                    </p>
                  </div>
                </div>

                {/* Earnings Summary */}
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
                    <p className="text-yellow-400 text-xs font-medium">
                      Total Earnings
                    </p>
                    <p className="text-xl font-bold text-stone-900">
                      ${(referralHierarchy.earnings?.total || 0).toFixed(2)}
                    </p>
                  </div>
                  <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4">
                    <p className="text-purple-400 text-xs font-medium">
                      Level 1 (8%)
                    </p>
                    <p className="text-xl font-bold text-stone-900">
                      ${(referralHierarchy.earnings?.level1 || 0).toFixed(2)}
                    </p>
                  </div>
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                    <p className="text-blue-400 text-xs font-medium">
                      Level 2 (4%)
                    </p>
                    <p className="text-xl font-bold text-stone-900">
                      ${(referralHierarchy.earnings?.level2 || 0).toFixed(2)}
                    </p>
                  </div>
                  <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-4">
                    <p className="text-cyan-400 text-xs font-medium">
                      Level 3 (2%)
                    </p>
                    <p className="text-xl font-bold text-stone-900">
                      ${(referralHierarchy.earnings?.level3 || 0).toFixed(2)}
                    </p>
                  </div>
                  <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
                    <p className="text-emerald-400 text-xs font-medium">
                      First Deposit Bonus
                    </p>
                    <p className="text-xl font-bold text-stone-900">
                      $
                      {(
                        referralHierarchy.earnings?.firstDepositBonus || 0
                      ).toFixed(2)}
                    </p>
                  </div>
                </div>

                {/* Hierarchy Tree -- flat list showing L1, L2, L3 as same-style rows */}
                <h3 className="text-lg font-bold text-stone-900 mb-4 flex items-center gap-2">
                  <Network className="w-5 h-5 text-purple-400" />
                  Referral Tree (Downline)
                </h3>

                {(referralHierarchy.downline?.level1?.users?.length > 0 ||
                  referralHierarchy.downline?.level2?.users?.length > 0 ||
                  referralHierarchy.downline?.level3?.users?.length > 0) ? (
                  <div className="space-y-2">
                    {/* Level 1 */}
                    {(referralHierarchy.downline?.level1?.users || []).map((u: any) => (
                      <div key={u.id || u._id} className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-white font-bold text-sm">L1</span>
                          </div>
                          <div>
                            <p className="text-stone-900 font-medium">{u.name}</p>
                            <p className="text-stone-900/60 text-xs">{u.email}</p>
                          </div>
                        </div>
                        <span className="text-purple-500 text-sm font-semibold">8% Commission</span>
                      </div>
                    ))}

                    {/* Level 2 */}
                    {(referralHierarchy.downline?.level2?.users || []).map((u: any) => (
                      <div key={u.id || u._id} className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-white font-bold text-sm">L2</span>
                          </div>
                          <div>
                            <p className="text-stone-900 font-medium">{u.name}</p>
                            <p className="text-stone-900/60 text-xs">{u.email}</p>
                          </div>
                        </div>
                        <span className="text-blue-500 text-sm font-semibold">4% Commission</span>
                      </div>
                    ))}

                    {/* Level 3 */}
                    {(referralHierarchy.downline?.level3?.users || []).map((u: any) => (
                      <div key={u.id || u._id} className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-cyan-500 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-white font-bold text-sm">L3</span>
                          </div>
                          <div>
                            <p className="text-stone-900 font-medium">{u.name}</p>
                            <p className="text-stone-900/60 text-xs">{u.email}</p>
                          </div>
                        </div>
                        <span className="text-cyan-600 text-sm font-semibold">2% Commission</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Network className="w-12 h-12 text-stone-900/20 mx-auto mb-3" />
                    <p className="text-stone-900/60">
                      No referrals found for this user
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-cream-100/80  border border-stone-300/50 rounded-2xl p-8 text-center">
                <Network className="w-16 h-16 text-stone-900/20 mx-auto mb-4" />
                <p className="text-stone-900/60 text-lg">
                  Select a user to view their referral hierarchy
                </p>
                <p className="text-stone-900/40 text-sm mt-2">
                  The tree will show up to 3 levels of referrals with commission
                  rates
                </p>
              </div>
            )}
          </motion.div>
        )}

        {/* Push Notifications Tab */}
        {activeTab === "notifications" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* Send Notification Form */}
            <div className="bg-cream-100/80  border border-stone-300/50 rounded-2xl p-6">
              <h3 className="text-xl font-bold text-stone-900 mb-6 flex items-center">
                <MessageSquare className="w-6 h-6 mr-3 text-emerald-400" />
                Send Push Notification
              </h3>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  {/* User Selection */}
                  <div>
                    <label className="block text-stone-900/80 text-sm mb-2">
                      Send To
                    </label>
                    {/* Custom searchable dropdown -- avoids dark OS dropdown */}
                    <div className="relative" data-notif-send-to>
                      <button
                        type="button"
                        onClick={() => { setShowSendToDropdown(!showSendToDropdown); setShowTypeDropdown(false); }}
                        className="w-full px-4 py-3 bg-white border border-stone-300 rounded-xl text-stone-900 text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                      >
                        <span className="truncate">
                          {notificationUserId === "all"
                            ? "📢 All Users (Broadcast)"
                            : allUsers.find((u: any) => (u._id || u.id) === notificationUserId)
                              ? `${allUsers.find((u: any) => (u._id || u.id) === notificationUserId)?.name} (${allUsers.find((u: any) => (u._id || u.id) === notificationUserId)?.email})`
                              : "Select user..."}
                        </span>
                        <ChevronDown className="w-4 h-4 text-stone-500 flex-shrink-0 ml-2" />
                      </button>

                      {showSendToDropdown && (
                        <div className="absolute z-50 w-full mt-1 bg-white border border-stone-200 rounded-xl shadow-xl max-h-64 overflow-hidden">
                          <div className="p-2 border-b border-stone-100">
                            <input
                              type="text"
                              value={sendToSearch}
                              onChange={(e) => setSendToSearch(e.target.value)}
                              placeholder="Search by name or email..."
                              className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                              autoFocus
                            />
                          </div>
                          <div className="overflow-y-auto max-h-48">
                            <button
                              type="button"
                              onClick={() => { setNotificationUserId("all"); setShowSendToDropdown(false); setSendToSearch(""); }}
                              className={`w-full px-4 py-2.5 text-left text-sm hover:bg-emerald-50 transition-colors ${notificationUserId === "all" ? "bg-emerald-50 text-emerald-700 font-semibold" : "text-stone-900"}`}
                            >
                              📢 All Users (Broadcast)
                            </button>
                            {allUsers
                              .filter((u: any) => {
                                if (!sendToSearch) return true;
                                const q = sendToSearch.toLowerCase();
                                return u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
                              })
                              .map((user: any) => (
                                <button
                                  key={user._id || user.id}
                                  type="button"
                                  onClick={() => { setNotificationUserId(user._id || user.id); setShowSendToDropdown(false); setSendToSearch(""); }}
                                  className={`w-full px-4 py-2.5 text-left text-sm hover:bg-emerald-50 transition-colors ${notificationUserId === (user._id || user.id) ? "bg-emerald-50 text-emerald-700 font-semibold" : "text-stone-900"}`}
                                >
                                  <span className="font-medium">{user.name}</span>
                                  <span className="text-stone-500 ml-1 text-xs">({user.email})</span>
                                </button>
                              ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Notification Type */}
                  <div>
                    <label className="block text-stone-900/80 text-sm mb-2">
                      Notification Type
                    </label>
                    {/* Custom dropdown -- avoids dark OS dropdown */}
                    <div className="relative" data-notif-type>
                      <button
                        type="button"
                        onClick={() => { setShowTypeDropdown(!showTypeDropdown); setShowSendToDropdown(false); }}
                        className={`w-full px-4 py-3 bg-white border border-stone-300 rounded-xl text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-emerald-500/50 ${
                          notificationType === "announcement" ? "text-purple-700"
                          : notificationType === "success"    ? "text-green-700"
                          : notificationType === "warning"    ? "text-yellow-700"
                          : notificationType === "error"      ? "text-red-700"
                          : "text-blue-700"
                        }`}
                      >
                        <span className="font-medium">
                          {notificationType === "announcement" && "📢 Announcement"}
                          {notificationType === "info"         && "ℹ️ Information"}
                          {notificationType === "success"      && " Success"}
                          {notificationType === "warning"      && "Warning:️ Warning"}
                          {notificationType === "error"        && " Error"}
                        </span>
                        <ChevronDown className="w-4 h-4 flex-shrink-0 ml-2 text-stone-500" />
                      </button>

                      {showTypeDropdown && (
                        <div className="absolute z-50 w-full mt-1 bg-white border border-stone-200 rounded-xl shadow-xl overflow-hidden">
                          {[
                            { value: "announcement", label: "📢 Announcement", color: "text-purple-700", hover: "hover:bg-purple-50" },
                            { value: "info",         label: "ℹ️ Information",   color: "text-blue-700",   hover: "hover:bg-blue-50" },
                            { value: "success",      label: " Success",       color: "text-green-700",  hover: "hover:bg-green-50" },
                            { value: "warning",      label: "Warning:️ Warning",       color: "text-yellow-700", hover: "hover:bg-yellow-50" },
                            { value: "error",        label: " Error",         color: "text-red-700",    hover: "hover:bg-red-50" },
                          ].map((opt) => (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => { setNotificationType(opt.value as any); setShowTypeDropdown(false); }}
                              className={`w-full px-4 py-3 text-left text-sm font-medium ${opt.color} ${opt.hover} transition-colors ${notificationType === opt.value ? "font-bold bg-stone-50" : ""}`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Title */}
                  <div>
                    <label className="block text-stone-900/80 text-sm mb-2">
                      Title
                    </label>
                    <input
                      type="text"
                      value={notificationTitle}
                      onChange={(e) => setNotificationTitle(e.target.value)}
                      placeholder="Enter notification title..."
                      maxLength={200}
                      className="w-full px-4 py-3 bg-cream-200/60 border border-stone-300/50 rounded-xl text-stone-900 placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    />
                    <p className="text-stone-900/40 text-xs mt-1">
                      {notificationTitle.length}/200
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Message */}
                  <div>
                    <label className="block text-stone-900/80 text-sm mb-2">
                      Message
                    </label>
                    <textarea
                      value={notificationMessage}
                      onChange={(e) => setNotificationMessage(e.target.value)}
                      placeholder="Enter notification message..."
                      maxLength={2000}
                      rows={6}
                      className="w-full px-4 py-3 bg-cream-200/60 border border-stone-300/50 rounded-xl text-stone-900 placeholder-white/50 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    />
                    <p className="text-stone-900/40 text-xs mt-1">
                      {notificationMessage.length}/2000
                    </p>
                  </div>

                  {/* Send Button */}
                  <button
                    onClick={handleSendNotification}
                    disabled={
                      isSendingNotification ||
                      !notificationTitle.trim() ||
                      !notificationMessage.trim()
                    }
                    className="w-full py-4 bg-emerald-500 text-stone-900 rounded-xl hover:bg-emerald-600 transition-all duration-300 font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {isSendingNotification ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <MessageSquare className="w-5 h-5 mr-2" />
                        Send Notification
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Sent Notifications History */}
            <div className="bg-cream-100/80  border border-stone-300/50 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-stone-900 flex items-center">
                  <Clock className="w-6 h-6 mr-3 text-blue-400" />
                  Sent Notifications History
                </h3>
                <button
                  onClick={fetchSentNotifications}
                  disabled={isLoadingNotifications}
                  className="px-4 py-2 bg-cream-200/60 rounded-xl text-stone-900 hover:bg-cream-300/60 transition-all duration-300 flex items-center"
                >
                  <RefreshCw
                    className={`w-4 h-4 mr-2 ${
                      isLoadingNotifications ? "animate-spin" : ""
                    }`}
                  />
                  Refresh
                </button>
              </div>

              {isLoadingNotifications ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
                </div>
              ) : sentNotifications.length === 0 ? (
                <div className="text-center py-12">
                  <MessageSquare className="w-16 h-16 text-stone-900/20 mx-auto mb-4" />
                  <p className="text-stone-900/60">No notifications sent yet</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {sentNotifications.map((notif: any) => (
                    <div
                      key={notif._id}
                      className="bg-cream-100/80 rounded-xl p-4 border border-stone-300/40 hover:border-stone-300/50 transition-all duration-300"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span
                              className={`px-2 py-1 rounded-lg text-xs font-medium ${
                                notif.type === "announcement"
                                  ? "bg-purple-500/20 text-purple-400"
                                  : notif.type === "success"
                                  ? "bg-green-500/20 text-green-400"
                                  : notif.type === "warning"
                                  ? "bg-yellow-500/20 text-yellow-400"
                                  : notif.type === "error"
                                  ? "bg-red-500/20 text-red-400"
                                  : "bg-blue-500/20 text-blue-400"
                              }`}
                            >
                              {notif.type?.toUpperCase()}
                            </span>
                            <span
                              className={`px-2 py-1 rounded-lg text-xs font-medium ${
                                notif.isBroadcast
                                  ? "bg-emerald-500/20 text-emerald-400"
                                  : "bg-cyan-500/20 text-cyan-400"
                              }`}
                            >
                              {notif.isBroadcast ? "Broadcast" : "Individual"}
                            </span>
                          </div>
                          <h4 className="text-stone-900 font-semibold">
                            {notif.title}
                          </h4>
                          <p className="text-stone-900/60 text-sm mt-1 line-clamp-2">
                            {notif.message}
                          </p>
                          <div className="flex items-center gap-4 mt-3 text-stone-900/40 text-xs">
                            <span>
                              Sent by: {notif.sentBy?.name || "Admin"}
                            </span>
                            {notif.userId && (
                              <span>
                                To: {notif.userId?.name || notif.userId?.email}
                              </span>
                            )}
                            <span>
                              {formatDateTime(notif.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Monthly Payouts Tab */}
        {activeTab === "payouts" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* Payout Summary Stats */}
            {payoutSummary && (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gradient-to-r from-emerald-500/20 to-green-400/20 border border-emerald-500/30 rounded-xl p-4">
                  <p className="text-emerald-400 text-sm font-medium">Total Users</p>
                  <p className="text-2xl font-bold text-stone-900">{payoutSummary.total}</p>
                </div>
                <div className="bg-gradient-to-r from-blue-500/20 to-cyan-400/20 border border-blue-500/30 rounded-xl p-4">
                  <p className="text-blue-400 text-sm font-medium">Eligible for Payout</p>
                  <p className="text-2xl font-bold text-stone-900">{payoutSummary.eligible}</p>
                </div>
                <div className="bg-gradient-to-r from-yellow-500/20 to-orange-400/20 border border-yellow-500/30 rounded-xl p-4">
                  <p className="text-yellow-400 text-sm font-medium">Not Yet Eligible</p>
                  <p className="text-2xl font-bold text-stone-900">{payoutSummary.notYetEligible}</p>
                </div>
                <div className="bg-gradient-to-r from-purple-500/20 to-pink-400/20 border border-purple-500/30 rounded-xl p-4">
                  <p className="text-purple-400 text-sm font-medium">Eligible Staked Amount</p>
                  <p className="text-2xl font-bold text-stone-900">${formatCurrency(payoutSummary.totalEligibleStaked ?? payoutSummary.totalMaturedStaked ?? 0)}</p>
                </div>
              </div>
            )}

            {/* Payout Distribution Form */}
            <div className="bg-cream-100/80 border border-stone-300/50 rounded-2xl p-6">
              <h3 className="text-xl font-bold text-stone-900 mb-6 flex items-center">
                <Gift className="w-6 h-6 mr-3 text-emerald-400" />
                Distribute 30-Day Interval Payout
              </h3>
              <p className="text-stone-900/60 text-sm mb-4">
                Each 90-day stake receives <strong>3 payouts</strong> -- one every 30 days. 
                Only stakes that have passed their next 30-day interval are shown as eligible.
              </p>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                <div>
                  <label className="block text-stone-900/80 text-sm mb-2">
                    Payout Percentage (% of Staked Amount)
                  </label>
                  <input
                    type="number"
                    min="0.01"
                    max="100"
                    step="0.01"
                    value={payoutPercentage}
                    onChange={(e) => setPayoutPercentage(e.target.value)}
                    placeholder="Enter percentage (e.g., 8.5)"
                    className="w-full px-4 py-3 bg-cream-200/60 border border-stone-300/50 rounded-xl text-stone-900 placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                  <p className="text-stone-900/60 text-xs mt-1">
                    Range: 0.01% - 100%
                  </p>
                </div>
                
                <div>
                  <label className="block text-stone-900/80 text-sm mb-2">
                    Selected Users
                  </label>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={handleSelectAllEligible}
                      className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all border ${
                        selectedPayoutUsers.length === eligibleUsers.filter(u => u.selectable).length && eligibleUsers.filter(u => u.selectable).length > 0
                          ? "bg-emerald-500 text-white border-emerald-500 hover:bg-emerald-600"
                          : "bg-emerald-500/15 text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/25"
                      }`}
                    >
                      {selectedPayoutUsers.length === eligibleUsers.filter(u => u.selectable).length && eligibleUsers.filter(u => u.selectable).length > 0
                        ? "✓ Deselect All"
                        : "☑ Select All Eligible"}
                    </button>
                    <span className="px-3 py-2 bg-stone-100 border border-stone-200 rounded-xl text-stone-700 text-sm font-medium">
                      {selectedPayoutUsers.length} / {eligibleUsers.filter(u => u.selectable).length} selected
                    </span>
                    {selectedPayoutUsers.length > 0 && (
                      <button
                        onClick={() => setSelectedPayoutUsers([])}
                        className="px-3 py-2 bg-stone-100 border border-stone-200 rounded-xl text-stone-500 text-sm hover:bg-stone-200 transition-colors flex items-center gap-1"
                      >
                        <X className="w-3.5 h-3.5" /> Clear
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex items-end">
                  <button
                    onClick={handleDistributePayouts}
                    disabled={isDistributingPayouts || !payoutPercentage || parseFloat(payoutPercentage) <= 0}
                    className="w-full py-3 px-4 bg-emerald-500 text-black rounded-xl hover:bg-emerald-600 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {isDistributingPayouts ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Distributing...
                      </>
                    ) : (
                      <>
                        <Gift className="w-5 h-5 mr-2" />
                        Distribute Payout
                      </>
                    )}
                  </button>
                </div>
              </div>

              {payoutPercentage && parseFloat(payoutPercentage) > 0 && payoutSummary && (
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 mb-4">
                  <h4 className="text-emerald-400 font-semibold mb-2">Payout Preview</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-stone-900/60">Percentage:</span>
                      <span className="text-stone-900 font-semibold ml-2">{payoutPercentage}%</span>
                    </div>
                    <div>
                      <span className="text-stone-900/60">Total to Distribute:</span>
                      <span className="text-stone-900 font-semibold ml-2">
                        ${formatCurrency(payoutSummary.totalMaturedStaked * (parseFloat(payoutPercentage) / 100))}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Eligible Users Table */}
            <div className="bg-cream-100/80 border border-stone-300/50 rounded-2xl overflow-hidden">
              <div className="p-6 border-b border-stone-300/40">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-bold text-stone-900 flex items-center">
                      <Users className="w-5 h-5 mr-2" />
                      Eligible Users for Payout
                    </h3>
                    <p className="text-stone-900/60 text-sm mt-1">
                      Only users whose staking period has ended are selectable for payouts
                    </p>
                  </div>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                    <input type="text" value={payoutsSearch} onChange={(e) => setPayoutsSearch(e.target.value)}
                      placeholder="Search by name or email..." className="pl-9 pr-4 py-2 bg-cream-200/60 border border-stone-300/50 rounded-xl text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 w-full sm:w-64" />
                  </div>
                </div>
              </div>

              {isLoadingPayouts ? (
                <div className="p-8 text-center">
                  <Loader2 className="w-8 h-8 text-emerald-400 animate-spin mx-auto mb-4" />
                  <p className="text-stone-900/60">Loading eligible users...</p>
                </div>
              ) : eligibleUsers.length === 0 ? (
                <div className="p-8 text-center">
                  <Users className="w-12 h-12 text-stone-900/40 mx-auto mb-4" />
                  <p className="text-stone-900/60">No users with active stakes found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-cream-100/80">
                      <tr>
                        <th className="text-left p-4 text-stone-900/80 font-medium">
                          <input
                            type="checkbox"
                            checked={selectedPayoutUsers.length === eligibleUsers.filter(u => u.selectable).length && eligibleUsers.filter(u => u.selectable).length > 0}
                            onChange={handleSelectAllEligible}
                            className="rounded border-stone-300"
                          />
                        </th>
                        <th className="text-left p-4 text-stone-900/80 font-medium">User</th>
                        <th className="text-left p-4 text-stone-900/80 font-medium">Total Staked</th>
                        <th className="text-left p-4 text-stone-900/80 font-medium">Matured Amount</th>
                        <th className="text-left p-4 text-stone-900/80 font-medium">Stakes Status</th>
                        <th className="text-left p-4 text-stone-900/80 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPayoutUsers.map((user, index) => (
                        <motion.tr
                          key={user.userId}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className={`border-b border-stone-300/40 transition-colors ${
                            user.selectable 
                              ? "hover:bg-cream-100/80" 
                              : "bg-stone-100/50 opacity-60"
                          }`}
                        >
                          <td className="p-4">
                            <input
                              type="checkbox"
                              checked={selectedPayoutUsers.includes(user.userId)}
                              onChange={() => handleToggleUserSelection(user.userId)}
                              disabled={!user.selectable}
                              className="rounded border-stone-300 disabled:opacity-30"
                            />
                          </td>
                          <td className="p-4">
                            <div>
                              <p className="text-stone-900 font-medium">{user.name}</p>
                              <p className="text-stone-900/60 text-sm">{user.email}</p>
                            </div>
                          </td>
                          <td className="p-4">
                            <span className="text-stone-900 font-semibold">
                              ${formatCurrency(user.totalStakedAmount)}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className="text-emerald-400 font-semibold">
                              ${formatCurrency(user.eligibleStakedAmount || user.maturedStakedAmount || 0)}
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="space-y-2">
                              {user.stakes.map((stake: any) => {
                                const payoutsGiven = stake.payoutsGiven ?? 0;
                                const totalSlots = stake.totalPayoutSlots ?? 3;
                                const daysElapsed = stake.daysElapsed ?? 0;
                                const nextPayoutDay = (payoutsGiven + 1) * 30;
                                const daysUntilNext = Math.max(0, nextPayoutDay - daysElapsed);
                                const eligible = stake.isEligibleForPayout;
                                const done = payoutsGiven >= totalSlots;
                                return (
                                  <div key={stake.stakeId} className={`rounded-lg border p-2.5 text-xs ${done ? "bg-gray-100 border-gray-300" : eligible ? "bg-emerald-50 border-emerald-400" : "bg-amber-50 border-amber-400"}`}>
                                    <div className="flex items-center justify-between mb-1.5">
                                      <span className="font-bold text-gray-900 text-sm">${formatCurrency(stake.amount)} USDT</span>
                                      <span className={`font-semibold text-xs px-2 py-0.5 rounded-full ${done ? "bg-gray-200 text-gray-600" : eligible ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                                        Payout {payoutsGiven}/{totalSlots}
                                      </span>
                                    </div>
                                    <div className="h-1.5 bg-gray-200 rounded-full mb-2">
                                      <div className={`h-full rounded-full ${eligible ? "bg-emerald-500" : "bg-amber-400"}`} style={{ width: `${Math.min((daysElapsed / 90) * 100, 100)}%` }} />
                                    </div>
                                    <div className="flex justify-between text-gray-700">
                                      <span>{daysElapsed} days old</span>
                                      {!done && <span className={eligible ? "text-emerald-700 font-semibold" : "text-amber-700"}>{eligible ? "Ready for payout" : `${daysUntilNext}d until next payout`}</span>}
                                      {done && <span className="text-gray-500">All payouts done</span>}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </td>
                          <td className="p-4">
                            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${user.selectable ? "bg-emerald-100 text-emerald-700 border border-emerald-400" : "bg-amber-100 text-amber-700 border border-amber-400"}`}>
                              {user.selectable ? "Eligible" : "Not Yet Eligible"}
                            </span>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Payout History */}
            <div className="bg-cream-100/80 border border-stone-300/50 rounded-2xl overflow-hidden">
              <div className="p-6 border-b border-stone-300/40">
                <h3 className="text-lg font-bold text-stone-900 flex items-center">
                  <History className="w-5 h-5 mr-2" />
                  Recent Payout History
                </h3>
              </div>

              {payoutHistory.length === 0 ? (
                <div className="p-8 text-center">
                  <History className="w-12 h-12 text-stone-900/40 mx-auto mb-4" />
                  <p className="text-stone-900/60">No payouts distributed yet</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-cream-100/80">
                      <tr>
                        <th className="text-left p-4 text-stone-900/80 font-medium">User</th>
                        <th className="text-left p-4 text-stone-900/80 font-medium">Amount</th>
                        <th className="text-left p-4 text-stone-900/80 font-medium">Percentage</th>
                        <th className="text-left p-4 text-stone-900/80 font-medium">Date</th>
                        <th className="text-left p-4 text-stone-900/80 font-medium">Admin</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payoutHistory.slice(0, 20).map((payout, index) => (
                        <tr key={payout.id} className="border-b border-stone-300/40 hover:bg-cream-100/80 transition-colors">
                          <td className="p-4">
                            <div>
                              <p className="text-stone-900 font-medium">{payout.user?.name || "Unknown"}</p>
                              <p className="text-stone-900/60 text-sm">{payout.user?.email}</p>
                            </div>
                          </td>
                          <td className="p-4">
                            <span className="text-emerald-400 font-semibold">
                              ${formatCurrency(payout.amount)}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className="text-stone-900 font-medium">
                              {payout.metadata?.payoutPercentage || "N/A"}%
                            </span>
                          </td>
                          <td className="p-4">
                            <span className="text-stone-900/60 text-sm">
                              {formatDateTime(payout.completed_at)}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className="text-stone-900/60 text-sm">
                              {payout.metadata?.adminEmail || "Admin"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ── Total Users Tab ─────────────────────────────────────── */}
        {activeTab === "total-users" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-cream-100/80 border border-stone-300/50 rounded-2xl overflow-hidden"
          >
            <div className="p-4 sm:p-6 border-b border-stone-300/40">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-stone-900">Total Users</h2>
                  <p className="text-stone-900/60 text-sm mt-1">All registered users with full account details</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-emerald-500/20 text-emerald-700 text-sm font-semibold rounded-full">
                    {allUsersDetailed.length} users
                  </span>
                  <button
                    onClick={() => fetchAllUsersDetailed(allUsersDetailedSearch)}
                    className="p-2 bg-cream-200/60 hover:bg-cream-300/60 rounded-xl transition-colors"
                  >
                    <RefreshCw className="w-4 h-4 text-stone-900/60" />
                  </button>
                </div>
              </div>

              {/* Search */}
              <div className="relative mt-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-900/50" />
                <input
                  type="text"
                  value={allUsersDetailedSearch}
                  onChange={(e) => {
                    setAllUsersDetailedSearch(e.target.value);
                    clearTimeout((window as any).__userSearchTimer);
                    (window as any).__userSearchTimer = setTimeout(() => {
                      fetchAllUsersDetailed(e.target.value);
                    }, 400);
                  }}
                  placeholder="Search by name or email..."
                  className="w-full pl-10 pr-4 py-2.5 bg-cream-200/60 border border-stone-300/50 rounded-xl text-stone-900 placeholder-stone-900/40 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
              </div>
            </div>

            {allUsersDetailedLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
              </div>
            ) : allUsersDetailedError ? (
              <div className="p-8 text-center">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <AlertTriangle className="w-6 h-6 text-red-500" />
                </div>
                <p className="text-stone-900 font-semibold mb-1">Failed to load users</p>
                <p className="text-stone-900/60 text-sm mb-4">{allUsersDetailedError}</p>
                <button
                  onClick={() => fetchAllUsersDetailed(allUsersDetailedSearch)}
                  className="px-4 py-2 bg-emerald-500 text-black rounded-xl text-sm font-semibold hover:bg-emerald-600 transition-colors"
                >
                  Retry
                </button>
              </div>
            ) : allUsersDetailed.length === 0 ? (
              <div className="p-8 text-center text-stone-900/50">No users found.</div>
            ) : (
              <div className="divide-y divide-stone-300/30">
                {allUsersDetailed.map((u: any) => (
                  <div
                    key={u.id}
                    className="p-4 sm:p-5 hover:bg-cream-200/40 cursor-pointer transition-colors"
                    onClick={() => setSelectedUserDetail(selectedUserDetail?.id === u.id ? null : u)}
                  >
                    {/* Row summary */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center flex-shrink-0">
                          <User className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                          <p className="text-stone-900 font-semibold text-sm">{u.name || "--"}</p>
                          <p className="text-stone-900/60 text-xs">{u.email}</p>
                          <p className="text-stone-900/40 text-xs">Joined {formatDate(u.createdAt)}</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs">
                        <span className="px-2 py-1 bg-emerald-500/15 text-emerald-700 rounded-lg font-medium">
                          Balance: ${(u.wallet?.balance ?? 0).toFixed(2)}
                        </span>
                        <span className="px-2 py-1 bg-blue-500/15 text-blue-700 rounded-lg font-medium">
                          Staked: ${(u.wallet?.stakedAmount ?? 0).toFixed(2)}
                        </span>
                        <span className="px-2 py-1 bg-purple-500/15 text-purple-700 rounded-lg font-medium">
                          Business: ${(u.stats?.totalBusiness ?? 0).toFixed(2)}
                        </span>
                        <span className={`px-2 py-1 rounded-lg font-medium ${u.isActive ? "bg-emerald-500/15 text-emerald-700" : "bg-red-500/15 text-red-700"}`}>
                          {u.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </div>

                    {/* Expanded detail panel */}
                    {selectedUserDetail?.id === u.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="mt-4 pt-4 border-t border-stone-300/40 overflow-hidden"
                      >
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                          {[
                            { label: "Total Balance",    value: `$${(u.wallet?.balance ?? 0).toFixed(2)}`,          color: "emerald" },
                            { label: "Currently Staked", value: `$${(u.wallet?.stakedAmount ?? 0).toFixed(2)}`,     color: "blue" },
                            { label: "Total Deposited",  value: `$${(u.wallet?.totalDeposited ?? 0).toFixed(2)}`,   color: "purple" },
                            { label: "Total Withdrawn",  value: `$${(u.wallet?.totalWithdrawn ?? 0).toFixed(2)}`,   color: "orange" },
                            { label: "Total Earnings",   value: `$${(u.wallet?.totalEarnings ?? 0).toFixed(2)}`,    color: "yellow" },
                            { label: "Total Business",   value: `$${(u.stats?.totalBusiness ?? 0).toFixed(2)}`,     color: "pink" },
                            { label: "Referrals (L1)",   value: u.stats?.level1ReferralCount ?? 0,                  color: "cyan" },
                            { label: "Transactions",     value: u.stats?.totalTransactions ?? 0,                    color: "slate" },
                          ].map((item) => (
                            <div key={item.label} className={`p-3 bg-${item.color}-500/10 border border-${item.color}-500/20 rounded-xl`}>
                              <p className="text-stone-900/60 text-xs mb-1">{item.label}</p>
                              <p className="text-stone-900 font-bold text-sm">{item.value}</p>
                            </div>
                          ))}
                        </div>

                        {/* Active Stakes */}
                        {u.activeStakes && u.activeStakes.length > 0 && (
                          <div className="mb-3">
                            <p className="text-stone-900/60 text-xs font-semibold uppercase mb-2">Active Stakes</p>
                            <div className="space-y-2">
                              {u.activeStakes.map((s: any) => {
                                const end = new Date(s.endDate);
                                const daysLeft = Math.max(0, Math.ceil((end.getTime() - Date.now()) / 86400000));
                                return (
                                  <div key={s.stakeId} className="flex items-center justify-between p-2.5 bg-cream-200/60 border border-stone-300/40 rounded-lg text-xs">
                                    <div>
                                      <span className="text-stone-900 font-semibold">${s.amount.toFixed(2)} USDT</span>
                                      <span className="text-stone-900/50 ml-2">· {s.packageType}</span>
                                    </div>
                                    <div className="text-right">
                                      <span className="text-stone-900/60">{daysLeft} days left</span>
                                      <span className="text-stone-900/40 ml-2">ends {end.toLocaleDateString()}</span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Account Info */}
                        <div className="flex flex-wrap gap-3 text-xs text-stone-900/60">
                          {u.referralCode && (
                            <span>Ref Code: <span className="text-stone-900 font-mono font-semibold">{u.referralCode}</span></span>
                          )}
                          {u.lastLogin && (
                            <span>Last Login: {formatDate(u.lastLogin)}</span>
                          )}
                          <span>Role: <span className="capitalize font-semibold text-stone-900">{u.role}</span></span>
                        </div>

                        {/* KYC Details */}
                        {(u.aadharNumber || u.panNumber || u.permanentAddress || u.dateOfBirth) && (
                          <div className="mt-3 pt-3 border-t border-stone-200">
                            <p className="text-stone-900/60 text-xs font-semibold uppercase mb-2">KYC / Personal Details</p>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                              {u.aadharNumber && (
                                <div className="p-2.5 bg-blue-500/8 border border-blue-500/15 rounded-xl">
                                  <p className="text-stone-900/50 text-[10px] mb-0.5">Aadhaar</p>
                                  <p className="text-stone-900 font-mono font-semibold text-xs">
                                    XXXX-XXXX-{u.aadharNumber.slice(-4)}
                                  </p>
                                </div>
                              )}
                              {u.panNumber && (
                                <div className="p-2.5 bg-purple-500/8 border border-purple-500/15 rounded-xl">
                                  <p className="text-stone-900/50 text-[10px] mb-0.5">PAN</p>
                                  <p className="text-stone-900 font-mono font-semibold text-xs">{u.panNumber}</p>
                                </div>
                              )}
                              {u.dateOfBirth && (
                                <div className="p-2.5 bg-emerald-500/8 border border-emerald-500/15 rounded-xl">
                                  <p className="text-stone-900/50 text-[10px] mb-0.5">Date of Birth</p>
                                  <p className="text-stone-900 font-semibold text-xs">
                                    {new Date(u.dateOfBirth).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                                  </p>
                                </div>
                              )}
                              {u.permanentAddress && (
                                <div className="p-2.5 bg-orange-500/8 border border-orange-500/15 rounded-xl sm:col-span-2">
                                  <p className="text-stone-900/50 text-[10px] mb-0.5">Permanent Address</p>
                                  <p className="text-stone-900 text-xs leading-relaxed">{u.permanentAddress}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* Response Modal */}
      <AnimatePresence>
        {responseModal.open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-stone-900/40  z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-cream-100 border border-stone-300/50 rounded-2xl p-6 max-w-md w-full"
            >
              <h3 className="text-xl font-bold text-stone-900 mb-4">
                Respond to Issue
              </h3>

              <div className="mb-4">
                <label className="block text-stone-900/80 text-sm mb-2">
                  Your Response
                </label>
                <textarea
                  value={adminResponse}
                  onChange={(e) => setAdminResponse(e.target.value)}
                  className="w-full h-32 px-4 py-2 bg-cream-200/60 border border-stone-300/50 rounded-xl text-stone-900 placeholder-white/50 resize-none focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                  placeholder="Type your response to the user..."
                  maxLength={2000}
                />
                <p className="text-stone-900/40 text-xs mt-1">
                  {adminResponse.length}/2000
                </p>
              </div>

              <div className="flex items-center space-x-3">
                <button
                  onClick={() => {
                    if (responseModal.issueId) {
                      handleRespondToIssue(
                        responseModal.issueId,
                        adminResponse
                      );
                    }
                  }}
                  disabled={!adminResponse.trim()}
                  className="flex-1 py-3 px-4 bg-cyan-500 text-stone-900 rounded-xl hover:bg-cyan-600 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Send Response
                </button>

                <button
                  onClick={() => {
                    setResponseModal({ open: false, issueId: null });
                    setAdminResponse("");
                  }}
                  className="flex-1 py-3 px-4 bg-cream-200/60 text-stone-900 rounded-xl hover:bg-cream-300/60 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Comment Modal */}
      <AnimatePresence>
        {commentModal.open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={closeCommentModal}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white border border-gray-200 rounded-2xl p-6 max-w-lg w-full shadow-2xl"
            >
              {(() => {
                // Find the transaction being processed
                const currentTransaction = pendingTransactions.find(
                  tx => tx._id === commentModal.txId
                );
                
                return (
                  <>
                    <div className="text-center mb-6">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        {commentModal.action === "approve"
                          ? "Approve Transaction"
                          : "Reject Transaction"}
                      </h3>
                      
                      {/* Transaction Details */}
                      {currentTransaction && (
                        <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">Amount:</span>
                            <span className="font-bold text-gray-900">
                              {currentTransaction.amount?.toLocaleString()} {currentTransaction.currency || 'USDT'}
                            </span>
                          </div>
                          {currentTransaction.network && (
                            <div className="flex justify-between items-center">
                              <span className="text-gray-600">Network:</span>
                              <span className="text-blue-600 font-medium">
                                {currentTransaction.network}
                              </span>
                            </div>
                          )}
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">Type:</span>
                            <span className="uppercase font-medium text-gray-900">
                              {currentTransaction.type}
                            </span>
                          </div>
                          {currentTransaction.userId?.name && (
                            <div className="flex justify-between items-center">
                              <span className="text-gray-600">User:</span>
                              <span className="font-medium text-gray-900">
                                {currentTransaction.userId.name}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="mb-6">
                      <label className="block text-gray-700 text-sm font-medium mb-2">
                        {commentModal.action === "reject"
                          ? "Rejection Reason (Required)"
                          : "Comment (Optional)"}
                      </label>
                      <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        className="w-full h-28 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-500 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        placeholder={
                          commentModal.action === "reject"
                            ? "Please provide a clear reason for rejection..."
                            : "Optional comment..."
                        }
                      />
                      {commentModal.action === "reject" && !comment.trim() && (
                        <p className="text-red-500 text-xs mt-1">
                          Rejection reason is required
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => {
                          if (commentModal.txId) {
                            closeCommentModal();
                            if (commentModal.action === "approve") {
                              handleApprove(commentModal.txId, comment);
                            } else {
                              handleReject(commentModal.txId, comment);
                            }
                          }
                        }}
                        disabled={commentModal.action === "reject" && !comment.trim()}
                        className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all duration-200 ${
                          commentModal.action === "approve"
                            ? "bg-green-500 hover:bg-green-600 text-white shadow-lg hover:shadow-green-500/25"
                            : "bg-red-500 hover:bg-red-600 text-white shadow-lg hover:shadow-red-500/25"
                        } disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none`}
                      >
                        {commentModal.action === "approve" ? "Approve" : "Reject"}
                      </button>

                      <button
                        onClick={closeCommentModal}
                        className="flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-all duration-200"
                      >
                        Cancel
                      </button>
                    </div>
                  </>
                );
              })()}
            </motion.div>
          </motion.div>
        )}

        {/* Cancel Stake Modal */}
        {cancelStakeModal.open && cancelStakeModal.user && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[9999] p-4"
            onClick={() =>
              setCancelStakeModal({
                open: false,
                user: null,
                selectedStakeId: null,
              })
            }
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white border border-stone-200 rounded-2xl shadow-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="w-6 h-6 text-red-500" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-stone-900">Cancel Stake</h3>
                    <p className="text-stone-500 text-sm">A 10% early cancellation penalty will be applied</p>
                  </div>
                </div>
                <button
                  onClick={() => setCancelStakeModal({ open: false, user: null, selectedStakeId: null })}
                  className="p-2 hover:bg-stone-100 rounded-xl transition-colors text-stone-400 hover:text-stone-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* User Info */}
              <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 mb-4">
                <div className="flex justify-between mb-2">
                  <span className="text-stone-500 text-sm">User:</span>
                  <span className="text-stone-900 font-semibold">{cancelStakeModal.user.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500 text-sm">Email:</span>
                  <span className="text-stone-700 text-sm">{cancelStakeModal.user.email}</span>
                </div>
              </div>

              {/* Individual Stakes */}
              {cancelStakeModal.user.wallet?.stakes &&
              cancelStakeModal.user.wallet.stakes.filter((s: any) => s.status === "active").length > 0 ? (
                <div className="mb-4">
                  <h4 className="text-stone-700 font-semibold mb-3 text-sm uppercase tracking-wide">Active Stakes</h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {cancelStakeModal.user.wallet.stakes
                      .filter((stake: any) => stake.status === "active")
                      .map((stake: any) => (
                        <div
                          key={stake.stakeId}
                          className={`rounded-xl p-3 border-2 transition-all cursor-pointer ${
                            cancelStakeModal.selectedStakeId === stake.stakeId
                              ? "border-red-400 bg-red-50"
                              : "border-stone-200 bg-stone-50 hover:border-stone-300"
                          }`}
                          onClick={() =>
                            setCancelStakeModal({
                              ...cancelStakeModal,
                              selectedStakeId:
                                cancelStakeModal.selectedStakeId === stake.stakeId ? null : stake.stakeId,
                            })
                          }
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-blue-600 font-bold text-base">${stake.amount?.toLocaleString()} USDT</p>
                              <p className="text-stone-500 text-xs mt-0.5 capitalize">{stake.packageType} package</p>
                              <p className="text-stone-400 text-xs">{formatDate(stake.startDate)} - {formatDate(stake.endDate)}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-red-500 text-sm font-semibold">-${(stake.amount * 0.1).toLocaleString()}</p>
                              <p className="text-stone-400 text-xs">penalty</p>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                  <p className="text-stone-400 text-xs mt-2">
                    {cancelStakeModal.selectedStakeId
                      ? "Tap again to deselect -- will cancel ALL stakes"
                      : "Tap a stake to cancel only that one, or leave all unselected to cancel ALL"}
                  </p>
                </div>
              ) : (
                <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 mb-4">
                  <div className="flex justify-between">
                    <span className="text-stone-500 text-sm">Total Staked:</span>
                    <span className="text-blue-600 font-bold">${cancelStakeModal.user.wallet?.stakedAmount?.toLocaleString() || 0}</span>
                  </div>
                </div>
              )}

              {/* Summary */}
              <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 mb-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-stone-500">{cancelStakeModal.selectedStakeId ? "Selected Stake:" : "All Stakes:"}</span>
                  <span className="text-blue-600 font-bold">
                    ${cancelStakeModal.selectedStakeId
                      ? cancelStakeModal.user.wallet?.stakes?.find((s: any) => s.stakeId === cancelStakeModal.selectedStakeId)?.amount?.toLocaleString() || 0
                      : cancelStakeModal.user.wallet?.stakedAmount?.toLocaleString() || 0}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-stone-500">Penalty (10%):</span>
                  <span className="text-red-500 font-bold">
                    -${cancelStakeModal.selectedStakeId
                      ? ((cancelStakeModal.user.wallet?.stakes?.find((s: any) => s.stakeId === cancelStakeModal.selectedStakeId)?.amount || 0) * 0.1).toLocaleString()
                      : ((cancelStakeModal.user.wallet?.stakedAmount || 0) * 0.1).toLocaleString()}
                  </span>
                </div>
                <div className="border-t border-stone-200 pt-2 flex justify-between text-sm font-semibold">
                  <span className="text-stone-700">Return to User:</span>
                  <span className="text-emerald-600 font-bold">
                    ${cancelStakeModal.selectedStakeId
                      ? ((cancelStakeModal.user.wallet?.stakes?.find((s: any) => s.stakeId === cancelStakeModal.selectedStakeId)?.amount || 0) * 0.9).toLocaleString()
                      : ((cancelStakeModal.user.wallet?.stakedAmount || 0) * 0.9).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Reason */}
              <div className="mb-5">
                <label className="block text-stone-700 text-sm font-medium mb-2">
                  Reason for Cancellation <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={cancelStakeReason}
                  onChange={(e) => setCancelStakeReason(e.target.value)}
                  className="w-full h-24 px-4 py-3 bg-white border border-stone-300 rounded-xl text-stone-900 placeholder-stone-400 resize-none focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-red-400 transition-all"
                  placeholder="Enter the reason for early stake cancellation..."
                />
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleCancelStake(cancelStakeModal.selectedStakeId)}
                  disabled={!cancelStakeReason.trim() || isCancellingStake}
                  className="flex-1 py-3 px-4 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                >
                  {isCancellingStake
                    ? "Processing..."
                    : cancelStakeModal.selectedStakeId
                    ? "Cancel Selected Stake"
                    : "Cancel All Stakes"}
                </button>
                <button
                  onClick={() => {
                    setCancelStakeModal({ open: false, user: null, selectedStakeId: null });
                    setCancelStakeReason("");
                  }}
                  className="flex-1 py-3 px-4 bg-stone-100 text-stone-700 rounded-xl hover:bg-stone-200 transition-colors font-medium"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Delete User Modal */}
        {deleteUserModal.open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80  flex items-center justify-center z-50 p-4"
            onClick={() => {
              setDeleteUserModal({ open: false, userId: null, userName: null });
              setDeleteConfirmText("");
              setDeleteReason("");
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-cream-100 border border-red-500/30 rounded-2xl p-6 max-w-lg w-full"
            >
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center">
                  <Trash2 className="w-6 h-6 text-red-500" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-red-400">
                    Delete User Permanently
                  </h3>
                  <p className="text-stone-900/60 text-sm">
                    This action cannot be undone
                  </p>
                </div>
              </div>

              {/* Warning */}
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-4">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-red-400 font-medium mb-2">
                      Warning: Permanent Deletion
                    </p>
                    <ul className="text-stone-900/70 text-sm space-y-1">
                      <li>- All user data will be permanently deleted</li>
                      <li>- Wallet and balance will be lost</li>
                      <li>- All transactions history will be removed</li>
                      <li>- All stakes will be deleted</li>
                      <li>- User will be removed from referral chains</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* User Info */}
              <div className="bg-cream-100/80 rounded-xl p-4 mb-4">
                <div className="flex justify-between mb-2">
                  <span className="text-stone-900/60">User to delete:</span>
                  <span className="text-red-400 font-semibold">
                    {deleteUserModal.userName}
                  </span>
                </div>
              </div>

              {/* Reason */}
              <div className="mb-4">
                <label className="block text-stone-900/80 text-sm mb-2">
                  Reason for Deletion (Optional - for audit log)
                </label>
                <textarea
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  className="w-full h-20 px-4 py-2 bg-cream-200/60 border border-stone-300/50 rounded-xl text-stone-900 placeholder-white/50 resize-none focus:outline-none focus:ring-2 focus:ring-red-500/50"
                  placeholder="Enter reason for deleting this user..."
                />
              </div>

              {/* Confirmation Input */}
              <div className="mb-6">
                <label className="block text-stone-900/80 text-sm mb-2">
                  Type <span className="text-red-400 font-bold">DELETE</span> to
                  confirm
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  className="w-full px-4 py-3 bg-cream-200/60 border border-stone-300/50 rounded-xl text-stone-900 placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-red-500/50"
                  placeholder="Type DELETE to confirm"
                />
              </div>

              <div className="flex items-center space-x-3">
                <button
                  onClick={handleDeleteUser}
                  disabled={deleteConfirmText !== "DELETE" || isDeletingUser}
                  className="flex-1 py-3 px-4 bg-red-600 text-stone-900 rounded-xl hover:bg-red-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isDeletingUser ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-5 h-5 mr-2" />
                      Delete User Forever
                    </>
                  )}
                </button>

                <button
                  onClick={() => {
                    setDeleteUserModal({
                      open: false,
                      userId: null,
                      userName: null,
                    });
                    setDeleteConfirmText("");
                    setDeleteReason("");
                  }}
                  className="flex-1 py-3 px-4 bg-cream-200/60 text-stone-900 rounded-xl hover:bg-cream-300/60 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}


