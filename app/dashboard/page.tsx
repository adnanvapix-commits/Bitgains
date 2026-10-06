"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../contexts/AuthContext";
import { ThemeToggle } from "../../components/ThemeToggle";
import { walletApi } from "../../lib/api/transactions.js";
import { notificationsApi } from "../../lib/api/notifications.js";
import Image from "next/image";
import {
  DollarSign,
  TrendingUp,
  ArrowUpRight,
  ArrowDownLeft,
  History,
  Settings,
  Menu,
  X,
  Bell,
  User,
  Users,
  LogOut,
  Home,
  Wallet,
  BarChart3,
  Clock,
  Zap,
  Shield,
  Plus,
  Minus,
  RefreshCw,
  Eye,
  EyeOff,
  Copy,
  Check,
  AlertCircle,
  CheckCircle,
  XCircle,
  Award,
  CreditCard,
  Banknote,
  QrCode,
  AlertTriangle,
  Info,
  Upload,
  Camera,
  Trash2,
  Loader,
  HelpCircle,
  MessageSquare,
  Mail,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";

// Enhanced Mock data with real-time updates
const mockData = {
  totalBalance: 0,
  stakedAmount: 0,
  availableAmount: 0,
  earnings: 0,
  apr: 0,
  dailyEarnings: 0,
  totalStaked: 0,
  totalWithdrawn: 0,
  totalDeposited: 0,
  recentTransactions: [] as Array<{
    id: number;
    type: string;
    amount: number;
    date: string;
    status: string;
    txHash: string;
    fee: number;
    token: string;
  }>,
  portfolioData: [
    { date: "2024-01-01", balance: 0, earnings: 0 },
    { date: "2024-01-08", balance: 0, earnings: 0 },
    { date: "2024-01-15", balance: 0, earnings: 0 },
    { date: "2024-01-22", balance: 0, earnings: 0 },
    { date: "2024-01-29", balance: 0, earnings: 0 },
    { date: "2024-02-05", balance: 0, earnings: 0 },
    { date: "2024-02-12", balance: 0, earnings: 0 },
    { date: "2024-02-19", balance: 0, earnings: 0 },
    { date: "2024-02-26", balance: 0, earnings: 0 },
    { date: "2024-03-05", balance: 0, earnings: 0 },
    { date: "2024-03-12", balance: 0, earnings: 0 },
    { date: "2024-03-19", balance: 0, earnings: 0 },
    { date: "2024-03-26", balance: 0, earnings: 0 },
    { date: "2024-04-02", balance: 0, earnings: 0 },
    { date: "2024-04-09", balance: 0, earnings: 0 },
    { date: "2024-04-16", balance: 0, earnings: 0 },
    { date: "2024-04-23", balance: 0, earnings: 0 },
    { date: "2024-04-30", balance: 0, earnings: 0 },
    { date: "2024-05-07", balance: 0, earnings: 0 },
    { date: "2024-05-14", balance: 0, earnings: 0 },
    { date: "2024-05-21", balance: 0, earnings: 0 },
    { date: "2024-05-28", balance: 0, earnings: 0 },
    { date: "2024-06-04", balance: 0, earnings: 0 },
    { date: "2024-06-11", balance: 0, earnings: 0 },
    { date: "2024-06-18", balance: 0, earnings: 0 },
  ],
  dailyRewards: [
    { day: "Mon", amount: 0 },
    { day: "Tue", amount: 0 },
    { day: "Wed", amount: 0 },
    { day: "Thu", amount: 0 },
    { day: "Fri", amount: 0 },
    { day: "Sat", amount: 0 },
    { day: "Sun", amount: 0 },
  ],
  earningsBreakdown: [
    { name: "Staking Rewards", value: 0, color: "#10B981" },
    { name: "Compound Interest", value: 0, color: "#00FF87" },
    { name: "Bonus Rewards", value: 0, color: "#06B6D4" },
    { name: "Referral Bonus", value: 0, color: "#8B5CF6" },
  ],
};

export default function DashboardPage() {
  const { user, logout, isAuthenticated } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTabState] = useState("overview");

  // Read tab from URL on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const tab = new URLSearchParams(window.location.search).get("tab");
      if (tab) setActiveTabState(tab);
    }
  }, []);

  // Sync URL on tab change
  const setActiveTab = (tab: string) => {
    setActiveTabState(tab);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("tab", tab);
      window.history.replaceState({}, "", url.toString());
    }
  };
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [screenWidth, setScreenWidth] = useState(1024); // Default to desktop width
  const [isClient, setIsClient] = useState(false);
  const [balance, setBalance] = useState(0);
  const [availableBalance, setAvailableBalance] = useState(0);
  const [stakedBalance, setStakedBalance] = useState(0);
  const [earnings, setEarnings] = useState(0);
  const [isLive, setIsLive] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [showBalance, setShowBalance] = useState(true);
  const [walletData, setWalletData] = useState<any>(null);
  const [loadingWallet, setLoadingWallet] = useState(true);
  const [walletError, setWalletError] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<
    Array<{ id: number; type: string; message: string; timestamp: Date }>
  >([]);

  // Push notifications state
  const [pushNotifications, setPushNotifications] = useState<any[]>([]);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [showNotificationDropdown, setShowNotificationDropdown] =
    useState(false);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  const navigationItems = [
    {
      id: "overview",
      label: "Account Overview",
      icon: Home,
      description: "Portfolio summary",
    },
    {
      id: "deposit",
      label: "Deposit",
      icon: ArrowUpRight,
      description: "Add funds",
    },
    {
      id: "staking",
      label: "Staking",
      icon: TrendingUp,
      description: "Stake your funds",
    },
    {
      id: "withdraw",
      label: "Withdraw",
      icon: ArrowDownLeft,
      description: "Withdraw funds",
    },
    {
      id: "history",
      label: "Transaction History",
      icon: History,
      description: "View all transactions",
    },
    {
      id: "analytics",
      label: "Analytics",
      icon: BarChart3,
      description: "Performance metrics",
    },
    {
      id: "affiliate",
      label: "Affiliate",
      icon: Users,
      description: "Referral program",
    },
    {
      id: "settings",
      label: "Settings",
      icon: Settings,
      description: "Account settings",
    },
    {
      id: "calculator",
      label: "Staking Calculator",
      icon: BarChart3,
      description: "Project your earnings",
    },
    {
      id: "plans",
      label: "Staking Plans",
      icon: Award,
      description: "Bronze to Platinum tiers",
    },
    {
      id: "auto-compound",
      label: "Auto-Compound",
      icon: RefreshCw,
      description: "Reinvest rewards",
    },
    {
      id: "address-book",
      label: "Address Book",
      icon: QrCode,
      description: "Trusted wallets",
    },
    {
      id: "portfolio",
      label: "Portfolio Analytics",
      icon: BarChart3,
      description: "Deep insights",
    },
    {
      id: "raise-issue",
      label: "Raise Issue",
      icon: MessageSquare,
      description: "Report a problem",
      isExternal: true,
      href: "/raise-issue",
    },
    {
      id: "support",
      label: "Help & Support",
      icon: HelpCircle,
      description: "Get assistance",
      isExternal: true,
      href: "/support",
    },
  ];

  // Authentication check
  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, router]);

  // Fetch wallet data when authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchWalletData();
      // Refresh only every 5 minutes to avoid DB overuse
      const interval = setInterval(fetchWalletData, 300000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, user]);

  const fetchWalletData = async () => {
    try {
      setWalletError(null);
      const response = await walletApi.getWallet();

      if (response.success) {
        const wallet = response.data.wallet;
        setWalletData(wallet);

        // Update local states with real data
        setBalance(wallet.balance || 0);
        setAvailableBalance(wallet.availableBalance || 0);
        setStakedBalance(wallet.stakedAmount || 0);
        setEarnings(wallet.totalEarnings || 0);
        setLastUpdate(new Date());
      } else {
        setWalletError(response.message || "Failed to fetch wallet data");
      }
    } catch (error) {
      console.error("Error fetching wallet data:", error);
      setWalletError("Failed to connect to wallet service");
    } finally {
      setLoadingWallet(false);
    }
  };

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      setLoadingNotifications(true);
      const response = await notificationsApi.getNotifications();
      if (response.success) {
        setPushNotifications(response.data.notifications || []);
        setUnreadNotificationCount(response.data.unreadCount || 0);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoadingNotifications(false);
    }
  };

  // Fetch notifications when authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchNotifications();
      // Refresh notifications every 5 minutes
      const interval = setInterval(fetchNotifications, 300000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, user]);

  // Mark notification as read
  const markNotificationAsRead = async (notificationId: string) => {
    try {
      await notificationsApi.markAsRead(notificationId);
      setPushNotifications((prev) =>
        prev.map((n: { _id: string; read?: boolean }) =>
          n._id === notificationId ? { ...n, read: true } : n
        )
      );
      setUnreadNotificationCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  // Mark all notifications as read
  const markAllNotificationsAsRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      setPushNotifications((prev) =>
        prev.map((n: { _id: string; read?: boolean }) => ({ ...n, read: true }))
      );
      setUnreadNotificationCount(0);
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  // Delete notification
  const deleteNotification = async (notificationId: string) => {
    try {
      await notificationsApi.deleteNotification(notificationId);
      setPushNotifications((prev) =>
        prev.filter((n: { _id: string }) => n._id !== notificationId)
      );
      // Also update unread count if notification was unread
      const notification = pushNotifications.find(
        (n: { _id: string; read?: boolean }) => n._id === notificationId
      );
      if (notification && !notification.read) {
        setUnreadNotificationCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error("Error deleting notification:", error);
      setNotifications((prev) => [
        {
          id: Date.now(),
          type: "error",
          message: "Failed to delete notification",
          timestamp: new Date(),
        },
        ...prev,
      ]);
    }
  };

  // Client-side initialization
  useEffect(() => {
    setIsClient(true);
    if (typeof window !== "undefined") {
      setScreenWidth(window.innerWidth);
    }
  }, []);

  // Mobile screen detection and sidebar handling
  useEffect(() => {
    if (!isClient) return;

    const handleResize = () => {
      if (typeof window !== "undefined") {
        const width = window.innerWidth;
        setScreenWidth(width);

        if (width >= 1024) {
          // Desktop - sidebar should be visible by default
          setMobileMenuOpen(false);
          setSidebarCollapsed(false);
        } else if (width >= 768) {
          // Tablet - sidebar collapsed but not mobile menu
          setMobileMenuOpen(false);
          setSidebarCollapsed(true);
        } else {
          // Mobile - sidebar hidden, use mobile menu
          setMobileMenuOpen(false);
          setSidebarCollapsed(true);
        }
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isClient]);

  // Close mobile menu when tab changes (only on very small screens)
  useEffect(() => {
    if (screenWidth < 640) setMobileMenuOpen(false);
  }, [activeTab, screenWidth]);

  // Close notification dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (
        showNotificationDropdown &&
        !target.closest("[data-notification-dropdown]")
      ) {
        setShowNotificationDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showNotificationDropdown]);

  // Live update removed — rewards calculated on wallet load, no polling needed

  const formatCurrency = (amount: number, showDecimals = true) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: showDecimals ? 2 : 0,
      maximumFractionDigits: showDecimals ? 2 : 0,
    }).format(amount);
  };

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

  const handleDeposit = (amount: number) => {
    const newBalance = balance + amount;
    const newAvailable = availableBalance + amount;

    setBalance(newBalance);
    setAvailableBalance(newAvailable);

    // Add notification
    setNotifications((prev) => [
      {
        id: Date.now(),
        type: "success",
        message: `Deposit of ${formatCurrency(amount)} successful`,
        timestamp: new Date(),
      },
      ...prev,
    ]);

    // Auto-remove notification after 5 seconds
    setTimeout(() => {
      setNotifications((prev) => prev.slice(1));
    }, 5000);
  };

  const handleWithdraw = async (amount: number, toAddress: string = "") => {
    try {
      const { transactionApi } = await import("../../lib/api/transactions.js");

      const withdrawalData = {
        amount: amount,
        toAddress: toAddress || "default-address", // You might want to handle this better
        currency: "USDT",
        network: "TRC-20",
        description: `Withdrawal of ${amount} USDT`,
      };

      const response = await transactionApi.createWithdrawal(withdrawalData);

      if (response.success) {
        // Show success notification
        setNotifications((prev) => [
          {
            id: Date.now(),
            type: "success",
            message: `Withdrawal request submitted successfully. Awaiting admin approval.`,
            timestamp: new Date(),
          },
          ...prev,
        ]);

        // Auto-remove notification after 10 seconds
        setTimeout(() => {
          setNotifications((prev) => prev.slice(1));
        }, 10000);
      } else {
        throw new Error(response.message || "Withdrawal request failed");
      }
    } catch (error) {
      console.error("Withdrawal error:", error);
      setNotifications((prev) => [
        {
          id: Date.now(),
          type: "error",
          message: `Withdrawal failed: ${
            error instanceof Error ? error.message : "Unknown error occurred"
          }`,
          timestamp: new Date(),
        },
        ...prev,
      ]);

      setTimeout(() => {
        setNotifications((prev) => prev.slice(1));
      }, 8000);
    }
  };

  const handleStake = async (
    amount: number,
    packageType: string = "30-day"
  ) => {
    try {
      const { transactionApi } = await import("../../lib/api/transactions.js");

      const stakeData = {
        amount: amount,
        packageType: packageType,
        currency: "USDT",
        description: `Staking of ${amount} USDT (${packageType} package)`,
      };

      const response = await transactionApi.stakeFunds(stakeData);

      if (response.success) {
        // Refresh wallet data to get updated balances
        await fetchWalletData();

        setNotifications((prev) => [
          {
            id: Date.now(),
            type: "success",
            message: `Successfully staked ${formatCurrency(
              amount
            )} for ${packageType}`,
            timestamp: new Date(),
          },
          ...prev,
        ]);

        setTimeout(() => {
          setNotifications((prev) => prev.slice(1));
        }, 5000);
      } else {
        throw new Error(response.message || "Staking failed");
      }
    } catch (error) {
      console.error("Staking error:", error);
      setNotifications((prev) => [
        {
          id: Date.now(),
          type: "error",
          message: `Staking failed: ${
            error instanceof Error ? error.message : "Unknown error occurred"
          }`,
          timestamp: new Date(),
        },
        ...prev,
      ]);

      setTimeout(() => {
        setNotifications((prev) => prev.slice(1));
      }, 8000);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        {/* Mobile Overlay */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
          )}
        </AnimatePresence>

        {/* Professional Sidebar */}
        <motion.div
          initial={{ x: -320 }}
          animate={{
            x:
              mobileMenuOpen ||
              (isClient && screenWidth >= 1024 && !sidebarCollapsed)
                ? 0
                : isClient && screenWidth >= 1024
                ? -240
                : -320,
          }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className={`fixed left-0 top-0 h-screen ${
            sidebarCollapsed && isClient && screenWidth >= 1024
              ? "w-20"
              : "w-80"
          } border-r border-border z-50 overflow-hidden transition-all duration-300 ${
            mobileMenuOpen ? "block" : "hidden lg:block"
          } desktop-sidebar`}
          style={{
            background: 'linear-gradient(180deg, var(--sidebar) 0%, color-mix(in srgb, var(--sidebar) 85%, var(--background)) 100%)'
          }}
        >
          <div className="flex flex-col h-full overflow-hidden">
            {/* Logo Section */}
            <div className="p-6 border-b border-border">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-primary/10 border border-primary/30 p-1 shadow-lg shadow-primary/15">
                    <Image
                      src="/bitgain.PNG"
                      alt="BitGain Logo"
                      width={48}
                      height={48}
                      className="w-full h-full object-contain rounded-lg"
                    />
                  </div>
                </div>
                {(!sidebarCollapsed || mobileMenuOpen) && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                  >
                    <h1 className="text-xl font-bold relative">
                      <span className="neon-text">
                        BitGains
                      </span>
                    </h1>
                  </motion.div>
                )}
              </div>

              {/* Mobile Close Button (only on mobile) */}
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="absolute right-3 top-6 p-2 text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-primary/10 lg:hidden"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Live Balance Summary */}
            {(!sidebarCollapsed || mobileMenuOpen) && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="p-6 border-b border-border"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Total Balance</p>
                      <p className="text-lg font-bold text-foreground">
                        {showBalance ? formatCurrency(balance) : "••••••"}
                      </p>
                    </div>
                    <button
                      onClick={() => setShowBalance(!showBalance)}
                      className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-primary/10"
                    >
                      {showBalance ? (
                        <Eye className="w-4 h-4" />
                      ) : (
                        <EyeOff className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-primary/10 border border-primary/20 rounded-lg p-3">
                      <p className="text-xs text-primary font-medium">Staked</p>
                      <p className="text-sm font-semibold text-foreground">
                        {showBalance
                          ? formatCurrency(stakedBalance, false)
                          : "••••"}
                      </p>
                    </div>
                    <div className="bg-primary/10 border border-primary/20 rounded-lg p-3">
                      <p className="text-xs text-primary font-medium">Available</p>
                      <p className="text-sm font-semibold text-foreground">
                        {showBalance
                          ? formatCurrency(availableBalance, false)
                          : "••••"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 text-xs">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        isLive ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground"
                      }`}
                    ></div>
                    <span className="text-muted-foreground">
                      {isLive ? "Live" : "Paused"} •{" "}
                      {isClient ? lastUpdate.toLocaleTimeString() : "--:--:--"}
                    </span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-2 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
              {navigationItems.map((item, index) => {
                const isExternal = "isExternal" in item && item.isExternal;
                const href = "href" in item ? item.href : undefined;

                if (isExternal && href) {
                  return (
                    <motion.a
                      key={item.id}
                      href={href}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 + 0.3 }}
                      whileHover={{ x: 4 }}
                      whileTap={{ scale: 0.98 }}
                      className={`w-full flex items-center ${
                        sidebarCollapsed && isClient && screenWidth >= 1024
                          ? "justify-center px-2 py-3"
                          : "space-x-3 px-4 py-3.5"
                      } rounded-2xl transition-all duration-300 group text-muted-foreground hover:text-foreground hover:bg-primary/10`}
                    >
                      <item.icon className="w-5 h-5 text-muted-foreground group-hover:text-primary" />
                      {(!sidebarCollapsed ||
                        mobileMenuOpen ||
                        (isClient && screenWidth < 1024)) && (
                        <div className="text-left">
                          <span className="font-medium block">
                            {item.label}
                          </span>
                          <span className="text-xs text-muted-foreground/70 block">
                            {item.description}
                          </span>
                        </div>
                      )}
                    </motion.a>
                  );
                }

                return (
                  <motion.button
                    key={item.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 + 0.3 }}
                    whileHover={{ x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center ${
                      sidebarCollapsed && isClient && screenWidth >= 1024
                        ? "justify-center px-2 py-3"
                        : "space-x-3 px-4 py-3.5"
                    } rounded-2xl transition-all duration-300 group ${
                      activeTab === item.id
                        ? "bg-primary/15 text-primary border border-primary/30 shadow-sm shadow-primary/10"
                        : "text-muted-foreground hover:text-foreground hover:bg-primary/10"
                    }`}
                  >
                    <item.icon
                      className={`w-5 h-5 ${
                        activeTab === item.id
                          ? "text-primary"
                          : "text-muted-foreground group-hover:text-primary"
                      }`}
                    />
                    {(!sidebarCollapsed ||
                      mobileMenuOpen ||
                      (isClient && screenWidth < 1024)) && (
                      <div className="text-left">
                        <span className="font-medium block">{item.label}</span>
                        <span className="text-xs text-muted-foreground/70 block">
                          {item.description}
                        </span>
                      </div>
                    )}
                    {activeTab === item.id &&
                      (!sidebarCollapsed ||
                        mobileMenuOpen ||
                        (isClient && screenWidth < 1024)) && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="ml-auto w-2 h-2 bg-primary rounded-full"
                        />
                      )}
                  </motion.button>
                );
              })}
            </nav>

            {/* User Profile */}
            <div className="flex-shrink-0 p-4 border-t border-border">
              <div
                className={`flex items-center ${
                  sidebarCollapsed && isClient && screenWidth >= 1024
                    ? "justify-center p-2"
                    : "space-x-3 p-3"
                } rounded-2xl bg-primary/10 border border-primary/20 ${
                  sidebarCollapsed &&
                  !mobileMenuOpen &&
                  isClient &&
                  screenWidth >= 1024
                    ? "justify-center"
                    : ""
                }`}
              >
                <div className="w-10 h-10 bg-gradient-to-r from-primary to-accent rounded-2xl flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-primary-foreground" />
                </div>
                {(!sidebarCollapsed ||
                  mobileMenuOpen ||
                  (isClient && screenWidth < 1024)) && (
                  <>
                    <div className="flex-1 min-w-0">
                      <p className="text-foreground font-medium truncate">
                        {user?.name || "User"}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {user?.role === "admin"
                          ? "Administrator"
                          : "Premium Member"}
                      </p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-1.5 text-destructive hover:text-destructive/80 transition-colors px-2 py-1.5 rounded-lg hover:bg-destructive/10 border border-destructive/30 flex-shrink-0"
                      title="Logout"
                    >
                      <LogOut className="w-4 h-4" />
                      <span className="text-xs font-medium">Logout</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Main Content Area */}
        <div
          className={`flex-1 min-h-screen transition-all duration-300 ${
            isClient && screenWidth >= 1024
              ? sidebarCollapsed
                ? "lg:ml-20"
                : "lg:ml-80"
              : "ml-0"
          }`}
        >
          {/* Top Header */}
          <div className="border-b border-border px-4 sm:px-6 lg:px-8 py-4 sm:py-6 sticky top-0 z-40 bg-card">
            <div className="flex items-center justify-between">
              {/* Mobile Menu Button & Sidebar Toggle */}
              <div className="flex items-center space-x-4">
                {/* Mobile Menu Button (< 1024px) */}
                <button
                  onClick={() => setMobileMenuOpen(true)}
                  className="lg:hidden p-2 text-muted-foreground hover:text-foreground transition-colors rounded-xl hover:bg-primary/10 border border-transparent hover:border-border"
                >
                  <Menu className="w-6 h-6" />
                </button>

                {/* Desktop Sidebar Toggle (>= 1024px) */}
                <button
                  onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                  className="hidden lg:flex p-2 text-muted-foreground hover:text-foreground transition-colors rounded-xl hover:bg-primary/10 border border-transparent hover:border-border"
                  title={
                    sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"
                  }
                >
                  <Menu className="w-5 h-5" />
                </button>

                <div>
                  <div className="flex items-center space-x-2 sm:space-x-4">
                    <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground capitalize">
                      {activeTab === "overview"
                        ? "Account Overview"
                        : activeTab}
                    </h1>
                  </div>
                  <p className="text-muted-foreground mt-1 text-sm sm:text-base hidden sm:block">
                    {activeTab === "overview" &&
                      "Manage your USDT staking portfolio"}
                    {activeTab === "deposit" &&
                      "Add funds to your staking wallet"}
                    {activeTab === "withdraw" && "Withdraw your funds securely"}
                    {activeTab === "history" && "Track all your transactions"}
                    {activeTab === "analytics" && "Analyze your performance"}
                    {activeTab === "settings" &&
                      "Configure your account preferences"}
                    {activeTab === "calculator" && "Project your staking returns"}
                    {activeTab === "plans" && "Choose your staking tier"}
                    {activeTab === "auto-compound" && "Manage your auto-compounding preferences"}
                    {activeTab === "address-book" && "Manage your trusted withdrawal addresses"}
                    {activeTab === "portfolio" && "Deep portfolio insights & analytics"}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2 sm:space-x-4">
                {/* Quick Stats */}
                <div className="hidden xl:flex items-center space-x-4 lg:space-x-6 bg-secondary border border-border rounded-xl lg:rounded-2xl px-3 lg:px-6 py-2 lg:py-3">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Monthly Rate</p>
                    <p className="text-lg font-bold text-primary">5-12%</p>
                  </div>
                  <div className="w-px h-8 bg-border"></div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Total Earnings</p>
                    <p className="text-lg font-bold text-primary">
                      ${earnings.toFixed(2)}
                    </p>
                  </div>
                </div>

                {/* Manual Refresh */}
                <button
                  onClick={() => fetchWalletData()}
                  className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-2 rounded-lg sm:rounded-xl transition-all duration-300 bg-secondary border border-border text-muted-foreground hover:text-foreground hover:bg-primary/10 hover:border-primary/30"
                  title="Refresh data"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span className="text-xs sm:text-sm font-medium hidden sm:inline">Refresh</span>
                </button>

                {/* Notification Bell */}
                <div className="relative" data-notification-dropdown>
                  <button
                    onClick={() =>
                      setShowNotificationDropdown(!showNotificationDropdown)
                    }
                    className="relative flex items-center justify-center p-2 bg-secondary border border-border text-muted-foreground hover:bg-primary/10 hover:border-primary/30 hover:text-foreground rounded-lg sm:rounded-xl transition-all duration-300"
                    title="Notifications"
                  >
                    <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
                    {unreadNotificationCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-primary-foreground text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
                        {unreadNotificationCount > 9
                          ? "9+"
                          : unreadNotificationCount}
                      </span>
                    )}
                  </button>

                  {/* Notification Dropdown */}
                  <AnimatePresence>
                    {showNotificationDropdown && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 top-12 w-80 sm:w-96 max-h-96 overflow-y-auto bg-card border border-border rounded-2xl shadow-2xl z-50"
                      >
                        <div className="sticky top-0 bg-card p-4 border-b border-border flex items-center justify-between">
                          <h3 className="text-foreground font-semibold">
                            Notifications
                          </h3>
                          {unreadNotificationCount > 0 && (
                            <button
                              onClick={markAllNotificationsAsRead}
                              className="text-xs text-primary hover:text-primary/80 transition-colors"
                            >
                              Mark all as read
                            </button>
                          )}
                        </div>

                        <div className="p-2">
                          {loadingNotifications ? (
                            <div className="flex items-center justify-center py-8">
                              <RefreshCw className="w-6 h-6 text-primary animate-spin" />
                            </div>
                          ) : pushNotifications.length === 0 ? (
                            <div className="text-center py-8">
                              <Bell className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                              <p className="text-muted-foreground text-sm">
                                No notifications yet
                              </p>
                            </div>
                          ) : (
                            pushNotifications.map(
                              (notification: {
                                _id: string;
                                title: string;
                                message: string;
                                type: string;
                                read: boolean;
                                createdAt: string;
                              }) => (
                                <motion.div
                                  key={notification._id}
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  className={`p-3 rounded-xl mb-2 cursor-pointer transition-all duration-200 border ${
                                    notification.read
                                      ? "bg-secondary border-border hover:bg-primary/10 hover:border-primary/20"
                                      : "bg-primary/10 border-primary/30 hover:bg-primary/15"
                                  }`}
                                  onClick={() => {
                                    if (!notification.read) {
                                      markNotificationAsRead(notification._id);
                                    }
                                  }}
                                >
                                  <div className="flex items-start space-x-3">
                                    <div
                                      className={`p-2 rounded-lg ${
                                        notification.type === "success"
                                          ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                                          : notification.type === "warning"
                                          ? "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400"
                                          : notification.type === "error"
                                          ? "bg-destructive/15 text-destructive"
                                          : notification.type === "announcement"
                                          ? "bg-primary/15 text-primary"
                                          : "bg-primary/15 text-primary"
                                      }`}
                                    >
                                      <Bell className="w-4 h-4" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center justify-between">
                                        <h4
                                          className={`font-medium text-sm ${
                                            notification.read
                                              ? "text-muted-foreground"
                                              : "text-foreground"
                                          }`}
                                        >
                                          {notification.title}
                                        </h4>
                                        <div className="flex items-center space-x-2">
                                          {!notification.read && (
                                            <span className="w-2 h-2 bg-primary rounded-full flex-shrink-0"></span>
                                          )}
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              deleteNotification(
                                                notification._id
                                              );
                                            }}
                                            className="p-1 hover:bg-destructive/15 rounded-lg transition-colors group"
                                            title="Delete notification"
                                          >
                                            <Trash2 className="w-4 h-4 text-muted-foreground/50 group-hover:text-destructive transition-colors" />
                                          </button>
                                        </div>
                                      </div>
                                      <p className="text-muted-foreground text-xs mt-1 line-clamp-2">
                                        {notification.message}
                                      </p>
                                      <p className="text-muted-foreground/60 text-xs mt-2">
                                        {new Date(
                                          notification.createdAt
                                        ).toLocaleString()}
                                      </p>
                                    </div>
                                  </div>
                                </motion.div>
                              )
                            )
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Support Button */}
                <a
                  href="/support"
                  className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-2 bg-secondary text-muted-foreground border border-border rounded-lg sm:rounded-xl hover:bg-primary/10 hover:border-primary/30 hover:text-primary transition-all duration-300 group"
                  title="Help & Support"
                >
                  <HelpCircle className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  <span className="text-xs sm:text-sm font-medium hidden md:inline">
                    Support
                  </span>
                </a>
                {/* Theme Toggle */}
                <ThemeToggle />
              </div>
            </div>
          </div>

          {/* Notifications Display */}
          <AnimatePresence>
            {notifications.map((notification) => (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, y: -50, x: 100 }}
                animate={{ opacity: 1, y: 0, x: 0 }}
                exit={{ opacity: 0, x: 100 }}
                className={`fixed top-20 sm:top-24 right-4 sm:right-8 z-50 p-3 sm:p-4 rounded-xl sm:rounded-2xl shadow-xl border max-w-xs sm:max-w-sm ${
                  notification.type === "success"
                    ? "bg-card border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                    : notification.type === "error"
                    ? "bg-card border-destructive/30 text-destructive"
                    : "bg-card border-primary/30 text-primary"
                }`}
              >
                <div className="flex items-start space-x-3">
                  {notification.type === "success" && (
                    <CheckCircle className="w-5 h-5 mt-0.5" />
                  )}
                  {notification.type === "error" && (
                    <XCircle className="w-5 h-5 mt-0.5" />
                  )}
                  {notification.type === "info" && (
                    <AlertCircle className="w-5 h-5 mt-0.5" />
                  )}
                  <div>
                    <p className="font-medium">{notification.message}</p>
                    <p className="text-xs opacity-70">
                      {notification.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Content Area */}
          <div className="p-3 sm:p-4 md:p-6 lg:p-8">
            {loadingWallet ? (
              <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                  <div className="w-16 h-16 border-4 border-warm-400/30 border-t-warm-600 rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-slate-600 dark:text-slate-300 font-medium">Loading wallet data...</p>
                </div>
              </div>
            ) : walletError ? (
              <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                  <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <X className="w-8 h-8 text-red-400" />
                  </div>
                  <p className="text-red-400 font-medium mb-2">
                    Failed to load wallet data
                  </p>
                  <p className="text-slate-600 dark:text-slate-300 text-sm mb-4">{walletError}</p>
                  <button
                    onClick={fetchWalletData}
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors"
                  >
                    Retry
                  </button>
                </div>
              </div>
            ) : (
              <>
                {activeTab === "overview" && (
                  <OverviewTab
                    data={{
                      ...mockData,
                      totalBalance: balance,
                      availableAmount: availableBalance,
                      stakedAmount: stakedBalance,
                      earnings: earnings,
                    }}
                    walletData={walletData}
                    onDeposit={handleDeposit}
                    onWithdraw={handleWithdraw}
                    onStake={handleStake}
                    showBalance={showBalance}
                    formatCurrency={formatCurrency}
                    setActiveTab={setActiveTab}
                  />
                )}
                {activeTab === "deposit" && (
                  <DepositTab
                    availableBalance={availableBalance}
                    setNotifications={setNotifications}
                    formatCurrency={formatCurrency}
                    onDepositSuccess={fetchWalletData}
                  />
                )}
                {activeTab === "staking" && (
                  <StakingTab
                    availableBalance={availableBalance}
                    stakedBalance={stakedBalance}
                    onStake={handleStake}
                    setNotifications={setNotifications}
                    formatCurrency={formatCurrency}
                    walletData={walletData}
                  />
                )}
                {activeTab === "withdraw" && (
                  <WithdrawTab
                    onWithdraw={(amount, toAddress) =>
                      handleWithdraw(amount, toAddress)
                    }
                    availableBalance={availableBalance}
                    setNotifications={setNotifications}
                  />
                )}
                {activeTab === "history" && (
                  <HistoryTab setNotifications={setNotifications} />
                )}
                {activeTab === "analytics" && <AnalyticsTab />}
                {activeTab === "affiliate" && (
                  <AffiliateTab
                    user={user}
                    setNotifications={setNotifications}
                  />
                )}
                {activeTab === "settings" && <SettingsTab />}
                {activeTab === "calculator" && <StakingCalculatorTab walletData={walletData} />}
                {activeTab === "plans" && <StakingPlansTab />}
                {activeTab === "auto-compound" && <AutoCompoundTab walletData={walletData} />}
                {activeTab === "address-book" && <AddressBookTab />}
                {activeTab === "portfolio" && <PortfolioAnalyticsTab walletData={walletData} />}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Enhanced Overview Tab Component with Interactive Features
function OverviewTab({
  data,
  walletData,
  onDeposit,
  onWithdraw,
  onStake,
  showBalance,
  formatCurrency,
  setActiveTab,
}: {
  data: typeof mockData;
  walletData: any;
  onDeposit: (amount: number) => void;
  onWithdraw: (amount: number, toAddress?: string) => void;
  onStake: (amount: number) => void;
  showBalance: boolean;
  formatCurrency: (amount: number, showDecimals?: boolean) => string;
  setActiveTab: (tab: string) => void;
}) {
  const [quickAmount, setQuickAmount] = useState("");
  const [activeQuickAction, setActiveQuickAction] = useState<string | null>(
    null
  );
  const [screenWidth, setScreenWidth] = useState(1024);
  const [isClient, setIsClient] = useState(false);
  const [timeRange, setTimeRange] = useState<
    "7d" | "30d" | "90d" | "1y" | "all"
  >("30d");
  const [portfolioData, setPortfolioData] = useState<
    Array<{ date: string; balance: number }>
  >([]);
  const [loadingChart, setLoadingChart] = useState(true);
  const [transactions, setTransactions] = useState<any[]>([]);

  // Client-side initialization
  useEffect(() => {
    setIsClient(true);
    if (typeof window !== "undefined") {
      setScreenWidth(window.innerWidth);

      const handleResize = () => {
        setScreenWidth(window.innerWidth);
      };

      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }
  }, []);

  // Fetch transaction history and calculate portfolio data
  useEffect(() => {
    const fetchTransactionsAndCalculatePortfolio = async () => {
      try {
        setLoadingChart(true);
        const { transactionApi } = await import(
          "../../lib/api/transactions.js"
        );

        // Fetch transaction history
        const response = await transactionApi.getHistory();

        if (response.success && response.data?.transactions) {
          const txs = response.data.transactions;
          setTransactions(txs.slice(0, 5)); // Store last 5 for display

          // Calculate portfolio value over time
          const now = new Date();
          const daysBack =
            timeRange === "7d"
              ? 7
              : timeRange === "30d"
              ? 30
              : timeRange === "90d"
              ? 90
              : timeRange === "1y"
              ? 365
              : 730;
          const startDate = new Date(
            now.getTime() - daysBack * 24 * 60 * 60 * 1000
          );

          // Sort transactions by date
          const sortedTxs = [...txs].sort(
            (a, b) =>
              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );

          // Calculate balance at each point
          let runningBalance = 0;
          const dataPoints: Array<{ date: string; balance: number }> = [];

          // Group transactions by day
          const txByDate = new Map<string, number>();

          sortedTxs.forEach((tx) => {
            const txDate = new Date(tx.createdAt);
            if (txDate >= startDate && tx.status === "completed") {
              const dateKey = txDate.toISOString().split("T")[0];
              const currentBalance = txByDate.get(dateKey) || runningBalance;

              if (tx.type === "deposit" || tx.type === "reward") {
                txByDate.set(dateKey, currentBalance + tx.amount);
              } else if (tx.type === "withdrawal") {
                txByDate.set(dateKey, currentBalance - tx.amount);
              }
            }
          });

          // Generate data points for each day in range
          for (
            let d = new Date(startDate);
            d <= now;
            d.setDate(d.getDate() + 1)
          ) {
            const dateKey = d.toISOString().split("T")[0];
            const dayBalance = txByDate.get(dateKey);

            if (dayBalance !== undefined) {
              runningBalance = dayBalance;
            }

            dataPoints.push({
              date: dateKey,
              balance: runningBalance,
            });
          }

          // If no data, add current balance
          if (
            dataPoints.length === 0 ||
            dataPoints.every((p) => p.balance === 0)
          ) {
            dataPoints.push({
              date: now.toISOString().split("T")[0],
              balance: walletData?.balance || 0,
            });
          }

          setPortfolioData(dataPoints);
        } else {
          // No transactions yet, show current balance
          setPortfolioData([
            {
              date: new Date().toISOString().split("T")[0],
              balance: walletData?.balance || 0,
            },
          ]);
        }
      } catch (error) {
        console.error("Error fetching transactions:", error);
        // Fallback to current balance
        setPortfolioData([
          {
            date: new Date().toISOString().split("T")[0],
            balance: walletData?.balance || 0,
          },
        ]);
      } finally {
        setLoadingChart(false);
      }
    };

    if (walletData) {
      fetchTransactionsAndCalculatePortfolio();
    }
  }, [timeRange, walletData]);

  const quickActions = [
    {
      id: "deposit",
      label: "Quick Deposit",
      icon: Plus,
      color: "emerald",
      onClick: () => setActiveQuickAction("deposit"),
    },
    {
      id: "withdraw",
      label: "Quick Withdraw",
      icon: Minus,
      color: "red",
      onClick: () => setActiveQuickAction("withdraw"),
    },
  ];

  const handleQuickAction = (action: string) => {
    const amount = parseFloat(quickAmount);
    if (!amount || amount <= 0) return;

    switch (action) {
      case "deposit":
        onDeposit(amount);
        break;
      case "stake":
        onStake(amount);
        break;
      case "withdraw":
        onWithdraw(amount, "default-address");
        break;
    }
    setQuickAmount("");
    setActiveQuickAction(null);
  };

  return (
    <div className="space-y-8">
      {/* Enhanced Hero Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
        {/* Total Balance Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden bg-gradient-to-br from-emerald-500/20 via-green-400/10 to-emerald-600/20 backdrop-blur-xl border border-emerald-500/30 rounded-2xl sm:rounded-3xl p-4 sm:p-6 group hover:scale-105 transition-all duration-300"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-green-400/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-r from-emerald-500 to-green-400 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <DollarSign className="w-6 h-6 sm:w-7 sm:h-7 text-black font-bold" />
              </div>
              <div className="px-3 py-1 bg-emerald-500/20 rounded-full border border-emerald-500/30">
                <span className="text-emerald-400 text-sm font-medium">
                  +2.5%
                </span>
              </div>
            </div>
            <h3 className="text-2xl sm:text-3xl font-bold text-white mb-1 sm:mb-2">
              {showBalance ? data.totalBalance.toLocaleString() : "••••••"}
            </h3>
            <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm mb-1">
              Total Balance (USDT)
            </p>
            {walletData && walletData.totalDeposited > 0 && (
              <p className="text-emerald-400 text-xs mb-1">
                Total Deposited: {formatCurrency(walletData.totalDeposited)}
              </p>
            )}
            <div className="flex items-center space-x-2 text-xs">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
              <span className="text-emerald-400">
                Daily: +{data.dailyEarnings} USDT
              </span>
            </div>
          </div>
        </motion.div>

        {/* Staked Amount Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="relative overflow-hidden bg-gradient-to-br from-cyan-500/20 via-blue-400/10 to-cyan-600/20 backdrop-blur-xl border border-cyan-500/30 rounded-2xl sm:rounded-3xl p-4 sm:p-6 group hover:scale-105 transition-all duration-300"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-blue-400/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-r from-cyan-500 to-blue-400 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg shadow-cyan-500/20">
                <TrendingUp className="w-6 h-6 sm:w-7 sm:h-7 text-black font-bold" />
              </div>
              <div className="px-3 py-1 bg-cyan-500/20 rounded-full border border-cyan-500/30">
                <span className="text-cyan-400 text-sm font-medium">
                  5-15% Monthly
                </span>
              </div>
            </div>
            <h3 className="text-2xl sm:text-3xl font-bold text-white mb-1 sm:mb-2">
              {showBalance ? data.stakedAmount.toLocaleString() : "••••••"}
            </h3>
            <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm mb-1">
              Staked Amount (USDT)
            </p>
            <div className="flex items-center space-x-2 text-xs">
              <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
              <span className="text-cyan-400">Earning: 5%-15% monthly</span>
            </div>
          </div>
        </motion.div>

        {/* Available Balance Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="relative overflow-hidden bg-gradient-to-br from-yellow-500/20 via-orange-400/10 to-yellow-600/20 backdrop-blur-xl border border-yellow-500/30 rounded-2xl sm:rounded-3xl p-4 sm:p-6 group hover:scale-105 transition-all duration-300"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-orange-400/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-r from-yellow-500 to-orange-400 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg shadow-yellow-500/20">
                <Wallet className="w-6 h-6 sm:w-7 sm:h-7 text-black font-bold" />
              </div>
              <div className="px-3 py-1 bg-yellow-500/20 rounded-full border border-yellow-500/30">
                <span className="text-yellow-400 text-sm font-medium">
                  Available
                </span>
              </div>
            </div>
            <h3 className="text-3xl font-bold text-white mb-2">
              {showBalance ? data.availableAmount.toLocaleString() : "••••••"}
            </h3>
            <p className="text-slate-600 dark:text-slate-300 text-sm mb-1">
              Available Balance (USDT)
            </p>
            <div className="flex items-center space-x-2 text-xs">
              <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
              <span className="text-yellow-400">Ready to stake</span>
            </div>
          </div>
        </motion.div>

        {/* Total Earnings Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="relative overflow-hidden bg-gradient-to-br from-purple-500/20 via-pink-400/10 to-purple-600/20 backdrop-blur-xl border border-purple-500/30 rounded-3xl p-6 group hover:scale-105 transition-all duration-300"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-400/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 bg-gradient-to-r from-purple-500 to-pink-400 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/20">
                <BarChart3 className="w-7 h-7 text-black font-bold" />
              </div>
              <div className="px-3 py-1 bg-purple-500/20 rounded-full border border-purple-500/30">
                <span className="text-purple-400 text-sm font-medium">
                  Earnings
                </span>
              </div>
            </div>
            <h3 className="text-3xl font-bold text-white mb-2">
              {showBalance ? data.earnings.toLocaleString() : "••••••"}
            </h3>
            <p className="text-slate-600 dark:text-slate-300 text-sm mb-1">Total Earnings (USDT)</p>
            <div className="flex items-center space-x-2 text-xs">
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
              <span className="text-purple-400">
                +{((data.earnings / data.totalStaked) * 100).toFixed(2)}% return
              </span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Quick Actions Panel */}
      <motion.div>
        {/* <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">
              Quick Actions
            </h2>
            <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base">
              Manage your funds efficiently with one-click actions
            </p>
          </div>

          <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-3 lg:space-x-4 w-full sm:w-auto">
            {quickActions.map((action) => (
              <motion.button
                key={action.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={action.onClick}
                className={`flex items-center justify-center sm:justify-start space-x-2 sm:space-x-3 px-4 sm:px-6 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-semibold text-sm sm:text-base transition-all duration-300 ${
                  action.color === "emerald"
                    ? "bg-gradient-to-r from-emerald-500 to-green-400 text-black shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30"
                    : action.color === "blue"
                    ? "bg-gradient-to-r from-cyan-500 to-blue-400 text-black shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/30"
                    : "bg-gradient-to-r from-red-500 to-orange-400 text-black shadow-lg shadow-red-500/20 hover:shadow-red-500/30"
                }`}
              >
                <action.icon className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="font-medium">{action.label}</span>
              </motion.button>
            ))}
          </div>
        </div> */}

        {/* Quick Action Form */}
        <AnimatePresence>
          {activeQuickAction && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-6 pt-6 border-t border-warm-400/30"
            >
              <div className="flex flex-col sm:flex-row gap-4 items-end">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-white mb-2">
                    Amount (USDT)
                  </label>
                  <input
                    type="number"
                    value={quickAmount}
                    onChange={(e) => setQuickAmount(e.target.value)}
                    placeholder="Enter amount"
                    className="w-full px-4 py-3 bg-warm-400/15 border border-warm-400/30 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50"
                    step="0.01"
                    min="0"
                  />
                </div>
                <div className="flex gap-3">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleQuickAction(activeQuickAction)}
                    disabled={!quickAmount || parseFloat(quickAmount) <= 0}
                    className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                      !quickAmount || parseFloat(quickAmount) <= 0
                        ? "bg-warm-400/15 text-white/50 cursor-not-allowed"
                        : "bg-gradient-to-r from-emerald-500 to-green-400 text-black shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30"
                    }`}
                  >
                    Confirm {activeQuickAction}
                  </motion.button>
                  <button
                    onClick={() => setActiveQuickAction(null)}
                    className="px-6 py-3 bg-warm-400/15 text-white rounded-xl font-semibold hover:bg-warm-400/25 transition-all duration-300"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Portfolio Growth Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl border border-warm-400/30 rounded-3xl p-8"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
          <div>
            <h3 className="text-2xl font-bold text-white mb-2">
              Portfolio Growth
            </h3>
            <p className="text-slate-600 dark:text-slate-300 text-sm">
              Track your balance over time
            </p>
          </div>

          {/* Time Range Filter */}
          <div className="flex items-center gap-2 bg-slate-800/80 dark:bg-slate-700/60 rounded-full p-1 border border-warm-400/20">
            {[
              { label: "7D", value: "7d" as const },
              { label: "30D", value: "30d" as const },
              { label: "90D", value: "90d" as const },
              { label: "1Y", value: "1y" as const },
              { label: "All", value: "all" as const },
            ].map((range) => (
              <button
                key={range.value}
                onClick={() => setTimeRange(range.value)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300 ${
                  timeRange === range.value
                    ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30"
                    : "text-gray-400 hover:text-white hover:bg-slate-800/80 dark:bg-slate-700/60"
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>

        <div className="h-64 sm:h-80 lg:h-96">
          {loadingChart ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
            </div>
          ) : portfolioData.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-slate-800/80 dark:bg-slate-700/60 flex items-center justify-center">
                  <TrendingUp className="w-12 h-12 text-white/40" />
                </div>
                <p className="text-slate-600 dark:text-slate-300 text-lg font-medium">
                  No Portfolio Data Yet
                </p>
                <p className="text-white/40 text-sm">
                  Start transacting to see your portfolio growth
                </p>
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={portfolioData}>
                <defs>
                  <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="date"
                  stroke="#9CA3AF"
                  fontSize={isClient && screenWidth < 640 ? 10 : 12}
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    return isClient && screenWidth < 640
                      ? `${date.getMonth() + 1}/${date.getDate()}`
                      : date.toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        });
                  }}
                  interval="preserveStartEnd"
                  minTickGap={isClient && screenWidth < 640 ? 50 : 30}
                />
                <YAxis
                  stroke="#9CA3AF"
                  fontSize={isClient && screenWidth < 640 ? 10 : 12}
                  tickFormatter={(value) => `$${value.toLocaleString()}`}
                  width={isClient && screenWidth < 640 ? 60 : 80}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1F2937",
                    border: "1px solid #374151",
                    borderRadius: "16px",
                    color: "#F9FAFB",
                    backdropFilter: "blur(20px)",
                    fontSize: isClient && screenWidth < 640 ? "14px" : "16px",
                  }}
                  formatter={(value: number) => [
                    `$${value.toLocaleString()}`,
                    "Balance",
                  ]}
                  labelFormatter={(label) => {
                    const date = new Date(label);
                    return date.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    });
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="balance"
                  stroke="#10B981"
                  strokeWidth={isClient && screenWidth < 640 ? 2 : 3}
                  fillOpacity={1}
                  fill="url(#colorBalance)"
                  dot={false}
                  activeDot={{
                    r: isClient && screenWidth < 640 ? 4 : 6,
                    fill: "#10B981",
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </motion.div>

      {/* Recent Transactions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.8 }}
        className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl border border-warm-400/30 rounded-3xl p-8"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-white">Recent Transactions</h3>
          <button
            onClick={() => setActiveTab("history")}
            className="text-emerald-400 hover:text-emerald-300 text-sm font-medium px-4 py-2 rounded-xl hover:bg-emerald-500/10 transition-all duration-300"
          >
            View All →
          </button>
        </div>
        <div className="space-y-4">
          {transactions.length > 0 ? (
            transactions.map((transaction: any) => (
              <motion.div
                key={transaction._id}
                whileHover={{ scale: 1.02 }}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-6 bg-slate-800/80 dark:bg-slate-700/60 rounded-xl sm:rounded-2xl hover:bg-warm-400/15 transition-all duration-300 cursor-pointer border border-warm-400/20 hover:border-warm-400/30 space-y-3 sm:space-y-0"
              >
                <div className="flex items-center space-x-3 sm:space-x-4">
                  <div
                    className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center ${
                      transaction.type === "deposit"
                        ? "bg-emerald-500/20 text-emerald-400"
                        : transaction.type === "withdrawal" ||
                          transaction.type === "early_cancellation_penalty" ||
                          transaction.type === "manual_deduct"
                        ? "bg-red-500/20 text-red-400"
                        : transaction.type === "stake"
                        ? "bg-cyan-500/20 text-cyan-400"
                        : transaction.type === "unstake"
                        ? "bg-orange-500/20 text-orange-400"
                        : transaction.type === "manual_bonus" ||
                          transaction.type === "manual_add" ||
                          transaction.type === "first_deposit_bonus" ||
                          transaction.type === "referral_commission"
                        ? "bg-yellow-500/20 text-yellow-400"
                        : "bg-blue-500/20 text-blue-400"
                    }`}
                  >
                    {transaction.type === "deposit" ? (
                      <ArrowUpRight className="w-6 h-6" />
                    ) : transaction.type === "withdrawal" ||
                      transaction.type === "early_cancellation_penalty" ||
                      transaction.type === "manual_deduct" ? (
                      <ArrowDownLeft className="w-6 h-6" />
                    ) : transaction.type === "stake" ? (
                      <TrendingUp className="w-6 h-6" />
                    ) : transaction.type === "unstake" ? (
                      <ArrowDownLeft className="w-6 h-6" />
                    ) : (
                      <DollarSign className="w-6 h-6" />
                    )}
                  </div>
                  <div>
                    <p className="text-white font-semibold capitalize text-lg">
                      {transaction.type === "early_cancellation_penalty"
                        ? "Early Cancellation Penalty"
                        : transaction.type === "manual_bonus"
                        ? "Bonus"
                        : transaction.type === "manual_add"
                        ? "Balance Added"
                        : transaction.type === "manual_deduct"
                        ? "Balance Deducted"
                        : transaction.type === "first_deposit_bonus"
                        ? "First Deposit Bonus"
                        : transaction.type === "referral_commission"
                        ? "Referral Commission"
                        : transaction.type}
                    </p>
                    {/* Show description for bonus/admin transactions */}
                    {transaction.description && (
                      <p className="text-emerald-400/80 text-xs sm:text-sm mt-0.5 italic">
                        {transaction.description
                          .replace(/^Admin bonus:\s*/i, "")
                          .replace(/^Manual (add|deduct|bonus):\s*/i, "")}
                      </p>
                    )}
                    <p className="text-slate-600 dark:text-slate-300 text-sm">
                      {new Date(transaction.createdAt).toLocaleDateString(
                        "en-US",
                        {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      )}
                    </p>
                    {transaction.transactionHash && (
                      <p className="text-white/50 text-xs font-mono break-all sm:break-normal">
                        {transaction.transactionHash.slice(0, 10)}...
                        {transaction.transactionHash.slice(-8)}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right sm:text-left">
                  <p
                    className={`text-lg sm:text-xl font-bold ${
                      transaction.type === "deposit" ||
                      transaction.type === "manual_bonus" ||
                      transaction.type === "manual_add" ||
                      transaction.type === "first_deposit_bonus" ||
                      transaction.type === "referral_commission"
                        ? "text-emerald-400"
                        : transaction.type === "withdrawal" ||
                          transaction.type === "unstake" ||
                          transaction.type === "early_cancellation_penalty" ||
                          transaction.type === "manual_deduct"
                        ? "text-red-400"
                        : transaction.type === "stake"
                        ? "text-cyan-400"
                        : "text-blue-400"
                    }`}
                  >
                    {transaction.type === "withdrawal" ||
                    transaction.type === "unstake" ||
                    transaction.type === "early_cancellation_penalty" ||
                    transaction.type === "manual_deduct"
                      ? "-"
                      : "+"}
                    {transaction.amount.toLocaleString()}{" "}
                    {transaction.currency || "USDT"}
                  </p>
                  <p
                    className={`text-sm font-medium capitalize ${
                      transaction.status === "completed"
                        ? "text-emerald-400"
                        : transaction.status === "pending"
                        ? "text-yellow-400"
                        : transaction.status === "failed"
                        ? "text-red-400"
                        : "text-gray-400"
                    }`}
                  >
                    {transaction.status}
                  </p>
                  {(() => {
                    const feeAmount =
                      typeof transaction.fee === "object" &&
                      transaction.fee?.amount
                        ? transaction.fee.amount
                        : typeof transaction.fee === "number"
                        ? transaction.fee
                        : 0;
                    return feeAmount > 0 ? (
                      <p className="text-white/50 text-xs">
                        Fee: {feeAmount.toFixed(4)}{" "}
                        {transaction.currency || "USDT"}
                      </p>
                    ) : null;
                  })()}
                </div>
              </motion.div>
            ))
          ) : (
            <div className="text-center py-12">
              <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-slate-800/80 dark:bg-slate-700/60 flex items-center justify-center">
                <History className="w-12 h-12 text-white/40" />
              </div>
              <p className="text-slate-600 dark:text-slate-300 text-lg font-medium">
                No Transactions Yet
              </p>
              <p className="text-white/40 text-sm">
                Your recent transactions will appear here
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// Enhanced Deposit Tab Component
function DepositTab({
  availableBalance,
  setNotifications,
  formatCurrency,
  onDepositSuccess,
}: {
  availableBalance: number;
  setNotifications: React.Dispatch<
    React.SetStateAction<
      Array<{ id: number; type: string; message: string; timestamp: Date }>
    >
  >;
  formatCurrency: (amount: number, showDecimals?: boolean) => string;
  onDepositSuccess?: () => void;
}) {
  const [depositAmount, setDepositAmount] = useState("");
  const [selectedToken, setSelectedToken] = useState("USDT");
  const [depositMethod, setDepositMethod] = useState("wallet");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [uploadedScreenshot, setUploadedScreenshot] = useState<File | null>(
    null
  );
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(
    null
  );
  const [userTransactionId, setUserTransactionId] = useState("");

  // Cleanup screenshot preview URL when component unmounts
  useEffect(() => {
    return () => {
      if (screenshotPreview) {
        URL.revokeObjectURL(screenshotPreview);
      }
    };
  }, [screenshotPreview]);

  const depositMethods = [
    {
      id: "wallet",
      label: "Crypto Wallet",
      icon: Wallet,
      description: "Connect your crypto wallet",
      fee: "0%",
      time: "Instant",
    },
  ];

  const tokens = [
    {
      symbol: "USDT",
      name: "Tether USD",
      balance: availableBalance,
      icon: "/theter.png",
      network: "TRC-20",
      minDeposit: 10,
    },
  ];

  const selectedTokenData =
    tokens.find((t) => t.symbol === selectedToken) || tokens[0];
  const selectedMethodData =
    depositMethods.find((m) => m.id === depositMethod) || depositMethods[0];
  const amount = parseFloat(depositAmount) || 0;
  const fee =
    amount * (parseFloat(selectedMethodData.fee.replace("%", "")) / 100);
  const finalAmount = amount - fee;

  const handleScreenshotUpload = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        // 5MB limit
        setNotifications((prev) => [
          {
            id: Date.now(),
            type: "error",
            message: "Screenshot file size must be less than 5MB",
            timestamp: new Date(),
          },
          ...prev,
        ]);
        return;
      }

      if (!file.type.startsWith("image/")) {
        setNotifications((prev) => [
          {
            id: Date.now(),
            type: "error",
            message: "Please upload a valid image file",
            timestamp: new Date(),
          },
          ...prev,
        ]);
        return;
      }

      setUploadedScreenshot(file);

      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setScreenshotPreview(previewUrl);

      setNotifications((prev) => [
        {
          id: Date.now(),
          type: "success",
          message: "Payment screenshot uploaded successfully",
          timestamp: new Date(),
        },
        ...prev,
      ]);

      // Auto-remove notification after 3 seconds
      setTimeout(() => {
        setNotifications((prev) => prev.slice(1));
      }, 3000);
    }
  };

  const removeScreenshot = () => {
    if (screenshotPreview) {
      URL.revokeObjectURL(screenshotPreview);
    }
    setUploadedScreenshot(null);
    setScreenshotPreview(null);
  };

  const handleModalDone = async () => {
    if (!uploadedScreenshot) {
      setNotifications((prev) => [
        {
          id: Date.now(),
          type: "error",
          message: "Please upload a payment screenshot before submitting",
          timestamp: new Date(),
        },
        ...prev,
      ]);
      setTimeout(() => setNotifications((prev) => prev.slice(1)), 5000);
      return;
    }

    if (!userTransactionId.trim()) {
      setNotifications((prev) => [
        {
          id: Date.now(),
          type: "error",
          message: "Please enter your transaction ID",
          timestamp: new Date(),
        },
        ...prev,
      ]);
      setTimeout(() => setNotifications((prev) => prev.slice(1)), 5000);
      return;
    }

    try {
      setIsProcessing(true);
      const { transactionApi } = await import("../../lib/api/transactions.js");

      const depositData = {
        amount: parseFloat(depositAmount), // Use original depositAmount to ensure proper number
        currency: selectedToken,
        network: selectedTokenData.network,
        description: `Deposit of ${parseFloat(depositAmount)} ${selectedToken}`,
        userTransactionId: userTransactionId.trim() || null,
        screenshot: uploadedScreenshot
          ? {
              filename: uploadedScreenshot.name,
              size: uploadedScreenshot.size,
              type: uploadedScreenshot.type,
            }
          : null,
      };

      console.log("Sending deposit data:", depositData); // Debug log

      const response = await transactionApi.createDeposit(depositData);

      if (response.success) {
        // Show success notification
        setNotifications((prev) => [
          {
            id: Date.now(),
            type: "success",
            message: `Deposit request of ${formatCurrency(
              parseFloat(depositAmount)
            )} submitted successfully. Admin will review your request.`,
            timestamp: new Date(),
          },
          ...prev,
        ]);

        setDepositAmount("");
        setUserTransactionId("");
        setUploadedScreenshot(null);
        setScreenshotPreview(null);
        setShowQRModal(false);

        // Call success callback to refresh wallet data
        if (onDepositSuccess) {
          onDepositSuccess();
        }

        // Auto-remove notification after 10 seconds
        setTimeout(() => {
          setNotifications((prev) => prev.slice(1));
        }, 10000);
      } else {
        throw new Error(response.message || "Deposit failed");
      }
    } catch (error) {
      console.error("Deposit error:", error);
      setNotifications((prev) => [
        {
          id: Date.now(),
          type: "error",
          message: `Deposit failed: ${
            error instanceof Error ? error.message : "Unknown error occurred"
          }`,
          timestamp: new Date(),
        },
        ...prev,
      ]);

      setTimeout(() => {
        setNotifications((prev) => prev.slice(1));
      }, 8000);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!depositAmount || amount < selectedTokenData.minDeposit) return;

    setIsProcessing(true);

    try {
      const { transactionApi } = await import("../../lib/api/transactions.js");

      const depositData = {
        amount: finalAmount,
        currency: selectedToken,
        network: selectedTokenData.network,
        description: `Deposit of ${finalAmount} ${selectedToken}`,
        screenshot: uploadedScreenshot
          ? {
              filename: uploadedScreenshot.name,
              size: uploadedScreenshot.size,
              type: uploadedScreenshot.type,
            }
          : null,
      };

      const response = await transactionApi.createDeposit(depositData);

      if (response.success) {
        // Show success notification
        setNotifications((prev) => [
          {
            id: Date.now(),
            type: "success",
            message: `Deposit request of ${formatCurrency(
              finalAmount
            )} submitted successfully. ${
              uploadedScreenshot
                ? "Screenshot included for faster verification."
                : "Admin will review your request."
            }`,
            timestamp: new Date(),
          },
          ...prev,
        ]);

        setDepositAmount("");
        setUploadedScreenshot(null);
        setScreenshotPreview(null);

        // Call success callback to refresh wallet data
        if (onDepositSuccess) {
          onDepositSuccess();
        }

        // Auto-remove notification after 10 seconds
        setTimeout(() => {
          setNotifications((prev) => prev.slice(1));
        }, 10000);
      } else {
        throw new Error(response.message || "Deposit failed");
      }
    } catch (error) {
      console.error("Deposit error:", error);
      setNotifications((prev) => [
        {
          id: Date.now(),
          type: "error",
          message: `Deposit failed: ${
            error instanceof Error ? error.message : "Unknown error occurred"
          }`,
          timestamp: new Date(),
        },
        ...prev,
      ]);

      setTimeout(() => {
        setNotifications((prev) => prev.slice(1));
      }, 8000);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Mobile-First Deposit Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-gradient-to-r from-emerald-500/20 to-green-400/20 backdrop-blur-xl 
                 border border-emerald-500/30 rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8
                 mx-2 sm:mx-0"
      >
        <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 mb-4 sm:mb-6">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-emerald-500 to-green-400 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <ArrowUpRight className="w-6 h-6 sm:w-8 sm:h-8 text-black font-bold" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">
              Deposit Funds
            </h1>
            <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base">
              Add funds to your staking wallet and start earning
            </p>
          </div>
        </div>

        {/* Key Benefits */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mt-4 sm:mt-6">
          <div className="flex items-center space-x-2 sm:space-x-3 bg-warm-400/15 rounded-xl sm:rounded-2xl p-3 sm:p-4">
            <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400" />
            <div>
              <p className="text-white font-medium text-sm sm:text-base">
                Secure
              </p>
              <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm">
                Bank-grade encryption
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-3 bg-warm-400/15 rounded-xl sm:rounded-2xl p-3 sm:p-4">
            <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-400" />
            <div>
              <p className="text-white font-medium text-sm sm:text-base">
                Instant
              </p>
              <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm">
                Start earning immediately
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-3 bg-warm-400/15 rounded-xl sm:rounded-2xl p-3 sm:p-4">
            <Award className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400" />
            <div>
              <p className="text-white font-medium text-sm sm:text-base">
                6-10% Monthly
              </p>
              <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm">
                Variable staking returns
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Mobile-Optimized Main Deposit Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl border border-warm-400/30 
                 rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8"
      >
        <form onSubmit={handleDeposit} className="space-y-8">
          {/* Mobile-First Token Selection */}
          <div className="space-y-4">
            <label className="block text-lg sm:text-xl font-bold text-white text-center sm:text-left">
              Select Cryptocurrency
            </label>

            {/* Single Token Display (since only USDT is available) */}
            <div className="w-full">
              {tokens.map((token) => (
                <motion.div
                  key={token.symbol}
                  whileTap={{ scale: 0.98 }}
                  className="relative p-4 sm:p-6 rounded-2xl border-2 border-emerald-500/50 
                           bg-gradient-to-r from-emerald-500/15 to-green-400/10 
                           shadow-lg shadow-emerald-500/20"
                >
                  <div className="flex items-center space-x-4">
                    {/* Token Icon */}
                    <div
                      className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-emerald-500 to-green-400 
                                  rounded-xl flex items-center justify-center shadow-lg overflow-hidden"
                    >
                      <Image
                        src={token.icon}
                        alt={token.symbol}
                        width={48}
                        height={48}
                        className="w-10 h-10 sm:w-12 sm:h-12 object-contain"
                      />
                    </div>

                    {/* Token Info */}
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="text-white font-bold text-lg sm:text-xl">
                          {token.symbol}
                        </h3>
                        <span
                          className="px-2 py-1 bg-emerald-500/20 text-emerald-400 
                                       rounded-lg text-xs font-medium"
                        >
                          Selected
                        </span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base mb-2">
                        {token.name}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm">
                        <span className="px-2 py-1 bg-warm-400/15 rounded-lg text-slate-600 dark:text-slate-300">
                          {token.network}
                        </span>
                        <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded-lg">
                          TRC-20 & BEP-20
                        </span>
                      </div>
                    </div>

                    {/* Checkmark */}
                    <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center">
                      <Check className="w-5 h-5 text-white" />
                    </div>
                  </div>

                  {/* Additional Info Row */}
                  <div className="mt-4 pt-3 border-t border-warm-400/20">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="text-center sm:text-left">
                        <p className="text-slate-600 dark:text-slate-300">Minimum Deposit</p>
                        <p className="text-emerald-400 font-semibold">
                          {formatCurrency(token.minDeposit)}
                        </p>
                      </div>
                      <div className="text-center sm:text-left">
                        <p className="text-slate-600 dark:text-slate-300">Processing Time</p>
                        <p className="text-slate-900 dark:text-white font-semibold">1-5 minutes</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Benefits Display */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="flex items-center space-x-2 bg-slate-800/80 dark:bg-slate-700/60 rounded-xl p-3">
                <Shield className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                <div>
                  <p className="text-white font-medium text-sm">Secure</p>
                  <p className="text-slate-600 dark:text-slate-300 text-xs">Multi-network support</p>
                </div>
              </div>
              <div className="flex items-center space-x-2 bg-slate-800/80 dark:bg-slate-700/60 rounded-xl p-3">
                <Zap className="w-5 h-5 text-yellow-400 flex-shrink-0" />
                <div>
                  <p className="text-white font-medium text-sm">Fast</p>
                  <p className="text-slate-600 dark:text-slate-300 text-xs">Instant verification</p>
                </div>
              </div>
              <div className="flex items-center space-x-2 bg-slate-800/80 dark:bg-slate-700/60 rounded-xl p-3">
                <Award className="w-5 h-5 text-purple-400 flex-shrink-0" />
                <div>
                  <p className="text-white font-medium text-sm">Earn 12.5%</p>
                  <p className="text-slate-600 dark:text-slate-300 text-xs">Start immediately</p>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile-Optimized Amount Input */}
          <div className="space-y-4">
            <label className="block text-lg sm:text-xl font-bold text-white text-center sm:text-left">
              Enter Deposit Amount
            </label>

            {/* Large, Touch-Friendly Input */}
            <div className="relative">
              <input
                type="number"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                className="w-full px-4 sm:px-6 py-4 sm:py-5 text-xl sm:text-2xl text-center sm:text-left
                         bg-warm-400/15 border-2 border-warm-400/30 rounded-2xl text-white placeholder-white/50 
                         focus:outline-none focus:ring-2 focus:ring-emerald-500/60 focus:border-emerald-500/60 
                         transition-all duration-300 touch-manipulation font-bold"
                placeholder="0.00"
                step="0.01"
                min={selectedTokenData.minDeposit}
                inputMode="decimal"
              />
              <div className="absolute right-4 sm:right-6 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
                <span className="text-slate-600 dark:text-slate-300 text-lg sm:text-xl font-semibold">
                  {selectedToken}
                </span>
                <div className="w-8 h-8 sm:w-10 sm:h-10">
                  <Image
                    src={selectedTokenData.icon}
                    alt={selectedTokenData.symbol}
                    width={40}
                    height={40}
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
            </div>

            {/* Mobile-Friendly Quick Amount Grid */}
            <div className="space-y-3">
              <p className="text-slate-600 dark:text-slate-300 text-sm text-center">
                Quick Select Amount
              </p>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 sm:gap-3">
                {[50, 100, 250, 500, 1000].map((quickAmount) => (
                  <button
                    key={quickAmount}
                    type="button"
                    onClick={() => setDepositAmount(quickAmount.toString())}
                    className="py-3 px-2 sm:px-4 bg-warm-400/15 hover:bg-emerald-500/20 active:bg-emerald-500/30
                             border border-warm-400/30 hover:border-emerald-500/40 rounded-xl 
                             text-white text-sm sm:text-base font-semibold transition-all duration-200 
                             touch-manipulation transform active:scale-95"
                  >
                    ${quickAmount}
                  </button>
                ))}
              </div>

              {/* Custom Amount Button for Higher Values */}
              <div className="grid grid-cols-2 gap-2 sm:gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => setDepositAmount("2500")}
                  className="py-3 px-4 bg-gradient-to-r from-blue-500/20 to-purple-400/20 
                           border border-blue-500/30 rounded-xl text-blue-400 font-semibold 
                           transition-all duration-200 touch-manipulation active:scale-95"
                >
                  $2,500
                </button>
                <button
                  type="button"
                  onClick={() => setDepositAmount("5000")}
                  className="py-3 px-4 bg-gradient-to-r from-purple-500/20 to-pink-400/20 
                           border border-purple-500/30 rounded-xl text-purple-400 font-semibold 
                           transition-all duration-200 touch-manipulation active:scale-95"
                >
                  $5,000
                </button>
              </div>
            </div>

            {/* Mobile-Friendly Info Display */}
            <div className="bg-gradient-to-r from-white/5 to-white/10 rounded-xl p-3 sm:p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 text-sm">
                <div className="text-center sm:text-left">
                  <span className="text-slate-600 dark:text-slate-300">Minimum: </span>
                  <span className="text-emerald-400 font-semibold">
                    {selectedTokenData.minDeposit} {selectedToken}
                  </span>
                </div>
                <div className="text-center sm:text-left">
                  <span className="text-slate-600 dark:text-slate-300">Maximum: </span>
                  <span className="text-emerald-400 font-semibold">
                    100,000 {selectedToken}
                  </span>
                </div>
              </div>

              {/* Amount Validation Feedback */}
              {depositAmount && (
                <div className="mt-2 pt-2 border-t border-warm-400/20">
                  {amount >= selectedTokenData.minDeposit ? (
                    <div className="flex items-center justify-center space-x-2 text-emerald-400">
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-sm font-medium">
                        Valid amount entered
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center space-x-2 text-red-400">
                      <XCircle className="w-4 h-4" />
                      <span className="text-sm font-medium">
                        Minimum deposit is{" "}
                        {formatCurrency(selectedTokenData.minDeposit)}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Deposit Method */}
          <div>
            <label className="block text-lg font-semibold text-white mb-4">
              Deposit Method
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {depositMethods.map((method) => (
                <motion.button
                  key={method.id}
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setDepositMethod(method.id)}
                  className={`p-4 sm:p-6 rounded-xl sm:rounded-2xl border-2 transition-all duration-300 text-left ${
                    depositMethod === method.id
                      ? "border-emerald-500 bg-emerald-500/10 shadow-lg shadow-emerald-500/20"
                      : "border-warm-400/30 bg-slate-800/80 dark:bg-slate-700/60 hover:border-emerald-500/50 hover:bg-warm-400/15"
                  }`}
                >
                  <div className="flex items-start space-x-4">
                    <method.icon className="w-8 h-8 text-emerald-400 mt-1" />
                    <div className="flex-1">
                      <div className="text-white font-semibold text-lg">
                        {method.label}
                      </div>
                      <div className="text-slate-600 dark:text-slate-300 text-sm mb-2">
                        {method.description}
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-emerald-400 font-medium">
                          {method.fee} fee
                        </span>
                        <span className="text-white/50 text-sm">
                          {method.time}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Transaction Summary */}
          {amount > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="bg-gradient-to-r from-emerald-500/10 to-green-400/10 border border-emerald-500/20 rounded-2xl p-6"
            >
              <h3 className="text-lg font-semibold text-white mb-4">
                Transaction Summary
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-300">Deposit Amount:</span>
                  <span className="text-slate-900 dark:text-white font-semibold">
                    {amount.toLocaleString()} {selectedToken}
                  </span>
                </div>
                {fee > 0 && (
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-300">
                      Processing Fee ({selectedMethodData.fee}):
                    </span>
                    <span className="text-red-400">
                      -{fee.toFixed(4)} {selectedToken}
                    </span>
                  </div>
                )}
                <div className="border-t border-warm-400/30 pt-3">
                  <div className="flex justify-between">
                    <span className="text-slate-900 dark:text-white font-semibold">
                      You will receive:
                    </span>
                    <span className="text-emerald-400 font-bold text-lg">
                      {finalAmount.toFixed(4)} {selectedToken}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-300">Processing Time:</span>
                  <span className="text-slate-600 dark:text-slate-300">
                    {selectedMethodData.time}
                  </span>
                </div>
                <div className="bg-emerald-500/20 rounded-xl p-4 mt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-900 dark:text-white font-medium">Monthly Returns</p>
                      <p className="text-slate-600 dark:text-slate-300 text-sm">
                        Variable staking rates
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-emerald-400">
                        6-10%
                      </p>
                      <p className="text-slate-600 dark:text-slate-300 text-sm">Per month</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Payment Screenshot Upload Section */}

          {/* Mobile-Optimized Action Button */}
          <div className="space-y-3">
            {/* Primary Deposit Button - Mobile First */}
            <motion.button
              type="button"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                if (!depositAmount || amount < selectedTokenData.minDeposit) {
                  setNotifications((prev) => [
                    {
                      id: Date.now(),
                      type: "error",
                      message: `Please enter a valid amount (minimum ${formatCurrency(
                        selectedTokenData.minDeposit
                      )})`,
                      timestamp: new Date(),
                    },
                    ...prev,
                  ]);
                  setTimeout(
                    () => setNotifications((prev) => prev.slice(1)),
                    5000
                  );
                  return;
                }
                setShowQRModal(true);
              }}
              disabled={isProcessing}
              className={`w-full py-4 sm:py-5 px-6 sm:px-8 rounded-2xl font-bold text-base sm:text-lg 
                        transition-all duration-300 touch-manipulation shadow-lg ${
                          !depositAmount ||
                          amount < selectedTokenData.minDeposit ||
                          isProcessing
                            ? "bg-warm-400/15 text-white/50 cursor-not-allowed border border-warm-400/30"
                            : "bg-gradient-to-r from-emerald-500 to-green-400 text-black shadow-emerald-500/20 hover:shadow-emerald-500/30 active:shadow-emerald-500/40 transform active:scale-95"
                        }`}
            >
              {isProcessing ? (
                <div className="flex items-center justify-center space-x-2">
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>Processing...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-2">
                  <QrCode className="w-5 h-5 sm:w-6 sm:h-6" />
                  <span>
                    Show Deposit QR •{" "}
                    {amount > 0 ? formatCurrency(amount) : "$0"} {selectedToken}
                  </span>
                </div>
              )}
            </motion.button>

            {/* Mobile Helper Text */}
            <div className="text-center space-y-1">
              <p className="text-slate-600 dark:text-slate-300 text-sm">
                {amount > 0
                  ? `Ready to deposit ${formatCurrency(
                      amount
                    )} ${selectedToken}`
                  : "Enter amount above to continue"}
              </p>
              <p className="text-white/40 text-xs">
                QR code • Copy address • Upload proof • Instant verification
              </p>
            </div>
          </div>
        </form>

        {/* Mobile-Optimized QR Code Modal */}
        <AnimatePresence>
          {showQRModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/90 backdrop-blur-lg z-50 overflow-y-auto"
              onClick={() => setShowQRModal(false)}
            >
              <div className="min-h-screen flex items-start sm:items-center justify-center p-0 sm:p-4 sm:py-8">
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 100 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 100 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-0 sm:border border-emerald-500/20 
                         rounded-none sm:rounded-3xl w-full sm:max-w-lg md:max-w-2xl lg:max-w-4xl 
                         overflow-y-auto shadow-2xl shadow-emerald-500/10
                         flex flex-col"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Mobile-Optimized Header with Safe Area */}
                <div className="bg-gradient-to-r from-emerald-500/10 to-green-400/10 border-b border-emerald-500/20 px-3 sm:px-6 lg:px-8 pt-safe-top pb-3 sm:py-6 flex-shrink-0">
                  <div className="flex items-center justify-between pt-2 sm:pt-0">
                    <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-emerald-500 to-green-400 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0">
                        <QrCode className="w-5 h-5 sm:w-6 sm:h-6 text-black" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-base sm:text-xl lg:text-2xl font-bold text-white truncate">
                          Deposit {formatCurrency(amount)}
                        </h3>
                        <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm truncate">
                          {selectedToken} • Select Network
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowQRModal(false)}
                      className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-warm-400/15 hover:bg-warm-400/25 flex items-center justify-center transition-all duration-300 flex-shrink-0 ml-2"
                    >
                      <X className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto w-full overscroll-contain">
                  <div className="px-3 sm:px-6 lg:px-8 py-3 sm:py-6 space-y-3 sm:space-y-6">
                    {/* Mobile-First Network Selection */}
                    <div className="space-y-3 sm:space-y-4">
                      <h4 className="text-white font-bold text-base sm:text-lg text-center">
                        Choose Network
                      </h4>

                      {/* TRC-20 Network Card - Mobile Optimized */}
                      <div className="bg-gradient-to-br from-emerald-500/15 to-green-400/10 backdrop-blur-xl border border-emerald-500/30 rounded-xl sm:rounded-2xl p-3 sm:p-6">
                        <div className="text-center">
                          <div className="flex items-center justify-center space-x-2 mb-2 sm:mb-3">
                            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-emerald-500 rounded-lg flex items-center justify-center flex-shrink-0">
                              <span className="text-black font-bold text-xs sm:text-sm">
                                T
                              </span>
                            </div>
                            <h5 className="text-white font-bold text-sm sm:text-lg">
                              TRC-20
                            </h5>
                            <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded text-xs font-medium">
                              Recommended
                            </span>
                          </div>

                          {/* Mobile-Sized QR Code */}
                          <div className="relative group mb-3 sm:mb-4">
                            <div className="bg-white p-2 sm:p-4 rounded-lg sm:rounded-2xl shadow-2xl mx-auto w-fit">
                              <Image
                                src="/qr.jpeg"
                                alt="USDT Deposit QR Code - TRC-20"
                                width={150}
                                height={150}
                                className="w-28 h-28 sm:w-40 sm:h-40 lg:w-48 lg:h-48 object-contain rounded-lg"
                              />
                            </div>
                          </div>

                          {/* Mobile-Friendly Address Display */}
                          <div className="bg-black/30 rounded-lg sm:rounded-xl p-2 sm:p-3 mb-2 sm:mb-3 border border-emerald-500/30">
                            <p className="text-emerald-400 font-mono text-xs sm:text-sm break-all line-clamp-2">
                              TXMAjhdDAtY4FY9biErqAqx3VS7rfiU7gV
                            </p>
                          </div>

                          {/* Large Touch-Friendly Copy Button */}
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(
                                "0x742d35Cc6634C0532925a3b8D1DD2C1e9B8e4CfD"
                              );
                              setNotifications((prev) => [
                                {
                                  id: Date.now(),
                                  type: "success",
                                  message: "TRC-20 address copied!",
                                  timestamp: new Date(),
                                },
                                ...prev,
                              ]);
                              setTimeout(
                                () => setNotifications((prev) => prev.slice(1)),
                                3000
                              );
                            }}
                            className="w-full py-2.5 sm:py-4 px-3 sm:px-4 bg-emerald-500/20 hover:bg-emerald-500/30 
                                     active:bg-emerald-500/40 border border-emerald-500/30 hover:border-emerald-500/50 
                                     text-emerald-400 rounded-lg sm:rounded-xl transition-all duration-200 
                                     flex items-center justify-center space-x-2 touch-manipulation text-sm sm:text-base"
                          >
                            <Copy className="w-4 h-4 sm:w-5 sm:h-5" />
                            <span className="font-bold">Copy TRC-20</span>
                          </button>
                        </div>
                      </div>

                      {/* BEP-20 Network Card - Mobile Optimized */}
                      <div className="bg-gradient-to-br from-yellow-500/15 to-orange-400/10 backdrop-blur-xl border border-yellow-500/30 rounded-xl sm:rounded-2xl p-3 sm:p-6">
                        <div className="text-center">
                          <div className="flex items-center justify-center space-x-2 mb-2 sm:mb-3">
                            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-yellow-500 rounded-lg flex items-center justify-center flex-shrink-0">
                              <span className="text-black font-bold text-xs sm:text-sm">
                                B
                              </span>
                            </div>
                            <h5 className="text-white font-bold text-sm sm:text-lg">
                              BEP-20 (BSC)
                            </h5>
                          </div>

                          {/* Mobile-Sized QR Code */}
                          <div className="relative group mb-3 sm:mb-4">
                            <div className="bg-white p-2 sm:p-4 rounded-lg sm:rounded-2xl shadow-2xl mx-auto w-fit">
                              <Image
                                src="/Bep20.jpeg"
                                alt="USDT Deposit QR Code - BEP-20"
                                width={150}
                                height={150}
                                className="w-28 h-28 sm:w-40 sm:h-40 lg:w-48 lg:h-48 object-contain rounded-lg"
                              />
                            </div>
                          </div>

                          <div className="bg-black/30 rounded-lg sm:rounded-xl p-2 sm:p-3 mb-2 sm:mb-3 border border-yellow-500/30">
                            <p className="text-yellow-400 font-mono text-xs sm:text-sm break-all line-clamp-2">
                              0x150D8a5488C3ce3Bc8718F12084E7262cC7e8933
                            </p>
                          </div>

                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(
                                "0x742d35Cc6634C0532925a3b8D1DD2C1e9B8e4CfD"
                              );
                              setNotifications((prev) => [
                                {
                                  id: Date.now(),
                                  type: "success",
                                  message: "BEP-20 address copied!",
                                  timestamp: new Date(),
                                },
                                ...prev,
                              ]);
                              setTimeout(
                                () => setNotifications((prev) => prev.slice(1)),
                                3000
                              );
                            }}
                            className="w-full py-2.5 sm:py-4 px-3 sm:px-4 bg-yellow-500/20 hover:bg-yellow-500/30 
                                     active:bg-yellow-500/40 border border-yellow-500/30 hover:border-yellow-500/50 
                                     text-yellow-400 rounded-lg sm:rounded-xl transition-all duration-200 
                                     flex items-center justify-center space-x-2 touch-manipulation text-sm sm:text-base"
                          >
                            <Copy className="w-4 h-4 sm:w-5 sm:h-5" />
                            <span className="font-bold">Copy BEP-20</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Mobile-Optimized Transaction Summary */}
                    <div className="bg-gradient-to-br from-blue-500/10 to-purple-400/5 backdrop-blur-xl border border-blue-500/20 rounded-xl sm:rounded-2xl p-3 sm:p-6">
                      <div className="flex items-center space-x-2 mb-3 sm:mb-4">
                        <div className="w-5 h-5 sm:w-6 sm:h-6 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Info className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                        </div>
                        <h4 className="text-white font-bold text-sm sm:text-lg">
                          Summary
                        </h4>
                      </div>

                      <div className="grid grid-cols-2 gap-2 sm:gap-4 mb-3 sm:mb-4">
                        <div className="text-center p-2 sm:p-3 bg-warm-400/15 rounded-lg">
                          <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm">
                            Amount
                          </p>
                          <p className="text-white font-bold text-sm sm:text-base">
                            {formatCurrency(amount)}
                          </p>
                        </div>
                        <div className="text-center p-2 sm:p-3 bg-warm-400/15 rounded-lg">
                          <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm">
                            Token
                          </p>
                          <p className="text-white font-bold text-sm sm:text-base">
                            {selectedToken}
                          </p>
                        </div>
                      </div>

                      <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm text-center">
                        Processing: 1-5 minutes
                      </p>
                    </div>

                    {/* Transaction ID Input Field */}
                    <div className="bg-gradient-to-br from-cyan-500/10 to-blue-400/5 backdrop-blur-xl border border-cyan-500/20 rounded-xl sm:rounded-2xl p-3 sm:p-6">
                      <div className="flex items-center space-x-2 mb-2 sm:mb-3">
                        <div className="w-5 h-5 sm:w-6 sm:h-6 bg-cyan-500 rounded-lg flex items-center justify-center flex-shrink-0">
                          <CreditCard className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                        </div>
                        <h4 className="text-white font-bold text-sm sm:text-lg">
                          Transaction ID
                        </h4>
                        <span className="px-2 py-0.5 bg-red-500/20 text-red-400 rounded text-xs font-medium">
                          Required
                        </span>
                      </div>

                      <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm mb-3">
                        Enter your transaction hash or ID for faster
                        verification
                      </p>

                      <input
                        type="text"
                        value={userTransactionId}
                        onChange={(e) => setUserTransactionId(e.target.value)}
                        placeholder="Enter transaction ID (e.g., 0xabc123...)"
                        className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-warm-400/15 border border-cyan-500/30 rounded-lg sm:rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all duration-300 text-xs sm:text-sm font-mono"
                        maxLength={200}
                      />
                      <p className="text-white/50 text-xs mt-2">
                        This helps us verify your payment faster
                      </p>
                    </div>

                    {/* Mobile-Optimized Screenshot Upload */}
                    <div className="bg-gradient-to-br from-purple-500/10 to-pink-400/5 backdrop-blur-xl border border-purple-500/20 rounded-xl sm:rounded-2xl p-3 sm:p-6">
                      <div className="flex items-center space-x-2 mb-2 sm:mb-3">
                        <div className="w-5 h-5 sm:w-6 sm:h-6 bg-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Upload className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                        </div>
                        <h4 className="text-white font-bold text-sm sm:text-lg">
                          Payment Proof
                        </h4>
                        <span className="px-2 py-0.5 bg-red-500/20 text-red-400 rounded text-xs font-medium">
                          Required
                        </span>
                      </div>

                      <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm mb-3">
                        Upload transaction screenshot
                      </p>

                      {!uploadedScreenshot ? (
                        <div className="border-2 border-dashed border-purple-400/30 hover:border-purple-400/60 rounded-lg p-4 sm:p-6 text-center transition-all duration-300 bg-purple-500/5">
                          <label className="cursor-pointer block">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleScreenshotUpload}
                              className="hidden"
                            />
                            <div className="space-y-2">
                              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mx-auto">
                                <Camera className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400" />
                              </div>
                              <div>
                                <p className="text-white font-medium text-xs sm:text-sm">
                                  Tap to Upload
                                </p>
                                <p className="text-slate-600 dark:text-slate-300 text-xs">
                                  PNG, JPG up to 5MB
                                </p>
                              </div>
                            </div>
                          </label>
                        </div>
                      ) : (
                        <div className="bg-green-500/15 border border-green-500/30 rounded-lg p-3 sm:p-4">
                          <div className="flex items-center space-x-2 sm:space-x-3">
                            <div className="relative flex-shrink-0">
                              {screenshotPreview && (
                                <img
                                  src={screenshotPreview}
                                  alt="Payment screenshot"
                                  className="w-12 h-12 sm:w-16 sm:h-16 object-cover rounded-lg border-2 border-green-500/40"
                                />
                              )}
                              <div className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-green-500 rounded-full flex items-center justify-center">
                                <Check className="w-2 h-2 sm:w-3 sm:h-3 text-white" />
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-white font-semibold text-xs sm:text-sm truncate">
                                {uploadedScreenshot.name}
                              </p>
                              <p className="text-slate-600 dark:text-slate-300 text-xs">
                                {(
                                  uploadedScreenshot.size /
                                  1024 /
                                  1024
                                ).toFixed(1)}{" "}
                                MB • Ready
                              </p>
                            </div>
                            <button
                              onClick={removeScreenshot}
                              className="w-7 h-7 sm:w-8 sm:h-8 bg-red-500/20 hover:bg-red-500/30 rounded-lg flex items-center justify-center transition-colors flex-shrink-0"
                            >
                              <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 text-red-400" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Mobile-Friendly Instructions */}
                    <div className="bg-gradient-to-br from-amber-500/10 to-orange-400/5 backdrop-blur-xl border border-amber-500/20 rounded-xl sm:rounded-2xl p-3 sm:p-6">
                      <div className="flex items-center space-x-2 mb-3 sm:mb-4">
                        <div className="w-5 h-5 sm:w-6 sm:h-6 bg-amber-500 rounded-lg flex items-center justify-center flex-shrink-0">
                          <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 text-black" />
                        </div>
                        <h4 className="text-white font-bold text-sm sm:text-lg">
                          Steps
                        </h4>
                      </div>

                      <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm">
                        <div className="flex items-start space-x-2 sm:space-x-3">
                          <div className="w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="text-black text-xs font-bold">
                              1
                            </span>
                          </div>
                          <p className="text-slate-900 dark:text-white">
                            Send{" "}
                            <span className="font-bold text-amber-400">
                              {formatCurrency(amount)} {selectedToken}
                            </span>
                          </p>
                        </div>
                        <div className="flex items-start space-x-2 sm:space-x-3">
                          <div className="w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="text-black text-xs font-bold">
                              2
                            </span>
                          </div>
                          <p className="text-slate-900 dark:text-white">
                            Use TRC-20 (faster) or BEP-20
                          </p>
                        </div>
                        <div className="flex items-start space-x-2 sm:space-x-3">
                          <div className="w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="text-black text-xs font-bold">
                              3
                            </span>
                          </div>
                          <p className="text-slate-900 dark:text-white">
                            Upload screenshot proof
                          </p>
                        </div>
                        <div className="flex items-start space-x-2 sm:space-x-3">
                          <div className="w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="text-black text-xs font-bold">
                              4
                            </span>
                          </div>
                          <p className="text-slate-900 dark:text-white">Tap "Confirm Deposit"</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mobile-Optimized Footer with Safe Area */}
                <div className="flex-shrink-0 border-t border-warm-400/20 px-3 sm:px-6 pt-3 sm:pt-4 pb-safe-bottom bg-gradient-to-r from-slate-900/95 to-slate-800/95 backdrop-blur-sm">
                  <div className="space-y-2 sm:space-y-3">
                    {/* Primary Action Button */}
                    <button
                      onClick={handleModalDone}
                      disabled={
                        isProcessing ||
                        !uploadedScreenshot ||
                        !userTransactionId.trim()
                      }
                      className={`w-full py-3 sm:py-4 px-4 sm:px-6 rounded-xl sm:rounded-2xl font-bold text-sm sm:text-lg transition-all duration-300 shadow-lg touch-manipulation ${
                        !uploadedScreenshot || !userTransactionId.trim()
                          ? "bg-warm-400/15 text-white/50 cursor-not-allowed border border-warm-400/20"
                          : "bg-gradient-to-r from-emerald-500 to-green-400 hover:from-emerald-600 hover:to-green-500 active:scale-95 text-black shadow-emerald-500/30"
                      }`}
                    >
                      {isProcessing ? (
                        <div className="flex items-center justify-center space-x-2">
                          <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                          <span>Processing...</span>
                        </div>
                      ) : !uploadedScreenshot ? (
                        <div className="flex items-center justify-center space-x-2">
                          <Upload className="w-4 h-4 sm:w-5 sm:h-5" />
                          <span>Upload Screenshot</span>
                        </div>
                      ) : !userTransactionId.trim() ? (
                        <div className="flex items-center justify-center space-x-2">
                          <CreditCard className="w-4 h-4 sm:w-5 sm:h-5" />
                          <span>Enter Transaction ID</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center space-x-2">
                          <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6" />
                          <span>Confirm Deposit {formatCurrency(amount)}</span>
                        </div>
                      )}
                    </button>

                    {/* Secondary Cancel Button */}
                    <button
                      onClick={() => setShowQRModal(false)}
                      className="w-full py-2 sm:py-3 px-4 sm:px-6 bg-warm-400/15 hover:bg-warm-400/25 active:bg-white/25 text-white rounded-lg sm:rounded-xl transition-all duration-200 border border-warm-400/30 hover:border-white/30 font-medium touch-manipulation text-sm sm:text-base"
                    >
                      Cancel
                    </button>
                  </div>

                  {/* Mobile-Friendly Progress Indicator */}
                  <div className="mt-2 sm:mt-3 flex items-center justify-center space-x-2 pb-2 sm:pb-0">
                    <div
                      className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full transition-colors ${
                        amount > 0 ? "bg-emerald-400" : "bg-warm-400/25"
                      }`}
                    ></div>
                    <div
                      className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full transition-colors ${
                        userTransactionId.trim()
                          ? "bg-emerald-400"
                          : "bg-warm-400/25"
                      }`}
                    ></div>
                    <div
                      className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full transition-colors ${
                        uploadedScreenshot ? "bg-emerald-400" : "bg-warm-400/25"
                      }`}
                    ></div>
                    <div
                      className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full transition-colors ${
                        isProcessing ? "bg-emerald-400" : "bg-warm-400/25"
                      }`}
                    ></div>
                  </div>
                  <p className="text-center text-slate-600 dark:text-slate-300 text-xs mt-2 pb-1">
                    {!userTransactionId.trim()
                      ? "Step 2 of 4: Enter transaction ID"
                      : !uploadedScreenshot
                      ? "Step 3 of 4: Upload proof"
                      : "Step 4 of 4: Ready"}
                  </p>
                </div>
              </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

// Enhanced Staking Tab Component
function StakingTab({
  availableBalance,
  stakedBalance,
  onStake,
  setNotifications,
  formatCurrency,
  walletData,
}: {
  availableBalance: number;
  stakedBalance: number;
  onStake: (amount: number, packageType: string) => void;
  setNotifications: React.Dispatch<
    React.SetStateAction<
      Array<{ id: number; type: string; message: string; timestamp: Date }>
    >
  >;
  formatCurrency: (amount: number, showDecimals?: boolean) => string;
  walletData: any;
}) {
  const [stakingAmount, setStakingAmount] = useState("");
  const [selectedPackage, setSelectedPackage] = useState("locked30");
  const [isProcessing, setIsProcessing] = useState(false);

  // Display ranges for users (actual calculation uses backend variable rates)
  const stakingPackages = [
    {
      id: "locked30",
      label: "30-Day Stake",
      apr: "5-10%",
      description: "Variable monthly returns",
      minStake: 100,
      lockPeriod: "30 days",
      icon: Clock,
      color: "blue",
      packageType: "30-day",
    },
    {
      id: "locked90",
      label: "90-Day Stake",
      apr: "6-15%",
      description: "Higher commitment rewards",
      minStake: 500,
      lockPeriod: "90 days",
      icon: Award,
      color: "purple",
      packageType: "90-day",
    },
  ];

  const selectedPackageData =
    stakingPackages.find((p) => p.id === selectedPackage) || stakingPackages[0];
  const amount = parseFloat(stakingAmount) || 0;

  const calculateDailyEarnings = (amount: number, apr: string) => {
    const aprNumber = parseFloat(
      apr.replace("%", "").split("-")[1] || apr.replace("%", "")
    );
    return (amount * aprNumber) / 100 / 365;
  };

  const handleStake = async (e: React.FormEvent) => {
    e.preventDefault();

    console.log("Staking attempt:", {
      stakingAmount,
      amount,
      availableBalance,
      minStake: selectedPackageData.minStake,
    });

    if (!stakingAmount || amount <= 0) {
      setNotifications((prev) => [
        {
          id: Date.now(),
          type: "error",
          message: "Please enter a valid staking amount",
          timestamp: new Date(),
        },
        ...prev,
      ]);
      setTimeout(() => setNotifications((prev) => prev.slice(1)), 5000);
      return;
    }

    if (amount < selectedPackageData.minStake) {
      setNotifications((prev) => [
        {
          id: Date.now(),
          type: "error",
          message: `Minimum staking amount for ${
            selectedPackageData.label
          } is ${formatCurrency(selectedPackageData.minStake)}`,
          timestamp: new Date(),
        },
        ...prev,
      ]);
      setTimeout(() => setNotifications((prev) => prev.slice(1)), 5000);
      return;
    }

    if (amount > availableBalance) {
      setNotifications((prev) => [
        {
          id: Date.now(),
          type: "error",
          message: `Insufficient available balance for staking. Available: ${formatCurrency(
            availableBalance
          )}, Requested: ${formatCurrency(amount)}`,
          timestamp: new Date(),
        },
        ...prev,
      ]);
      setTimeout(() => setNotifications((prev) => prev.slice(1)), 5000);
      return;
    }

    setIsProcessing(true);

    try {
      console.log(
        "Calling onStake with amount:",
        amount,
        "packageType:",
        selectedPackageData.packageType
      );
      // Call the onStake function passed from parent with packageType
      onStake(amount, selectedPackageData.packageType);

      setNotifications((prev) => [
        {
          id: Date.now(),
          type: "success",
          message: `Successfully staked ${formatCurrency(amount)} in ${
            selectedPackageData.label
          }`,
          timestamp: new Date(),
        },
        ...prev,
      ]);

      setStakingAmount("");

      setTimeout(() => {
        setNotifications((prev) => prev.slice(1));
      }, 8000);
    } catch (error) {
      console.error("Staking error:", error);
      setNotifications((prev) => [
        {
          id: Date.now(),
          type: "error",
          message: `Staking failed: ${
            error instanceof Error ? error.message : "Unknown error occurred"
          }`,
          timestamp: new Date(),
        },
        ...prev,
      ]);

      setTimeout(() => {
        setNotifications((prev) => prev.slice(1));
      }, 8000);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Staking Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-gradient-to-r from-blue-500/20 to-purple-400/20 backdrop-blur-xl border border-blue-500/30 rounded-xl sm:rounded-2xl lg:rounded-3xl p-4 sm:p-6 lg:p-8"
      >
        <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 mb-4 sm:mb-6">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-blue-500 to-purple-400 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
            <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-white font-bold" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">
              Stake Your Funds
            </h1>
            <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base">
              Earn passive income by staking your deposited funds
            </p>
          </div>
        </div>

        {/* Balance Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mt-4 sm:mt-6">
          <div className="flex items-center space-x-2 sm:space-x-3 bg-warm-400/15 rounded-xl sm:rounded-2xl p-3 sm:p-4">
            <Wallet className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" />
            <div>
              <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm">
                Available to Stake
              </p>
              <p className="text-white font-bold text-sm sm:text-base">
                {formatCurrency(availableBalance)}
              </p>
              {availableBalance === 0 &&
                walletData &&
                walletData.totalDeposited === 0 && (
                  <p className="text-yellow-400 text-xs">
                    No deposits yet - deposit funds first
                  </p>
                )}
            </div>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-3 bg-warm-400/15 rounded-xl sm:rounded-2xl p-3 sm:p-4">
            <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400" />
            <div>
              <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm">
                Currently Staked
              </p>
              <p className="text-white font-bold text-sm sm:text-base">
                {formatCurrency(stakedBalance)}
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Monthly Rate Schedule */}
      {/* <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.05 }}
        className="bg-gradient-to-br from-emerald-500/10 to-blue-500/10 backdrop-blur-xl border border-emerald-500/30 rounded-3xl p-6 sm:p-8"
      >
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-xl flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Monthly Rate Schedule</h3>
            <p className="text-slate-600 dark:text-slate-300 text-sm">Variable returns based on staking duration</p>
          </div>
        </div>
        
        <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-2 sm:gap-3">
          {monthlyRates.map((rate, index) => (
            <div
              key={index}
              className={`relative p-3 sm:p-4 rounded-xl text-center transition-all duration-300 ${
                currentMonth === index + 1
                  ? 'bg-gradient-to-br from-emerald-500 to-blue-500 shadow-lg shadow-emerald-500/30'
                  : 'bg-warm-400/15 hover:bg-warm-400/25'
              }`}
            >
              <p className={`text-xs font-medium ${currentMonth === index + 1 ? 'text-white' : 'text-slate-600 dark:text-slate-300'}`}>
                M{index + 1}
              </p>
              <p className={`text-lg sm:text-xl font-bold ${currentMonth === index + 1 ? 'text-white' : 'text-emerald-400'}`}>
                {rate}%
              </p>
              {currentMonth === index + 1 && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-pulse" />
              )}
            </div>
          ))}
        </div>
        
        <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-gradient-to-r from-emerald-500 to-blue-500 rounded"></div>
            <span>Current Month</span>
          </div>
          <span>•</span>
          <span>After M9: Alternating 7% / 6% pattern</span>
        </div>
      </motion.div> */}

      {/* Staking Packages */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl border border-warm-400/30 rounded-3xl p-8"
      >
        <h3 className="text-2xl font-bold text-white mb-6">
          Choose Staking Package
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {stakingPackages.map((pkg) => (
            <motion.div
              key={pkg.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedPackage(pkg.id)}
              className={`relative p-6 rounded-2xl cursor-pointer transition-all duration-300 border-2 ${
                selectedPackage === pkg.id
                  ? `border-${pkg.color}-500 bg-${pkg.color}-500/10`
                  : "border-warm-400/30 bg-slate-800/80 dark:bg-slate-700/60 hover:border-white/30"
              }`}
            >
              <div className="flex items-center space-x-3 mb-4">
                <div
                  className={`w-12 h-12 bg-gradient-to-r ${
                    pkg.color === "emerald"
                      ? "from-emerald-500 to-green-400"
                      : pkg.color === "blue"
                      ? "from-blue-500 to-cyan-400"
                      : "from-purple-500 to-pink-400"
                  } rounded-xl flex items-center justify-center`}
                >
                  <pkg.icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h4 className="text-white font-bold text-lg">{pkg.label}</h4>
                  <p className="text-slate-600 dark:text-slate-300 text-sm">{pkg.description}</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-300 text-sm">Current Rate</span>
                  <span
                    className={`font-bold ${
                      pkg.color === "emerald"
                        ? "text-emerald-400"
                        : pkg.color === "blue"
                        ? "text-blue-400"
                        : "text-purple-400"
                    }`}
                  >
                    {pkg.apr}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-300 text-sm">Min. Stake</span>
                  <span className="text-slate-900 dark:text-white font-medium">
                    {formatCurrency(pkg.minStake)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-300 text-sm">Lock Period</span>
                  <span className="text-slate-900 dark:text-white font-medium">
                    {pkg.lockPeriod}
                  </span>
                </div>
              </div>

              {selectedPackage === pkg.id && (
                <div className="absolute top-3 right-3">
                  <div
                    className={`w-6 h-6 rounded-full ${
                      pkg.color === "emerald"
                        ? "bg-emerald-500"
                        : pkg.color === "blue"
                        ? "bg-blue-500"
                        : "bg-purple-500"
                    } flex items-center justify-center`}
                  >
                    <Check className="w-4 h-4 text-white" />
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Staking Form */}
        <form onSubmit={handleStake} className="space-y-6">
          {availableBalance === 0 &&
          walletData &&
          walletData.totalDeposited === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Wallet className="w-8 h-8 text-yellow-400" />
              </div>
              <h4 className="text-slate-600 dark:text-slate-300 text-lg mb-2">
                No Funds Available for Staking
              </h4>
              <p className="text-slate-600 dark:text-slate-300 text-sm mb-4">
                You need to deposit funds first before you can start staking.
              </p>
              <p className="text-white/40 text-xs">
                Go to the Deposit tab to add funds to your wallet.
              </p>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-lg font-semibold text-white mb-4">
                  Staking Amount
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={stakingAmount}
                    onChange={(e) => setStakingAmount(e.target.value)}
                    className="w-full px-4 sm:px-6 py-3 sm:py-4 text-lg sm:text-xl bg-warm-400/15 border border-warm-400/30 rounded-xl sm:rounded-2xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300"
                    placeholder="0.00"
                    step="0.01"
                    min={selectedPackageData.minStake}
                    max={availableBalance}
                    disabled={availableBalance <= 0}
                  />
                  <div className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2">
                    <span className="text-slate-600 dark:text-slate-300 text-sm sm:text-base font-medium">
                      USDT
                    </span>
                  </div>
                </div>

                {/* Quick Amount Buttons */}
                <div className="flex flex-wrap gap-2 sm:gap-3 mt-3 sm:mt-4">
                  {[25, 50, 75, 100].map((percent) => {
                    const percentAmount = (availableBalance * percent) / 100;
                    return (
                      <button
                        key={percent}
                        type="button"
                        onClick={() =>
                          setStakingAmount(percentAmount.toFixed(2))
                        }
                        disabled={availableBalance <= 0}
                        className="px-3 sm:px-4 py-2 bg-warm-400/15 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-warm-400/25 hover:text-white transition-all duration-300 text-xs sm:text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {percent}%
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() =>
                      setStakingAmount(availableBalance.toFixed(2))
                    }
                    disabled={availableBalance <= 0}
                    className="px-3 sm:px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-all duration-300 text-xs sm:text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    MAX
                  </button>
                </div>

                <div className="flex justify-between text-sm text-slate-600 dark:text-slate-300 mt-3">
                  <span>Available: {formatCurrency(availableBalance)}</span>
                  <span>
                    Min: {formatCurrency(selectedPackageData.minStake)}
                  </span>
                </div>

                {/* Debug Information */}
                {stakingAmount && (
                  <div className="mt-2 p-2 bg-slate-800/80 dark:bg-slate-700/60 rounded text-xs text-slate-600 dark:text-slate-300">
                    Debug: Amount={amount}, Available={availableBalance}, Min=
                    {selectedPackageData.minStake}, Valid=
                    {amount > 0 &&
                      amount >= selectedPackageData.minStake &&
                      amount <= availableBalance}
                  </div>
                )}
              </div>

              {/* Action Button */}
              <motion.button
                type="submit"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={
                  !stakingAmount ||
                  amount <= 0 ||
                  amount < selectedPackageData.minStake ||
                  amount > availableBalance ||
                  isProcessing ||
                  availableBalance <= 0
                }
                className={`w-full py-4 px-8 rounded-2xl font-bold text-lg transition-all duration-300 ${
                  !stakingAmount ||
                  amount <= 0 ||
                  amount < selectedPackageData.minStake ||
                  amount > availableBalance ||
                  isProcessing ||
                  availableBalance <= 0
                    ? "bg-warm-400/15 text-white/50 cursor-not-allowed"
                    : "bg-gradient-to-r from-blue-500 to-purple-400 text-white shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30"
                }`}
              >
                {isProcessing ? (
                  <div className="flex items-center justify-center space-x-2">
                    <Loader className="w-5 h-5 animate-spin" />
                    <span>Processing...</span>
                  </div>
                ) : availableBalance <= 0 ? (
                  "Deposit Funds to Start Staking"
                ) : (
                  `Stake ${amount > 0 ? formatCurrency(amount) : "$0.00"}`
                )}
              </motion.button>
            </>
          )}
        </form>
      </motion.div>

      {/* Current Stakes */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl border border-warm-400/30 rounded-3xl p-8"
      >
        <h3 className="text-2xl font-bold text-white mb-6">
          Your Active Stakes
        </h3>

        {walletData?.stakes && walletData.stakes.length > 0 ? (
          <div className="space-y-4">
            {/* Summary Card */}
            <div className="p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl border border-blue-500/20 mb-6">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-slate-600 dark:text-slate-300 text-sm">Total Staked</p>
                  <p className="text-2xl font-bold text-white">
                    {formatCurrency(stakedBalance)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-slate-600 dark:text-slate-300 text-sm">Active Stakes</p>
                  <p className="text-2xl font-bold text-blue-400">
                    {
                      walletData.stakes.filter(
                        (s: any) => s.status === "active"
                      ).length
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* Individual Stakes List */}
            <div className="space-y-3">
              {walletData.stakes.map((stake: any) => {
                const startDate = new Date(stake.startDate);
                const endDate = new Date(stake.endDate);
                const now = new Date();
                const totalDays = Math.ceil(
                  (endDate.getTime() - startDate.getTime()) /
                    (1000 * 60 * 60 * 24)
                );
                const daysRemaining = Math.max(
                  0,
                  Math.ceil(
                    (endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
                  )
                );
                const progress = Math.min(
                  100,
                  ((totalDays - daysRemaining) / totalDays) * 100
                );
                const isMatured = stake.status === "matured";
                const isCancelled = stake.status === "cancelled";

                return (
                  <div
                    key={stake.stakeId}
                    className={`p-4 rounded-xl border ${
                      isMatured
                        ? "bg-emerald-500/10 border-emerald-500/30"
                        : isCancelled
                        ? "bg-red-500/10 border-red-500/30"
                        : "bg-slate-800/80 dark:bg-slate-700/60 border-warm-400/20"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="flex items-center space-x-3">
                        <div
                          className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            isMatured
                              ? "bg-emerald-500"
                              : isCancelled
                              ? "bg-red-500"
                              : "bg-gradient-to-r from-blue-500 to-purple-400"
                          }`}
                        >
                          {isMatured ? (
                            <Check className="w-5 h-5 text-white" />
                          ) : isCancelled ? (
                            <X className="w-5 h-5 text-white" />
                          ) : (
                            <Clock className="w-5 h-5 text-white" />
                          )}
                        </div>
                        <div>
                          <p className="text-slate-900 dark:text-white font-semibold">
                            {formatCurrency(stake.amount)}
                          </p>
                          <p className="text-slate-600 dark:text-slate-300 text-xs">
                            {stake.packageType} package
                          </p>
                        </div>
                      </div>

                      <div className="flex-1 px-4">
                        <div className="flex justify-between text-xs text-slate-600 dark:text-slate-300 mb-1">
                          <span>{startDate.toLocaleDateString()}</span>
                          <span>{endDate.toLocaleDateString()}</span>
                        </div>
                        <div className="w-full h-2 bg-warm-400/15 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              isMatured
                                ? "bg-emerald-500"
                                : isCancelled
                                ? "bg-red-500"
                                : "bg-gradient-to-r from-blue-500 to-purple-400"
                            }`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>

                      <div className="text-right">
                        <p
                          className={`text-sm font-medium ${
                            isMatured
                              ? "text-emerald-400"
                              : isCancelled
                              ? "text-red-400"
                              : "text-blue-400"
                          }`}
                        >
                          {isMatured
                            ? `+${formatCurrency(
                                stake.actualRewards || 0
                              )} earned`
                            : isCancelled
                            ? "Cancelled"
                            : `${daysRemaining} days left`}
                        </p>
                        <p className="text-white/40 text-xs capitalize">
                          {stake.status}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : stakedBalance > 0 ? (
          <div className="space-y-4">
            <div className="p-6 bg-slate-800/80 dark:bg-slate-700/60 rounded-2xl border border-warm-400/20">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-400 rounded-xl flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-lg">
                      Active Staking
                    </h4>
                    <p className="text-slate-600 dark:text-slate-300 text-sm">
                      Earning rewards on maturity
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-white">
                    {formatCurrency(stakedBalance)}
                  </p>
                  <p className="text-blue-400 text-sm">Earning 5-10% monthly</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-warm-400/15 rounded-full flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="w-8 h-8 text-white/40" />
            </div>
            <h4 className="text-slate-600 dark:text-slate-300 text-lg mb-2">No Active Stakes</h4>
            <p className="text-white/40 text-sm">
              Start staking to earn passive income
            </p>
          </div>
        )}
      </motion.div>

      {/* Staking Information */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl border border-warm-400/30 rounded-3xl p-8"
      >
        <h3 className="text-2xl font-bold text-white mb-6">
          How Staking Works
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-white font-bold text-sm">1</span>
              </div>
              <div>
                <h4 className="text-slate-900 dark:text-white font-semibold">Stake Your Funds</h4>
                <p className="text-slate-600 dark:text-slate-300 text-sm">
                  Enter the amount you want to stake from your available deposit
                  balance.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-white font-bold text-sm">2</span>
              </div>
              <div>
                <h4 className="text-slate-900 dark:text-white font-semibold">Compound Growth</h4>
                <p className="text-slate-600 dark:text-slate-300 text-sm">
                  Rewards are automatically added to your balance for compound
                  growth.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-white font-bold text-sm">3</span>
              </div>
              <div>
                <h4 className="text-slate-900 dark:text-white font-semibold">Earn Daily Rewards</h4>
                <p className="text-slate-600 dark:text-slate-300 text-sm">
                  Your staked funds earn rewards daily based on the current
                  month&apos;s rate.
                </p>
              </div>
            </div>

            {/* <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-white font-bold text-sm">3</span>
              </div>
              <div>
                <h4 className="text-slate-900 dark:text-white font-semibold"></h4>
                <p className="text-slate-600 dark:text-slate-300 text-sm"></p>
              </div>
            </div> */}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// Enhanced Withdraw Tab Component
function WithdrawTab({
  onWithdraw,
  availableBalance,
  setNotifications,
}: {
  onWithdraw: (amount: number, toAddress: string) => void;
  availableBalance: number;
  setNotifications: React.Dispatch<React.SetStateAction<any[]>>;
}) {
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [selectedToken, setSelectedToken] = useState("USDT");
  const [withdrawMethod, setWithdrawMethod] = useState("wallet");
  const [withdrawAddress, setWithdrawAddress] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  // OTP states
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);
  const [emailHint, setEmailHint] = useState("");

  const withdrawMethods = [
    {
      id: "wallet",
      label: "Crypto Wallet",
      icon: Wallet,
      description: "Send to external wallet",
      fee: "2 USDT",
      time: "5-15 minutes",
    },
  ];

  const tokens = [
    {
      symbol: "USDT",
      name: "Tether USD",
      balance: availableBalance,
      icon: "/theter.png",
      network: "TRC-20",
      minWithdraw: 20,
      maxWithdraw: 50000,
    },
  ];

  const selectedTokenData =
    tokens.find((t) => t.symbol === selectedToken) || tokens[0];
  const selectedMethodData =
    withdrawMethods.find((m) => m.id === withdrawMethod) || withdrawMethods[0];
  const amount = parseFloat(withdrawAmount) || 0;
  const feeAmount =
    selectedMethodData.id === "bank"
      ? 5
      : parseFloat(selectedMethodData.fee.split(" ")[0]);
  const finalAmount = amount - feeAmount;

  // Add wallet address validation function
  const isValidWalletAddress = (address: string) => {
    // Check if address is 40 or 42 characters long (with or without 0x prefix)
    const cleanAddress = address.replace(/^0x/, "");
    return cleanAddress.length === 40 && /^[0-9a-fA-F]+$/.test(cleanAddress);
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();

    // Enhanced validation
    if (!withdrawAmount) {
      setNotifications((prev) => [
        {
          id: Date.now(),
          type: "error",
          message: "Please enter a withdrawal amount",
          timestamp: new Date(),
        },
        ...prev,
      ]);
      setTimeout(() => setNotifications((prev) => prev.slice(1)), 5000);
      return;
    }

    if (amount < selectedTokenData.minWithdraw) {
      setNotifications((prev) => [
        {
          id: Date.now(),
          type: "error",
          message: `Minimum withdrawal amount is ${selectedTokenData.minWithdraw} ${selectedToken}`,
          timestamp: new Date(),
        },
        ...prev,
      ]);
      setTimeout(() => setNotifications((prev) => prev.slice(1)), 5000);
      return;
    }

    if (!withdrawAddress) {
      setNotifications((prev) => [
        {
          id: Date.now(),
          type: "error",
          message: "Please enter a withdrawal address",
          timestamp: new Date(),
        },
        ...prev,
      ]);
      setTimeout(() => setNotifications((prev) => prev.slice(1)), 5000);
      return;
    }

    if (!isValidWalletAddress(withdrawAddress)) {
      setNotifications((prev) => [
        {
          id: Date.now(),
          type: "error",
          message:
            "Please enter a valid wallet address (40-42 characters, hex format)",
          timestamp: new Date(),
        },
        ...prev,
      ]);
      setTimeout(() => setNotifications((prev) => prev.slice(1)), 5000);
      return;
    }

    setShowConfirmation(true);
  };

  // Request OTP for withdrawal
  const requestOTP = async () => {
    setOtpLoading(true);
    try {
      const { transactionApi } = await import("../../lib/api/transactions.js");

      const formattedAddress = withdrawAddress.startsWith("0x")
        ? withdrawAddress
        : `0x${withdrawAddress}`;

      const response = await transactionApi.requestWithdrawalOTP({
        amount: parseFloat(amount.toFixed(8)),
        toAddress: formattedAddress,
      });

      if (response.success) {
        setOtpSent(true);
        setOtpTimer(600); // 10 minutes
        if (response.data?.emailHint) {
          setEmailHint(response.data.emailHint);
        }
        setNotifications((prev) => [
          {
            id: Date.now(),
            type: "success",
            message: `OTP sent to ${
              response.data?.emailHint || "your email"
            }. Please check your inbox.`,
            timestamp: new Date(),
          },
          ...prev,
        ]);
        setTimeout(() => setNotifications((prev) => prev.slice(1)), 5000);
      } else {
        throw new Error(response.message || "Failed to send OTP");
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to send OTP";
      setNotifications((prev) => [
        {
          id: Date.now(),
          type: "error",
          message: errorMessage,
          timestamp: new Date(),
        },
        ...prev,
      ]);
      setTimeout(() => setNotifications((prev) => prev.slice(1)), 5000);
    } finally {
      setOtpLoading(false);
    }
  };

  // Timer for OTP expiry
  useEffect(() => {
    if (otpTimer > 0) {
      const interval = setInterval(() => {
        setOtpTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [otpTimer]);

  const confirmWithdraw = async () => {
    // Validate OTP first
    if (!otp || otp.length !== 6) {
      setNotifications((prev) => [
        {
          id: Date.now(),
          type: "error",
          message: "Please enter a valid 6-digit OTP",
          timestamp: new Date(),
        },
        ...prev,
      ]);
      setTimeout(() => setNotifications((prev) => prev.slice(1)), 5000);
      return;
    }

    setIsProcessing(true);

    try {
      const { transactionApi } = await import("../../lib/api/transactions.js");

      // Ensure toAddress has 0x prefix if it doesn't already
      const formattedAddress = withdrawAddress.startsWith("0x")
        ? withdrawAddress
        : `0x${withdrawAddress}`;

      const withdrawalData = {
        amount: parseFloat(amount.toFixed(8)), // Ensure proper decimal formatting
        toAddress: formattedAddress,
        otp: otp,
        currency: selectedToken,
        network: selectedTokenData.network,
        description: `Withdrawal of ${amount} ${selectedToken} to ${formattedAddress}`,
      };

      console.log("Sending withdrawal data:", withdrawalData); // Debug log

      const response = await transactionApi.createWithdrawal(withdrawalData);

      if (response.success) {
        // Show success notification - withdrawal is pending admin approval
        setNotifications((prev) => [
          {
            id: Date.now(),
            type: "success",
            message: `Withdrawal request submitted successfully. Your request is now pending admin approval.`,
            timestamp: new Date(),
          },
          ...prev,
        ]);

        // Reset form including OTP states
        setWithdrawAmount("");
        setWithdrawAddress("");
        setShowConfirmation(false);
        setOtp("");
        setOtpSent(false);
        setOtpTimer(0);

        // Auto-remove notification after 10 seconds
        setTimeout(() => {
          setNotifications((prev) => prev.slice(1));
        }, 10000);
      } else {
        // Handle specific error responses
        if (response.requiresNewOTP) {
          setOtp("");
          setOtpSent(false);
        }

        const attemptsSuffix =
          typeof response.attemptsRemaining === "number"
            ? ` (${response.attemptsRemaining} attempts remaining)`
            : "";

        throw new Error(
          `${response.message || "Withdrawal request failed"}${attemptsSuffix}`
        );
      }
    } catch (error) {
      console.error("Withdrawal error:", error);

      // More detailed error handling
      let errorMessage = "Unknown error occurred";
      if (error instanceof Error) {
        if (error.message.includes("Validation failed")) {
          errorMessage =
            "Please check that all fields are filled correctly. Wallet address must be 40-42 characters long.";
        } else if (error.message.includes("Insufficient balance")) {
          errorMessage = "Insufficient balance for withdrawal";
        } else if (error.message.includes("Invalid wallet address")) {
          errorMessage = "Please enter a valid wallet address";
        } else {
          errorMessage = error.message;
        }
      }

      setNotifications((prev) => [
        {
          id: Date.now(),
          type: "error",
          message: `Withdrawal failed: ${errorMessage}`,
          timestamp: new Date(),
        },
        ...prev,
      ]);

      setTimeout(() => {
        setNotifications((prev) => prev.slice(1));
      }, 8000);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Withdraw Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-primary/10 border border-primary/30 rounded-3xl p-8"
      >
        <div className="flex items-center space-x-4 mb-4">
          <div className="w-16 h-16 bg-gradient-to-r from-primary to-accent rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
            <ArrowDownLeft className="w-8 h-8 text-primary-foreground font-bold" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Withdraw Funds</h1>
            <p className="text-muted-foreground">
              Transfer your earnings to external wallets or bank accounts
            </p>
          </div>
        </div>

        {/* Key Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="flex items-center space-x-3 bg-card border border-border rounded-2xl p-4">
            <Shield className="w-6 h-6 text-primary" />
            <div>
              <p className="text-foreground font-medium">Secure</p>
              <p className="text-muted-foreground text-sm">2FA verification required</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 bg-card border border-border rounded-2xl p-4">
            <Clock className="w-6 h-6 text-primary" />
            <div>
              <p className="text-foreground font-medium">Fast Transfer</p>
              <p className="text-muted-foreground text-sm">5 min-4 hours to wallets</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main Withdraw Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="bg-card border border-border rounded-3xl p-8"
      >
        <form onSubmit={handleWithdraw} className="space-y-8">
          {/* Available Balance Display */}
          <div className="bg-primary/10 border border-primary/25 rounded-2xl p-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-foreground text-sm sm:text-lg font-medium">
                  Available Balance
                </p>
                <p className="text-muted-foreground text-xs sm:text-sm">
                  Ready for withdrawal
                </p>
              </div>
              <div className="text-right overflow-hidden">
                <p className="text-xl sm:text-2xl md:text-4xl font-bold text-primary truncate max-w-[150px] sm:max-w-[200px] md:max-w-[300px]">
                  {availableBalance >= 1000000
                    ? `${(availableBalance / 1000000).toFixed(2)}M`
                    : availableBalance >= 1000
                    ? `${(availableBalance / 1000).toFixed(2)}K`
                    : availableBalance.toLocaleString()}
                </p>
                <p className="text-muted-foreground text-sm sm:text-lg">USDT</p>
              </div>
            </div>
          </div>

          {/* Token Selection */}
          <div>
            <label className="block text-lg font-semibold text-foreground mb-4">
              Select Token
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {tokens.map((token) => (
                <motion.button
                  key={token.symbol}
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedToken(token.symbol)}
                  className={`p-6 rounded-2xl border-2 transition-all duration-300 ${
                    selectedToken === token.symbol
                      ? "border-primary bg-primary/10 shadow-lg shadow-primary/15"
                      : "border-border bg-secondary hover:border-primary/50 hover:bg-primary/5"
                  }`}
                >
                  <div className="text-center">
                    <div className="w-12 h-12 mx-auto mb-3">
                      <Image
                        src={token.icon}
                        alt={token.symbol}
                        width={48}
                        height={48}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="text-foreground font-bold text-lg">
                      {token.symbol}
                    </div>
                    <div className="text-muted-foreground text-sm mb-2">
                      {token.name}
                    </div>
                    <div className="text-xs text-muted-foreground/70 mb-1">
                      {token.network}
                    </div>
                    <div className="text-primary text-sm font-medium">
                      Available: {token.balance.toLocaleString()}
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Amount Input */}
          <div>
            <label className="block text-lg font-semibold text-foreground mb-4">
              Withdraw Amount
            </label>
            <div className="relative">
              <input
                type="number"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                className="w-full px-6 py-4 text-xl bg-secondary border border-border rounded-2xl text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all duration-300"
                placeholder="0.00"
                step="0.01"
                min={selectedTokenData.minWithdraw}
                max={Math.min(
                  selectedTokenData.maxWithdraw,
                  selectedTokenData.balance
                )}
              />
              <div className="absolute right-6 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
                <span className="text-muted-foreground text-lg">{selectedToken}</span>
                <div className="w-8 h-8">
                  <Image
                    src={selectedTokenData.icon}
                    alt={selectedTokenData.symbol}
                    width={32}
                    height={32}
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
            </div>

            {/* Quick Amount Buttons */}
            <div className="flex flex-wrap gap-3 mt-4">
              {["25%", "50%", "75%", "Max"].map((label, i) => {
                const multipliers = [0.25, 0.5, 0.75, null];
                const m = multipliers[i];
                const val = m !== null
                  ? (selectedTokenData.balance * m).toString()
                  : (selectedTokenData.balance - feeAmount).toString();
                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() => setWithdrawAmount(val)}
                    className="px-4 py-2 bg-secondary hover:bg-primary/15 border border-border hover:border-primary/40 rounded-xl text-foreground transition-all duration-300"
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            <div className="flex justify-between text-sm text-muted-foreground mt-3">
              <span>
                Minimum: {selectedTokenData.minWithdraw} {selectedToken}
              </span>
              <span>
                Maximum:{" "}
                {Math.min(
                  selectedTokenData.maxWithdraw,
                  selectedTokenData.balance
                ).toLocaleString()}{" "}
                {selectedToken}
              </span>
            </div>
          </div>

          {/* Withdraw Method */}
          <div>
            <label className="block text-lg font-semibold text-foreground mb-4">
              Withdraw Method
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {withdrawMethods.map((method) => (
                <motion.button
                  key={method.id}
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setWithdrawMethod(method.id)}
                  className={`p-6 rounded-2xl border-2 transition-all duration-300 text-left ${
                    withdrawMethod === method.id
                      ? "border-primary bg-primary/10 shadow-lg shadow-primary/15"
                      : "border-border bg-secondary hover:border-primary/50 hover:bg-primary/5"
                  }`}
                >
                  <div className="flex items-start space-x-4">
                    <method.icon className="w-8 h-8 text-primary mt-1" />
                    <div className="flex-1">
                      <div className="text-foreground font-semibold text-lg">
                        {method.label}
                      </div>
                      <div className="text-muted-foreground text-sm mb-2">
                        {method.description}
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-primary font-medium">
                          {method.fee} fee
                        </span>
                        <span className="text-muted-foreground/70 text-sm">
                          {method.time}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Destination Address */}
          <div>
            <label className="block text-lg font-semibold text-foreground mb-4">
              {withdrawMethod === "bank"
                ? "Bank Account Details"
                : "Destination Address"}
            </label>
            <div className="relative">
              <input
                type="text"
                value={withdrawAddress}
                onChange={(e) => setWithdrawAddress(e.target.value)}
                className={`w-full px-6 py-4 text-lg bg-secondary border ${
                  withdrawAddress && !isValidWalletAddress(withdrawAddress)
                    ? "border-destructive/60 focus:ring-destructive/40 focus:border-destructive"
                    : "border-border focus:ring-primary/40 focus:border-primary"
                } rounded-2xl text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 transition-all duration-300`}
                placeholder={
                  withdrawMethod === "bank"
                    ? "Enter your bank account details"
                    : "Enter wallet address (0x...)"
                }
              />
              <div className="absolute right-6 top-1/2 transform -translate-y-1/2">
                <QrCode className="w-6 h-6 text-muted-foreground/50" />
              </div>
            </div>
            <p className="text-muted-foreground text-sm mt-2">
              {withdrawMethod === "bank"
                ? "Bank transfers require full verification and may take 1-3 business days"
                : withdrawAddress && !isValidWalletAddress(withdrawAddress)
                ? "⚠️ Please enter a valid wallet address (40-42 characters, hex format)"
                : "Double-check the address. Transactions cannot be reversed."}
            </p>
            {withdrawMethod !== "bank" && (
              <p className="text-muted-foreground/60 text-xs mt-1">
                Example: 0x742D35Cc6634C0532925a3b8D0b30E3e0000000A
              </p>
            )}
          </div>

          {/* Transaction Summary */}
          {amount > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="bg-secondary border border-border rounded-2xl p-6"
            >
              <h3 className="text-lg font-semibold text-foreground mb-4">
                Transaction Summary
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Withdraw Amount:</span>
                  <span className="text-foreground font-semibold">
                    {amount.toLocaleString()} {selectedToken}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Network Fee:</span>
                  <span className="text-destructive">
                    -{selectedMethodData.fee}
                  </span>
                </div>
                <div className="border-t border-border pt-3">
                  <div className="flex justify-between">
                    <span className="text-foreground font-semibold">
                      You will receive:
                    </span>
                    <span className="text-primary font-bold text-lg">
                      {finalAmount.toFixed(4)} {selectedToken}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Processing Time:</span>
                  <span className="text-muted-foreground">
                    {selectedMethodData.time}
                  </span>
                </div>
                <div className="bg-yellow-500/10 border border-yellow-500/25 rounded-xl p-4 mt-4">
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-yellow-600 dark:text-yellow-400 font-medium text-sm">
                        Important Notice
                      </p>
                      <p className="text-muted-foreground text-sm">
                        Withdrawals cannot be cancelled once processed. Please
                        verify all details before confirming.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <motion.button
              type="submit"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={
                !withdrawAmount ||
                amount < selectedTokenData.minWithdraw ||
                !withdrawAddress ||
                !isValidWalletAddress(withdrawAddress) ||
                isProcessing
              }
              className={`flex-1 py-4 px-8 rounded-2xl font-bold text-lg transition-all duration-300 ${
                !withdrawAmount ||
                amount < selectedTokenData.minWithdraw ||
                !withdrawAddress ||
                !isValidWalletAddress(withdrawAddress) ||
                isProcessing
                  ? "bg-muted text-muted-foreground cursor-not-allowed border border-border"
                  : "bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-lg shadow-primary/20 hover:shadow-primary/30 border border-primary/20"
              }`}
            >
              {isProcessing ? (
                <div className="flex items-center justify-center space-x-2">
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>Processing...</span>
                </div>
              ) : (
                `Withdraw ${amount || "0"} ${selectedToken}`
              )}
            </motion.button>
          </div>
        </form>

        {/* Confirmation Modal with OTP */}
        <AnimatePresence>
          {showConfirmation && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-card border border-border rounded-3xl p-8 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl"
              >
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-primary/15 border border-primary/25 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertTriangle className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold text-foreground mb-2">
                    Confirm Withdrawal
                  </h3>
                  <p className="text-muted-foreground">
                    Verify with OTP sent to your email
                  </p>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between p-4 bg-secondary border border-border rounded-xl">
                    <span className="text-muted-foreground">Amount:</span>
                    <span className="text-foreground font-semibold">
                      {amount} {selectedToken}
                    </span>
                  </div>
                  <div className="flex justify-between p-4 bg-secondary border border-border rounded-xl">
                    <span className="text-muted-foreground">Fee:</span>
                    <span className="text-destructive">
                      {selectedMethodData.fee}
                    </span>
                  </div>
                  <div className="flex justify-between p-4 bg-secondary border border-border rounded-xl">
                    <span className="text-muted-foreground">You will receive:</span>
                    <span className="text-primary font-bold">
                      {finalAmount.toFixed(4)} {selectedToken}
                    </span>
                  </div>
                  <div className="p-4 bg-secondary border border-border rounded-xl">
                    <span className="text-muted-foreground block mb-1">
                      Destination:
                    </span>
                    <span className="text-foreground font-mono text-sm break-all">
                      {withdrawAddress}
                    </span>
                  </div>
                </div>

                {/* OTP Section */}
                <div className="mb-6">
                  {!otpSent ? (
                    <button
                      onClick={requestOTP}
                      disabled={otpLoading}
                      className="w-full py-3 px-6 bg-gradient-to-r from-primary to-accent text-primary-foreground rounded-xl hover:shadow-lg hover:shadow-primary/20 transition-all duration-300 disabled:opacity-50 flex items-center justify-center space-x-2 font-semibold"
                    >
                      {otpLoading ? (
                        <>
                          <RefreshCw className="w-5 h-5 animate-spin" />
                          <span>Sending OTP...</span>
                        </>
                      ) : (
                        <>
                          <Mail className="w-5 h-5" />
                          <span>Send OTP to Email</span>
                        </>
                      )}
                    </button>
                  ) : (
                    <div className="space-y-4">
                      <div className="p-4 bg-primary/10 border border-primary/30 rounded-xl">
                        <div className="flex items-center justify-between">
                          <p className="text-primary text-sm font-medium">
                            OTP sent to {emailHint || "your email"}
                          </p>
                          {otpTimer > 0 && (
                            <p className="text-muted-foreground text-sm">
                              Expires in: {Math.floor(otpTimer / 60)}:
                              {(otpTimer % 60).toString().padStart(2, "0")}
                            </p>
                          )}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm text-muted-foreground mb-2">
                          Enter 6-digit OTP
                        </label>
                        <input
                          type="text"
                          value={otp}
                          onChange={(e) =>
                            setOtp(
                              e.target.value.replace(/\D/g, "").slice(0, 6)
                            )
                          }
                          placeholder="000000"
                          maxLength={6}
                          className="w-full py-4 px-6 bg-secondary border border-border rounded-xl text-foreground text-center text-2xl tracking-[0.5em] font-mono focus:border-primary focus:ring-2 focus:ring-primary/30 transition-all placeholder:tracking-[0.5em] placeholder:text-muted-foreground/40"
                        />
                      </div>

                      {otpTimer === 0 && (
                        <button
                          onClick={requestOTP}
                          disabled={otpLoading}
                          className="w-full py-2 text-primary hover:text-primary/80 transition-colors text-sm font-medium"
                        >
                          Resend OTP
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex space-x-4">
                  <button
                    onClick={() => {
                      setShowConfirmation(false);
                      setOtp("");
                      setOtpSent(false);
                      setOtpTimer(0);
                    }}
                    className="flex-1 py-3 px-6 border border-border text-foreground rounded-xl hover:bg-secondary transition-colors"
                  >
                    Cancel
                  </button>
                  {otpSent && (
                    <button
                      onClick={confirmWithdraw}
                      disabled={isProcessing || otp.length !== 6}
                      className="flex-1 py-3 px-6 bg-gradient-to-r from-primary to-accent text-primary-foreground rounded-xl hover:shadow-primary/20 transition-all duration-300 disabled:opacity-50 font-semibold"
                    >
                      {isProcessing ? "Processing..." : "Confirm Withdrawal"}
                    </button>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Recent Withdrawals */}
      {/* <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl border border-warm-400/30 rounded-3xl p-8"
      >
        <h3 className="text-2xl font-bold text-white mb-6">
          Recent Withdrawals
        </h3>
        <div className="space-y-4">
          {[
            {
              id: 1,
              amount: 2500,
              token: "USDT",
              method: "Wallet",
              date: "2024-01-14",
              status: "completed",
              txHash: "0x987654321fedcba9876543210fedcba987654321",
            },
            {
              id: 2,
              amount: 5000,
              token: "USDT",
              method: "Bank",
              date: "2024-01-13",
              status: "processing",
              txHash: "0xabcdef123456789abcdef123456789abcdef123",
            },
            {
              id: 3,
              amount: 1000,
              token: "USDC",
              method: "Exchange",
              date: "2024-01-12",
              status: "completed",
              txHash: "0x456789abcdef123456789abcdef123456789abc",
            },
          ].map((withdrawal) => (
            <motion.div
              key={withdrawal.id}
              whileHover={{ scale: 1.01 }}
              className="flex items-center justify-between p-6 bg-slate-800/80 dark:bg-slate-700/60 rounded-2xl hover:bg-warm-400/15 transition-all duration-300 border border-warm-400/20 hover:border-warm-400/30"
            >
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 bg-red-500/20 rounded-2xl flex items-center justify-center">
                  <ArrowDownLeft className="w-7 h-7 text-red-400" />
                </div>
                <div>
                  <p className="text-white font-semibold text-lg">
                    Withdraw {withdrawal.token}
                  </p>
                  <p className="text-slate-600 dark:text-slate-300 text-sm">
                    {withdrawal.method} • {withdrawal.date}
                  </p>
                  <p className="text-white/50 text-xs font-mono">
                    {withdrawal.txHash.slice(0, 10)}...
                    {withdrawal.txHash.slice(-8)}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-red-400 font-bold text-xl">
                  -{withdrawal.amount.toLocaleString()} {withdrawal.token}
                </p>
                <p
                  className={`text-sm font-medium ${
                    withdrawal.status === "completed"
                      ? "text-emerald-400"
                      : withdrawal.status === "processing"
                      ? "text-yellow-400"
                      : "text-red-400"
                  }`}
                >
                  {withdrawal.status}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div> */}
    </div>
  );
}

// History Tab Component
function HistoryTab({
  setNotifications,
}: {
  setNotifications: React.Dispatch<React.SetStateAction<any[]>>;
}) {
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("date");
  // Define transaction type interface
  interface Transaction {
    _id: string;
    type: string;
    amount: number;
    currency: string;
    status: string;
    description?: string;
    txHash?: string;
    fee?: {
      amount: number;
    };
    createdAt: string;
    submittedAt: string;
    completedAt?: string;
    network?: string;
    toAddress?: string;
    fromAddress?: string;
  }

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    totalCount: 0,
    totalPages: 1,
  });

  const filters = [
    { id: "all", label: "All Transactions" },
    { id: "deposit", label: "Deposits" },
    { id: "withdrawal", label: "Withdrawals" },
    { id: "stake", label: "Staking" },
    { id: "unstake", label: "Unstaking" },
    { id: "reward", label: "Rewards" },
  ];

  // Fetch transaction history from API
  useEffect(() => {
    fetchTransactions();
  }, [filter, pagination.page]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      setError(null);

      const { transactionApi } = await import("../../lib/api/transactions.js");

      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...(filter !== "all" && { type: filter }),
      };

      const response = await transactionApi.getHistory(params);

      if (response.success) {
        setTransactions(response.data.transactions || []);
        setPagination((prev) => ({
          ...prev,
          totalCount: response.data.pagination?.totalCount || 0,
          totalPages: response.data.pagination?.totalPages || 1,
        }));
      } else {
        throw new Error(response.message || "Failed to fetch transactions");
      }
    } catch (err) {
      console.error("Error fetching transactions:", err);
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Failed to load transaction history";
      setError(errorMessage);
      setTransactions([]); // Fallback to empty array
    } finally {
      setLoading(false);
    }
  };

  const filteredTransactions = transactions
    .filter((transaction) => {
      const matchesFilter = filter === "all" || transaction.type === filter;
      const matchesSearch =
        searchTerm === "" ||
        (transaction.txHash &&
          transaction.txHash
            .toLowerCase()
            .includes(searchTerm.toLowerCase())) ||
        (transaction.description &&
          transaction.description
            .toLowerCase()
            .includes(searchTerm.toLowerCase())) ||
        transaction.type.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesFilter && matchesSearch;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "date":
          // Sort by date (newest first)
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        case "amount":
          // Sort by amount (highest first)
          return b.amount - a.amount;
        case "type":
          // Sort alphabetically by type
          return a.type.localeCompare(b.type);
        default:
          return 0;
      }
    });

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "deposit":
        return ArrowUpRight;
      case "withdrawal":
        return ArrowDownLeft;
      case "stake":
        return TrendingUp;
      case "unstake":
        return ArrowDownLeft;
      case "reward":
        return DollarSign;
      default:
        return DollarSign;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "text-emerald-400";
      case "pending":
        return "text-yellow-400";
      case "failed":
        return "text-red-400";
      default:
        return "text-slate-600 dark:text-slate-300";
    }
  };

  const getAmountColor = (type: string) => {
    switch (type) {
      case "deposit":
        return "text-emerald-400";
      case "withdraw":
        return "text-red-400";
      case "stake":
        return "text-blue-400";
      case "reward":
        return "text-green-400";
      default:
        return "text-white";
    }
  };

  const getAmountPrefix = (type: string) => {
    switch (type) {
      case "deposit":
        return "+";
      case "withdraw":
        return "-";
      case "stake":
        return "+";
      case "reward":
        return "+";
      default:
        return "";
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters and Search */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="glass-card p-4 sm:p-6"
      >
        <div className="space-y-4">
          {/* Header with Title and Refresh */}
          <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <h2 className="text-xl sm:text-2xl font-bold text-white">
                Transaction History
              </h2>
              <button
                onClick={() => fetchTransactions()}
                disabled={loading}
                className="flex items-center space-x-2 px-3 py-2 bg-warm-400/15 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-warm-400/25 hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw
                  className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
                />
                <span className="text-sm">Refresh</span>
              </button>
            </div>

            {/* Search and Sort Controls */}
            <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:items-center gap-3 w-full sm:w-auto">
              {/* Search */}
              <div className="relative flex-1 sm:flex-none">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full sm:w-64 px-4 py-3 pr-10 bg-warm-400/15 border border-warm-400/30 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all duration-300"
                  placeholder="Search transactions..."
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-600 dark:text-slate-300">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
              </div>

              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full sm:w-40 px-4 py-3 bg-warm-400/15 border border-warm-400/30 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all duration-300"
              >
                <option value="date" className="bg-gray-800 text-white">
                  Sort by Date
                </option>
                <option value="amount" className="bg-gray-800 text-white">
                  Sort by Amount
                </option>
                <option value="type" className="bg-gray-800 text-white">
                  Sort by Type
                </option>
              </select>
            </div>
          </div>

          {/* Filter Buttons */}
          <div className="space-y-3">
            <p className="text-slate-600 dark:text-slate-300 text-sm font-medium">
              Filter by transaction type:
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 sm:gap-3">
              {filters.map((filterOption) => (
                <button
                  key={filterOption.id}
                  onClick={() => setFilter(filterOption.id)}
                  className={`px-3 sm:px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 min-h-[48px] flex items-center justify-center ${
                    filter === filterOption.id
                      ? "bg-emerald-500 text-black shadow-lg shadow-emerald-500/20 scale-105"
                      : "bg-warm-400/15 text-slate-600 dark:text-slate-300 hover:bg-warm-400/25 hover:text-white hover:scale-105"
                  }`}
                >
                  {filterOption.label}
                </button>
              ))}
            </div>
          </div>

          {/* Results Summary */}
          {!loading && (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-3 border-t border-warm-400/20">
              <p className="text-slate-600 dark:text-slate-300 text-sm mb-2 sm:mb-0">
                Showing {filteredTransactions.length} of {transactions.length}{" "}
                transactions
                {filter !== "all" && (
                  <span className="ml-2 px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded-lg text-xs">
                    {filter} only
                  </span>
                )}
              </p>

              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="text-emerald-400 hover:text-emerald-300 text-sm font-medium transition-colors"
                >
                  Clear search
                </button>
              )}
            </div>
          )}
        </div>
      </motion.div>

      {/* Mobile Transaction Cards (Small Screens) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="lg:hidden space-y-4"
      >
        {loading ? (
          <div className="glass-card p-6 text-center">
            <div className="flex items-center justify-center space-x-2">
              <RefreshCw className="w-5 h-5 animate-spin text-emerald-400" />
              <span className="text-slate-600 dark:text-slate-300">Loading transactions...</span>
            </div>
          </div>
        ) : error ? (
          <div className="glass-card p-6 text-center">
            <div className="text-red-400">
              <AlertCircle className="w-8 h-8 mx-auto mb-2" />
              <p className="mb-3">{error}</p>
              <button
                onClick={() => fetchTransactions()}
                className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="glass-card p-6 text-center">
            <div className="text-slate-600 dark:text-slate-300">
              <History className="w-8 h-8 mx-auto mb-2" />
              <p>No transactions found</p>
            </div>
          </div>
        ) : (
          filteredTransactions.map((transaction, index) => {
            const Icon = getTransactionIcon(transaction.type);
            return (
              <motion.div
                key={transaction._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="glass-card p-4 hover:bg-slate-800/80 dark:bg-slate-700/60 transition-all duration-300"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        transaction.type === "deposit"
                          ? "bg-emerald-500/20"
                          : transaction.type === "withdraw"
                          ? "bg-red-500/20"
                          : transaction.type === "stake"
                          ? "bg-blue-500/20"
                          : "bg-green-500/20"
                      }`}
                    >
                      <Icon
                        className={`w-6 h-6 ${
                          transaction.type === "deposit"
                            ? "text-emerald-400"
                            : transaction.type === "withdraw"
                            ? "text-red-400"
                            : transaction.type === "stake"
                            ? "text-blue-400"
                            : "text-green-400"
                        }`}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-white font-semibold capitalize text-lg">
                          {transaction.type}
                        </h3>
                        <span
                          className={`text-lg font-bold ${getAmountColor(
                            transaction.type
                          )}`}
                        >
                          {getAmountPrefix(transaction.type)}
                          {transaction.amount.toLocaleString()}{" "}
                          {transaction.currency}
                        </span>
                      </div>

                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-600 dark:text-slate-300">Status:</span>
                          <span
                            className={`font-medium ${getStatusColor(
                              transaction.status
                            )}`}
                          >
                            {transaction.status}
                          </span>
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="text-slate-600 dark:text-slate-300">Date:</span>
                          <span className="text-slate-600 dark:text-slate-300">
                            {new Date(transaction.createdAt).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              }
                            )}
                          </span>
                        </div>

                        {transaction.network && (
                          <div className="flex justify-between items-center">
                            <span className="text-slate-600 dark:text-slate-300">Network:</span>
                            <span className="text-slate-600 dark:text-slate-300">
                              {transaction.network}
                            </span>
                          </div>
                        )}

                        {transaction.fee && transaction.fee.amount > 0 && (
                          <div className="flex justify-between items-center">
                            <span className="text-slate-600 dark:text-slate-300">Fee:</span>
                            <span className="text-slate-600 dark:text-slate-300">
                              {transaction.fee.amount} {transaction.currency}
                            </span>
                          </div>
                        )}

                        {transaction.description && (
                          <div className="mt-2 pt-2 border-t border-warm-400/20">
                            <p className="text-emerald-400 italic text-xs">
                              {transaction.description}
                            </p>
                          </div>
                        )}

                        {transaction.txHash && (
                          <div className="mt-2 pt-2 border-t border-warm-400/20">
                            <div className="flex items-center justify-between">
                              <span className="text-slate-600 dark:text-slate-300 text-xs">
                                Transaction:
                              </span>
                              <button
                                onClick={() =>
                                  navigator.clipboard.writeText(
                                    transaction.txHash || ""
                                  )
                                }
                                className="text-emerald-400 hover:text-emerald-300 text-xs font-mono transition-colors flex items-center space-x-1"
                              >
                                <span>
                                  {transaction.txHash?.slice(0, 6)}...
                                  {transaction.txHash?.slice(-4)}
                                </span>
                                <Copy className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </motion.div>

      {/* Desktop Transaction Table (Large Screens) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="hidden lg:block glass-card p-6"
      >
        <div className="overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-warm-400/20">
                <th className="text-left py-4 px-4 text-slate-600 dark:text-slate-300 font-semibold">
                  Type
                </th>
                <th className="text-left py-4 px-4 text-slate-600 dark:text-slate-300 font-semibold">
                  Amount
                </th>
                <th className="text-left py-4 px-4 text-slate-600 dark:text-slate-300 font-semibold">
                  Description
                </th>
                <th className="text-left py-4 px-4 text-slate-600 dark:text-slate-300 font-semibold">
                  Network
                </th>
                <th className="text-left py-4 px-4 text-slate-600 dark:text-slate-300 font-semibold">
                  Date
                </th>
                <th className="text-left py-4 px-4 text-slate-600 dark:text-slate-300 font-semibold">
                  Status
                </th>
                <th className="text-left py-4 px-4 text-slate-600 dark:text-slate-300 font-semibold">
                  Transaction Hash
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12">
                    <div className="flex items-center justify-center space-x-2">
                      <RefreshCw className="w-6 h-6 animate-spin text-emerald-400" />
                      <span className="text-slate-600 dark:text-slate-300">
                        Loading transactions...
                      </span>
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={7} className="text-center py-12">
                    <div className="text-red-400">
                      <AlertCircle className="w-10 h-10 mx-auto mb-3" />
                      <p className="mb-3">{error}</p>
                      <button
                        onClick={() => fetchTransactions()}
                        className="px-6 py-3 bg-red-500/20 text-red-400 rounded-xl hover:bg-red-500/30 transition-colors"
                      >
                        Retry
                      </button>
                    </div>
                  </td>
                </tr>
              ) : filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12">
                    <div className="text-slate-600 dark:text-slate-300">
                      <History className="w-10 h-10 mx-auto mb-3" />
                      <p className="text-lg">No transactions found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((transaction, index) => {
                  const Icon = getTransactionIcon(transaction.type);
                  return (
                    <motion.tr
                      key={transaction._id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className="border-b border-white/5 hover:bg-slate-800/80 dark:bg-slate-700/60 transition-colors group"
                    >
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-4">
                          <div
                            className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                              transaction.type === "deposit"
                                ? "bg-emerald-500/20 group-hover:bg-emerald-500/30"
                                : transaction.type === "withdraw"
                                ? "bg-red-500/20 group-hover:bg-red-500/30"
                                : transaction.type === "stake"
                                ? "bg-blue-500/20 group-hover:bg-blue-500/30"
                                : "bg-green-500/20 group-hover:bg-green-500/30"
                            } transition-colors`}
                          >
                            <Icon
                              className={`w-6 h-6 ${
                                transaction.type === "deposit"
                                  ? "text-emerald-400"
                                  : transaction.type === "withdraw"
                                  ? "text-red-400"
                                  : transaction.type === "stake"
                                  ? "text-blue-400"
                                  : "text-green-400"
                              }`}
                            />
                          </div>
                          <div>
                            <p className="text-white font-semibold capitalize text-lg">
                              {transaction.type}
                            </p>
                            <p className="text-slate-600 dark:text-slate-300 text-sm">
                              {transaction.currency}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div>
                          <p
                            className={`font-bold text-lg ${getAmountColor(
                              transaction.type
                            )}`}
                          >
                            {getAmountPrefix(transaction.type)}
                            {transaction.amount.toLocaleString()}{" "}
                            {transaction.currency}
                          </p>
                          {(() => {
                            const feeAmount =
                              typeof transaction.fee === "object" &&
                              transaction.fee?.amount
                                ? transaction.fee.amount
                                : typeof transaction.fee === "number"
                                ? transaction.fee
                                : 0;
                            return feeAmount > 0 ? (
                              <p className="text-slate-600 dark:text-slate-300 text-sm">
                                Fee: {feeAmount.toFixed(4)}{" "}
                                {transaction.currency}
                              </p>
                            ) : null;
                          })()}
                        </div>
                      </td>
                      <td className="py-4 px-4 max-w-xs">
                        {transaction.description ? (
                          <div className="group relative">
                            <p className="text-emerald-400 italic text-sm truncate">
                              {transaction.description}
                            </p>
                            {transaction.description.length > 50 && (
                              <div className="absolute left-0 top-full mt-2 hidden group-hover:block z-50 bg-gray-900 border border-emerald-500/30 rounded-lg p-3 shadow-xl max-w-sm">
                                <p className="text-emerald-400 italic text-sm whitespace-normal">
                                  {transaction.description}
                                </p>
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-white/40 text-sm">-</span>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-slate-600 dark:text-slate-300 bg-warm-400/15 px-3 py-1 rounded-lg text-sm">
                          {transaction.network || "N/A"}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div>
                          <span className="text-slate-600 dark:text-slate-300 text-base">
                            {new Date(transaction.createdAt).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              }
                            )}
                          </span>
                          <p className="text-slate-600 dark:text-slate-300 text-sm">
                            {new Date(transaction.createdAt).toLocaleTimeString(
                              "en-US",
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )}
                          </p>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className={`px-3 py-1 rounded-lg text-sm font-semibold ${
                            transaction.status === "completed"
                              ? "bg-emerald-500/20 text-emerald-400"
                              : transaction.status === "pending"
                              ? "bg-yellow-500/20 text-yellow-400"
                              : "bg-red-500/20 text-red-400"
                          }`}
                        >
                          {transaction.status}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        {transaction.txHash ? (
                          <button
                            onClick={() =>
                              navigator.clipboard.writeText(
                                transaction.txHash || ""
                              )
                            }
                            className="text-emerald-400 hover:text-emerald-300 font-mono transition-colors flex items-center space-x-2 bg-slate-800/80 dark:bg-slate-700/60 hover:bg-warm-400/15 px-3 py-2 rounded-lg"
                          >
                            <span>
                              {transaction.txHash.slice(0, 8)}...
                              {transaction.txHash.slice(-6)}
                            </span>
                            <Copy className="w-4 h-4" />
                          </button>
                        ) : (
                          <span className="text-white/40">N/A</span>
                        )}
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Transaction Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6"
      >
        <div className="glass-card p-4 sm:p-6 text-center hover:scale-105 transition-transform duration-300">
          <div className="flex items-center justify-center mb-3">
            <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center">
              <ArrowUpRight className="w-6 h-6 text-emerald-400" />
            </div>
          </div>
          <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base mb-2 font-medium">
            Total Deposits
          </p>
          <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-emerald-400">
            $
            {transactions
              .filter((t) => t.type === "deposit")
              .reduce((sum, t) => sum + t.amount, 0)
              .toLocaleString()}
          </p>
          <p className="text-white/50 text-xs sm:text-sm mt-1">
            {transactions.filter((t) => t.type === "deposit").length}{" "}
            transactions
          </p>
        </div>

        <div className="glass-card p-4 sm:p-6 text-center hover:scale-105 transition-transform duration-300">
          <div className="flex items-center justify-center mb-3">
            <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center">
              <ArrowDownLeft className="w-6 h-6 text-red-400" />
            </div>
          </div>
          <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base mb-2 font-medium">
            Total Withdrawals
          </p>
          <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-red-400">
            $
            {transactions
              .filter((t) => t.type === "withdrawal")
              .reduce((sum, t) => sum + t.amount, 0)
              .toLocaleString()}
          </p>
          <p className="text-white/50 text-xs sm:text-sm mt-1">
            {transactions.filter((t) => t.type === "withdrawal").length}{" "}
            transactions
          </p>
        </div>

        <div className="glass-card p-4 sm:p-6 text-center hover:scale-105 transition-transform duration-300">
          <div className="flex items-center justify-center mb-3">
            <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-green-400" />
            </div>
          </div>
          <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base mb-2 font-medium">
            Total Rewards
          </p>
          <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-green-400">
            $
            {transactions
              .filter((t) =>
                [
                  "reward",
                  "manual_bonus",
                  "manual_add",
                  "first_deposit_bonus",
                  "referral_commission",
                  "staking_reward",
                ].includes(t.type)
              )
              .reduce((sum, t) => sum + t.amount, 0)
              .toLocaleString()}
          </p>
          <p className="text-white/50 text-xs sm:text-sm mt-1">
            {
              transactions.filter((t) =>
                [
                  "reward",
                  "manual_bonus",
                  "manual_add",
                  "first_deposit_bonus",
                  "referral_commission",
                  "staking_reward",
                ].includes(t.type)
              ).length
            }{" "}
            rewards earned
          </p>
        </div>

        <div className="glass-card p-4 sm:p-6 text-center hover:scale-105 transition-transform duration-300">
          <div className="flex items-center justify-center mb-3">
            <div className="w-12 h-12 bg-yellow-500/20 rounded-xl flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-yellow-400" />
            </div>
          </div>
          <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base mb-2 font-medium">
            Total Fees
          </p>
          <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-yellow-400">
            $
            {transactions
              .reduce((sum, t) => {
                const feeAmount =
                  typeof t.fee === "object" && t.fee?.amount
                    ? t.fee.amount
                    : typeof t.fee === "number"
                    ? t.fee
                    : 0;
                return sum + feeAmount;
              }, 0)
              .toFixed(2)}
          </p>
          <p className="text-white/50 text-xs sm:text-sm mt-1">
            Network & processing fees
          </p>
        </div>
      </motion.div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="glass-card p-4 sm:p-6"
        >
          <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between">
            {/* Page Info */}
            <div className="text-center sm:text-left">
              <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base">
                Showing page{" "}
                <span className="font-bold text-emerald-400">
                  {pagination.page}
                </span>{" "}
                of{" "}
                <span className="font-bold text-emerald-400">
                  {pagination.totalPages}
                </span>
              </p>
              <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm mt-1">
                {pagination.totalCount} total transactions
              </p>
            </div>

            {/* Navigation Controls */}
            <div className="flex items-center justify-center space-x-2 sm:space-x-3">
              {/* First Page */}
              <button
                onClick={() => setPagination((prev) => ({ ...prev, page: 1 }))}
                disabled={pagination.page <= 1 || loading}
                className="px-3 py-2 sm:px-4 sm:py-3 bg-warm-400/15 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-warm-400/25 hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base min-h-[44px] flex items-center justify-center"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
                  />
                </svg>
              </button>

              {/* Previous Page */}
              <button
                onClick={() =>
                  setPagination((prev) => ({
                    ...prev,
                    page: Math.max(1, prev.page - 1),
                  }))
                }
                disabled={pagination.page <= 1 || loading}
                className="px-4 py-2 sm:px-6 sm:py-3 bg-warm-400/15 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-warm-400/25 hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base min-h-[44px] flex items-center space-x-2"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                <span className="hidden sm:inline">Previous</span>
              </button>

              {/* Page Numbers */}
              <div className="flex items-center space-x-1 sm:space-x-2">
                {[...Array(Math.min(5, pagination.totalPages))].map(
                  (_, index) => {
                    let pageNumber;
                    if (pagination.totalPages <= 5) {
                      pageNumber = index + 1;
                    } else if (pagination.page <= 3) {
                      pageNumber = index + 1;
                    } else if (pagination.page >= pagination.totalPages - 2) {
                      pageNumber = pagination.totalPages - 4 + index;
                    } else {
                      pageNumber = pagination.page - 2 + index;
                    }

                    return (
                      <button
                        key={pageNumber}
                        onClick={() =>
                          setPagination((prev) => ({
                            ...prev,
                            page: pageNumber,
                          }))
                        }
                        disabled={loading}
                        className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg text-sm sm:text-base font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                          pagination.page === pageNumber
                            ? "bg-emerald-500 text-black shadow-lg shadow-emerald-500/20"
                            : "bg-warm-400/15 text-slate-600 dark:text-slate-300 hover:bg-warm-400/25 hover:text-white"
                        }`}
                      >
                        {pageNumber}
                      </button>
                    );
                  }
                )}
              </div>

              {/* Next Page */}
              <button
                onClick={() =>
                  setPagination((prev) => ({
                    ...prev,
                    page: Math.min(prev.totalPages, prev.page + 1),
                  }))
                }
                disabled={pagination.page >= pagination.totalPages || loading}
                className="px-4 py-2 sm:px-6 sm:py-3 bg-warm-400/15 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-warm-400/25 hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base min-h-[44px] flex items-center space-x-2"
              >
                <span className="hidden sm:inline">Next</span>
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>

              {/* Last Page */}
              <button
                onClick={() =>
                  setPagination((prev) => ({ ...prev, page: prev.totalPages }))
                }
                disabled={pagination.page >= pagination.totalPages || loading}
                className="px-3 py-2 sm:px-4 sm:py-3 bg-warm-400/15 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-warm-400/25 hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base min-h-[44px] flex items-center justify-center"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 5l7 7-7 7M5 5l7 7-7 7"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile-only Quick Jump */}
          <div className="block sm:hidden mt-4 pt-4 border-t border-warm-400/20">
            <div className="flex items-center justify-center space-x-3">
              <label className="text-slate-600 dark:text-slate-300 text-sm">Go to page:</label>
              <input
                type="number"
                min="1"
                max={pagination.totalPages}
                value={pagination.page}
                onChange={(e) => {
                  const page = parseInt(e.target.value);
                  if (page >= 1 && page <= pagination.totalPages) {
                    setPagination((prev) => ({ ...prev, page }));
                  }
                }}
                className="w-16 px-2 py-1 bg-warm-400/15 border border-warm-400/30 rounded-lg text-white text-center text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
              <span className="text-slate-600 dark:text-slate-300 text-sm">
                of {pagination.totalPages}
              </span>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

// Analytics Tab Component
function AnalyticsTab() {
  const [timeRange, setTimeRange] = useState("30d");
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [portfolioHistory, setPortfolioHistory] = useState<
    Array<{ date: string; balance: number }>
  >([]);
  const [transactionStats, setTransactionStats] = useState<any>(null);

  const timeRanges = [
    { id: "7d", label: "7D" },
    { id: "30d", label: "30D" },
    { id: "90d", label: "90D" },
    { id: "1y", label: "1Y" },
  ];

  // Fetch analytics data
  useEffect(() => {
    fetchAnalyticsData();
  }, [timeRange]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      const { transactionApi, walletApi } = await import(
        "../../lib/api/transactions.js"
      );

      // Fetch transactions and wallet data
      const [transactionsResponse, walletResponse] = await Promise.all([
        transactionApi.getHistory(),
        walletApi.getWallet(),
      ]);

      if (
        transactionsResponse.success &&
        transactionsResponse.data?.transactions
      ) {
        const transactions = transactionsResponse.data.transactions;
        const wallet = walletResponse.data?.wallet || {};

        // Calculate time range
        const now = new Date();
        const daysBack =
          timeRange === "7d"
            ? 7
            : timeRange === "30d"
            ? 30
            : timeRange === "90d"
            ? 90
            : 365;
        const startDate = new Date(
          now.getTime() - daysBack * 24 * 60 * 60 * 1000
        );

        // Filter transactions by date range
        const filteredTxs = transactions.filter(
          (tx: any) =>
            new Date(tx.createdAt) >= startDate && tx.status === "completed"
        );

        // Calculate earnings breakdown
        const deposits = filteredTxs
          .filter((tx: any) => tx.type === "deposit")
          .reduce((sum: number, tx: any) => sum + tx.amount, 0);
        const withdrawals = filteredTxs
          .filter((tx: any) => tx.type === "withdrawal")
          .reduce((sum: number, tx: any) => sum + tx.amount, 0);
        const stakingRewards = filteredTxs
          .filter((tx: any) => tx.type === "reward")
          .reduce((sum: number, tx: any) => sum + tx.amount, 0);
        const stakes = filteredTxs
          .filter((tx: any) => tx.type === "stake")
          .reduce((sum: number, tx: any) => sum + tx.amount, 0);

        // Calculate daily rewards for the last 7 days
        const dailyRewardsData = [];
        const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        for (let i = 6; i >= 0; i--) {
          const date = new Date(now);
          date.setDate(date.getDate() - i);
          const dayStart = new Date(date.setHours(0, 0, 0, 0));
          const dayEnd = new Date(date.setHours(23, 59, 59, 999));

          const dayRewards = filteredTxs
            .filter((tx: any) => {
              const txDate = new Date(tx.createdAt);
              return (
                tx.type === "reward" && txDate >= dayStart && txDate <= dayEnd
              );
            })
            .reduce((sum: number, tx: any) => sum + tx.amount, 0);

          dailyRewardsData.push({
            day: dayNames[date.getDay()],
            amount: dayRewards,
          });
        }

        // Calculate portfolio history
        const sortedTxs = [...transactions]
          .filter((tx: any) => new Date(tx.createdAt) >= startDate)
          .sort(
            (a, b) =>
              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );

        let runningBalance = 0;
        const portfolioData: Array<{ date: string; balance: number }> = [];
        const txByDate = new Map<string, number>();

        sortedTxs.forEach((tx) => {
          if (tx.status === "completed") {
            const dateKey = new Date(tx.createdAt).toISOString().split("T")[0];
            const currentBalance = txByDate.get(dateKey) || runningBalance;

            if (tx.type === "deposit" || tx.type === "reward") {
              txByDate.set(dateKey, currentBalance + tx.amount);
            } else if (tx.type === "withdrawal") {
              txByDate.set(dateKey, currentBalance - tx.amount);
            }
          }
        });

        // Generate data points
        for (
          let d = new Date(startDate);
          d <= now;
          d.setDate(d.getDate() + 1)
        ) {
          const dateKey = d.toISOString().split("T")[0];
          const dayBalance = txByDate.get(dateKey);

          if (dayBalance !== undefined) {
            runningBalance = dayBalance;
          }

          portfolioData.push({
            date: dateKey,
            balance: runningBalance,
          });
        }

        // Calculate statistics
        const totalValue = wallet.balance || 0;
        const totalEarnings = wallet.totalEarnings || 0;
        const stakedAmount = wallet.stakedAmount || 0;
        const stakingDays = wallet.createdAt
          ? Math.floor(
              (now.getTime() - new Date(wallet.createdAt).getTime()) /
                (1000 * 60 * 60 * 24)
            )
          : 0;

        // Calculate best day and average daily
        const maxEarningDay = dailyRewardsData.reduce(
          (max, day) => (day.amount > max.amount ? day : max),
          dailyRewardsData[0]
        );
        const avgDaily =
          dailyRewardsData.reduce((sum, day) => sum + day.amount, 0) / 7;

        setAnalyticsData({
          totalValue,
          totalEarnings,
          stakedAmount,
          stakingDays,
          deposits,
          withdrawals,
          stakingRewards,
          stakes,
          earningsBreakdown: [
            {
              name: "Staking Rewards",
              value: stakingRewards,
              color: "#10B981",
            },
            { name: "Deposits", value: deposits, color: "#00FF87" },
            { name: "Active Stakes", value: stakes, color: "#06B6D4" },
            { name: "Withdrawals", value: withdrawals, color: "#EF4444" },
          ],
          dailyRewards: dailyRewardsData,
          bestDay: maxEarningDay.amount,
          avgDaily: avgDaily,
          transactionCount: filteredTxs.length,
        });

        setPortfolioHistory(portfolioData);
        setTransactionStats({
          total: transactions.length,
          completed: transactions.filter((tx: any) => tx.status === "completed")
            .length,
          pending: transactions.filter((tx: any) => tx.status === "pending")
            .length,
          failed: transactions.filter((tx: any) => tx.status === "failed")
            .length,
        });
      }
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="glass-card p-6"
      >
        <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-white">
            Portfolio Analytics
          </h2>
          <div className="flex flex-wrap gap-2">
            {timeRanges.map((range) => (
              <button
                key={range.id}
                onClick={() => setTimeRange(range.id)}
                className={`px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                  timeRange === range.id
                    ? "bg-emerald-500 text-black"
                    : "bg-warm-400/15 text-slate-600 dark:text-slate-300 hover:bg-warm-400/25 hover:text-white"
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>

        {/* Key Metrics */}
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
            <div className="text-center">
              <p className="text-slate-600 dark:text-slate-300 text-sm mb-1">Total Value</p>
              <p className="text-2xl font-bold text-white">
                ${analyticsData?.totalValue.toLocaleString() || "0.00"}
              </p>
              <p className="text-emerald-400 text-sm">
                {analyticsData?.transactionCount || 0} transactions
              </p>
            </div>
            <div className="text-center">
              <p className="text-slate-600 dark:text-slate-300 text-sm mb-1">Total Earnings</p>
              <p className="text-2xl font-bold text-white">
                ${analyticsData?.totalEarnings.toLocaleString() || "0.00"}
              </p>
              <p className="text-emerald-400 text-sm">
                +{analyticsData?.stakingRewards.toFixed(2) || "0.00"} rewards
              </p>
            </div>
            <div className="text-center">
              <p className="text-slate-600 dark:text-slate-300 text-sm mb-1">Monthly Rate</p>
              <p className="text-2xl font-bold text-emerald-400">5-12%</p>
              <p className="text-slate-600 dark:text-slate-300 text-sm">Variable</p>
            </div>
            <div className="text-center">
              <p className="text-slate-600 dark:text-slate-300 text-sm mb-1">Staking Days</p>
              <p className="text-2xl font-bold text-white">
                {analyticsData?.stakingDays || 0}
              </p>
              <p className="text-slate-600 dark:text-slate-300 text-sm">Days Active</p>
            </div>
          </div>
        )}
      </motion.div>

      {/* Portfolio Growth Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="glass-card p-6"
      >
        <h3 className="text-xl font-semibold text-white mb-6">
          Portfolio Value Over Time
        </h3>
        <div className="h-80">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
            </div>
          ) : portfolioHistory.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={portfolioHistory}>
                <defs>
                  <linearGradient
                    id="colorBalanceAnalytics"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="date"
                  stroke="#9CA3AF"
                  fontSize={12}
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    return `${date.getMonth() + 1}/${date.getDate()}`;
                  }}
                />
                <YAxis
                  stroke="#9CA3AF"
                  fontSize={12}
                  tickFormatter={(value) => `$${value.toLocaleString()}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1F2937",
                    border: "1px solid #374151",
                    borderRadius: "16px",
                    color: "#F9FAFB",
                  }}
                  formatter={(value: number) => [
                    `$${value.toLocaleString()}`,
                    "Balance",
                  ]}
                  labelFormatter={(label) =>
                    new Date(label).toLocaleDateString()
                  }
                />
                <Area
                  type="monotone"
                  dataKey="balance"
                  stroke="#10B981"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorBalanceAnalytics)"
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <BarChart3 className="w-16 h-16 text-white/40 mx-auto mb-4" />
                <p className="text-slate-600 dark:text-slate-300">No portfolio data yet</p>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Earnings Breakdown */}
      <div className="grid md:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="glass-card p-6"
        >
          <h3 className="text-xl font-semibold text-white mb-6">
            Transaction Breakdown
          </h3>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {analyticsData?.earningsBreakdown.map((item: any) => (
                <div
                  key={item.name}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-slate-900 dark:text-white font-medium">{item.name}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-slate-900 dark:text-white font-semibold">
                      ${item.value.toLocaleString()}
                    </p>
                    <p className="text-slate-600 dark:text-slate-300 text-sm">
                      {analyticsData?.earningsBreakdown.reduce(
                        (sum: number, i: any) => sum + i.value,
                        0
                      ) > 0
                        ? (
                            (item.value /
                              analyticsData?.earningsBreakdown.reduce(
                                (sum: number, i: any) => sum + i.value,
                                0
                              )) *
                            100
                          ).toFixed(1)
                        : "0.0"}
                      %
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="glass-card p-6"
        >
          <h3 className="text-xl font-semibold text-white mb-6">
            Daily Rewards (Last 7 Days)
          </h3>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {analyticsData?.dailyRewards.map((day: any) => {
                const maxAmount = Math.max(
                  ...analyticsData.dailyRewards.map((d: any) => d.amount),
                  50
                );
                return (
                  <div
                    key={day.day}
                    className="flex items-center justify-between"
                  >
                    <span className="text-slate-600 dark:text-slate-300 font-medium w-12">
                      {day.day}
                    </span>
                    <div className="flex items-center space-x-3 flex-1">
                      <div className="w-full max-w-xs bg-warm-400/15 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-emerald-500 to-green-400 h-2 rounded-full transition-all duration-300"
                          style={{
                            width: `${(day.amount / maxAmount) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="text-emerald-400 font-semibold text-sm w-16 text-right">
                        ${day.amount.toFixed(2)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>

      {/* Transaction Status Distribution */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="glass-card p-6"
      >
        <h3 className="text-xl font-semibold text-white mb-6">
          Transaction Statistics
        </h3>
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
          </div>
        ) : transactionStats ? (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={[
                  {
                    name: "Completed",
                    count: transactionStats.completed,
                    fill: "#10B981",
                  },
                  {
                    name: "Pending",
                    count: transactionStats.pending,
                    fill: "#F59E0B",
                  },
                  {
                    name: "Failed",
                    count: transactionStats.failed,
                    fill: "#EF4444",
                  },
                ]}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="name" stroke="#9CA3AF" fontSize={12} />
                <YAxis stroke="#9CA3AF" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1F2937",
                    border: "1px solid #374151",
                    borderRadius: "16px",
                    color: "#F9FAFB",
                  }}
                  formatter={(value: number) => [value, "Transactions"]}
                />
                <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                  {[
                    {
                      name: "Completed",
                      count: transactionStats.completed,
                      fill: "#10B981",
                    },
                    {
                      name: "Pending",
                      count: transactionStats.pending,
                      fill: "#F59E0B",
                    },
                    {
                      name: "Failed",
                      count: transactionStats.failed,
                      fill: "#EF4444",
                    },
                  ].map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center">
            <div className="text-center">
              <BarChart3 className="w-16 h-16 text-white/40 mx-auto mb-4" />
              <p className="text-slate-600 dark:text-slate-300">No transaction data available</p>
            </div>
          </div>
        )}
      </motion.div>

      {/* Performance Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="glass-card p-6"
      >
        <h3 className="text-xl font-semibold text-white mb-6">
          Performance Summary
        </h3>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-slate-800/80 dark:bg-slate-700/60 rounded-xl">
              <p className="text-slate-600 dark:text-slate-300 text-sm mb-2">Best Day</p>
              <p className="text-2xl font-bold text-emerald-400">
                ${analyticsData?.bestDay.toFixed(2) || "0.00"}
              </p>
              <p className="text-slate-600 dark:text-slate-300 text-xs">
                {analyticsData?.bestDay > 0
                  ? "Highest daily reward"
                  : "No rewards yet"}
              </p>
            </div>
            <div className="text-center p-4 bg-slate-800/80 dark:bg-slate-700/60 rounded-xl">
              <p className="text-slate-600 dark:text-slate-300 text-sm mb-2">Average Daily</p>
              <p className="text-2xl font-bold text-white">
                ${analyticsData?.avgDaily.toFixed(2) || "0.00"}
              </p>
              <p className="text-slate-600 dark:text-slate-300 text-xs">Last 7 days</p>
            </div>
            <div className="text-center p-4 bg-slate-800/80 dark:bg-slate-700/60 rounded-xl">
              <p className="text-slate-600 dark:text-slate-300 text-sm mb-2">Total Staked</p>
              <p className="text-2xl font-bold text-cyan-400">
                ${analyticsData?.stakedAmount.toLocaleString() || "0.00"}
              </p>
              <p className="text-slate-600 dark:text-slate-300 text-xs">Principal amount</p>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}

// Affiliate Tab Component
function AffiliateTab({
  user,
  setNotifications,
}: {
  user: any;
  setNotifications: React.Dispatch<
    React.SetStateAction<
      Array<{ id: number; type: string; message: string; timestamp: Date }>
    >
  >;
}) {
  const [referralData, setReferralData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  // Generate a dummy referral code based on user data (fallback only)
  const generateDummyReferralCode = (user: any) => {
    if (!user) return "GUEST001";

    // Create a consistent code based on user email/id
    const emailHash =
      user.email?.split("@")[0]?.toUpperCase().slice(0, 4) || "USER";
    const idHash = user.id?.slice(-4)?.toUpperCase() || "1234";

    // Ensure it's always 8 characters with proper formatting
    let code = (emailHash + idHash)
      .replace(/[^A-Z0-9]/g, "")
      .padEnd(8, "0")
      .slice(0, 8);

    // Make sure it looks like a real referral code (mix of letters and numbers)
    if (!/[0-9]/.test(code)) {
      code =
        code.slice(0, 6) +
        Math.floor(Math.random() * 100)
          .toString()
          .padStart(2, "0");
    }
    if (!/[A-Z]/.test(code)) {
      code = "REF" + code.slice(3, 8);
    }

    return code;
  };

  const dummyReferralCode = generateDummyReferralCode(user);

  // Use actual referral code from referralData if available, otherwise use dummy
  const actualReferralCode = referralData?.referralCode || dummyReferralCode;

  const flattenLegacyReferredUsers = (referredUsers: any) => {
    if (!referredUsers) return [];
    if (Array.isArray(referredUsers)) return referredUsers;

    const levels = [
      ...(referredUsers.level1 || []),
      ...(referredUsers.level2 || []),
      ...(referredUsers.level3 || []),
    ];

    return levels;
  };

  const normalizeReferralData = (data: any) => {
    if (!data) return null;
    const flattened =
      data.referredUsersList ||
      data.referredUsersFlat ||
      flattenLegacyReferredUsers(data.referredUsers);

    return {
      ...data,
      referralCode: data.referralCode || dummyReferralCode,
      referredUsersList: flattened || [],
    };
  };

  const getDefaultReferralLink = () =>
    typeof window !== "undefined"
      ? `${window.location.origin}/signup?ref=${actualReferralCode}`
      : "";

  const referralLink = referralData?.referralLink || getDefaultReferralLink();

  const referredUsersList = referralData?.referredUsersList || [];
  const level1Count =
    referralData?.downline?.level1?.count ??
    referralData?.level1Referrals ??
    referredUsersList.filter((user: any) => user.level === 1).length;
  const level2Count =
    referralData?.downline?.level2?.count ??
    referralData?.level2Referrals ??
    referredUsersList.filter((user: any) => user.level === 2).length;
  const level3Count =
    referralData?.downline?.level3?.count ??
    referralData?.level3Referrals ??
    referredUsersList.filter((user: any) => user.level === 3).length;

  const totalReferrals =
    referralData?.totalReferrals ??
    referralData?.downline?.total ??
    referredUsersList.length ??
    0;

  const totalEarnings =
    referralData?.totalEarnings ?? referralData?.earnings?.total ?? 0;

  const earningsByLevel = {
    level1: referralData?.earnings?.level1 || 0,
    level2: referralData?.earnings?.level2 || 0,
    level3: referralData?.earnings?.level3 || 0,
    firstDeposit: referralData?.earnings?.firstDepositBonus || 0,
  };

  const referrer = referralData?.referrer;

  // Fetch referral data
  useEffect(() => {
    fetchReferralData();
  }, []);

  const fetchReferralData = async () => {
    try {
      setLoading(true);

      // Try to fetch real data from API first
      try {
        const { authApi } = await import("../../lib/api/auth.js");
        const response = await authApi.getReferralData();

        if (response.success && response.data) {
          setReferralData(normalizeReferralData(response.data));
          setLoading(false);
          return; // Exit early if we got real data
        }
      } catch (apiError) {
        console.log("API not available, using dummy data");
      }

      // Fallback to dummy data if API fails or returns no data
      const dummyReferredUsers = generateDummyReferredUsers();
      const dummyData = {
        referralCode: dummyReferralCode,
        totalReferrals: dummyReferredUsers.length,
        totalEarnings: dummyReferredUsers.reduce(
          (sum, user) => sum + (user.earnings || 0),
          0
        ),
        earnings: {
          level1: dummyReferredUsers.reduce(
            (sum, user) =>
              user.level === 1 ? sum + (user.earnings || 0) : sum,
            0
          ),
          level2: dummyReferredUsers.reduce(
            (sum, user) =>
              user.level === 2 ? sum + (user.earnings || 0) : sum,
            0
          ),
          level3: dummyReferredUsers.reduce(
            (sum, user) =>
              user.level === 3 ? sum + (user.earnings || 0) : sum,
            0
          ),
          firstDepositBonus: 0,
          total: dummyReferredUsers.reduce(
            (sum, user) => sum + (user.earnings || 0),
            0
          ),
        },
        downline: {
          total: dummyReferredUsers.length,
          level1: {
            count: dummyReferredUsers.filter((u) => u.level === 1).length,
            users: dummyReferredUsers.filter((u) => u.level === 1),
          },
          level2: {
            count: dummyReferredUsers.filter((u) => u.level === 2).length,
            users: dummyReferredUsers.filter((u) => u.level === 2),
          },
          level3: {
            count: dummyReferredUsers.filter((u) => u.level === 3).length,
            users: dummyReferredUsers.filter((u) => u.level === 3),
          },
        },
        referredUsersList: dummyReferredUsers,
      };

      setReferralData(dummyData);
    } catch (error) {
      console.error("Error fetching referral data:", error);
      setNotifications((prev) => [
        {
          id: Date.now(),
          type: "error",
          message: "Failed to load referral data, showing demo data",
          timestamp: new Date(),
        },
        ...prev,
      ]);

      // Fallback to basic dummy data
      setReferralData({
        referralCode: dummyReferralCode,
        totalReferrals: 0,
        totalEarnings: 0,
        earnings: {
          level1: 0,
          level2: 0,
          level3: 0,
          total: 0,
          firstDepositBonus: 0,
        },
        downline: {
          total: 0,
          level1: { count: 0, users: [] },
          level2: { count: 0, users: [] },
          level3: { count: 0, users: [] },
        },
        referredUsersList: [],
      });
    } finally {
      setLoading(false);
    }
  };

  // Generate dummy referred users for demonstration
  const generateDummyReferredUsers = () => {
    const dummyNames = [
      "Sarah Johnson",
      "Mike Chen",
      "Emily Davis",
      "David Wilson",
      "Lisa Garcia",
      "James Brown",
      "Anna Martinez",
      "Chris Taylor",
    ];

    const referralCount = Math.floor(Math.random() * 5); // 0-4 referrals
    const users = [];

    for (let i = 0; i < referralCount; i++) {
      const randomDate = new Date();
      randomDate.setDate(randomDate.getDate() - Math.floor(Math.random() * 30)); // Last 30 days
      const level = (i % 3) + 1;
      const commissionRate = level === 1 ? 8 : level === 2 ? 4 : 3;

      users.push({
        id: `dummy-${i}`,
        name: dummyNames[Math.floor(Math.random() * dummyNames.length)],
        email: `user${i + 1}@example.com`,
        createdAt: randomDate.toISOString(),
        earnings: Math.floor(Math.random() * 100),
        level,
        commissionRate,
      });
    }

    return users;
  };

  const copyReferralLink = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setNotifications((prev) => [
        {
          id: Date.now(),
          type: "success",
          message: "Referral link copied to clipboard!",
          timestamp: new Date(),
        },
        ...prev,
      ]);
      setTimeout(() => {
        setCopied(false);
        setNotifications((prev) => prev.slice(1));
      }, 3000);
    } catch (error) {
      setNotifications((prev) => [
        {
          id: Date.now(),
          type: "error",
          message: "Failed to copy referral link",
          timestamp: new Date(),
        },
        ...prev,
      ]);
    }
  };

  const copyReferralCode = async () => {
    try {
      await navigator.clipboard.writeText(actualReferralCode);
      setCopied(true);
      setNotifications((prev) => [
        {
          id: Date.now(),
          type: "success",
          message: "Referral code copied to clipboard!",
          timestamp: new Date(),
        },
        ...prev,
      ]);
      setTimeout(() => {
        setCopied(false);
        setNotifications((prev) => prev.slice(1));
      }, 3000);
    } catch (error) {
      setNotifications((prev) => [
        {
          id: Date.now(),
          type: "error",
          message: "Failed to copy referral code",
          timestamp: new Date(),
        },
        ...prev,
      ]);
    }
  };

  const shareReferralLink = async () => {
    // Prevent multiple concurrent share calls
    if (isSharing) return;

    if (navigator.share) {
      setIsSharing(true);
      try {
        await navigator.share({
          title: "Join USDT Staking",
          text: "Join me on this amazing USDT staking platform and start earning rewards!",
          url: referralLink,
        });
      } catch (error) {
        // User cancelled or share failed - silently ignore
        console.log("Share cancelled or failed");
      } finally {
        setIsSharing(false);
      }
    } else {
      copyReferralLink();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex items-center space-x-3">
          <Loader className="w-6 h-6 animate-spin text-emerald-400" />
          <span className="text-slate-600 dark:text-slate-300">Loading affiliate data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Affiliate Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-gradient-to-r from-purple-500/20 to-blue-400/20 backdrop-blur-xl border border-purple-500/30 rounded-xl sm:rounded-2xl lg:rounded-3xl p-4 sm:p-6 lg:p-8"
      >
        <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 mb-4 sm:mb-6">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-purple-500 to-blue-400 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/20">
            <Users className="w-6 h-6 sm:w-8 sm:h-8 text-white font-bold" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">
              Affiliate Program
            </h1>
            <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base">
              Earn rewards by inviting friends to join our platform
            </p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 sm:gap-4 mt-4 sm:mt-6">
          <div className="flex items-center space-x-2 sm:space-x-3 bg-warm-400/15 rounded-xl sm:rounded-2xl p-3 sm:p-4">
            <Users className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400" />
            <div>
              <p className="text-white font-semibold text-sm sm:text-base">
                {totalReferrals} Referrals
              </p>
              <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm">
                Total friends joined
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-3 bg-warm-400/15 rounded-xl sm:rounded-2xl p-3 sm:p-4">
            <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-green-400" />
            <div>
              <p className="text-white font-semibold text-sm sm:text-base">
                ${totalEarnings.toFixed(2)}
              </p>
              <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm">Total earnings</p>
              {earningsByLevel.firstDeposit > 0 && (
                <p className="text-emerald-400 text-[11px] sm:text-xs mt-1">
                  +${earningsByLevel.firstDeposit.toFixed(2)} first deposit
                  bonus
                </p>
              )}
            </div>
          </div>
          <div className="bg-warm-400/15 rounded-xl sm:rounded-2xl p-3 sm:p-4">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <Award className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-400" />
              <div>
                <p className="text-white font-semibold text-sm sm:text-base">
                  Multi-level rewards
                </p>
                <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm">
                  Level 1 · 8% &nbsp;|&nbsp; Level 2 · 4% &nbsp;|&nbsp; Level 3
                  · 3%
                </p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 mt-3">
              {[1, 2, 3].map((level) => (
                <div key={level} className="bg-slate-800/80 dark:bg-slate-700/60 rounded-lg p-2">
                  <p className="text-white text-xs font-semibold">L{level}</p>
                  <p className="text-slate-600 dark:text-slate-300 text-[11px]">
                    {level === 1
                      ? `${level1Count} refs`
                      : level === 2
                      ? `${level2Count} refs`
                      : `${level3Count} refs`}
                  </p>
                  <p className="text-emerald-400 text-xs font-semibold">
                    $
                    {level === 1
                      ? earningsByLevel.level1.toFixed(2)
                      : level === 2
                      ? earningsByLevel.level2.toFixed(2)
                      : earningsByLevel.level3.toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-3 bg-gradient-to-r from-purple-500/20 to-blue-400/20 rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-purple-500/30">
            <Copy className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400" />
            <div>
              <p className="text-white font-semibold text-sm sm:text-base font-mono">
                {actualReferralCode}
              </p>
              <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm">Your code</p>
            </div>
          </div>
        </div>
        {referrer && (
          <div className="mt-6 bg-slate-800/80 dark:bg-slate-700/60 border border-white/15 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500/30 to-blue-400/30 flex items-center justify-center border border-warm-400/20">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-slate-600 dark:text-slate-300 text-xs uppercase tracking-wide">
                  You were invited by
                </p>
                <p className="text-white text-lg font-bold leading-tight">
                  {referrer.name || "Referral Partner"}
                </p>
                {referrer.email && (
                  <p className="text-slate-600 dark:text-slate-300 text-sm">{referrer.email}</p>
                )}
              </div>
            </div>
            <div className="bg-warm-400/15 rounded-xl px-4 py-3">
              <p className="text-slate-600 dark:text-slate-300 text-[11px] uppercase tracking-wide">
                Their referral code
              </p>
              <p className="text-white font-mono text-base">
                {referrer.referralCode || "N/A"}
              </p>
            </div>
          </div>
        )}
      </motion.div>

      {/* Referral Link Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl border border-warm-400/30 rounded-3xl p-8"
      >
        <h3 className="text-2xl font-bold text-white mb-6">Share & Earn</h3>

        <div className="space-y-6">
          {/* Prominent Referral Code Display */}
          <div className="bg-gradient-to-r from-purple-500/20 to-blue-400/20 rounded-2xl p-6 border border-purple-500/30 text-center">
            <h4 className="text-slate-600 dark:text-slate-300 text-sm font-medium mb-3 uppercase tracking-wide">
              Your Referral Code
            </h4>
            <div className="bg-warm-400/15 rounded-xl p-4 mb-4">
              <div className="text-4xl font-bold text-white font-mono tracking-wider mb-2">
                {actualReferralCode}
              </div>
              <p className="text-purple-300 text-sm">
                Share this code with friends
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={copyReferralCode}
                className="px-6 py-2 bg-warm-400/25 text-white rounded-lg font-semibold hover:bg-white/30 transition-all duration-300 flex items-center space-x-2"
              >
                {copied ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
                <span>{copied ? "Copied!" : "Copy Code"}</span>
              </button>
              <button
                onClick={shareReferralLink}
                className="px-6 py-2 bg-gradient-to-r from-purple-500 to-blue-400 text-white rounded-lg font-semibold hover:from-purple-600 hover:to-blue-500 transition-all duration-300 flex items-center space-x-2"
              >
                <Users className="w-4 h-4" />
                <span>Share Link</span>
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Referred Users Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl border border-warm-400/30 rounded-3xl p-8"
      >
        <h3 className="text-2xl font-bold text-white mb-6">Referred Users</h3>

        {referredUsersList.length > 0 ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <p className="text-slate-600 dark:text-slate-300 text-sm">
                You have referred {referredUsersList.length} user
                {referredUsersList.length !== 1 ? "s" : ""}
              </p>
              <div className="text-emerald-400 text-sm font-semibold">
                Total Earned: ${totalEarnings.toFixed(2)}
              </div>
            </div>
            {referredUsersList.map((referredUser: any, index: number) => (
              <motion.div
                key={referredUser.email || index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="flex items-center justify-between p-4 bg-slate-800/80 dark:bg-slate-700/60 rounded-2xl border border-warm-400/20 hover:bg-warm-400/15 transition-all duration-300"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-400 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-slate-900 dark:text-white font-semibold">
                      {referredUser.name ||
                        referredUser.fullName ||
                        "Referred User"}
                    </p>
                    <p className="text-slate-600 dark:text-slate-300 text-sm">
                      Joined{" "}
                      {referredUser.createdAt
                        ? new Date(referredUser.createdAt).toLocaleDateString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            }
                          )
                        : "Date unavailable"}
                    </p>
                    {referredUser.email && (
                      <p className="text-white/40 text-xs font-mono">
                        {referredUser.email.split("@")[0]}***
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-emerald-400 font-semibold">
                    $
                    {(
                      referredUser.earnings ??
                      referredUser.totalReward ??
                      referredUser.bonus ??
                      0
                    ).toFixed(2)}
                  </p>
                  <p className="text-slate-600 dark:text-slate-300 text-sm">
                    Level {referredUser.level || 1} ·{" "}
                    {referredUser.commissionRate
                      ? `${referredUser.commissionRate}%`
                      : "Referral bonus"}
                  </p>
                  <div className="flex items-center space-x-1 mt-1">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                    <span className="text-emerald-400 text-xs">Active</span>
                  </div>
                </div>
              </motion.div>
            ))}

            {/* Summary Card */}
            <div className="mt-6 p-4 bg-gradient-to-r from-emerald-500/10 to-green-400/10 rounded-2xl border border-emerald-500/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-emerald-400 font-semibold">
                    Keep sharing your referral code!
                  </p>
                  <p className="text-slate-600 dark:text-slate-300 text-sm">
                    Earn 10% commission on every successful referral
                  </p>
                </div>
                <button
                  onClick={shareReferralLink}
                  className="px-4 py-2 bg-emerald-500 text-black rounded-lg font-semibold hover:bg-emerald-400 transition-all duration-300"
                >
                  Share More
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-warm-400/15 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-white/40" />
            </div>
            <h4 className="text-slate-600 dark:text-slate-300 text-lg mb-2">No referrals yet</h4>
            <p className="text-white/40 text-sm mb-6">
              Start sharing your referral link to earn rewards!
            </p>
            <button
              onClick={shareReferralLink}
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-400 text-white rounded-xl font-semibold hover:from-purple-600 hover:to-blue-500 transition-all duration-300 shadow-lg shadow-purple-500/20"
            >
              Share Now
            </button>
          </div>
        )}
      </motion.div>

      {/* How It Works */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl border border-warm-400/30 rounded-3xl p-8"
      >
        <h3 className="text-2xl font-bold text-white mb-6">How It Works</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <Copy className="w-8 h-8 text-white" />
            </div>
            <h4 className="text-white font-semibold text-lg mb-2">
              1. Share Your Link
            </h4>
            <p className="text-slate-600 dark:text-slate-300 text-sm">
              Copy your unique referral link and share it with friends via
              social media, email, or messaging apps.
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="w-8 h-8 text-white" />
            </div>
            <h4 className="text-white font-semibold text-lg mb-2">
              2. Friends Sign Up
            </h4>
            <p className="text-slate-600 dark:text-slate-300 text-sm">
              When someone uses your link to register, they automatically become
              your referral and you both get benefits.
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <DollarSign className="w-8 h-8 text-white" />
            </div>
            <h4 className="text-white font-semibold text-lg mb-2">
              3. Earn Rewards
            </h4>
            <p className="text-slate-600 dark:text-slate-300 text-sm">
              Get 10% commission on your referrals' staking rewards and track
              your earnings in real-time.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}


// Settings Tab — clean redesign
function SettingsTab() {
  const { user, updateProfile } = useAuth();
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(user?.name || "");
  const [isUpdating, setIsUpdating] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showPw, setShowPw] = useState(false);
  const [pw, setPw] = useState({ newPass: "", confirm: "" });
  const [pwLoading, setPwLoading] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => { if (user) setNameValue(user.name || ""); }, [user]);

  const flash = (setter: any, type: "success" | "error", text: string) => {
    setter({ type, text });
    setTimeout(() => setter(null), 4000);
  };

  const saveName = async () => {
    if (!nameValue.trim()) return flash(setMsg, "error", "Name cannot be empty");
    setIsUpdating(true);
    try {
      const res = await updateProfile({ name: nameValue.trim() });
      if (res?.success) { setEditingName(false); flash(setMsg, "success", "Name updated!"); }
      else flash(setMsg, "error", res?.message || "Failed to update");
    } catch { flash(setMsg, "error", "Failed to update"); }
    finally { setIsUpdating(false); }
  };

  const changePw = async () => {
    if (pw.newPass.length < 6) return flash(setPwMsg, "error", "Min 6 characters");
    if (pw.newPass !== pw.confirm) return flash(setPwMsg, "error", "Passwords do not match");
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(pw.newPass)) return flash(setPwMsg, "error", "Needs uppercase, lowercase & number");
    setPwLoading(true);
    try {
      const { default: apiClient } = await import("../../lib/api/client.js");
      const res = await apiClient.put("/auth/change-password", { newPassword: pw.newPass });
      if (res?.success) { setShowPw(false); setPw({ newPass: "", confirm: "" }); flash(setMsg, "success", "Password changed!"); }
      else flash(setPwMsg, "error", res?.message || "Failed");
    } catch { flash(setPwMsg, "error", "Failed to change password"); }
    finally { setPwLoading(false); }
  };

  const info = [
    { label: "Account Type", value: user?.role === "admin" ? "Administrator" : "Premium Member" },
    { label: "Member Since", value: user?.createdAt ? new Date(user.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : "—" },
    { label: "Last Login", value: user?.lastLogin ? new Date(user.lastLogin).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—" },
    { label: "Email Status", value: user?.isEmailVerified ? "✅ Verified" : "⏳ Pending" },
    { label: "Referral Code", value: user?.referralCode || "—" },
    { label: "User ID", value: user?.id ? `${user.id.slice(0, 8)}...${user.id.slice(-4)}` : "—" },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="glass-card p-4 sm:p-6">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">Account Settings</h2>
        <p className="text-slate-600 dark:text-slate-300 text-sm mt-1">Manage your profile and security</p>
        {msg && (
          <div className={`mt-3 p-3 rounded-xl text-sm font-medium ${msg.type === "success" ? "bg-green-50 border border-green-300 text-green-700" : "bg-red-50 border border-red-300 text-red-700"}`}>
            {msg.type === "success" ? "✅ " : "❌ "}{msg.text}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Profile */}
        <div className="glass-card p-4 sm:p-6 space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-warm-400/20">
            <div className="w-9 h-9 rounded-xl bg-warm-400/20 flex items-center justify-center flex-shrink-0">
              <User className="w-4 h-4 text-warm-600" />
            </div>
            <div><div className="font-bold text-slate-900 dark:text-white text-sm">Profile</div><div className="text-xs text-warm-600">Update your display name</div></div>
          </div>
          {/* Avatar row */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-xl font-bold text-white flex-shrink-0">
              {user?.name?.charAt(0)?.toUpperCase() || "U"}
            </div>
            <div className="min-w-0">
              <div className="font-bold text-slate-900 dark:text-white truncate">{user?.name || "—"}</div>
              <div className="text-xs text-warm-600 truncate">{user?.email}</div>
            </div>
          </div>
          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-warm-600 mb-1.5 uppercase tracking-wide">Display Name</label>
            {editingName ? (
              <div className="space-y-2">
                <input value={nameValue} onChange={e => setNameValue(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border-2 border-amber-500 bg-amber-50 text-slate-900 dark:text-white outline-none text-sm" />
                <div className="flex gap-2">
                  <button onClick={saveName} disabled={isUpdating} className="flex-1 py-2 bg-amber-600 text-white rounded-xl text-xs font-semibold disabled:opacity-60">{isUpdating ? "Saving..." : "Save"}</button>
                  <button onClick={() => { setEditingName(false); setNameValue(user?.name || ""); }} className="flex-1 py-2 border border-warm-400/30 text-slate-600 dark:text-slate-300 rounded-xl text-xs">Cancel</button>
                </div>
              </div>
            ) : (
              <div className="flex gap-2">
                <div className="flex-1 px-3 py-2.5 rounded-xl bg-warm-400/10 border border-warm-400/20 text-slate-900 dark:text-white text-sm truncate">{user?.name || "Not set"}</div>
                <button onClick={() => setEditingName(true)} className="px-3 py-2.5 bg-warm-400/15 hover:bg-warm-400/25 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-semibold border border-warm-400/20 flex-shrink-0">Edit</button>
              </div>
            )}
          </div>
          {/* Email readonly */}
          <div>
            <label className="block text-xs font-semibold text-warm-600 mb-1.5 uppercase tracking-wide">Email Address</label>
            <div className="flex gap-2 items-center">
              <div className="flex-1 px-3 py-2.5 rounded-xl bg-warm-400/10 border border-warm-400/20 text-slate-900 dark:text-white text-sm truncate">{user?.email || "—"}</div>
              <span className="px-2 py-1 text-xs text-warm-600 bg-warm-400/10 rounded-lg border border-warm-400/20 flex-shrink-0">🔒 Fixed</span>
            </div>
            <p className="text-xs text-warm-500 mt-1">Contact support to change email.</p>
          </div>
        </div>

        {/* Account Info */}
        <div className="glass-card p-4 sm:p-6 space-y-3">
          <div className="flex items-center gap-3 pb-3 border-b border-warm-400/20">
            <div className="w-9 h-9 rounded-xl bg-warm-400/20 flex items-center justify-center flex-shrink-0">
              <Shield className="w-4 h-4 text-warm-600" />
            </div>
            <div><div className="font-bold text-slate-900 dark:text-white text-sm">Account Information</div><div className="text-xs text-warm-600">Your account details</div></div>
          </div>
          <div className="space-y-2">
            {info.map(item => (
              <div key={item.label} className="flex justify-between items-center py-2 border-b border-warm-400/10 last:border-0 gap-2">
                <span className="text-xs text-warm-600 font-medium flex-shrink-0">{item.label}</span>
                <span className="text-xs text-slate-900 dark:text-white font-semibold text-right truncate">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Security */}
        <div className="glass-card p-4 sm:p-6 space-y-3">
          <div className="flex items-center gap-3 pb-3 border-b border-warm-400/20">
            <div className="w-9 h-9 rounded-xl bg-warm-400/20 flex items-center justify-center flex-shrink-0">
              <Lock className="w-4 h-4 text-warm-600" />
            </div>
            <div><div className="font-bold text-slate-900 dark:text-white text-sm">Security</div><div className="text-xs text-warm-600">Change your password</div></div>
          </div>
          {!showPw ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-warm-400/10">
                <div><div className="text-sm font-semibold text-slate-900 dark:text-white">Password</div><div className="text-xs text-warm-600">••••••••••</div></div>
                <button onClick={() => setShowPw(true)} className="px-3 py-1.5 bg-amber-600 text-white rounded-xl text-xs font-semibold hover:bg-amber-700 flex-shrink-0">Change</button>
              </div>
              <div className="p-3 rounded-xl bg-green-50 border border-green-200 text-xs text-green-700">🔐 Auth secured via Supabase JWT.</div>
            </div>
          ) : (
            <div className="space-y-3">
              {pwMsg && <div className={`p-3 rounded-xl text-xs font-medium ${pwMsg.type === "success" ? "bg-green-50 border border-green-300 text-green-700" : "bg-red-50 border border-red-300 text-red-700"}`}>{pwMsg.text}</div>}
              <div>
                <label className="block text-xs font-semibold text-warm-600 mb-1">New Password</label>
                <input type="password" value={pw.newPass} onChange={e => setPw(p => ({ ...p, newPass: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl border border-warm-400/30 bg-cream-50 text-slate-900 dark:text-white outline-none text-sm focus:ring-2 focus:ring-amber-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-warm-600 mb-1">Confirm Password</label>
                <input type="password" value={pw.confirm} onChange={e => setPw(p => ({ ...p, confirm: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl border border-warm-400/30 bg-cream-50 text-slate-900 dark:text-white outline-none text-sm focus:ring-2 focus:ring-amber-500" />
              </div>
              <div className="flex gap-2">
                <button onClick={changePw} disabled={pwLoading} className="flex-1 py-2.5 bg-amber-600 text-white rounded-xl text-sm font-semibold disabled:opacity-60">{pwLoading ? "Updating..." : "Update Password"}</button>
                <button onClick={() => { setShowPw(false); setPw({ newPass: "", confirm: "" }); setPwMsg(null); }} className="flex-1 py-2.5 border border-warm-400/30 text-slate-600 dark:text-slate-300 rounded-xl text-sm">Cancel</button>
              </div>
            </div>
          )}
        </div>

        {/* Danger Zone */}
        <div className="glass-card p-4 sm:p-6 border border-red-200 bg-red-50/30 space-y-3">
          <div className="flex items-center gap-3 pb-3 border-b border-red-200/50">
            <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-4 h-4 text-red-500" />
            </div>
            <div><div className="font-bold text-slate-900 dark:text-white text-sm">Danger Zone</div><div className="text-xs text-warm-600">Irreversible actions</div></div>
          </div>
          <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-red-200 gap-3">
            <div className="min-w-0"><div className="text-sm font-semibold text-slate-900 dark:text-white">Delete Account</div><div className="text-xs text-warm-600 truncate">Permanently delete all data</div></div>
            <button className="px-3 py-1.5 bg-red-500 text-white rounded-xl text-xs font-semibold opacity-60 cursor-not-allowed flex-shrink-0">Contact Support</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Professional Deposit Popup Component
function DepositPopup({
  onClose,
  onDeposit,
}: {
  onClose: () => void;
  onDeposit: (amount: number) => void;
}) {
  const [amount, setAmount] = useState("");
  const [selectedToken, setSelectedToken] = useState("USDT");
  const [depositMethod, setDepositMethod] = useState("wallet");
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) return;

    setIsProcessing(true);
    // Simulate processing
    await new Promise((resolve) => setTimeout(resolve, 2000));
    onDeposit(parseFloat(amount));
    setIsProcessing(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 overflow-y-auto"
      onClick={onClose}
    >
      <div className="min-h-screen flex items-start justify-center p-4 py-8">
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="w-full max-w-md p-6 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-600"
          onClick={(e) => e.stopPropagation()}
        >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Deposit Funds</h2>
          <button
            onClick={onClose}
            className="p-2 text-slate-600 dark:text-slate-300 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Token Selection */}
          <div>
            <label className="block text-sm font-medium text-white mb-3">
              Token
            </label>
            <div className="grid grid-cols-2 gap-3">
              {["USDT", "USDC"].map((token) => (
                <button
                  key={token}
                  type="button"
                  onClick={() => setSelectedToken(token)}
                  className={`p-3 rounded-xl border-2 transition-all duration-300 ${
                    selectedToken === token
                      ? "border-emerald-500 bg-emerald-500/10"
                      : "border-warm-400/30 bg-slate-800/80 dark:bg-slate-700/60 hover:border-emerald-500/50"
                  }`}
                >
                  <div className="text-center">
                    <div className="text-2xl mb-1">
                      {token === "USDT" ? "💎" : "🪙"}
                    </div>
                    <div className="text-slate-900 dark:text-white font-medium">{token}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Amount Input */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Amount
            </label>
            <div className="relative">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="input-crypto w-full pr-12"
                step="0.01"
                min="0"
              />
              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-600 dark:text-slate-300">
                {selectedToken}
              </span>
            </div>
          </div>

          {/* Deposit Method */}
          <div>
            <label className="block text-sm font-medium text-white mb-3">
              Method
            </label>
            <div className="space-y-2">
              {[
                { id: "wallet", label: "Crypto Wallet", icon: Wallet },
                { id: "bank", label: "Bank Transfer", icon: DollarSign },
                { id: "card", label: "Credit Card", icon: Shield },
              ].map((method) => (
                <button
                  key={method.id}
                  type="button"
                  onClick={() => setDepositMethod(method.id)}
                  className={`w-full flex items-center space-x-3 p-3 rounded-xl border-2 transition-all duration-300 ${
                    depositMethod === method.id
                      ? "border-emerald-500 bg-emerald-500/10"
                      : "border-warm-400/30 bg-slate-800/80 dark:bg-slate-700/60 hover:border-emerald-500/50"
                  }`}
                >
                  <method.icon className="w-5 h-5 text-emerald-400" />
                  <span className="text-slate-900 dark:text-white font-medium">{method.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Monthly Returns */}
          <div className="bg-slate-800/80 dark:bg-slate-700/60 rounded-xl p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-slate-900 dark:text-white font-medium">Monthly Returns</p>
                <p className="text-slate-600 dark:text-slate-300 text-sm">Variable staking rates</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-emerald-400">6-10%</p>
                <p className="text-slate-600 dark:text-slate-300 text-sm">Per month</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-6 bg-warm-400/15 text-white rounded-xl font-semibold hover:bg-warm-400/25 transition-all duration-300"
            >
              Cancel
            </button>
            <motion.button
              type="submit"
              disabled={!amount || parseFloat(amount) <= 0 || isProcessing}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`flex-1 py-3 px-6 rounded-xl font-semibold transition-all duration-300 ${
                !amount || parseFloat(amount) <= 0 || isProcessing
                  ? "bg-warm-400/15 text-white/50 cursor-not-allowed"
                  : "btn-crypto"
              }`}
            >
              {isProcessing ? (
                <div className="flex items-center justify-center space-x-2">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Processing...</span>
                </div>
              ) : (
                `Deposit ${amount || "0"} ${selectedToken}`
              )}
            </motion.button>
          </div>
        </form>
      </motion.div>
        </div>
</motion.div>
  );
}

// Professional Withdraw Popup Component
function WithdrawPopup({
  onClose,
  onWithdraw,
  balance,
}: {
  onClose: () => void;
  onWithdraw: (amount: number, toAddress?: string) => void;
  balance: number;
}) {
  const [amount, setAmount] = useState("");
  const [selectedToken, setSelectedToken] = useState("USDT");
  const [withdrawMethod, setWithdrawMethod] = useState("instant");
  const [destinationWallet, setDestinationWallet] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const withdrawMethods = [
    {
      id: "instant",
      label: "Instant",
      fee: "0.1%",
      time: "1-5 min",
      icon: Zap,
    },
    {
      id: "standard",
      label: "Standard",
      fee: "0.05%",
      time: "1-24 hours",
      icon: Clock,
    },
    {
      id: "priority",
      label: "Priority",
      fee: "0.2%",
      time: "1-2 hours",
      icon: ArrowUpRight,
    },
  ];

  const selectedMethod = withdrawMethods.find((m) => m.id === withdrawMethod);
  const amountNum = parseFloat(amount) || 0;
  const fee = amountNum * (parseFloat(selectedMethod?.fee || "0") / 100);
  const finalAmount = amountNum - fee;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || amountNum <= 0 || amountNum > balance || !destinationWallet)
      return;

    setIsProcessing(true);
    // Simulate processing
    await new Promise((resolve) => setTimeout(resolve, 2000));
    onWithdraw(amountNum, "default-address");
    setIsProcessing(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="glass-card-strong w-full max-w-md p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Withdraw Funds</h2>
          <button
            onClick={onClose}
            className="p-2 text-slate-600 dark:text-slate-300 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Available Balance */}
          <div className="bg-slate-800/80 dark:bg-slate-700/60 rounded-xl p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-slate-900 dark:text-white font-medium">Available Balance</p>
                <p className="text-slate-600 dark:text-slate-300 text-sm">Ready to withdraw</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-emerald-400">
                  {balance.toLocaleString()} USDT
                </p>
              </div>
            </div>
          </div>

          {/* Amount Input */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Amount
            </label>
            <div className="relative">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="input-crypto w-full pr-12"
                step="0.01"
                min="0"
                max={balance}
              />
              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-600 dark:text-slate-300">
                USDT
              </span>
            </div>
            <div className="flex justify-between text-sm text-slate-600 dark:text-slate-300 mt-1">
              <span>Max: {balance.toLocaleString()} USDT</span>
              <button
                type="button"
                onClick={() => setAmount(balance.toString())}
                className="text-emerald-400 hover:text-emerald-300"
              >
                Use Max
              </button>
            </div>
          </div>

          {/* Destination Wallet */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Destination Wallet
            </label>
            <input
              type="text"
              value={destinationWallet}
              onChange={(e) => setDestinationWallet(e.target.value)}
              placeholder="0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6"
              className="input-crypto w-full"
            />
            <p className="text-slate-600 dark:text-slate-300 text-sm mt-1">
              Make sure this is the correct address. Transactions cannot be
              reversed.
            </p>
          </div>

          {/* Withdraw Method */}
          <div>
            <label className="block text-sm font-medium text-white mb-3">
              Withdraw Method
            </label>
            <div className="space-y-2">
              {withdrawMethods.map((method) => (
                <button
                  key={method.id}
                  type="button"
                  onClick={() => setWithdrawMethod(method.id)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl border-2 transition-all duration-300 ${
                    withdrawMethod === method.id
                      ? "border-emerald-500 bg-emerald-500/10"
                      : "border-warm-400/30 bg-slate-800/80 dark:bg-slate-700/60 hover:border-emerald-500/50"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <method.icon className="w-5 h-5 text-emerald-400" />
                    <div className="text-left">
                      <div className="text-slate-900 dark:text-white font-medium">
                        {method.label}
                      </div>
                      <div className="text-slate-600 dark:text-slate-300 text-sm">{method.time}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-emerald-400 font-medium">
                      {method.fee} fee
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Fee Breakdown */}
          {amount && (
            <div className="bg-slate-800/80 dark:bg-slate-700/60 rounded-xl p-4">
              <h4 className="text-white font-medium mb-3">Fee Breakdown</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-300">Withdrawal Amount:</span>
                  <span className="text-white">
                    {amountNum.toLocaleString()} USDT
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-300">
                    Network Fee ({selectedMethod?.fee}):
                  </span>
                  <span className="text-red-400">-{fee.toFixed(4)} USDT</span>
                </div>
                <div className="border-t border-warm-400/30 pt-2">
                  <div className="flex justify-between font-semibold">
                    <span className="text-white">You&apos;ll Receive:</span>
                    <span className="text-emerald-400">
                      {finalAmount.toFixed(4)} USDT
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-6 bg-warm-400/15 text-white rounded-xl font-semibold hover:bg-warm-400/25 transition-all duration-300"
            >
              Cancel
            </button>
            <motion.button
              type="submit"
              disabled={
                !amount ||
                amountNum <= 0 ||
                amountNum > balance ||
                !destinationWallet ||
                isProcessing
              }
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`flex-1 py-3 px-6 rounded-xl font-semibold transition-all duration-300 ${
                !amount ||
                amountNum <= 0 ||
                amountNum > balance ||
                !destinationWallet ||
                isProcessing
                  ? "bg-warm-400/15 text-white/50 cursor-not-allowed"
                  : "btn-crypto"
              }`}
            >
              {isProcessing ? (
                <div className="flex items-center justify-center space-x-2">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Processing...</span>
                </div>
              ) : (
                `Withdraw ${amount || "0"} USDT`
              )}
            </motion.button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

// Professional Transaction Popup Component
function TransactionPopup({
  transaction,
  onClose,
}: {
  transaction: {
    id: number;
    type: string;
    amount: number;
    status: string;
    txHash: string;
    date: string;
    token: string;
    fee?: number;
  };
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const copyTxHash = () => {
    navigator.clipboard.writeText(transaction.txHash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-6 h-6 text-emerald-400" />;
      case "pending":
        return <Clock className="w-6 h-6 text-yellow-400" />;
      case "failed":
        return <XCircle className="w-6 h-6 text-red-400" />;
      default:
        return <AlertCircle className="w-6 h-6 text-slate-600 dark:text-slate-300" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "text-emerald-400";
      case "pending":
        return "text-yellow-400";
      case "failed":
        return "text-red-400";
      default:
        return "text-slate-600 dark:text-slate-300";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="glass-card-strong w-full max-w-md p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Transaction Details</h2>
          <button
            onClick={onClose}
            className="p-2 text-slate-600 dark:text-slate-300 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Transaction Type & Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  transaction.type === "deposit"
                    ? "bg-emerald-500/20"
                    : transaction.type === "withdraw"
                    ? "bg-red-500/20"
                    : "bg-blue-500/20"
                }`}
              >
                {transaction.type === "deposit" ? (
                  <ArrowUpRight className="w-6 h-6 text-emerald-400" />
                ) : transaction.type === "withdraw" ? (
                  <ArrowDownLeft className="w-6 h-6 text-red-400" />
                ) : (
                  <TrendingUp className="w-6 h-6 text-blue-400" />
                )}
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white capitalize">
                  {transaction.type}
                </h3>
                <p className="text-slate-600 dark:text-slate-300">{transaction.date}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {getStatusIcon(transaction.status)}
              <span
                className={`font-medium ${getStatusColor(transaction.status)}`}
              >
                {transaction.status}
              </span>
            </div>
          </div>

          {/* Amount */}
          <div className="bg-slate-800/80 dark:bg-slate-700/60 rounded-xl p-4">
            <div className="text-center">
              <p className="text-slate-600 dark:text-slate-300 text-sm mb-2">Amount</p>
              <p
                className={`text-3xl font-bold ${
                  transaction.type === "deposit"
                    ? "text-emerald-400"
                    : transaction.type === "withdraw"
                    ? "text-red-400"
                    : "text-blue-400"
                }`}
              >
                {transaction.type === "withdraw" ? "-" : "+"}
                {transaction.amount.toLocaleString()} USDT
              </p>
              {transaction.fee && transaction.fee > 0 && (
                <p className="text-slate-600 dark:text-slate-300 text-sm mt-2">
                  Fee: {transaction.fee} USDT
                </p>
              )}
            </div>
          </div>

          {/* Transaction Hash */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Transaction Hash
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={transaction.txHash}
                readOnly
                className="input-crypto flex-1 font-mono text-sm"
              />
              <button
                onClick={copyTxHash}
                className="p-2 text-slate-600 dark:text-slate-300 hover:text-white transition-colors"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
            <p className="text-slate-600 dark:text-slate-300 text-sm mt-1">
              Click to copy transaction hash
            </p>
          </div>

          {/* Additional Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-800/80 dark:bg-slate-700/60 rounded-xl p-4">
              <p className="text-slate-600 dark:text-slate-300 text-sm mb-1">Type</p>
              <p className="text-white font-medium capitalize">
                {transaction.type}
              </p>
            </div>
            <div className="bg-slate-800/80 dark:bg-slate-700/60 rounded-xl p-4">
              <p className="text-slate-600 dark:text-slate-300 text-sm mb-1">Date</p>
              <p className="text-slate-900 dark:text-white font-medium">{transaction.date}</p>
            </div>
          </div>

          {/* Action Button */}
          <button
            onClick={onClose}
            className="w-full py-3 px-6 bg-emerald-500 text-black rounded-xl font-semibold hover:bg-emerald-400 transition-all duration-300"
          >
            Close
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}



// ─────────────────────────────────────────────────────────────
// 1. STAKING CALCULATOR TAB
// ─────────────────────────────────────────────────────────────
function StakingCalculatorTab({ walletData }: { walletData: any }) {
  const [amount, setAmount] = useState("1000");
  const [duration, setDuration] = useState("30");
  const [compoundEnabled, setCompoundEnabled] = useState(false);

  const RATES: Record<string, number> = {
    "30": 0.05, "60": 0.08, "90": 0.12, "180": 0.15,
  };
  const rate = RATES[duration] ?? 0.05;
  const num = parseFloat(amount) || 0;
  const months = parseInt(duration) / 30;
  const simpleEarning = num * rate * months;
  const compoundEarning = num * (Math.pow(1 + rate, months) - 1);
  const earning = compoundEnabled ? compoundEarning : simpleEarning;
  const total = num + earning;

  const tiers = [
    { label: "Bronze", min: 100, max: 999, rate: "5%", color: "from-amber-600 to-amber-500", icon: "🥉" },
    { label: "Silver", min: 1000, max: 4999, rate: "8%", color: "from-slate-400 to-slate-300", icon: "🥈" },
    { label: "Gold", min: 5000, max: 24999, rate: "12%", color: "from-yellow-500 to-yellow-400", icon: "🥇" },
    { label: "Platinum", min: 25000, max: Infinity, rate: "15%", color: "from-purple-500 to-purple-400", icon: "💎" },
  ];
  const currentTier = tiers.find(t => num >= t.min && num <= t.max) ?? tiers[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-card p-6">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">Staking Calculator</h2>
        <p className="text-slate-600 dark:text-slate-300">Simulate your potential returns before you stake</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Input Panel */}
        <div className="glass-card p-6 space-y-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="w-8 h-8 bg-warm-400/20 rounded-lg flex items-center justify-center text-warm-600">⚙</span>
            Configure Your Stake
          </h3>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Stake Amount (USDT)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-600 font-semibold">$</span>
              <input
                type="number"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="w-full pl-8 pr-4 py-3 rounded-xl border border-warm-400/30 bg-cream-100 text-slate-900 dark:text-white focus:ring-2 focus:ring-warm-400 focus:border-transparent outline-none text-lg font-semibold"
                placeholder="1000"
              />
            </div>
            <div className="flex gap-2 mt-2">
              {[100, 500, 1000, 5000, 25000].map(v => (
                <button key={v} onClick={() => setAmount(String(v))}
                  className="px-2 py-1 text-xs rounded-lg bg-warm-400/15 text-slate-600 dark:text-slate-300 hover:bg-warm-400/30 transition-all font-medium">
                  ${v >= 1000 ? `${v/1000}K` : v}
                </button>
              ))}
            </div>
          </div>

          {/* Duration */}
          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Lock Duration</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { days: "30", label: "1 Month", rate: "5% APM" },
                { days: "60", label: "2 Months", rate: "8% APM" },
                { days: "90", label: "3 Months", rate: "12% APM" },
                { days: "180", label: "6 Months", rate: "15% APM" },
              ].map(opt => (
                <button key={opt.days} onClick={() => setDuration(opt.days)}
                  className={`p-3 rounded-xl border-2 text-center transition-all duration-200 ${
                    duration === opt.days
                      ? "border-amber-600 bg-amber-600 text-white shadow-md shadow-amber-600/30 scale-[1.03]"
                      : "border-warm-400/30 bg-white text-slate-600 dark:text-slate-300 hover:border-amber-500/60 hover:bg-amber-50"
                  }`}>
                  <div className="font-bold text-sm">{opt.label}</div>
                  <div className="text-xs text-warm-600">{opt.rate}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Compound Toggle */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-warm-400/10 border border-warm-400/20">
            <div>
              <div className="font-semibold text-slate-900 dark:text-white text-sm">Auto-Compound Rewards</div>
              <div className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">Reinvest earnings for exponential growth</div>
            </div>
            <button onClick={() => setCompoundEnabled(!compoundEnabled)}
              className={`relative w-12 h-6 rounded-full transition-all duration-300 ring-2 ${
                compoundEnabled
                  ? "bg-amber-600 ring-amber-600"
                  : "bg-stone-300 ring-stone-300"
              }`}>
              <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-all duration-300 ${compoundEnabled ? "left-6" : "left-0.5"}`} />
            </button>
          </div>
        </div>

        {/* Results Panel */}
        <div className="space-y-4">
          {/* Tier Badge */}
          <div className={`glass-card p-5 bg-gradient-to-r ${currentTier.color} text-white`}>
            <div className="flex items-center gap-3">
              <span className="text-3xl">{currentTier.icon}</span>
              <div>
                <div className="text-sm font-medium opacity-90">Your Tier</div>
                <div className="text-2xl font-bold">{currentTier.label} Member</div>
                <div className="text-sm opacity-90">{currentTier.rate} monthly rate • ${currentTier.min.toLocaleString()}–{currentTier.max === Infinity ? "∞" : `$${currentTier.max.toLocaleString()}`}</div>
              </div>
            </div>
          </div>

          {/* Result Cards */}
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "Monthly Rate", value: `${(rate * 100).toFixed(0)}% APM`, sub: "Per month return" },
              { label: "Total Earnings", value: `$${earning.toFixed(2)}`, sub: `Over ${months} month${months > 1 ? "s" : ""}` },
              { label: "Total Return", value: `$${total.toFixed(2)}`, sub: "Principal + rewards" },
              { label: "ROI", value: `${num > 0 ? ((earning / num) * 100).toFixed(1) : "0"}%`, sub: "Return on investment" },
            ].map(item => (
              <div key={item.label} className="glass-card p-4 text-center">
                <div className="text-xs text-warm-600 mb-1">{item.label}</div>
                <div className="text-xl font-bold text-slate-900 dark:text-white">{item.value}</div>
                <div className="text-xs text-slate-600 dark:text-slate-300">{item.sub}</div>
              </div>
            ))}
          </div>

          {/* Projection Bar */}
          <div className="glass-card p-5">
            <div className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Earnings Breakdown</div>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs text-slate-600 dark:text-slate-300 mb-1">
                  <span>Principal</span><span>${num.toLocaleString()}</span>
                </div>
                <div className="h-2 bg-warm-400/20 rounded-full overflow-hidden">
                  <div className="h-full bg-warm-400 rounded-full" style={{ width: `${total > 0 ? (num / total) * 100 : 100}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs text-slate-600 dark:text-slate-300 mb-1">
                  <span>Earnings</span><span>${earning.toFixed(2)}</span>
                </div>
                <div className="h-2 bg-green-500/20 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 rounded-full" style={{ width: `${total > 0 ? (earning / total) * 100 : 0}%` }} />
                </div>
              </div>
            </div>
          </div>

          <div className="glass-card p-4 border border-amber-400/30 bg-amber-50/50">
            <div className="flex gap-2 items-start">
              <span className="text-amber-500 text-lg mt-0.5">⚠</span>
              <p className="text-xs text-slate-600 dark:text-slate-300">This is a projection based on current rates. Actual returns may vary. Rates are locked at time of staking.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Projection Table */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Month-by-Month Projection</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left">
                <th className="pb-3 text-warm-600 font-semibold">Month</th>
                <th className="pb-3 text-warm-600 font-semibold">Balance</th>
                <th className="pb-3 text-warm-600 font-semibold">Earnings</th>
                <th className="pb-3 text-warm-600 font-semibold">Total Return</th>
                <th className="pb-3 text-warm-600 font-semibold">ROI %</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: Math.min(months, 6) }, (_, i) => {
                const m = i + 1;
                const bal = compoundEnabled ? num * Math.pow(1 + rate, m) : num + num * rate * m;
                const earn = bal - num;
                return (
                  <tr key={m} className="border-t border-warm-400/10">
                    <td className="py-3 text-slate-900 dark:text-white font-medium">Month {m}</td>
                    <td className="py-3 text-slate-900 dark:text-white">${bal.toFixed(2)}</td>
                    <td className="py-3 text-green-600 font-medium">+${earn.toFixed(2)}</td>
                    <td className="py-3 text-slate-900 dark:text-white">${(num + earn).toFixed(2)}</td>
                    <td className="py-3 text-warm-600">{num > 0 ? ((earn / num) * 100).toFixed(2) : "0"}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 2. STAKING PLANS / TIERS TAB
// ─────────────────────────────────────────────────────────────
function StakingPlansTab() {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const plans = [
    {
      id: "bronze",
      name: "Bronze",
      icon: "🥉",
      min: 100, max: 999,
      rate: "5%",
      duration: "30 days",
      color: "from-amber-700 to-amber-500",
      bg: "bg-amber-50",
      border: "border-amber-300",
      badge: "bg-amber-100 text-amber-800",
      features: [
        "5% monthly return",
        "30-day lock period",
        "Manual withdrawal",
        "Basic dashboard access",
        "Email notifications",
      ],
      badge_label: "Starter",
    },
    {
      id: "silver",
      name: "Silver",
      icon: "🥈",
      min: 1000, max: 4999,
      rate: "8%",
      duration: "30 days",
      color: "from-slate-500 to-slate-400",
      bg: "bg-slate-50",
      border: "border-slate-300",
      badge: "bg-slate-100 text-slate-700",
      features: [
        "8% monthly return",
        "30-day lock period",
        "Priority withdrawals",
        "Advanced analytics",
        "SMS + email alerts",
        "Referral bonuses",
      ],
      badge_label: "Popular",
    },
    {
      id: "gold",
      name: "Gold",
      icon: "🥇",
      min: 5000, max: 24999,
      rate: "12%",
      duration: "30 days",
      color: "from-yellow-600 to-yellow-400",
      bg: "bg-yellow-50",
      border: "border-yellow-400",
      badge: "bg-yellow-100 text-yellow-800",
      features: [
        "12% monthly return",
        "30-day lock period",
        "Instant withdrawals",
        "Full portfolio analytics",
        "Dedicated support",
        "Enhanced referral rates",
        "Early access to features",
      ],
      badge_label: "Recommended",
    },
    {
      id: "platinum",
      name: "Platinum",
      icon: "💎",
      min: 25000, max: Infinity,
      rate: "15%",
      duration: "30 days",
      color: "from-purple-600 to-purple-400",
      bg: "bg-purple-50",
      border: "border-purple-400",
      badge: "bg-purple-100 text-purple-800",
      features: [
        "15% monthly return",
        "30-day lock period",
        "Instant withdrawals",
        "VIP dashboard & analytics",
        "24/7 private support",
        "Maximum referral commissions",
        "Exclusive investment insights",
        "Custom lock duration options",
        "Auto-compound enabled",
      ],
      badge_label: "VIP Elite",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="glass-card p-6">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">Staking Plans & Tiers</h2>
        <p className="text-slate-600 dark:text-slate-300">Higher stakes unlock better rates and exclusive benefits</p>
      </div>

      {/* Tier Comparison Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {plans.map(plan => (
          <div key={plan.id}
            onClick={() => setSelectedPlan(plan.id === selectedPlan ? null : plan.id)}
            className={`glass-card p-6 cursor-pointer transition-all duration-200 hover:-translate-y-1 ${
              selectedPlan === plan.id ? `border-2 ${plan.border} shadow-lg` : "border border-warm-400/20"
            }`}>
            {/* Badge */}
            <div className={`inline-block px-2.5 py-0.5 text-xs font-semibold rounded-full mb-4 ${plan.badge}`}>
              {plan.badge_label}
            </div>

            {/* Icon + Name */}
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${plan.color} flex items-center justify-center text-2xl shadow`}>
                {plan.icon}
              </div>
              <div>
                <div className="text-xl font-bold text-slate-900 dark:text-white">{plan.name}</div>
                <div className="text-xs text-warm-600">${plan.min.toLocaleString()}–{plan.max === Infinity ? "∞" : `$${plan.max.toLocaleString()}`}</div>
              </div>
            </div>

            {/* Rate */}
            <div className={`p-3 rounded-xl bg-gradient-to-r ${plan.color} text-white text-center mb-4`}>
              <div className="text-3xl font-black">{plan.rate}</div>
              <div className="text-xs opacity-80">Per Month (APM)</div>
            </div>

            {/* Duration */}
            <div className="text-center text-sm text-slate-600 dark:text-slate-300 mb-4">
              🔒 {plan.duration} lock period
            </div>

            {/* Features */}
            <ul className="space-y-2">
              {plan.features.map(f => (
                <li key={f} className="flex items-center gap-2 text-sm text-slate-900 dark:text-white">
                  <span className="w-4 h-4 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs flex-shrink-0">✓</span>
                  {f}
                </li>
              ))}
            </ul>

            {/* CTA placeholder */}
            <div className={`mt-5 w-full py-2.5 rounded-xl text-center text-sm font-semibold bg-gradient-to-r ${plan.color} text-white opacity-70 cursor-not-allowed`}>
              Coming Soon
            </div>
          </div>
        ))}
      </div>

      {/* Rate Comparison Table */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Rate Comparison</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="text-left pb-3 text-warm-600">Feature</th>
                {plans.map(p => (
                  <th key={p.id} className="text-center pb-3 text-warm-600">
                    {p.icon} {p.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ["Min. Stake", "$100", "$1,000", "$5,000", "$25,000"],
                ["Monthly Rate", "5%", "8%", "12%", "15%"],
                ["Lock Period", "30 days", "30 days", "30 days", "30 days"],
                ["Withdrawal Speed", "Manual", "Priority", "Instant", "Instant"],
                ["Analytics", "Basic", "Advanced", "Full", "VIP"],
                ["Support", "Email", "Email+SMS", "Dedicated", "24/7 VIP"],
                ["Auto-Compound", "✗", "✗", "✓", "✓"],
                ["Referral Bonus", "Standard", "Enhanced", "Enhanced+", "Maximum"],
              ].map(([feat, ...vals]) => (
                <tr key={feat} className="border-t border-warm-400/10">
                  <td className="py-3 font-medium text-slate-900 dark:text-white">{feat}</td>
                  {vals.map((v, i) => (
                    <td key={i} className="py-3 text-center text-slate-600 dark:text-slate-300">{v}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 3. AUTO-COMPOUND TAB
// ─────────────────────────────────────────────────────────────
function AutoCompoundTab({ walletData }: { walletData: any }) {
  const [globalEnabled, setGlobalEnabled] = useState(false);
  const [threshold, setThreshold] = useState("50");
  const [frequency, setFrequency] = useState("monthly");
  const [reinvestPercent, setReinvestPercent] = useState(100);

  const projections = [
    { months: 1, simple: +(num * rate).toFixed(2), compound: +(num * (Math.pow(1 + rate, 1) - 1)).toFixed(2) },
    { months: 3, simple: +(num * rate * 3).toFixed(2), compound: +(num * (Math.pow(1 + rate, 3) - 1)).toFixed(2) },
    { months: 6, simple: +(num * rate * 6).toFixed(2), compound: +(num * (Math.pow(1 + rate, 6) - 1)).toFixed(2) },
    { months: 12, simple: +(num * rate * 12).toFixed(2), compound: +(num * (Math.pow(1 + rate, 12) - 1)).toFixed(2) },
    { months: 24, simple: +(num * rate * 24).toFixed(2), compound: +(num * (Math.pow(1 + rate, 24) - 1)).toFixed(2) },
  ];

  return (
    <div className="space-y-6">
      <div className="glass-card p-6">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">Auto-Compound Settings</h2>
        <p className="text-slate-600 dark:text-slate-300">Automatically reinvest your rewards to maximize exponential growth</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Main Toggle Card */}
        <div className="lg:col-span-2 space-y-4 min-w-0">
          {/* Global Toggle */}
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-warm-400/20 flex items-center justify-center">
                  <RefreshCw className="w-5 h-5 text-warm-600" />
                </div>
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">Auto-Compound</div>
                  <div className="text-sm text-slate-600 dark:text-slate-300">Reinvest rewards automatically</div>
                </div>
              </div>
              <button onClick={() => setGlobalEnabled(!globalEnabled)}
                className={`relative w-14 h-7 rounded-full transition-all duration-300 ring-2 ${
                  globalEnabled
                    ? "bg-amber-600 ring-amber-600"
                    : "bg-stone-300 ring-stone-300"
                }`}>
                <span className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-all duration-300 ${globalEnabled ? "left-7" : "left-0.5"}`} />
              </button>
            </div>
            <div className={`p-3 rounded-xl text-sm ${globalEnabled ? "bg-green-50 border border-green-200 text-green-700" : "bg-warm-400/10 border border-warm-400/20 text-slate-600 dark:text-slate-300"}`}>
              {globalEnabled ? "✓ Auto-compound is ACTIVE. Your rewards will be reinvested automatically." : "○ Auto-compound is OFF. Enable to start growing faster."}
            </div>
          </div>

          {/* Settings Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Reinvest % */}
            <div className="glass-card p-5">
              <div className="font-semibold text-slate-900 dark:text-white mb-3">Reinvestment Rate</div>
              <div className="text-3xl font-black text-warm-600 mb-2">{reinvestPercent}%</div>
              <input type="range" min="10" max="100" step="10" value={reinvestPercent}
                onChange={e => setReinvestPercent(Number(e.target.value))}
                className="w-full accent-amber-600" />
              <div className="flex justify-between text-xs text-warm-600 mt-1">
                <span>10%</span><span>50%</span><span>100%</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-2">{100 - reinvestPercent}% will be sent to your available balance.</p>
            </div>

            {/* Frequency */}
            <div className="glass-card p-5">
              <div className="font-semibold text-slate-900 dark:text-white mb-3">Compound Frequency</div>
              <div className="space-y-2">
                {["daily", "weekly", "monthly"].map(f => (
                  <button key={f} onClick={() => setFrequency(f)}
                    className={`w-full py-2.5 px-4 rounded-xl text-sm font-medium text-left transition-all ${
                      frequency === f ? "bg-warm-400/25 border border-warm-500 text-slate-900 dark:text-white" : "bg-warm-400/10 border border-warm-400/10 text-slate-600 dark:text-slate-300 hover:bg-warm-400/20"
                    }`}>
                    <span className="capitalize">{f}</span>
                    {f === "monthly" && <span className="ml-2 text-xs text-warm-600">(default)</span>}
                    {f === "daily" && <span className="ml-2 text-xs text-amber-600">⚡ Max growth</span>}
                  </button>
                ))}
              </div>
            </div>

            {/* Minimum Threshold */}
            <div className="glass-card p-5">
              <div className="font-semibold text-slate-900 dark:text-white mb-1">Minimum Threshold</div>
              <p className="text-xs text-slate-600 dark:text-slate-300 mb-3">Only compound when rewards exceed this amount</p>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-600 font-semibold">$</span>
                <input type="number" value={threshold} onChange={e => setThreshold(e.target.value)}
                  className="w-full pl-8 pr-4 py-3 rounded-xl border border-warm-400/30 bg-cream-100 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-warm-400" />
              </div>
            </div>

            {/* Next Compound */}
            <div className="glass-card p-5">
              <div className="font-semibold text-slate-900 dark:text-white mb-3">Next Compound Event</div>
              <div className="text-2xl font-bold text-warm-600">—</div>
              <div className="text-sm text-slate-600 dark:text-slate-300 mt-1">No active stakes</div>
              <div className="mt-3 p-2 rounded-lg bg-warm-400/10 text-xs text-slate-600 dark:text-slate-300">
                Stake funds to activate compounding schedule
              </div>
            </div>
          </div>
        </div>

        {/* Compound vs Simple Projection */}
        <div className="glass-card p-6">
          <h3 className="font-semibold text-slate-900 dark:text-white mb-4">📈 Compound vs Simple</h3>
          <p className="text-xs text-slate-600 dark:text-slate-300 mb-4">Based on $1,000 principal at 5%/month</p>
          <div className="space-y-3">
            {projections.map(p => (
              <div key={p.months} className="p-3 rounded-xl bg-warm-400/10">
                <div className="text-xs font-semibold text-warm-600 mb-2">{p.months} Month{p.months > 1 ? "s" : ""}</div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-900 dark:text-white">Simple</span>
                  <span className="font-medium text-slate-900 dark:text-white">+${p.simple.toFixed(1)}</span>
                </div>
                <div className="h-1.5 bg-warm-400/20 rounded-full mb-2">
                  <div className="h-full bg-warm-400 rounded-full" style={{ width: `${Math.min(p.simple / 2.2, 100)}%` }} />
                </div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-green-700 font-medium">Compound ⚡</span>
                  <span className="font-bold text-green-700">+${p.compound.toFixed(1)}</span>
                </div>
                <div className="h-1.5 bg-green-100 rounded-full">
                  <div className="h-full bg-green-500 rounded-full" style={{ width: `${Math.min(p.compound / 2.2, 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 rounded-xl bg-green-50 border border-green-200 text-xs text-green-700">
            💡 Compound interest grows <strong>exponentially</strong> — the difference doubles every 12 months!
          </div>
        </div>
      </div>

      {/* Save Button (placeholder) */}
      <div className="glass-card p-4 flex items-center justify-between">
        <div className="text-sm text-slate-600 dark:text-slate-300">Settings will apply to your next staking cycle</div>
        <button className="px-6 py-2.5 bg-gradient-to-r from-warm-500 to-warm-600 text-white rounded-xl font-semibold text-sm opacity-70 cursor-not-allowed">
          Save Settings (Coming Soon)
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 4. ADDRESS BOOK TAB
// ─────────────────────────────────────────────────────────────
function AddressBookTab() {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [newNetwork, setNewNetwork] = useState("ERC-20");
  const [addresses, setAddresses] = useState([
    { id: 1, label: "My Binance Wallet", address: "0x742d35Cc6634C0532925a3b8D4C9B2aBd6a84c3e", network: "ERC-20", verified: true, lastUsed: "2024-01-15" },
    { id: 2, label: "Hardware Wallet", address: "TQn9Y2khEsLJW1ChVWFMSMeRDow5KEFH4V", network: "TRC-20", verified: true, lastUsed: "2024-01-10" },
  ]);

  const networks = ["ERC-20", "TRC-20", "BEP-20"];

  const maskAddress = (addr: string) => `${addr.slice(0, 8)}...${addr.slice(-8)}`;

  return (
    <div className="space-y-6">
      <div className="glass-card p-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">Address Book</h2>
          <p className="text-slate-600 dark:text-slate-300">Save and manage trusted withdrawal addresses</p>
        </div>
        <button onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-warm-500 to-warm-600 text-white rounded-xl font-semibold text-sm hover:opacity-90 transition-all">
          <Plus className="w-4 h-4" />
          Add Address
        </button>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className="glass-card p-6 border-2 border-warm-400/40">
          <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Add New Address</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            <div>
              <label className="block text-xs text-warm-600 mb-1.5 font-medium">Label</label>
              <input value={newLabel} onChange={e => setNewLabel(e.target.value)}
                placeholder="e.g. My Binance Wallet"
                className="w-full px-3 py-2.5 rounded-xl border border-warm-400/30 bg-cream-100 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-warm-400 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-warm-600 mb-1.5 font-medium">Network</label>
              <select value={newNetwork} onChange={e => setNewNetwork(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-warm-400/30 bg-cream-100 text-slate-900 dark:text-white outline-none text-sm">
                {networks.map(n => <option key={n}>{n}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-warm-600 mb-1.5 font-medium">Wallet Address</label>
              <input value={newAddress} onChange={e => setNewAddress(e.target.value)}
                placeholder="0x..."
                className="w-full px-3 py-2.5 rounded-xl border border-warm-400/30 bg-cream-100 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-warm-400 text-sm" />
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => {
              if (newLabel && newAddress) {
                setAddresses(prev => [...prev, { id: Date.now(), label: newLabel, address: newAddress, network: newNetwork, verified: false, lastUsed: "—" }]);
                setNewLabel(""); setNewAddress(""); setShowAddForm(false);
              }
            }} className="px-5 py-2 bg-gradient-to-r from-warm-500 to-warm-600 text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-all">
              Save Address
            </button>
            <button onClick={() => setShowAddForm(false)} className="px-5 py-2 border border-warm-400/30 text-slate-600 dark:text-slate-300 rounded-xl text-sm hover:bg-warm-400/10 transition-all">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Security Note */}
      <div className="glass-card p-4 border border-amber-300/50 bg-amber-50/50 flex gap-3">
        <Shield className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm">
          <strong className="text-slate-900 dark:text-white">Security Tip:</strong>
          <span className="text-slate-600 dark:text-slate-300"> Only save addresses you fully trust. Always verify the first 4 and last 4 characters before withdrawing.</span>
        </div>
      </div>

      {/* Address List */}
      <div className="space-y-3">
        {addresses.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <div className="text-4xl mb-3">📋</div>
            <div className="text-lg font-semibold text-slate-900 dark:text-white mb-1">No addresses saved</div>
            <div className="text-slate-600 dark:text-slate-300 text-sm">Add trusted wallets for faster withdrawals</div>
          </div>
        ) : (
          addresses.map(addr => (
            <div key={addr.id} className="glass-card p-5 flex items-center justify-between group hover:-translate-y-0.5 transition-all">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-warm-400/20 flex items-center justify-center text-warm-600 font-bold text-sm flex-shrink-0">
                  {addr.label.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900 dark:text-white">{addr.label}</span>
                    {addr.verified && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">✓ Verified</span>}
                    <span className="text-xs bg-warm-400/15 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full">{addr.network}</span>
                  </div>
                  <div className="text-sm text-warm-600 font-mono mt-0.5">{maskAddress(addr.address)}</div>
                  <div className="text-xs text-warm-500 mt-0.5">Last used: {addr.lastUsed}</div>
                </div>
              </div>
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                <button className="p-2 rounded-lg hover:bg-warm-400/15 text-warm-600 transition-all" title="Copy address">
                  <Copy className="w-4 h-4" />
                </button>
                <button onClick={() => setAddresses(prev => prev.filter(a => a.id !== addr.id))}
                  className="p-2 rounded-lg hover:bg-red-50 text-red-400 transition-all" title="Delete">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Saved Addresses", value: addresses.length },
          { label: "Verified", value: addresses.filter(a => a.verified).length },
          { label: "Networks", value: [...new Set(addresses.map(a => a.network))].length },
        ].map(s => (
          <div key={s.label} className="glass-card p-4 text-center">
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{s.value}</div>
            <div className="text-xs text-warm-600">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 5. PORTFOLIO ANALYTICS TAB
// ─────────────────────────────────────────────────────────────
function PortfolioAnalyticsTab({ walletData }: { walletData: any }) {
  const [period, setPeriod] = useState("30d");
  const [metric, setMetric] = useState("balance");

  const bal = walletData?.wallet?.balance ?? 0;
  const staked = walletData?.wallet?.stakedAmount ?? 0;
  const earned = walletData?.wallet?.totalEarnings ?? 0;
  const deposited = walletData?.wallet?.totalDeposited ?? 0;
  const withdrawn = walletData?.wallet?.totalWithdrawn ?? 0;
  const available = bal - staked;

  const allocationData = [
    { name: "Available", value: Math.max(available, 0), color: "#C4966A" },
    { name: "Staked", value: Math.max(staked, 0), color: "#8B5E3C" },
    { name: "Earnings", value: Math.max(earned, 0), color: "#B8700A" },
  ];
  const totalAlloc = allocationData.reduce((s, d) => s + d.value, 0) || 1;

  const performanceMetrics = [
    { label: "Total Balance", value: `$${bal.toFixed(2)}`, change: "+0.00%", positive: true, icon: "💰" },
    { label: "Total Deposited", value: `$${deposited.toFixed(2)}`, change: "", positive: true, icon: "📥" },
    { label: "Total Withdrawn", value: `$${withdrawn.toFixed(2)}`, change: "", positive: true, icon: "📤" },
    { label: "Total Earnings", value: `$${earned.toFixed(2)}`, change: "+0.00%", positive: true, icon: "📈" },
    { label: "Staked Amount", value: `$${staked.toFixed(2)}`, change: "", positive: true, icon: "🔒" },
    { label: "Available Balance", value: `$${available.toFixed(2)}`, change: "", positive: true, icon: "💳" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-card p-6 flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">Portfolio Analytics</h2>
          <p className="text-slate-600 dark:text-slate-300">Deep insights into your investment performance</p>
        </div>
        <div className="flex gap-2">
          {["7d", "30d", "90d", "1y", "All"].map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                period === p
                  ? "bg-amber-600 text-white shadow-sm shadow-amber-600/30 scale-105"
                  : "bg-white border border-warm-400/30 text-slate-600 dark:text-slate-300 hover:border-amber-500/50 hover:bg-amber-50"
              }`}>
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {performanceMetrics.map(m => (
          <div key={m.label} className="glass-card p-4">
            <div className="text-xl mb-2">{m.icon}</div>
            <div className="text-lg font-bold text-slate-900 dark:text-white">{m.value}</div>
            <div className="text-xs text-warm-600 mt-0.5">{m.label}</div>
            {m.change && (
              <div className={`text-xs font-medium mt-1 ${m.positive ? "text-green-600" : "text-red-500"}`}>
                {m.change}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Allocation Chart */}
        <div className="glass-card p-6">
          <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Portfolio Allocation</h3>
          {allocationData.every(d => d.value === 0) ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-2">📊</div>
              <div className="text-sm text-slate-600 dark:text-slate-300">No funds yet</div>
            </div>
          ) : (
            <div className="space-y-3">
              {allocationData.map(d => (
                <div key={d.name}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-slate-900 dark:text-white">{d.name}</span>
                    <span className="text-slate-600 dark:text-slate-300">${d.value.toFixed(2)} ({((d.value / totalAlloc) * 100).toFixed(1)}%)</span>
                  </div>
                  <div className="h-3 bg-warm-400/20 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${(d.value / totalAlloc) * 100}%`, backgroundColor: d.color }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Performance Scores */}
        <div className="glass-card p-6">
          <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Performance Score</h3>
          <div className="space-y-4">
            {[
              { label: "Portfolio Health", score: deposited > 0 ? Math.min(95, Math.round(70 + (earned / Math.max(deposited, 1)) * 100)) : 0, color: "#C4966A" },
              { label: "Staking Efficiency", score: deposited > 0 ? Math.min(100, Math.round((staked / Math.max(bal, 1)) * 100)) : 0, color: "#8B5E3C" },
              { label: "Risk Score", score: bal >= 0 ? 90 : 50, color: "#B8700A" },
              { label: "Diversification", score: (walletData?.wallet?.stakes?.length ?? 0) > 1 ? 75 : 30, color: "#7C5C3E" },
            ].map(item => (
              <div key={item.label}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-slate-900 dark:text-white font-medium">{item.label}</span>
                  <span className="font-bold" style={{ color: item.color }}>{item.score}/100</span>
                </div>
                <div className="h-2 bg-warm-400/20 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${item.score}%`, backgroundColor: item.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Activity Heatmap */}
        <div className="glass-card p-6">
          <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Monthly Summary</h3>
          <div className="space-y-3">
            {[
              { label: "Stake Events", value: walletData?.wallet?.stakes?.length ?? 0 },
              { label: "Active Stakes", value: walletData?.wallet?.stakes?.filter((s: any) => s.status === "active").length ?? 0 },
              { label: "Matured Stakes", value: walletData?.wallet?.maturedStakes?.length ?? 0 },
              { label: "Avg. Stake Size", value: staked > 0 ? `$${staked.toFixed(0)}` : "$0" },
            ].map(s => (
              <div key={s.label} className="flex justify-between items-center p-3 rounded-xl bg-warm-400/10">
                <span className="text-sm text-slate-600 dark:text-slate-300">{s.label}</span>
                <span className="font-bold text-slate-900 dark:text-white">{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Insights */}
      <div className="glass-card p-6">
        <h3 className="font-semibold text-slate-900 dark:text-white mb-4">📊 Portfolio Insights</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { icon: "🎯", title: "Optimization Tip", desc: bal < 1000 ? `Add $${(1000 - bal).toFixed(2)} to reach Silver tier (8%/month).` : bal < 5000 ? `Add $${(5000 - bal).toFixed(2)} to reach Gold tier (12%/month).` : "You're at a great tier! Keep compounding.", color: "bg-blue-50 border-blue-200" },
            { icon: "🔄", title: "Compounding Boost", desc: earned > 0 ? `You've earned $${earned.toFixed(2)} so far. Auto-compound could boost this by ~33% over 12 months.` : "Enable auto-compound after your first stake to maximize growth.", color: "bg-green-50 border-green-200" },
            { icon: "📅", title: "Active Stakes", desc: (walletData?.wallet?.stakes?.filter((s: any) => s.status === "active")?.length ?? 0) > 0 ? `${walletData.wallet.stakes.filter((s: any) => s.status === "active").length} active stake(s) currently running.` : "No active stakes. Deposit and stake USDT to start earning.", color: "bg-amber-50 border-amber-200" },
            { icon: "🏆", title: "Tier Status", desc: bal >= 25000 ? "Platinum tier — earning maximum 15%/month! 🎉" : bal >= 5000 ? `Gold tier. Add $${(25000 - bal).toFixed(2)} for Platinum.` : bal >= 1000 ? `Silver tier. Add $${(5000 - bal).toFixed(2)} for Gold.` : `Add $${(1000 - bal).toFixed(2)} for Silver tier.`, color: "bg-purple-50 border-purple-200" },
            { icon: "📈", title: "Monthly Potential", desc: bal > 0 ? `Staking $${bal.toFixed(2)} could earn ~$${(bal * 0.05).toFixed(2)}–$${(bal * 0.15).toFixed(2)}/month.` : "Deposit USDT to see your earning potential.", color: "bg-warm-50 border-warm-200" },
            { icon: "🛡️", title: "Risk Assessment", desc: "Your portfolio risk is LOW. USDT staking provides stable, predictable monthly returns with no market volatility.", color: "bg-emerald-50 border-emerald-200" },
          ].map(ins => (
            <div key={ins.title} className={`p-4 rounded-xl border ${ins.color}`}>
              <div className="text-xl mb-2">{ins.icon}</div>
              <div className="font-semibold text-slate-900 dark:text-white text-sm mb-1">{ins.title}</div>
              <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{ins.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}






