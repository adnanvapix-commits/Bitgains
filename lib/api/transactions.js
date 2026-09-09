import apiClient, { CACHE_TTL } from "./client.js";

// Transaction API functions
export const transactionApi = {
  // Create a deposit request
  async createDeposit(depositData) {
    // Invalidate wallet cache after deposit
    apiClient.clearCache();
    return apiClient.post("/transactions/deposit", depositData);
  },

  // Request withdrawal OTP
  async requestWithdrawalOTP(data) {
    return apiClient.post("/transactions/request-withdrawal-otp", data);
  },

  // Create a withdrawal request (with OTP)
  async createWithdrawal(withdrawalData) {
    // Invalidate wallet cache after withdrawal
    apiClient.clearCache();
    return apiClient.post("/transactions/withdraw", withdrawalData);
  },

  // Stake funds
  async stakeFunds(stakeData) {
    // Invalidate wallet cache after staking
    apiClient.clearCache();
    return apiClient.post("/transactions/stake", stakeData);
  },

  // Unstake funds
  async unstakeFunds(unstakeData) {
    // Invalidate wallet cache after unstaking
    apiClient.clearCache();
    return apiClient.post("/transactions/unstake", unstakeData);
  },

  // Get user transaction history (cached for 30 seconds)
  async getHistory(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const cacheKey = `transactions_history_${queryString}`;
    const cached = apiClient.getCached(cacheKey, 30 * 1000); // 30 seconds
    if (cached) return cached;

    const data = await apiClient.get(`/transactions/history?${queryString}`);
    apiClient.setCached(cacheKey, data);
    return data;
  },

  // Get specific transaction by ID
  async getTransaction(transactionId) {
    return apiClient.get(`/transactions/${transactionId}`);
  },

  // Get transaction statistics (cached for 1 minute)
  async getStats() {
    const cacheKey = "transactions_stats";
    const cached = apiClient.getCached(cacheKey, CACHE_TTL.WALLET);
    if (cached) return cached;

    const data = await apiClient.get("/transactions/stats");
    apiClient.setCached(cacheKey, data);
    return data;
  },

  // Cancel pending transaction (if allowed)
  async cancelTransaction(transactionId) {
    apiClient.clearCache();
    return apiClient.patch(`/transactions/${transactionId}/cancel`);
  },
};

// Wallet API functions
export const walletApi = {
  // Get wallet balance and information (cached for 1 minute)
  async getWallet() {
    const cacheKey = "wallet_data";
    const cached = apiClient.getCached(cacheKey, CACHE_TTL.WALLET);
    if (cached) return cached;

    const data = await apiClient.get("/users/wallet");
    apiClient.setCached(cacheKey, data);
    return data;
  },

  // Force refresh wallet (bypass cache)
  async refreshWallet() {
    apiClient.clearCache();
    return apiClient.get("/users/wallet");
  },

  // Get wallet transaction history
  async getWalletHistory(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return apiClient.get(`/users/wallet/history?${queryString}`);
  },

  // Update staking rewards (calculate and add)
  async updateRewards() {
    apiClient.clearCache();
    return apiClient.post("/users/wallet/update-rewards");
  },

  // Get staking statistics (cached for 2 minutes)
  async getStakingStats() {
    const cacheKey = "staking_stats";
    const cached = apiClient.getCached(cacheKey, 2 * 60 * 1000);
    if (cached) return cached;

    const data = await apiClient.get("/users/wallet/staking-stats");
    apiClient.setCached(cacheKey, data);
    return data;
  },
};

const transactions = { transactionApi, walletApi };

export default transactions;
