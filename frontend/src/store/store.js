import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      loading: false,

      login: (userData, token) => {
        if (token) localStorage.setItem("token", token);
        set({ user: userData, token, isAuthenticated: true });
      },
      logout: () => {
        localStorage.removeItem("token");
        set({ user: null, token: null, isAuthenticated: false });
      },
      setLoading: (status) => set({ loading: status }),
      setUser: (user) => set({ user }),
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({ token: state.token }), // only persist token
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
