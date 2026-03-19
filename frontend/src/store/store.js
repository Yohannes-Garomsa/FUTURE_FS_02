import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      loading: false,

      login: (userData, token, refreshToken) => {
        if (token) localStorage.setItem("token", token);
        if (refreshToken) localStorage.setItem("refresh_token", refreshToken);
        set({ user: userData, token, refreshToken, isAuthenticated: true });
      },
          logout: () => {
            localStorage.removeItem("token");
            localStorage.removeItem("refresh_token");
            set({ user: null, token: null, refreshToken: null, isAuthenticated: false });
          },
          setLoading: (status) => set({ loading: status }),
          setUser: (user) => set({ user }),
          setToken: (token) => {
            localStorage.setItem("token", token);
            set({ token });
          },
        }),
        {
          name: "auth-storage",
          partialize: (state) => ({ token: state.token, refreshToken: state.refreshToken }),
        }
  )
);

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
