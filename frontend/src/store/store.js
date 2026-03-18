import { create } from "zustand";

export const useAuthStore = create((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  loading: false,

  login: (userData, token) =>
    set({ user: userData, token, isAuthenticated: true }),
  logout: () => set({ user: null, token: null, isAuthenticated: false }),
  setLoading: (status) => set({ loading: status }),
}));

export const useLeadsStore = create((set) => ({
  leads: [],
  loading: false,
  error: null,

  setLeads: (leads) => set({ leads }),
  setLoading: (status) => set({ loading: status }),
  setError: (error) => set({ error }),
}));

export const useKanbanStore = create((set) => ({
  kanbanData: [],
  loading: false,

  setKanbanData: (data) => set({ kanbanData: data }),
  setLoading: (status) => set({ loading: status }),
}));
