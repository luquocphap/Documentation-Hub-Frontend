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
let authStateRevision = 0;

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

    const initializationRevision = authStateRevision;

    authInitializationPromise = (async () => {
      try {
        await authApi.getInfo({
          suppressAuthRedirect: true,
        });

        if (initializationRevision !== authStateRevision) {
          return;
        }

        markAuthenticatedSession();
        set({ isAuthenticated: true });
      } catch {
        if (initializationRevision !== authStateRevision) {
          return;
        }

        clearAuthenticatedSession();
        set({ isAuthenticated: false });
      } finally {
        if (initializationRevision === authStateRevision) {
          set({ isAuthChecking: false });
        }

        authInitializationPromise = null;
      }
    })();

    return authInitializationPromise;
  },

  login: () => {
    authStateRevision += 1;
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
      authStateRevision += 1;
      clearAuthenticatedSession();
      set({
        isAuthenticated: false,
        isAuthChecking: false,
      });
    }
  },
}));
