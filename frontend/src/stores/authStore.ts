import { create } from "zustand";
import { apiClient } from "@/lib/api-client";
import { TokenResponse, UserResponse, PersonaType } from "@/types/identity";
import { SEED_PERSONAS } from "@/lib/constants";

interface AuthState {
  token: string | null;
  user: UserResponse | null;
  activePersona: PersonaType;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  login: (login: string, password: string) => Promise<void>;
  switchPersona: (persona: PersonaType) => Promise<void>;
  logout: () => void;
  fetchMe: () => Promise<void>;
  hasScope: (scope: string) => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: localStorage.getItem("zshop_access_token"),
  user: null,
  activePersona: "guest",
  isLoading: false,
  error: null,

  login: async (login, password) => {
    set({ isLoading: true, error: null });
    try {
      const data = await apiClient<TokenResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ login, password }),
      });

      localStorage.setItem("zshop_access_token", data.access_token);
      set({
        token: data.access_token,
        user: data.user,
        isLoading: false,
      });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  switchPersona: async (persona) => {
    if (persona === "guest") {
      get().logout();
      return;
    }

    const config = SEED_PERSONAS[persona];
    if (!config || !config.password) return;

    set({ isLoading: true, error: null });
    try {
      const data = await apiClient<TokenResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify({
          login: config.email,
          password: config.password,
        }),
      });

      localStorage.setItem("zshop_access_token", data.access_token);
      set({
        token: data.access_token,
        user: data.user,
        activePersona: persona,
        isLoading: false,
      });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  logout: () => {
    localStorage.removeItem("zshop_access_token");
    set({
      token: null,
      user: null,
      activePersona: "guest",
      error: null,
    });
  },

  fetchMe: async () => {
    const token = get().token;
    if (!token) return;

    set({ isLoading: true });
    try {
      const user = await apiClient<UserResponse>("/auth/me");
      let persona: PersonaType = "guest";
      if (user.is_superuser || user.email === SEED_PERSONAS.admin.email) persona = "admin";
      else if (user.email === SEED_PERSONAS.manager.email) persona = "manager";
      else if (user.email === SEED_PERSONAS.customer.email) persona = "customer";

      set({ user, activePersona: persona, isLoading: false });
    } catch {
      get().logout();
      set({ isLoading: false });
    }
  },

  hasScope: (scope: string) => {
    const { user } = get();
    if (!user) return false;
    if (user.is_superuser) return true;
    return user.scopes.includes(scope);
  },
}));