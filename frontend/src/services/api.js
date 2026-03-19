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
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  },
);

export const authAPI = {
  login: (credentials) => api.post("/token/", credentials),
  register: (userData) => api.post("/users/", userData),
  logout: () => api.post("/token/logout/"),
};

export const leadsAPI = {
  getLeads: () => api.get("/leads/"),
  getLead: (id) => api.get(`/leads/${id}/`),
  createLead: (leadData) => api.post("/leads/", leadData),
  updateLead: (id, leadData) => api.patch(`/leads/${id}/`, leadData),
  deleteLead: (id) => api.delete(`/leads/${id}/`),
  assignLead: (id, userId) =>
    api.patch(`/leads/${id}/assign/`, { user_id: userId }),
};

export const activitiesAPI = {
  getActivities: (leadId) => api.get(`/leads/${leadId}/activities/`),
  createActivity: (activityData) => api.post("/activities/", activityData),
};

export const usersAPI = {
  getUsers: () => api.get("/users/"),
  getMe: () => api.get("/users/me/"),
  assignRole: (userId, roleData) =>
    api.post(`/users/${userId}/assign-role/`, roleData),
};
