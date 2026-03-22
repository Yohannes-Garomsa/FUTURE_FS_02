import axios from "axios";
import { useAuthStore } from "../store/store";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const { token } = useAuthStore.getState();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem("refresh_token");
        if (refreshToken) {
          const res = await axios.post(`${API_BASE_URL}/auth/refresh/`, {
            refresh: refreshToken,
          });
          const { access } = res.data;
          useAuthStore.getState().setToken(access);
          originalRequest.headers.Authorization = `Bearer ${access}`;
          return api(originalRequest);
        }
      } catch (err) {
        useAuthStore.getState().logout();
        window.location.href = "/login";
      }
    }
    if (error.response?.status === 401) {
       useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (credentials) => api.post("/auth/login/", credentials),
  refresh: (refresh) => api.post("/auth/refresh/", { refresh }),
};

export const leadsAPI = {
  getLeads: (params) => api.get("/leads/", { params }),
  getLead: (id) => api.get(`/leads/${id}/`),
  createLead: (leadData) => api.post("/leads/", leadData),
  updateLead: (id, leadData) => api.patch(`/leads/${id}/`, leadData),
  deleteLead: (id) => api.delete(`/leads/${id}/`),
  assignLead: (id, userId) =>
    api.patch(`/leads/${id}/assign/`, { assigned_to: userId }),
  getAttachments: (id) => api.get(`/leads/${id}/attachments/`),
  uploadAttachment: (id, formData) =>
    api.post(`/leads/${id}/attachments/`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
};

export const pipelineAPI = {
  getPipelines: () => api.get("/pipelines/"),
  getPipelineBoard: (id) => api.get(`/pipelines/${id}/board/`),
  moveLead: (pipelineLeadId, data) =>
    api.post(`/pipeline-leads/${pipelineLeadId}/move/`, data),
  reorderStages: (data) => api.post("/pipeline-stages/reorder/", data),
};

export const activitiesAPI = {
  getActivities: (leadId) => api.get(`/activities/?lead=${leadId}`),
  createActivity: (activityData) => api.post("/activities/", activityData),
};

export const analyticsAPI = {
  getDashboardStats: () => api.get("/analytics/dashboard/"),
  getAgentPerformance: () => api.get("/analytics/performance/"),
  getLeadTrends: (params) => api.get("/analytics/trends/", { params }),
  getSourceConversion: () => api.get("/analytics/source-conversion/"),
};

export const usersAPI = {
  getUsers: () => api.get("/users/"),
  getMe: () => api.get("/users/me/"),
  updateMe: (data) => api.patch("/users/me/", data),
  assignRole: (userId, role) =>
    api.post(`/users/${userId}/assign-role/`, { role }),
};

export default api;
