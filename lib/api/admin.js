import apiClient from "./client.js";

// Admin API functions
export const adminApi = {
  // Get dashboard statistics
  async getDashboardStats() {
    return apiClient.get("/admin/dashboard");
  },

  // Get pending transactions for review
  async getPendingTransactions(params = {}) {
    // Filter out undefined values
    const filteredParams = Object.entries(params)
      .filter(
        ([, value]) => value !== undefined && value !== null && value !== ""
      )
      .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});

    const queryString = new URLSearchParams(filteredParams).toString();
    return apiClient.get(`/admin/transactions/pending?${queryString}`);
  },

  // Get all transactions with filters
  async getAllTransactions(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return apiClient.get(`/admin/transactions?${queryString}`);
  },

  // Get staking transactions (stake/unstake/reward)
  async getStakingTransactions(params = {}) {
    const filteredParams = Object.entries(params)
      .filter(
        ([, value]) => value !== undefined && value !== null && value !== ""
      )
      .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});

    const queryString = new URLSearchParams(filteredParams).toString();
    return apiClient.get(`/admin/transactions/staking?${queryString}`);
  },

  // Approve a transaction
  async approveTransaction(transactionId, comment = "") {
    return apiClient.post(`/admin/transactions/${transactionId}/approve`, {
      comment,
    });
  },

  // Reject a transaction
  async rejectTransaction(transactionId, comment = "") {
    return apiClient.post(`/admin/transactions/${transactionId}/reject`, {
      comment,
    });
  },

  // Get all users
  async getAllUsers(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return apiClient.get(`/admin/users?${queryString}`);
  },

  // Get specific user details
  async getUserDetails(userId) {
    return apiClient.get(`/admin/users/${userId}`);
  },

  // Update user status (activate/deactivate)
  async updateUserStatus(userId, status) {
    return apiClient.patch(`/admin/users/${userId}/status`, {
      isActive: status,
    });
  },

  // Get user's wallet details
  async getUserWallet(userId) {
    return apiClient.get(`/admin/users/${userId}/wallet`);
  },

  // Update user's wallet balance (admin only)
  async updateUserWallet(userId, walletData) {
    return apiClient.patch(`/admin/users/${userId}/wallet`, walletData);
  },

  // Get transaction statistics for admin
  async getTransactionStats(startDate, endDate) {
    const params = new URLSearchParams();
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);
    return apiClient.get(`/admin/transactions/stats?${params}`);
  },

  // Get platform statistics
  async getPlatformStats() {
    return apiClient.get("/admin/platform/stats");
  },

  // Bulk approve transactions
  async bulkApproveTransactions(transactionIds, comment = "") {
    return apiClient.patch("/admin/transactions/bulk-approve", {
      transactionIds,
      comment,
    });
  },

  // Bulk reject transactions
  async bulkRejectTransactions(transactionIds, comment = "") {
    return apiClient.patch("/admin/transactions/bulk-reject", {
      transactionIds,
      comment,
    });
  },

  // Export transactions data
  async exportTransactions(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return apiClient.get(`/admin/export/transactions?${queryString}`);
  },

  // Get system logs (if implemented)
  async getSystemLogs(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return apiClient.get(`/admin/logs?${queryString}`);
  },

  // Manual balance adjustment - Add funds
  async manualAddBalance(userId, amount, reason) {
    return apiClient.post("/admin/balance/manual-add", {
      userId,
      amount,
      reason,
    });
  },

  // Manual balance adjustment - Deduct funds
  async manualDeductBalance(userId, amount, reason) {
    return apiClient.post("/admin/balance/manual-deduct", {
      userId,
      amount,
      reason,
    });
  },

  // Manual balance adjustment - Bonus credit
  async manualAddBonus(userId, amount, reason) {
    return apiClient.post("/admin/balance/manual-bonus", {
      userId,
      amount,
      reason,
    });
  },

  // Get deleted/rejected transactions
  async getDeletedTransactions(params = {}) {
    const filteredParams = Object.entries(params)
      .filter(
        ([, value]) => value !== undefined && value !== null && value !== ""
      )
      .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});

    const queryString = new URLSearchParams(filteredParams).toString();
    return apiClient.get(`/admin/transactions/deleted?${queryString}`);
  },

  // Revive a deleted transaction
  async reviveTransaction(transactionId, reason) {
    return apiClient.post(`/admin/transactions/${transactionId}/revive`, {
      reason,
    });
  },

  // Soft delete a transaction
  async deleteTransaction(transactionId, reason) {
    return apiClient.post(`/admin/transactions/${transactionId}/delete`, {
      reason,
    });
  },

  // Get audit logs
  async getAuditLogs(params = {}) {
    const filteredParams = Object.entries(params)
      .filter(
        ([, value]) => value !== undefined && value !== null && value !== ""
      )
      .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});

    const queryString = new URLSearchParams(filteredParams).toString();
    return apiClient.get(`/admin/audit-logs?${queryString}`);
  },

  // Global search across users, transactions, wallets
  async globalSearch(query) {
    return apiClient.get(`/admin/search?q=${encodeURIComponent(query)}`);
  },

  // Get referral hierarchy for a user
  async getReferralHierarchy(userId) {
    return apiClient.get(`/admin/referral-hierarchy/${userId}`);
  },

  // Cancel stake with penalty (stakeId optional - if not provided, cancels ALL active stakes)
  async cancelStake(userId, reason, stakeId = null) {
    const payload = {
      userId,
      reason,
    };
    if (stakeId != null) {
      payload.stakeId = stakeId;
    }
    return apiClient.post("/admin/stake/cancel", payload);
  },

  // ============================================
  // NOTIFICATION MANAGEMENT
  // ============================================

  // Send notification to user(s)
  async sendNotification(data) {
    return apiClient.post("/notifications/send", data);
  },

  // Get all sent notifications (admin view)
  async getAllNotifications(params = {}) {
    const filteredParams = Object.entries(params)
      .filter(
        ([, value]) => value !== undefined && value !== null && value !== ""
      )
      .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});

    const queryString = new URLSearchParams(filteredParams).toString();
    return apiClient.get(`/notifications/admin/all?${queryString}`);
  },

  // Delete a notification
  async deleteNotification(notificationId) {
    return apiClient.delete(`/notifications/admin/${notificationId}`);
  },

  // ============================================
  // USER DELETION
  // ============================================

  // Delete a user permanently
  async deleteUser(userId, reason) {
    return apiClient.delete(`/admin/users/${userId}`, {
      data: { reason },
    });
  },

  // ============================================
  // STAKING PAYOUTS
  // ============================================

  // Get all staked users with maturity eligibility info
  async getPayoutEligibleUsers() {
    return apiClient.get('/admin/payouts/eligible');
  },

  // Distribute payout: percentage of staked amount to selected (or all eligible) users
  async distributePayouts(percentage, userIds = null) {
    const payload = { percentage };
    if (userIds && userIds.length > 0) {
      payload.userIds = userIds;
    }
    return apiClient.post('/admin/payouts/distribute', payload);
  },

  // Get payout history
  async getPayoutHistory(params = {}) {
    const filteredParams = Object.entries(params)
      .filter(([, value]) => value !== undefined && value !== null && value !== '')
      .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});
    const queryString = new URLSearchParams(filteredParams).toString();
    return apiClient.get(`/admin/payouts/history?${queryString}`);
  },
};

export default adminApi;
