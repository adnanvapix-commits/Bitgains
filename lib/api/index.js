// Export all API functions
export { authApi } from "./auth.js";
export { transactionApi, walletApi } from "./transactions.js";
export { adminApi } from "./admin.js";
export { notificationsApi } from "./notifications.js";
export { default as apiClient } from "./client.js";

// Re-export everything for convenience
import { authApi } from "./auth.js";
import { transactionApi, walletApi } from "./transactions.js";
import { adminApi } from "./admin.js";
import { notificationsApi } from "./notifications.js";
import apiClient from "./client.js";

const api = {
  auth: authApi,
  transactions: transactionApi,
  wallet: walletApi,
  admin: adminApi,
  notifications: notificationsApi,
  client: apiClient,
};

export default api;
