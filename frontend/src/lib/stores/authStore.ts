import { writable, type Writable } from 'svelte/store';

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  isAdmin?: boolean;
}

export interface AuthStoreType {
  user: User | null;
  isAuthenticated: boolean;
  token: string | null;
  loading: boolean;
  error: string | null;
}

const initialState: AuthStoreType = {
  user: null,
  isAuthenticated: false,
  token: null,
  loading: false,
  error: null,
};

export const authStore: Writable<AuthStoreType> = writable(initialState);

// Derived store for current user ID
import { derived } from 'svelte/store';
export const currentUserId = derived(authStore, ($authStore) => {
  const userId = $authStore.user?.id || null;
  return userId;
});

/**
 * Auth Store Actions
 */
export const authStoreActions = {
  setUser(user: User | null) {
    authStore.update(state => ({
      ...state,
      user,
      isAuthenticated: user !== null,
    }));
  },

  setToken(token: string | null) {
    authStore.update(state => ({
      ...state,
      token,
    }));
  },

  setLoading(loading: boolean) {
    authStore.update(state => ({
      ...state,
      loading,
    }));
  },

  setError(error: string | null) {
    authStore.update(state => ({
      ...state,
      error,
    }));
  },

  login(user: User, token: string) {
    authStore.update(state => ({
      ...state,
      user,
      token,
      isAuthenticated: true,
      loading: false,
      error: null,
    }));

    // Optionally persist to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token);
      localStorage.setItem('auth_user', JSON.stringify(user));
    }
  },

  logout() {
    authStore.set(initialState);

    // Clear localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
    }
  },

  restoreFromStorage() {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('auth_token');
      const userStr = localStorage.getItem('auth_user');

      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          authStore.update(state => ({
            ...state,
            user,
            token,
            isAuthenticated: true,
          }));
        } catch (e) {
          // Invalid stored data, clear it
          localStorage.removeItem('auth_token');
          localStorage.removeItem('auth_user');
        }
      }
    }
  },

  reset() {
    authStore.set(initialState);
  },
};
