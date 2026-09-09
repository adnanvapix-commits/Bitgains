"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle,
  XCircle,
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
        setPendingTransactions(transactionsResponse.data.transactions);
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
        setStakingTransactions(response.data.transactions || []);
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
      const response = await adminApi.approveTransaction(txId, comment);

      if (response.success) {
        await fetchPendingTransactions();
        setCommentModal({ open: false, txId: null, action: null });
        setComment("");
      } else {
        setError(response.message);
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
      const response = await adminApi.rejectTransaction(txId, comment);

      if (response.success) {
        await fetchPendingTransactions();
        setCommentModal({ open: false, txId: null, action: null });
        setComment("");
      } else {
        setError(response.message);
      }
    } catch (error) {
      console.error("Error rejecting transaction:", error);
      setError(
        error instanceof Error ? error.message : "Failed to reject transaction"
      );
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
        setIssues(response.data.issues || []);
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
        setAllUsers(response.data.users);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
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
        targetStakeId // Pass specific stake ID or null to cancel all
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
        setAuditLogs(response.data.logs);
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
        // Expand first level by default
        setExpandedNodes(new Set([userId]));
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
        setSentNotifications(response.data.notifications);
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

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-crypto-black via-crypto-charcoal to-crypto-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
      </div>
    );
  }

  if (user.role !== "admin") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-crypto-black via-crypto-charcoal to-crypto-black flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Access Denied</h1>
          <p className="text-white/60">
            You need admin privileges to access this page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-crypto-black via-crypto-charcoal to-crypto-black">
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Header */}
        <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:items-center justify-between mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
              Admin Panel
            </h1>
            <p className="text-white/60 text-sm sm:text-base">
              Manage pending transactions and user staking
            </p>
          </div>

          <div className="flex items-center space-x-3 sm:space-x-4">
            {/* Admin Profile */}
            <div className="flex items-center space-x-3 px-3 sm:px-4 py-2 bg-white/5 rounded-xl border border-white/10">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-400 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <div className="hidden sm:block">
                <p className="text-white font-medium text-sm">
                  {user?.name || "Admin"}
                </p>
                <p className="text-white/60 text-xs">Administrator</p>
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

        {/* Global Search Bar */}
        <div className="relative mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/60" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() =>
                searchQuery.length >= 2 && setShowSearchResults(true)
              }
              placeholder="Search users, emails, transactions, wallet addresses..."
              className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50"
            />
            {isSearching && (
              <Loader2 className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-emerald-400 animate-spin" />
            )}
          </div>

          {/* Search Results Dropdown */}
          {showSearchResults && searchResults && (
            <div className="absolute z-50 w-full mt-2 bg-crypto-charcoal border border-white/20 rounded-xl shadow-2xl max-h-[32rem] overflow-y-auto">
              {searchResults.counts && (
                <div className="grid grid-cols-3 gap-2 p-3 border-b border-white/10 text-center">
                  <div className="bg-white/5 rounded-lg p-2">
                    <p className="text-xs text-white/60">Users</p>
                    <p className="text-white font-semibold text-lg">
                      {searchResults.counts.users}
                    </p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-2">
                    <p className="text-xs text-white/60">Transactions</p>
                    <p className="text-white font-semibold text-lg">
                      {searchResults.counts.transactions}
                    </p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-2">
                    <p className="text-xs text-white/60">Issues</p>
                    <p className="text-white font-semibold text-lg">
                      {searchResults.counts.issues}
                    </p>
                  </div>
                </div>
              )}

              {/* Users Results */}
              {userMatches.length > 0 && (
                <div className="p-3 border-b border-white/10">
                  <h4 className="text-xs font-semibold text-white/60 mb-3 flex items-center gap-2">
                    <User className="w-3 h-3" />
                    Users ({userMatches.length})
                  </h4>
                  {userMatches.map((match) => (
                    <div
                      key={match._id}
                      className="p-3 mb-2 last:mb-0 bg-white/5 rounded-lg"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-white font-medium text-sm">
                            {match.name}
                          </p>
                          <p className="text-white/60 text-xs">{match.email}</p>
                        </div>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded ${
                            match.isActive
                              ? "bg-emerald-500/20 text-emerald-400"
                              : "bg-red-500/20 text-red-400"
                          }`}
                        >
                          {match.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 mt-2 text-[11px]">
                        <span className="bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded">
                          Balance: ${formatCurrency(match.wallet?.balance)}
                        </span>
                        <span className="bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded">
                          Staked: ${formatCurrency(match.wallet?.stakedAmount)}
                        </span>
                        <span className="bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded">
                          Deposited: $
                          {formatCurrency(match.wallet?.totalDeposited)}
                        </span>
                        {match.referralCode && (
                          <span className="bg-pink-500/20 text-pink-300 px-2 py-0.5 rounded">
                            Ref: {match.referralCode}
                          </span>
                        )}
                      </div>
                      {match.recentTransactions?.length > 0 && (
                        <div className="mt-3 border-t border-white/10 pt-2">
                          <p className="text-white/60 text-[10px] uppercase mb-1">
                            Recent Activity
                          </p>
                          <div className="space-y-1">
                            {match.recentTransactions.map((tx) => (
                              <div
                                key={tx._id}
                                className="flex items-center justify-between text-[11px] text-white/70"
                              >
                                <div className="flex items-center gap-2">
                                  <ArrowUpRight className="w-3 h-3" />
                                  <span>{tx.type.toUpperCase()}</span>
                                </div>
                                <span>${formatCurrency(tx.amount)}</span>
                                <span
                                  className={`px-2 py-0.5 rounded ${getStatusBadgeClass(
                                    tx.status
                                  )}`}
                                >
                                  {tx.status}
                                </span>
                                <span>
                                  {new Date(tx.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Transactions Results */}
              {transactionMatches.length > 0 && (
                <div className="p-3 border-b border-white/10">
                  <h4 className="text-xs font-semibold text-white/60 mb-3 flex items-center gap-2">
                    <ArrowUpRight className="w-3 h-3" />
                    Transactions ({transactionMatches.length})
                  </h4>
                  {transactionMatches.map((tx) => (
                    <div
                      key={tx._id}
                      className="p-3 mb-2 last:mb-0 bg-white/5 rounded-lg"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-white font-medium text-sm">
                            {tx.userId?.name ||
                              tx.userId?.email ||
                              "Unknown User"}
                          </p>
                          <p className="text-white/60 text-xs">
                            {tx.userId?.email || "No email on record"}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-white font-semibold text-sm">
                            ${formatCurrency(tx.amount)}
                          </p>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded ${getStatusBadgeClass(
                              tx.status
                            )}`}
                          >
                            {tx.status}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-white/60 mt-2">
                        <span className="uppercase">{tx.type}</span>
                        {tx.network && <span>Network: {tx.network}</span>}
                        {tx.txHash && (
                          <span className="truncate">
                            Hash: {tx.txHash.slice(0, 10)}...
                          </span>
                        )}
                      </div>
                      {tx.description && (
                        <p className="text-white/60 text-xs mt-2 line-clamp-2">
                          {tx.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Issues Results */}
              {issueMatches.length > 0 && (
                <div className="p-3 border-b border-white/10">
                  <h4 className="text-xs font-semibold text-white/60 mb-3 flex items-center gap-2">
                    <MessageSquare className="w-3 h-3" />
                    Support Issues ({issueMatches.length})
                  </h4>
                  {issueMatches.map((issue) => (
                    <div
                      key={issue._id}
                      className="p-3 mb-2 last:mb-0 bg-white/5 rounded-lg"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-white font-medium text-sm">
                            {issue.subject}
                          </p>
                          <p className="text-white/60 text-xs">
                            {issue.userId?.email || "Unknown user"}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded ${getPriorityBadgeClass(
                              issue.priority
                            )}`}
                          >
                            {issue.priority}
                          </span>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded ${getStatusBadgeClass(
                              issue.status
                            )}`}
                          >
                            {issue.status}
                          </span>
                        </div>
                      </div>
                      {issue.description && (
                        <p className="text-white/60 text-xs mt-2 line-clamp-2">
                          {issue.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* No Results */}
              {userMatches.length === 0 &&
                transactionMatches.length === 0 &&
                issueMatches.length === 0 && (
                  <div className="p-4 text-center">
                    <Search className="w-8 h-8 text-white/20 mx-auto mb-2" />
                    <p className="text-white/60 text-sm">
                      No results found for "{searchQuery}"
                    </p>
                  </div>
                )}

              {/* Close Button */}
              <div className="p-2 border-t border-white/10">
                <button
                  onClick={() => {
                    setShowSearchResults(false);
                    setSearchQuery("");
                    setSearchResults(null);
                  }}
                  className="w-full py-2 text-white/60 hover:text-white text-sm transition-colors"
                >
                  Close Search
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 mb-6 sm:mb-8 bg-white/5 rounded-xl p-1 overflow-x-auto">
          <button
            onClick={() => setActiveTab("transactions")}
            className={`flex-shrink-0 px-4 py-3 rounded-lg font-medium transition-all duration-300 ${
              activeTab === "transactions"
                ? "bg-emerald-500 text-black shadow-lg"
                : "text-white/70 hover:text-white hover:bg-white/10"
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <Clock className="w-4 h-4" />
              <span>Pending</span>
              {pendingTransactions.length > 0 && (
                <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
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
                : "text-white/70 hover:text-white hover:bg-white/10"
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <TrendingUp className="w-4 h-4" />
              <span>Staking Activity</span>
              {stakingTransactions.length > 0 && (
                <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
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
                : "text-white/70 hover:text-white hover:bg-white/10"
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <Users className="w-4 h-4" />
              <span>User Staking</span>
              {users.length > 0 && (
                <span className="bg-purple-500 text-white text-xs px-2 py-1 rounded-full">
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
                : "text-white/70 hover:text-white hover:bg-white/10"
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
                : "text-white/70 hover:text-white hover:bg-white/10"
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
                : "text-white/70 hover:text-white hover:bg-white/10"
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
                : "text-white/70 hover:text-white hover:bg-white/10"
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
                : "text-white/70 hover:text-white hover:bg-white/10"
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
                : "text-white/70 hover:text-white hover:bg-white/10"
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <MessageSquare className="w-4 h-4" />
              <span>Push Notifications</span>
            </div>
          </button>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6 mb-6 sm:mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-r from-emerald-500/20 to-green-400/20 backdrop-blur-xl border border-emerald-500/30 rounded-xl sm:rounded-2xl p-4 sm:p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-emerald-400 text-xs sm:text-sm font-medium">
                    Pending Deposits
                  </p>
                  <p className="text-lg sm:text-2xl font-bold text-white">
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
              className="bg-gradient-to-r from-red-500/20 to-orange-400/20 backdrop-blur-xl border border-red-500/30 rounded-xl sm:rounded-2xl p-4 sm:p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-400 text-xs sm:text-sm font-medium">
                    Pending Withdrawals
                  </p>
                  <p className="text-lg sm:text-2xl font-bold text-white">
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
              className="bg-gradient-to-r from-blue-500/20 to-cyan-400/20 backdrop-blur-xl border border-blue-500/30 rounded-xl sm:rounded-2xl p-4 sm:p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-400 text-xs sm:text-sm font-medium">
                    Total Users
                  </p>
                  <p className="text-lg sm:text-2xl font-bold text-white">
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
              className="bg-gradient-to-r from-purple-500/20 to-pink-400/20 backdrop-blur-xl border border-purple-500/30 rounded-xl sm:rounded-2xl p-4 sm:p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-400 text-xs sm:text-sm font-medium">
                    Total Staked
                  </p>
                  <p className="text-lg sm:text-2xl font-bold text-white">
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
              className="bg-gradient-to-r from-yellow-500/20 to-orange-400/20 backdrop-blur-xl border border-yellow-500/30 rounded-xl sm:rounded-2xl p-4 sm:p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-400 text-xs sm:text-sm font-medium">
                    Total Balance
                  </p>
                  <p className="text-lg sm:text-2xl font-bold text-white">
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
                <Filter className="w-4 h-4 text-white/60" />
                <span className="text-white/60 text-sm">Filter:</span>
              </div>

              <div className="flex flex-wrap gap-2">
                {["all", "deposit", "withdrawal"].map((filterOption) => (
                  <button
                    key={filterOption}
                    onClick={() => setFilter(filterOption)}
                    className={`px-3 sm:px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                      filter === filterOption
                        ? "bg-emerald-500 text-black"
                        : "bg-white/10 text-white/70 hover:bg-white/20"
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
              className="bg-white/5 backdrop-blur-xl border border-white/20 rounded-xl sm:rounded-2xl overflow-hidden"
            >
              <div className="p-4 sm:p-6 border-b border-white/10">
                <h2 className="text-lg sm:text-xl font-bold text-white">
                  Pending Transactions
                </h2>
              </div>

              {isLoading ? (
                <div className="p-8 sm:p-12 text-center">
                  <Loader2 className="w-8 h-8 text-emerald-400 animate-spin mx-auto mb-4" />
                  <p className="text-white/60 text-sm sm:text-base">
                    Loading transactions...
                  </p>
                </div>
              ) : pendingTransactions.length === 0 ? (
                <div className="p-8 sm:p-12 text-center">
                  <Clock className="w-10 h-10 sm:w-12 sm:h-12 text-white/40 mx-auto mb-4" />
                  <p className="text-white/60 text-sm sm:text-base">
                    No pending transactions found
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[900px]">
                    <thead className="bg-white/5">
                      <tr>
                        <th className="text-left p-3 sm:p-4 text-white/80 font-medium text-sm">
                          User
                        </th>
                        <th className="text-left p-3 sm:p-4 text-white/80 font-medium text-sm">
                          Type
                        </th>
                        <th className="text-left p-3 sm:p-4 text-white/80 font-medium text-sm">
                          Amount
                        </th>
                        <th className="text-left p-3 sm:p-4 text-white/80 font-medium text-sm">
                          Address
                        </th>
                        <th className="text-left p-3 sm:p-4 text-white/80 font-medium text-sm">
                          Date
                        </th>
                        <th className="text-left p-3 sm:p-4 text-white/80 font-medium text-sm">
                          Status
                        </th>
                        <th className="text-left p-3 sm:p-4 text-white/80 font-medium text-sm">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingTransactions.map((tx, index) => (
                        <motion.tr
                          key={tx._id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="border-b border-white/10 hover:bg-white/5 transition-colors"
                        >
                          <td className="p-3 sm:p-4">
                            <div>
                              <p className="text-white font-medium text-sm sm:text-base">
                                {tx.userId?.name}
                              </p>
                              <p className="text-white/60 text-xs sm:text-sm">
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
                              <p className="text-white font-bold text-sm sm:text-base">
                                {tx.amount.toLocaleString()} {tx.currency}
                              </p>
                              {tx.fee?.amount && tx.fee.amount > 0 && (
                                <p className="text-white/60 text-xs">
                                  Fee: {tx.fee.amount} {tx.currency}
                                </p>
                              )}
                            </div>
                          </td>
                          <td className="p-3 sm:p-4">
                            <div>
                              {tx.type === "withdrawal" && tx.toAddress ? (
                                <div className="space-y-1">
                                  <p className="text-white/60 text-xs">
                                    Withdrawal Address:
                                  </p>
                                  <p className="text-white text-xs font-mono break-all">
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
                                      <p className="text-white/60 text-xs">
                                        From Address:
                                      </p>
                                      <p className="text-white text-xs font-mono break-all">
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
                                    <div className="space-y-1 mt-2 pt-2 border-t border-white/10">
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
                                <span className="text-white/40 text-xs">
                                  N/A
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-3 sm:p-4">
                            <div className="text-white/80">
                              <p className="text-sm">
                                {new Date(tx.submittedAt).toLocaleDateString()}
                              </p>
                              <p className="text-xs text-white/60">
                                {new Date(tx.submittedAt).toLocaleTimeString()}
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
            className="bg-white/5 backdrop-blur-xl border border-white/20 rounded-xl sm:rounded-2xl overflow-hidden"
          >
            <div className="p-4 sm:p-6 border-b border-white/10">
              <h2 className="text-lg sm:text-xl font-bold text-white">
                Staking Activity
              </h2>
              <p className="text-white/60 text-sm mt-1">
                All stake and unstake transactions
              </p>
            </div>

            {isLoadingStaking ? (
              <div className="p-8 sm:p-12 text-center">
                <Loader2 className="w-8 h-8 text-blue-400 animate-spin mx-auto mb-4" />
                <p className="text-white/60 text-sm sm:text-base">
                  Loading staking activity...
                </p>
              </div>
            ) : stakingTransactions.length === 0 ? (
              <div className="p-8 sm:p-12 text-center">
                <TrendingUp className="w-10 h-10 sm:w-12 sm:h-12 text-white/40 mx-auto mb-4" />
                <p className="text-white/60 text-sm sm:text-base">
                  No staking activity found
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px]">
                  <thead className="bg-white/5">
                    <tr>
                      <th className="text-left p-3 sm:p-4 text-white/80 font-medium text-sm">
                        User
                      </th>
                      <th className="text-left p-3 sm:p-4 text-white/80 font-medium text-sm">
                        Type
                      </th>
                      <th className="text-left p-3 sm:p-4 text-white/80 font-medium text-sm">
                        Amount
                      </th>
                      <th className="text-left p-3 sm:p-4 text-white/80 font-medium text-sm">
                        Date & Time
                      </th>
                      <th className="text-left p-3 sm:p-4 text-white/80 font-medium text-sm">
                        Status
                      </th>
                      <th className="text-left p-3 sm:p-4 text-white/80 font-medium text-sm">
                        Description
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {stakingTransactions.map((tx, index) => (
                      <motion.tr
                        key={tx._id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="border-b border-white/10 hover:bg-white/5 transition-colors"
                      >
                        <td className="p-3 sm:p-4">
                          <div>
                            <p className="text-white font-medium text-sm sm:text-base">
                              {tx.userId?.name}
                            </p>
                            <p className="text-white/60 text-xs sm:text-sm">
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
                            <p className="text-white text-sm">
                              {new Date(tx.createdAt).toLocaleDateString()}
                            </p>
                            <p className="text-white/60 text-xs">
                              {new Date(tx.createdAt).toLocaleTimeString()}
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
                          <p className="text-white/80 text-sm">
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
            className="bg-white/5 backdrop-blur-xl border border-white/20 rounded-xl sm:rounded-2xl overflow-hidden"
          >
            <div className="p-4 sm:p-6 border-b border-white/10">
              <div className="flex items-center justify-between">
                <h2 className="text-lg sm:text-xl font-bold text-white">
                  User Staking Overview
                </h2>
                <div className="flex items-center space-x-3">
                  <span className="text-white/60 text-sm">
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
                <p className="text-white/60 text-sm sm:text-base">
                  Loading user staking data...
                </p>
              </div>
            ) : users.length === 0 ? (
              <div className="p-8 sm:p-12 text-center">
                <TrendingUp className="w-10 h-10 sm:w-12 sm:h-12 text-white/40 mx-auto mb-4" />
                <p className="text-white/60 text-sm sm:text-base">
                  No users are currently staking
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1000px]">
                  <thead className="bg-white/5">
                    <tr>
                      <th className="text-left p-3 sm:p-4 text-white/80 font-medium text-sm">
                        User
                      </th>
                      <th className="text-left p-3 sm:p-4 text-white/80 font-medium text-sm">
                        Staked Amount
                      </th>
                      <th className="text-left p-3 sm:p-4 text-white/80 font-medium text-sm">
                        Staking Date
                      </th>
                      <th className="text-left p-3 sm:p-4 text-white/80 font-medium text-sm">
                        Last Update
                      </th>
                      <th className="text-left p-3 sm:p-4 text-white/80 font-medium text-sm">
                        Total Balance
                      </th>
                      <th className="text-left p-3 sm:p-4 text-white/80 font-medium text-sm">
                        Available
                      </th>
                      <th className="text-left p-3 sm:p-4 text-white/80 font-medium text-sm">
                        Total Earnings
                      </th>
                      <th className="text-left p-3 sm:p-4 text-white/80 font-medium text-sm">
                        Staking %
                      </th>
                      <th className="text-left p-3 sm:p-4 text-white/80 font-medium text-sm">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user, index) => (
                      <motion.tr
                        key={user._id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="border-b border-white/10 hover:bg-white/5 transition-colors"
                      >
                        <td className="p-3 sm:p-4">
                          <div>
                            <p className="text-white font-medium text-sm sm:text-base">
                              {user.name}
                            </p>
                            <p className="text-white/60 text-xs sm:text-sm">
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
                                  <p className="text-white text-sm">
                                    {new Date(
                                      user.wallet.stakingStartDate
                                    ).toLocaleDateString()}
                                  </p>
                                  <p className="text-white/60 text-xs">
                                    {new Date(
                                      user.wallet.stakingStartDate
                                    ).toLocaleTimeString()}
                                  </p>
                                </div>
                              </div>
                            ) : (
                              <span className="text-white/40 text-sm">
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
                                  <p className="text-white/80 text-sm">
                                    {new Date(
                                      user.wallet.lastStakingUpdate
                                    ).toLocaleDateString()}
                                  </p>
                                  <p className="text-white/60 text-xs">
                                    {new Date(
                                      user.wallet.lastStakingUpdate
                                    ).toLocaleTimeString()}
                                  </p>
                                </div>
                              </div>
                            ) : (
                              <span className="text-white/40 text-sm">
                                No updates
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-3 sm:p-4">
                          <div className="flex items-center space-x-2">
                            <Wallet className="w-4 h-4 text-emerald-400" />
                            <span className="text-white font-bold">
                              ${user.wallet?.balance?.toLocaleString() || "0"}
                            </span>
                          </div>
                        </td>
                        <td className="p-3 sm:p-4">
                          <span className="text-white">
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
                            <div className="w-16 bg-white/20 rounded-full h-2">
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
                            <span className="text-white/70 text-sm">
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
            className="bg-white/5 backdrop-blur-xl border border-white/20 rounded-xl sm:rounded-2xl overflow-hidden"
          >
            <div className="p-4 sm:p-6 border-b border-white/10">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                <h2 className="text-lg sm:text-xl font-bold text-white">
                  User Issues
                </h2>

                {/* Issue Filters */}
                <div className="flex items-center space-x-2">
                  <span className="text-white/60 text-sm">Filter:</span>
                  {["all", "open", "in-progress", "resolved"].map(
                    (filterOption) => (
                      <button
                        key={filterOption}
                        onClick={() => setIssueFilter(filterOption)}
                        className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                          issueFilter === filterOption
                            ? "bg-emerald-500 text-black"
                            : "bg-white/10 text-white/70 hover:bg-white/20"
                        }`}
                      >
                        {filterOption.replace("-", " ").toUpperCase()}
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* Issue Stats */}
              {issueStats && (
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-4">
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                    <p className="text-blue-400 text-xs font-medium">Total</p>
                    <p className="text-white text-xl font-bold">
                      {issueStats.total || 0}
                    </p>
                  </div>
                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                    <p className="text-yellow-400 text-xs font-medium">Open</p>
                    <p className="text-white text-xl font-bold">
                      {issueStats.open || 0}
                    </p>
                  </div>
                  <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-3">
                    <p className="text-cyan-400 text-xs font-medium">
                      In Progress
                    </p>
                    <p className="text-white text-xl font-bold">
                      {issueStats.inProgress || 0}
                    </p>
                  </div>
                  <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3">
                    <p className="text-emerald-400 text-xs font-medium">
                      Resolved
                    </p>
                    <p className="text-white text-xl font-bold">
                      {issueStats.resolved || 0}
                    </p>
                  </div>
                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                    <p className="text-red-400 text-xs font-medium">Urgent</p>
                    <p className="text-white text-xl font-bold">
                      {issueStats.urgent || 0}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {isLoadingIssues ? (
              <div className="p-8 sm:p-12 text-center">
                <Loader2 className="w-8 h-8 text-emerald-400 animate-spin mx-auto mb-4" />
                <p className="text-white/60 text-sm sm:text-base">
                  Loading issues...
                </p>
              </div>
            ) : issues.length === 0 ? (
              <div className="p-8 sm:p-12 text-center">
                <MessageSquare className="w-10 h-10 sm:w-12 sm:h-12 text-white/40 mx-auto mb-4" />
                <p className="text-white/60 text-sm sm:text-base">
                  No issues found
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px]">
                  <thead className="bg-white/5">
                    <tr>
                      <th className="text-left p-3 sm:p-4 text-white/80 font-medium text-sm">
                        User
                      </th>
                      <th className="text-left p-3 sm:p-4 text-white/80 font-medium text-sm">
                        Subject
                      </th>
                      <th className="text-left p-3 sm:p-4 text-white/80 font-medium text-sm">
                        Priority
                      </th>
                      <th className="text-left p-3 sm:p-4 text-white/80 font-medium text-sm">
                        Status
                      </th>
                      <th className="text-left p-3 sm:p-4 text-white/80 font-medium text-sm">
                        Date
                      </th>
                      <th className="text-left p-3 sm:p-4 text-white/80 font-medium text-sm">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {issues.map((issue: any) => (
                      <motion.tr
                        key={issue._id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="border-b border-white/10 hover:bg-white/5 transition-colors"
                      >
                        <td className="p-3 sm:p-4">
                          <div>
                            <p className="text-white font-medium text-sm">
                              {issue.userId?.name || "Unknown"}
                            </p>
                            <p className="text-white/60 text-xs">
                              {issue.userId?.email || "N/A"}
                            </p>
                          </div>
                        </td>
                        <td className="p-3 sm:p-4">
                          <div className="max-w-xs">
                            <p className="text-white font-medium text-sm truncate">
                              {issue.subject}
                            </p>
                            <p className="text-white/60 text-xs line-clamp-2">
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
                          <select
                            value={issue.status}
                            onChange={(e) =>
                              handleUpdateIssueStatus(issue._id, e.target.value)
                            }
                            className="px-2 py-1 bg-white/10 border border-white/20 rounded-lg text-white text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                          >
                            <option value="open" className="bg-gray-900">
                              Open
                            </option>
                            <option value="in-progress" className="bg-gray-900">
                              In Progress
                            </option>
                            <option value="resolved" className="bg-gray-900">
                              Resolved
                            </option>
                            <option value="closed" className="bg-gray-900">
                              Closed
                            </option>
                          </select>
                        </td>
                        <td className="p-3 sm:p-4">
                          <div className="text-white/80">
                            <p className="text-sm">
                              {new Date(issue.createdAt).toLocaleDateString()}
                            </p>
                            <p className="text-xs text-white/60">
                              {new Date(issue.createdAt).toLocaleTimeString()}
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
            className="bg-white/5 backdrop-blur-xl border border-white/20 rounded-2xl p-4 sm:p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center space-x-3">
                <Wallet className="w-6 h-6 text-emerald-400" />
                <span>Manual Balance Adjustment</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Form Section */}
              <div className="bg-white/5 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Adjust User Balance
                </h3>

                <div className="space-y-4">
                  {/* User Selection */}
                  <div>
                    <label className="block text-white/80 text-sm mb-2">
                      Select User
                    </label>
                    <select
                      value={selectedUser}
                      onChange={(e) => setSelectedUser(e.target.value)}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    >
                      <option value="">-- Select a user --</option>
                      {allUsers.map((user: any) => (
                        <option
                          key={user._id}
                          value={user._id}
                          className="bg-crypto-charcoal"
                        >
                          {user.email} ({user.name}) - Balance: $
                          {user.wallet?.balance || 0}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Action Type */}
                  <div>
                    <label className="block text-white/80 text-sm mb-2">
                      Action Type
                    </label>
                    <div className="flex flex-col sm:flex-row sm:space-x-4 space-y-3 sm:space-y-0">
                      <button
                        onClick={() => setBalanceAction("add")}
                        className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all ${
                          balanceAction === "add"
                            ? "bg-emerald-500 text-black"
                            : "bg-white/10 text-white hover:bg-white/20"
                        }`}
                      >
                        ➕ Add Balance
                      </button>
                      <button
                        onClick={() => setBalanceAction("deduct")}
                        className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all ${
                          balanceAction === "deduct"
                            ? "bg-red-500 text-white"
                            : "bg-white/10 text-white hover:bg-white/20"
                        }`}
                      >
                        ➖ Deduct Balance
                      </button>
                      <button
                        onClick={() => setBalanceAction("bonus")}
                        className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all ${
                          balanceAction === "bonus"
                            ? "bg-purple-500 text-white"
                            : "bg-white/10 text-white hover:bg-white/20"
                        }`}
                      >
                        🎁 Add Bonus
                      </button>
                    </div>
                  </div>

                  {/* Amount */}
                  <div>
                    <label className="block text-white/80 text-sm mb-2">
                      Amount (USDT)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={balanceAmount}
                      onChange={(e) => setBalanceAmount(e.target.value)}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                      placeholder="Enter amount..."
                    />
                  </div>

                  {/* Reason */}
                  <div>
                    <label className="block text-white/80 text-sm mb-2">
                      Reason (Required)
                    </label>
                    <textarea
                      value={balanceReason}
                      onChange={(e) => setBalanceReason(e.target.value)}
                      className="w-full h-24 px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                      placeholder="Provide a detailed reason for this adjustment..."
                      maxLength={500}
                    />
                    <p className="text-white/40 text-xs mt-1">
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
                        ? "bg-purple-500 text-white hover:bg-purple-600"
                        : "bg-red-500 text-white hover:bg-red-600"
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
                  <ul className="text-white/70 text-sm space-y-2">
                    <li>
                      • Use this feature to manually adjust user balances when
                      deposits are rejected by mistake
                    </li>
                    <li>• Or to deduct funds if approved incorrectly</li>
                    <li>• All adjustments are logged in the Audit Logs tab</li>
                    <li>• Always provide a clear reason for the adjustment</li>
                  </ul>
                </div>

                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
                  <h4 className="text-yellow-400 font-semibold mb-2">
                    ⚠️ Use Cases
                  </h4>
                  <ul className="text-white/70 text-sm space-y-2">
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
                          <div className="text-white/80 text-sm space-y-1">
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
            className="bg-white/5 backdrop-blur-xl border border-white/20 rounded-2xl p-4 sm:p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center space-x-3">
                <RefreshCw className="w-6 h-6 text-yellow-400" />
                <span>Deleted / Rejected Transactions</span>
              </h2>
              <button
                onClick={fetchDeletedTransactions}
                className="p-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
                title="Refresh"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
            </div>

            {isLoadingDeleted ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
              </div>
            ) : deletedTransactions.length === 0 ? (
              <div className="text-center py-12">
                <XCircle className="w-12 h-12 text-white/30 mx-auto mb-4" />
                <p className="text-white/60">No deleted transactions found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left p-3 sm:p-4 text-white/80 font-semibold text-xs sm:text-sm">
                        User
                      </th>
                      <th className="text-left p-3 sm:p-4 text-white/80 font-semibold text-xs sm:text-sm">
                        Type
                      </th>
                      <th className="text-left p-3 sm:p-4 text-white/80 font-semibold text-xs sm:text-sm">
                        Amount
                      </th>
                      <th className="text-left p-3 sm:p-4 text-white/80 font-semibold text-xs sm:text-sm">
                        Status
                      </th>
                      <th className="text-left p-3 sm:p-4 text-white/80 font-semibold text-xs sm:text-sm">
                        Deleted At
                      </th>
                      <th className="text-left p-3 sm:p-4 text-white/80 font-semibold text-xs sm:text-sm">
                        Deleted By
                      </th>
                      <th className="text-left p-3 sm:p-4 text-white/80 font-semibold text-xs sm:text-sm">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {deletedTransactions.map((tx: any) => (
                      <motion.tr
                        key={tx._id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="border-b border-white/5 hover:bg-white/5"
                      >
                        <td className="p-3 sm:p-4">
                          <div>
                            <p className="text-white text-sm">
                              {tx.userId?.name || "N/A"}
                            </p>
                            <p className="text-white/60 text-xs">
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
                          <p className="text-white font-semibold">
                            ${tx.amount} USDT
                          </p>
                        </td>
                        <td className="p-3 sm:p-4">
                          <span className="px-2 py-1 rounded-full text-xs bg-gray-500/20 text-gray-400">
                            {tx.status}
                          </span>
                        </td>
                        <td className="p-3 sm:p-4">
                          <div className="text-white/80">
                            <p className="text-sm">
                              {new Date(tx.deletedAt).toLocaleDateString()}
                            </p>
                            <p className="text-xs text-white/60">
                              {new Date(tx.deletedAt).toLocaleTimeString()}
                            </p>
                          </div>
                        </td>
                        <td className="p-3 sm:p-4">
                          <p className="text-white/70 text-sm">
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
                  <p className="text-2xl font-bold text-white">
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
                  <p className="text-2xl font-bold text-white">
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
                  <p className="text-2xl font-bold text-white">
                    {auditLogStats.revivedTransactions?.count || 0}
                  </p>
                </div>
                <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4">
                  <p className="text-purple-400 text-xs font-medium mb-1">
                    Deleted Txns
                  </p>
                  <p className="text-2xl font-bold text-white">
                    {auditLogStats.deletedTransactions?.count || 0}
                  </p>
                </div>
              </div>
            )}

            {/* Audit Logs Table */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/20 rounded-2xl p-4 sm:p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center space-x-3">
                  <Calendar className="w-6 h-6 text-cyan-400" />
                  <span>Admin Activity Audit Log</span>
                </h2>
                <button
                  onClick={fetchAuditLogs}
                  className="p-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
                  title="Refresh"
                >
                  <RefreshCw className="w-5 h-5" />
                </button>
              </div>

              {isLoadingAuditLogs ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
                </div>
              ) : auditLogs.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="w-12 h-12 text-white/30 mx-auto mb-4" />
                  <p className="text-white/60">No audit logs found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="text-left p-3 text-white/80 font-semibold text-xs">
                          Admin
                        </th>
                        <th className="text-left p-3 text-white/80 font-semibold text-xs">
                          Action
                        </th>
                        <th className="text-left p-3 text-white/80 font-semibold text-xs">
                          Target User
                        </th>
                        <th className="text-left p-3 text-white/80 font-semibold text-xs">
                          Amount
                        </th>
                        <th className="text-left p-3 text-white/80 font-semibold text-xs">
                          Reason
                        </th>
                        <th className="text-left p-3 text-white/80 font-semibold text-xs">
                          Date & Time
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {auditLogs.map((log: any) => (
                        <motion.tr
                          key={log._id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="border-b border-white/5 hover:bg-white/5"
                        >
                          <td className="p-3">
                            <p className="text-white text-sm">
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
                            <p className="text-white/80 text-sm">
                              {log.targetUserEmail}
                            </p>
                          </td>
                          <td className="p-3">
                            <p className="text-white font-semibold text-sm">
                              {log.amount > 0 ? `$${log.amount}` : "-"}
                            </p>
                          </td>
                          <td className="p-3">
                            <p
                              className="text-white/70 text-xs max-w-xs truncate"
                              title={log.reason}
                            >
                              {log.reason}
                            </p>
                          </td>
                          <td className="p-3">
                            <div className="text-white/80 text-xs">
                              <p>
                                {new Date(log.createdAt).toLocaleDateString()}
                              </p>
                              <p className="text-white/60">
                                {new Date(log.createdAt).toLocaleTimeString()}
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
            <div className="bg-white/5 backdrop-blur-xl border border-white/20 rounded-2xl p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center space-x-3">
                  <Network className="w-6 h-6 text-purple-400" />
                  <span>Referral Hierarchy Tree</span>
                </h2>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-1">
                  <label className="block text-white/80 text-sm mb-2">
                    Select User to View Hierarchy
                  </label>
                  <select
                    value={selectedUserForHierarchy}
                    onChange={(e) => {
                      setSelectedUserForHierarchy(e.target.value);
                      if (e.target.value) {
                        fetchReferralHierarchy(e.target.value);
                      } else {
                        setReferralHierarchy(null);
                      }
                    }}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  >
                    <option value="">-- Select a user --</option>
                    {allUsers.map((user: any) => (
                      <option
                        key={user._id}
                        value={user._id}
                        className="bg-crypto-charcoal"
                      >
                        {user.name} ({user.email})
                      </option>
                    ))}
                  </select>
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
                      <p className="text-white/70 text-xs">Level 1 (Direct)</p>
                    </div>
                    <div className="text-center p-3 bg-blue-500/20 rounded-lg">
                      <p className="text-2xl font-bold text-blue-400">4%</p>
                      <p className="text-white/70 text-xs">Level 2</p>
                    </div>
                    <div className="text-center p-3 bg-cyan-500/20 rounded-lg">
                      <p className="text-2xl font-bold text-cyan-400">2%</p>
                      <p className="text-white/70 text-xs">Level 3</p>
                    </div>
                  </div>
                  <p className="text-white/60 text-xs mt-3">
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
              <div className="bg-white/5 backdrop-blur-xl border border-white/20 rounded-2xl p-4 sm:p-6">
                {/* User Stats Summary */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
                    <p className="text-emerald-400 text-xs font-medium">
                      Total Referrals
                    </p>
                    <p className="text-2xl font-bold text-white">
                      {referralHierarchy.downline?.total || 0}
                    </p>
                  </div>
                  <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4">
                    <p className="text-purple-400 text-xs font-medium">
                      Level 1 Referrals
                    </p>
                    <p className="text-2xl font-bold text-white">
                      {referralHierarchy.downline?.level1?.count || 0}
                    </p>
                  </div>
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                    <p className="text-blue-400 text-xs font-medium">
                      Level 2 Referrals
                    </p>
                    <p className="text-2xl font-bold text-white">
                      {referralHierarchy.downline?.level2?.count || 0}
                    </p>
                  </div>
                  <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-4">
                    <p className="text-cyan-400 text-xs font-medium">
                      Level 3 Referrals
                    </p>
                    <p className="text-2xl font-bold text-white">
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
                    <p className="text-xl font-bold text-white">
                      ${(referralHierarchy.earnings?.total || 0).toFixed(2)}
                    </p>
                  </div>
                  <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4">
                    <p className="text-purple-400 text-xs font-medium">
                      Level 1 (8%)
                    </p>
                    <p className="text-xl font-bold text-white">
                      ${(referralHierarchy.earnings?.level1 || 0).toFixed(2)}
                    </p>
                  </div>
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                    <p className="text-blue-400 text-xs font-medium">
                      Level 2 (4%)
                    </p>
                    <p className="text-xl font-bold text-white">
                      ${(referralHierarchy.earnings?.level2 || 0).toFixed(2)}
                    </p>
                  </div>
                  <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-4">
                    <p className="text-cyan-400 text-xs font-medium">
                      Level 3 (2%)
                    </p>
                    <p className="text-xl font-bold text-white">
                      ${(referralHierarchy.earnings?.level3 || 0).toFixed(2)}
                    </p>
                  </div>
                  <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
                    <p className="text-emerald-400 text-xs font-medium">
                      First Deposit Bonus
                    </p>
                    <p className="text-xl font-bold text-white">
                      $
                      {(
                        referralHierarchy.earnings?.firstDepositBonus || 0
                      ).toFixed(2)}
                    </p>
                  </div>
                </div>

                {/* Hierarchy Tree */}
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Network className="w-5 h-5 text-purple-400" />
                  Referral Tree (Downline)
                </h3>

                {referralHierarchy.downline?.level1?.users &&
                referralHierarchy.downline.level1.users.length > 0 ? (
                  <div className="space-y-2">
                    {referralHierarchy.downline.level1.users.map(
                      (level1User: any) => (
                        <div
                          key={level1User._id}
                          className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4"
                        >
                          <div
                            className="flex items-center justify-between cursor-pointer"
                            onClick={() => toggleNodeExpand(level1User._id)}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                                <span className="text-white font-bold text-sm">
                                  L1
                                </span>
                              </div>
                              <div>
                                <p className="text-white font-medium">
                                  {level1User.name}
                                </p>
                                <p className="text-white/60 text-xs">
                                  {level1User.email}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-purple-400 text-sm font-medium">
                                8% Commission
                              </span>
                              {referralHierarchy.downline?.level2?.users?.filter(
                                (u: any) =>
                                  u.referredBy?.toString() ===
                                  level1User._id?.toString()
                              ).length > 0 &&
                                (expandedNodes.has(level1User._id) ? (
                                  <ChevronDown className="w-5 h-5 text-white/60" />
                                ) : (
                                  <ChevronRight className="w-5 h-5 text-white/60" />
                                ))}
                            </div>
                          </div>

                          {/* Level 2 Children */}
                          {expandedNodes.has(level1User._id) && (
                            <div className="mt-3 ml-8 space-y-2">
                              {referralHierarchy.downline?.level2?.users
                                ?.filter(
                                  (level2User: any) =>
                                    level2User.referredBy?.toString() ===
                                    level1User._id?.toString()
                                )
                                .map((level2User: any) => (
                                  <div
                                    key={level2User._id}
                                    className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3"
                                  >
                                    <div
                                      className="flex items-center justify-between cursor-pointer"
                                      onClick={() =>
                                        toggleNodeExpand(level2User._id)
                                      }
                                    >
                                      <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                                          <span className="text-white font-bold text-xs">
                                            L2
                                          </span>
                                        </div>
                                        <div>
                                          <p className="text-white font-medium text-sm">
                                            {level2User.name}
                                          </p>
                                          <p className="text-white/60 text-xs">
                                            {level2User.email}
                                          </p>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className="text-blue-400 text-xs font-medium">
                                          4%
                                        </span>
                                        {referralHierarchy.downline?.level3?.users?.filter(
                                          (u: any) =>
                                            u.referredBy?.toString() ===
                                            level2User._id?.toString()
                                        ).length > 0 &&
                                          (expandedNodes.has(level2User._id) ? (
                                            <ChevronDown className="w-4 h-4 text-white/60" />
                                          ) : (
                                            <ChevronRight className="w-4 h-4 text-white/60" />
                                          ))}
                                      </div>
                                    </div>

                                    {/* Level 3 Children */}
                                    {expandedNodes.has(level2User._id) && (
                                      <div className="mt-2 ml-6 space-y-1">
                                        {referralHierarchy.downline?.level3?.users
                                          ?.filter(
                                            (level3User: any) =>
                                              level3User.referredBy?.toString() ===
                                              level2User._id?.toString()
                                          )
                                          .map((level3User: any) => (
                                            <div
                                              key={level3User._id}
                                              className="bg-cyan-500/10 border border-cyan-500/30 rounded p-2 flex items-center justify-between"
                                            >
                                              <div className="flex items-center gap-2">
                                                <div className="w-5 h-5 bg-cyan-500 rounded-full flex items-center justify-center">
                                                  <span className="text-white font-bold text-[10px]">
                                                    L3
                                                  </span>
                                                </div>
                                                <div>
                                                  <p className="text-white font-medium text-xs">
                                                    {level3User.name}
                                                  </p>
                                                  <p className="text-white/60 text-[10px]">
                                                    {level3User.email}
                                                  </p>
                                                </div>
                                              </div>
                                              <span className="text-cyan-400 text-xs font-medium">
                                                2%
                                              </span>
                                            </div>
                                          ))}
                                      </div>
                                    )}
                                  </div>
                                ))}
                            </div>
                          )}
                        </div>
                      )
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Network className="w-12 h-12 text-white/20 mx-auto mb-3" />
                    <p className="text-white/60">
                      No referrals found for this user
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white/5 backdrop-blur-xl border border-white/20 rounded-2xl p-8 text-center">
                <Network className="w-16 h-16 text-white/20 mx-auto mb-4" />
                <p className="text-white/60 text-lg">
                  Select a user to view their referral hierarchy
                </p>
                <p className="text-white/40 text-sm mt-2">
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
            <div className="bg-white/5 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
              <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                <MessageSquare className="w-6 h-6 mr-3 text-emerald-400" />
                Send Push Notification
              </h3>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  {/* User Selection */}
                  <div>
                    <label className="block text-white/80 text-sm mb-2">
                      Send To
                    </label>
                    <select
                      value={notificationUserId}
                      onChange={(e) => setNotificationUserId(e.target.value)}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    >
                      <option value="all" className="bg-gray-800">
                        All Users (Broadcast)
                      </option>
                      {allUsers.map((user: any) => (
                        <option
                          key={user._id}
                          value={user._id}
                          className="bg-gray-800"
                        >
                          {user.name} ({user.email})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Notification Type */}
                  <div>
                    <label className="block text-white/80 text-sm mb-2">
                      Notification Type
                    </label>
                    <select
                      value={notificationType}
                      onChange={(e) =>
                        setNotificationType(e.target.value as any)
                      }
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    >
                      <option value="announcement" className="bg-gray-800">
                        📢 Announcement
                      </option>
                      <option value="info" className="bg-gray-800">
                        ℹ️ Information
                      </option>
                      <option value="success" className="bg-gray-800">
                        ✅ Success
                      </option>
                      <option value="warning" className="bg-gray-800">
                        ⚠️ Warning
                      </option>
                      <option value="error" className="bg-gray-800">
                        ❌ Error
                      </option>
                    </select>
                  </div>

                  {/* Title */}
                  <div>
                    <label className="block text-white/80 text-sm mb-2">
                      Title
                    </label>
                    <input
                      type="text"
                      value={notificationTitle}
                      onChange={(e) => setNotificationTitle(e.target.value)}
                      placeholder="Enter notification title..."
                      maxLength={200}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    />
                    <p className="text-white/40 text-xs mt-1">
                      {notificationTitle.length}/200
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Message */}
                  <div>
                    <label className="block text-white/80 text-sm mb-2">
                      Message
                    </label>
                    <textarea
                      value={notificationMessage}
                      onChange={(e) => setNotificationMessage(e.target.value)}
                      placeholder="Enter notification message..."
                      maxLength={2000}
                      rows={6}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    />
                    <p className="text-white/40 text-xs mt-1">
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
                    className="w-full py-4 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-all duration-300 font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
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
            <div className="bg-white/5 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white flex items-center">
                  <Clock className="w-6 h-6 mr-3 text-blue-400" />
                  Sent Notifications History
                </h3>
                <button
                  onClick={fetchSentNotifications}
                  disabled={isLoadingNotifications}
                  className="px-4 py-2 bg-white/10 rounded-xl text-white hover:bg-white/20 transition-all duration-300 flex items-center"
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
                  <MessageSquare className="w-16 h-16 text-white/20 mx-auto mb-4" />
                  <p className="text-white/60">No notifications sent yet</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {sentNotifications.map((notif: any) => (
                    <div
                      key={notif._id}
                      className="bg-white/5 rounded-xl p-4 border border-white/10 hover:border-white/20 transition-all duration-300"
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
                          <h4 className="text-white font-semibold">
                            {notif.title}
                          </h4>
                          <p className="text-white/60 text-sm mt-1 line-clamp-2">
                            {notif.message}
                          </p>
                          <div className="flex items-center gap-4 mt-3 text-white/40 text-xs">
                            <span>
                              Sent by: {notif.sentBy?.name || "Admin"}
                            </span>
                            {notif.userId && (
                              <span>
                                To: {notif.userId?.name || notif.userId?.email}
                              </span>
                            )}
                            <span>
                              {new Date(notif.createdAt).toLocaleString()}
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
      </div>

      {/* Response Modal */}
      <AnimatePresence>
        {responseModal.open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-crypto-charcoal border border-white/20 rounded-2xl p-6 max-w-md w-full"
            >
              <h3 className="text-xl font-bold text-white mb-4">
                Respond to Issue
              </h3>

              <div className="mb-4">
                <label className="block text-white/80 text-sm mb-2">
                  Your Response
                </label>
                <textarea
                  value={adminResponse}
                  onChange={(e) => setAdminResponse(e.target.value)}
                  className="w-full h-32 px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 resize-none focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                  placeholder="Type your response to the user..."
                  maxLength={2000}
                />
                <p className="text-white/40 text-xs mt-1">
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
                  className="flex-1 py-3 px-4 bg-cyan-500 text-white rounded-xl hover:bg-cyan-600 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Send Response
                </button>

                <button
                  onClick={() => {
                    setResponseModal({ open: false, issueId: null });
                    setAdminResponse("");
                  }}
                  className="flex-1 py-3 px-4 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-colors"
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
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-crypto-charcoal border border-white/20 rounded-2xl p-6 max-w-md w-full"
            >
              <h3 className="text-xl font-bold text-white mb-4">
                {commentModal.action === "approve"
                  ? "Approve Transaction"
                  : "Reject Transaction"}
              </h3>

              <div className="mb-4">
                <label className="block text-white/80 text-sm mb-2">
                  {commentModal.action === "reject"
                    ? "Rejection Reason (Required)"
                    : "Comment (Optional)"}
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full h-24 px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  placeholder={
                    commentModal.action === "reject"
                      ? "Please provide a reason for rejection..."
                      : "Optional comment..."
                  }
                />
              </div>

              <div className="flex items-center space-x-3">
                <button
                  onClick={() => {
                    if (commentModal.txId) {
                      if (commentModal.action === "approve") {
                        handleApprove(commentModal.txId, comment);
                      } else {
                        handleReject(commentModal.txId, comment);
                      }
                    }
                  }}
                  disabled={commentModal.action === "reject" && !comment.trim()}
                  className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-colors ${
                    commentModal.action === "approve"
                      ? "bg-emerald-500 text-black hover:bg-emerald-600"
                      : "bg-red-500 text-white hover:bg-red-600"
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {commentModal.action === "approve" ? "Approve" : "Reject"}
                </button>

                <button
                  onClick={closeCommentModal}
                  className="flex-1 py-3 px-4 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Cancel Stake Modal */}
        {cancelStakeModal.open && cancelStakeModal.user && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() =>
              setCancelStakeModal({
                open: false,
                user: null,
                selectedStakeId: null,
              })
            }
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-crypto-charcoal border border-white/20 rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">
                    Cancel Stakes
                  </h3>
                  <p className="text-white/60 text-sm">
                    10% penalty will be applied
                  </p>
                </div>
              </div>

              {/* User Info */}
              <div className="bg-white/5 rounded-xl p-4 mb-4">
                <div className="flex justify-between mb-2">
                  <span className="text-white/60">User:</span>
                  <span className="text-white font-medium">
                    {cancelStakeModal.user.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Email:</span>
                  <span className="text-white">
                    {cancelStakeModal.user.email}
                  </span>
                </div>
              </div>

              {/* Individual Stakes */}
              {cancelStakeModal.user.wallet?.stakes &&
              cancelStakeModal.user.wallet.stakes.filter(
                (s: any) => s.status === "active"
              ).length > 0 ? (
                <div className="mb-4">
                  <h4 className="text-white/80 font-medium mb-3">
                    Active Stakes:
                  </h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {cancelStakeModal.user.wallet.stakes
                      .filter((stake: any) => stake.status === "active")
                      .map((stake: any) => (
                        <div
                          key={stake.stakeId}
                          className={`bg-white/5 rounded-lg p-3 border transition-colors cursor-pointer ${
                            cancelStakeModal.selectedStakeId === stake.stakeId
                              ? "border-red-500/50 bg-red-500/10"
                              : "border-white/10 hover:border-white/20"
                          }`}
                          onClick={() =>
                            setCancelStakeModal({
                              ...cancelStakeModal,
                              selectedStakeId:
                                cancelStakeModal.selectedStakeId ===
                                stake.stakeId
                                  ? null
                                  : stake.stakeId,
                            })
                          }
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-blue-400 font-bold">
                                ${stake.amount?.toLocaleString()}
                              </p>
                              <p className="text-white/60 text-xs">
                                {stake.packageType} package
                              </p>
                              <p className="text-white/40 text-xs">
                                {new Date(stake.startDate).toLocaleDateString()}{" "}
                                - {new Date(stake.endDate).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-red-400 text-sm">
                                -${(stake.amount * 0.1).toLocaleString()}
                              </p>
                              <p className="text-white/40 text-xs">penalty</p>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                  <p className="text-white/40 text-xs mt-2">
                    {cancelStakeModal.selectedStakeId
                      ? "Click to deselect and cancel ALL stakes"
                      : "Click a stake to cancel only that one, or leave unselected to cancel ALL"}
                  </p>
                </div>
              ) : (
                <div className="bg-white/5 rounded-xl p-4 mb-4">
                  <div className="flex justify-between mb-2">
                    <span className="text-white/60">Total Staked:</span>
                    <span className="text-blue-400 font-bold">
                      $
                      {cancelStakeModal.user.wallet?.stakedAmount?.toLocaleString() ||
                        0}
                    </span>
                  </div>
                </div>
              )}

              {/* Summary */}
              <div className="bg-white/5 rounded-xl p-4 mb-4">
                <div className="flex justify-between mb-2">
                  <span className="text-white/60">
                    {cancelStakeModal.selectedStakeId
                      ? "Selected Stake:"
                      : "All Stakes:"}
                  </span>
                  <span className="text-blue-400 font-bold">
                    $
                    {cancelStakeModal.selectedStakeId
                      ? cancelStakeModal.user.wallet?.stakes
                          ?.find(
                            (s: any) =>
                              s.stakeId === cancelStakeModal.selectedStakeId
                          )
                          ?.amount?.toLocaleString() || 0
                      : cancelStakeModal.user.wallet?.stakedAmount?.toLocaleString() ||
                        0}
                  </span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-white/60">Penalty (10%):</span>
                  <span className="text-red-400 font-bold">
                    -$
                    {cancelStakeModal.selectedStakeId
                      ? (
                          (cancelStakeModal.user.wallet?.stakes?.find(
                            (s: any) =>
                              s.stakeId === cancelStakeModal.selectedStakeId
                          )?.amount || 0) * 0.1
                        ).toLocaleString()
                      : (
                          (cancelStakeModal.user.wallet?.stakedAmount || 0) *
                          0.1
                        ).toLocaleString()}
                  </span>
                </div>
                <div className="border-t border-white/10 pt-2 mt-2">
                  <div className="flex justify-between">
                    <span className="text-white/80 font-medium">
                      Return to User:
                    </span>
                    <span className="text-emerald-400 font-bold">
                      $
                      {cancelStakeModal.selectedStakeId
                        ? (
                            (cancelStakeModal.user.wallet?.stakes?.find(
                              (s: any) =>
                                s.stakeId === cancelStakeModal.selectedStakeId
                            )?.amount || 0) * 0.9
                          ).toLocaleString()
                        : (
                            (cancelStakeModal.user.wallet?.stakedAmount || 0) *
                            0.9
                          ).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-white/80 text-sm mb-2">
                  Reason for Cancellation (Required)
                </label>
                <textarea
                  value={cancelStakeReason}
                  onChange={(e) => setCancelStakeReason(e.target.value)}
                  className="w-full h-24 px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 resize-none focus:outline-none focus:ring-2 focus:ring-red-500/50"
                  placeholder="Enter the reason for early stake cancellation..."
                />
              </div>

              <div className="flex items-center space-x-3">
                <button
                  onClick={() =>
                    handleCancelStake(cancelStakeModal.selectedStakeId)
                  }
                  disabled={!cancelStakeReason.trim() || isCancellingStake}
                  className="flex-1 py-3 px-4 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCancellingStake
                    ? "Processing..."
                    : cancelStakeModal.selectedStakeId
                    ? "Cancel Selected Stake"
                    : "Cancel All Stakes"}
                </button>

                <button
                  onClick={() => {
                    setCancelStakeModal({
                      open: false,
                      user: null,
                      selectedStakeId: null,
                    });
                    setCancelStakeReason("");
                  }}
                  className="flex-1 py-3 px-4 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-colors"
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
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
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
              className="bg-crypto-charcoal border border-red-500/30 rounded-2xl p-6 max-w-lg w-full"
            >
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center">
                  <Trash2 className="w-6 h-6 text-red-500" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-red-400">
                    Delete User Permanently
                  </h3>
                  <p className="text-white/60 text-sm">
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
                    <ul className="text-white/70 text-sm space-y-1">
                      <li>• All user data will be permanently deleted</li>
                      <li>• Wallet and balance will be lost</li>
                      <li>• All transactions history will be removed</li>
                      <li>• All stakes will be deleted</li>
                      <li>• User will be removed from referral chains</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* User Info */}
              <div className="bg-white/5 rounded-xl p-4 mb-4">
                <div className="flex justify-between mb-2">
                  <span className="text-white/60">User to delete:</span>
                  <span className="text-red-400 font-semibold">
                    {deleteUserModal.userName}
                  </span>
                </div>
              </div>

              {/* Reason */}
              <div className="mb-4">
                <label className="block text-white/80 text-sm mb-2">
                  Reason for Deletion (Optional - for audit log)
                </label>
                <textarea
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  className="w-full h-20 px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 resize-none focus:outline-none focus:ring-2 focus:ring-red-500/50"
                  placeholder="Enter reason for deleting this user..."
                />
              </div>

              {/* Confirmation Input */}
              <div className="mb-6">
                <label className="block text-white/80 text-sm mb-2">
                  Type <span className="text-red-400 font-bold">DELETE</span> to
                  confirm
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-red-500/50"
                  placeholder="Type DELETE to confirm"
                />
              </div>

              <div className="flex items-center space-x-3">
                <button
                  onClick={handleDeleteUser}
                  disabled={deleteConfirmText !== "DELETE" || isDeletingUser}
                  className="flex-1 py-3 px-4 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
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
                  className="flex-1 py-3 px-4 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-colors"
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
