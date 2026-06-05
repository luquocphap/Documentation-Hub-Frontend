import { create } from 'zustand';
import { authApi } from '@/api/api';

const AUTH_FLAG_KEY = 'isLoggedIn';

interface AuthState {
  isAuthenticated: boolean;
  login: () => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>(() => ({
  // Khởi tạo từ localStorage → không bị reset khi refresh trang
  isAuthenticated: localStorage.getItem(AUTH_FLAG_KEY) === 'true',

  login: () => {
    localStorage.setItem(AUTH_FLAG_KEY, 'true');
    useAuthStore.setState({ isAuthenticated: true });
  },

  logout: async () => {
    try {
      await authApi.logout();
    } catch {
      // ignore — vẫn logout client dù server lỗi
    } finally {
      localStorage.removeItem(AUTH_FLAG_KEY);
      useAuthStore.setState({ isAuthenticated: false });
    }
  },
}));