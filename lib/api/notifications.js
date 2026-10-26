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

  // Mark a notification as read — route is PUT /notifications/[id] (no /read suffix)
  async markAsRead(notificationId) {
    return apiClient.put(`/notifications/${notificationId}`);
  },

  // Mark all notifications as read
  async markAllAsRead() {
    return apiClient.put("/notifications/read-all");
  },

  // Delete a notification — route is DELETE /notifications/[id]
  async deleteNotification(notificationId) {
    return apiClient.delete(`/notifications/${notificationId}`);
  },
};

export default notificationsApi;
