import { writable, type Writable } from 'svelte/store';

export interface UIStoreType {
  sidebarOpen: boolean;
  secondarySidebarOpen: boolean;
  tertiarySidebarOpen: boolean;
  activeTab: string;
  loading: boolean;
  selectedItem: string | null;
  editMode: boolean;
  error: string | null;
  notification: string | null;
}

const initialState: UIStoreType = {
  sidebarOpen: false,
  secondarySidebarOpen: false,
  tertiarySidebarOpen: false,
  activeTab: 'overview',
  loading: false,
  selectedItem: null,
  editMode: false,
  error: null,
  notification: null,
};

export const uiStore: Writable<UIStoreType> = writable(initialState);

/**
 * UI Store Actions
 */
export const uiStoreActions = {
  openSecondarySidebar() {
    uiStore.update(state => ({
      ...state,
      secondarySidebarOpen: true,
    }));
  },

  closeSecondarySidebar() {
    uiStore.update(state => ({
      ...state,
      secondarySidebarOpen: false,
    }));
  },

  toggleSecondarySidebar() {
    uiStore.update(state => ({
      ...state,
      secondarySidebarOpen: !state.secondarySidebarOpen,
    }));
  },

  openTertiarySidebar() {
    uiStore.update(state => ({
      ...state,
      tertiarySidebarOpen: true,
    }));
  },

  closeTertiarySidebar() {
    uiStore.update(state => ({
      ...state,
      tertiarySidebarOpen: false,
    }));
  },

  toggleTertiarySidebar() {
    uiStore.update(state => ({
      ...state,
      tertiarySidebarOpen: !state.tertiarySidebarOpen,
    }));
  },

  closeBothSidebars() {
    uiStore.update(state => ({
      ...state,
      secondarySidebarOpen: false,
      tertiarySidebarOpen: false,
    }));
  },

  setActiveTab(tab: string) {
    uiStore.update(state => ({
      ...state,
      activeTab: tab,
    }));
  },

  setLoading(loading: boolean) {
    uiStore.update(state => ({
      ...state,
      loading,
    }));
  },

  setSelectedItem(itemId: string | null) {
    uiStore.update(state => ({
      ...state,
      selectedItem: itemId,
    }));
  },

  setEditMode(editMode: boolean) {
    uiStore.update(state => ({
      ...state,
      editMode,
    }));
  },

  setError(error: string | null) {
    uiStore.update(state => ({
      ...state,
      error,
    }));
  },

  setNotification(notification: string | null) {
    uiStore.update(state => ({
      ...state,
      notification,
    }));

    // Auto-clear notification after 3 seconds
    if (notification) {
      setTimeout(() => {
        uiStore.update(state => ({
          ...state,
          notification: null,
        }));
      }, 3000);
    }
  },

  reset() {
    uiStore.set(initialState);
  },
};
