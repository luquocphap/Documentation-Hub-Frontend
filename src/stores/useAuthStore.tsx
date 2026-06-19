import { create } from 'zustand';
import { authApi } from '@/api/api';
import {
  clearAuthenticatedSession,
  hasAuthenticatedSession,
  markAuthenticatedSession,
} from '@/lib/authSession';

interface AuthState {
  isAuthenticated: boolean;
  isAuthChecking: boolean;
  initializeAuth: () => Promise<void>;
  login: () => void;
  logout: () => Promise<void>;
}

let authInitializationPromise: Promise<void> | null = null;

export const useAuthStore = create<AuthState>((set, get) => ({
  // Khởi tạo từ localStorage → không bị reset khi refresh trang
  isAuthenticated: hasAuthenticatedSession(),
  isAuthChecking: true,

  initializeAuth: () => {
    if (!get().isAuthChecking) {
      return Promise.resolve();
    }

    if (authInitializationPromise) {
      return authInitializationPromise;
    }

    authInitializationPromise = (async () => {
      try {
        await authApi.getInfo({
          suppressAuthRedirect: true,
        });
        markAuthenticatedSession();
        set({ isAuthenticated: true });
      } catch {
        clearAuthenticatedSession();
        set({ isAuthenticated: false });
      } finally {
        set({ isAuthChecking: false });
        authInitializationPromise = null;
      }
    })();

    return authInitializationPromise;
  },

  login: () => {
    markAuthenticatedSession();
    set({
      isAuthenticated: true,
      isAuthChecking: false,
    });
  },

  logout: async () => {
    try {
      await authApi.logout();
    } catch {
      // ignore — vẫn logout client dù server lỗi
    } finally {
      clearAuthenticatedSession();
      set({
        isAuthenticated: false,
        isAuthChecking: false,
      });
    }
  },
}));
