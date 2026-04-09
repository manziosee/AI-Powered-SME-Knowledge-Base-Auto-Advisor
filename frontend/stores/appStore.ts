"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  company?: string;
  avatar?: string;
}

interface AppState {
  // User
  user: User | null;
  setUser: (user: User | null) => void;
  
  // Theme
  theme: "light" | "dark";
  setTheme: (theme: "light" | "dark") => void;
  
  // Sidebar
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  
  // Onboarding
  hasCompletedOnboarding: boolean;
  setHasCompletedOnboarding: (completed: boolean) => void;
  showWalkthrough: boolean;
  setShowWalkthrough: (show: boolean) => void;
  
  // Notifications
  unreadCount: number;
  setUnreadCount: (count: number) => void;
  
  // Search
  isSearchOpen: boolean;
  setIsSearchOpen: (open: boolean) => void;
  
  // Modals
  activeModal: string | null;
  setActiveModal: (modal: string | null) => void;
  
  // Loading states
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // User
      user: null,
      setUser: (user) => set({ user }),
      
      // Theme
      theme: "dark",
      setTheme: (theme) => set({ theme }),
      
      // Sidebar
      sidebarOpen: true,
      setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      
      // Onboarding
      hasCompletedOnboarding: false,
      setHasCompletedOnboarding: (hasCompletedOnboarding) => set({ hasCompletedOnboarding }),
      showWalkthrough: false,
      setShowWalkthrough: (showWalkthrough) => set({ showWalkthrough }),
      
      // Notifications
      unreadCount: 0,
      setUnreadCount: (unreadCount) => set({ unreadCount }),
      
      // Search
      isSearchOpen: false,
      setIsSearchOpen: (isSearchOpen) => set({ isSearchOpen }),
      
      // Modals
      activeModal: null,
      setActiveModal: (activeModal) => set({ activeModal }),
      
      // Loading
      isLoading: false,
      setIsLoading: (isLoading) => set({ isLoading }),
    }),
    {
      name: "advisorai-app-storage",
      partialize: (state) => ({
        theme: state.theme,
        sidebarOpen: state.sidebarOpen,
        hasCompletedOnboarding: state.hasCompletedOnboarding,
      }),
    }
  )
);

// Notification store for toast notifications
interface ToastMessage {
  id: string;
  type: "success" | "error" | "warning" | "info";
  title: string;
  description?: string;
}

interface ToastStore {
  toasts: ToastMessage[];
  addToast: (toast: Omit<ToastMessage, "id">) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  addToast: (toast) => set((state) => ({
    toasts: [...state.toasts, { ...toast, id: Math.random().toString(36).slice(2) }],
  })),
  removeToast: (id) => set((state) => ({
    toasts: state.toasts.filter((t) => t.id !== id),
  })),
  clearToasts: () => set({ toasts: [] }),
}));