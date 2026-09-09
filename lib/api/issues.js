import apiClient from "./client.js";

export const issueApi = {
  // Create a new issue
  createIssue: async (issueData) => {
    const response = await apiClient.post("/issues/create", issueData);
    return response;
  },

  // Get user's issues
  getMyIssues: async (params = {}) => {
    const response = await apiClient.get("/issues/my-issues", { params });
    return response;
  },

  // Admin: Get all issues
  getAllIssues: async (params = {}) => {
    const response = await apiClient.get("/issues/admin/all", { params });
    return response;
  },

  // Admin: Add response to issue
  respondToIssue: async (issueId, response) => {
    const result = await apiClient.post(`/issues/admin/${issueId}/respond`, {
      response,
    });
    return result;
  },

  // Admin: Resolve issue
  resolveIssue: async (issueId) => {
    const response = await apiClient.post(`/issues/admin/${issueId}/resolve`);
    return response;
  },

  // Admin: Update issue status
  updateIssueStatus: async (issueId, status) => {
    const response = await apiClient.post(
      `/issues/admin/${issueId}/update-status`,
      { status }
    );
    return response;
  },
};
