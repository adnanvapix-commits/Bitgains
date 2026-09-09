import apiClient from "./client.js";

// Notifications API functions for users
export const notificationsApi = {
  // Get notifications for current user
  async getNotifications(params = {}) {
    const filteredParams = Object.entries(params)
      .filter(
        ([, value]) => value !== undefined && value !== null && value !== ""
      )
      .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});

    const queryString = new URLSearchParams(filteredParams).toString();
    return apiClient.get(`/notifications?${queryString}`);
  },

  // Get unread notification count
  async getUnreadCount() {
    return apiClient.get("/notifications/unread-count");
  },

  // Mark a notification as read
  async markAsRead(notificationId) {
    return apiClient.put(`/notifications/${notificationId}/read`);
  },

  // Mark all notifications as read
  async markAllAsRead() {
    return apiClient.put("/notifications/read-all");
  },

  // Delete a notification
  async deleteNotification(notificationId) {
    return apiClient.delete(`/notifications/${notificationId}`);
  },
};

export default notificationsApi;
