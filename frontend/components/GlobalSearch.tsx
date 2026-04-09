"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { create } from "zustand";
import { Command } from "cmdk";
import { 
  Search, FileText, Users, Settings, LayoutDashboard, 
  Brain, Shield, Calendar, X, ArrowRight, Bell
} from "lucide-react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

interface SearchResult {
  id: string;
  title: string;
  description?: string;
  icon: React.ReactNode;
  action: () => void;
  category: string;
}

interface SearchStore {
  isOpen: boolean;
  query: string;
  results: SearchResult[];
  isLoading: boolean;
  open: () => void;
  close: () => void;
  setQuery: (query: string) => void;
  setResults: (results: SearchResult[]) => void;
  setLoading: (loading: boolean) => void;
}

export const useSearchStore = create<SearchStore>((set) => ({
  isOpen: false,
  query: "",
  results: [],
  isLoading: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false, query: "", results: [] }),
  setQuery: (query) => set({ query }),
  setResults: (results) => set({ results }),
  setLoading: (isLoading) => set({ isLoading }),
}));

export function GlobalSearch() {
  const router = useRouter();
  const { isOpen, close, query, setQuery, results, setResults, isLoading, setLoading } = useSearchStore();
  const inputRef = useRef<HTMLInputElement>(null);

  const searchItems = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }
    
    setLoading(true);
    
    try {
      // Build search results based on query
      const mockResults: SearchResult[] = [];
      
      // Dashboard items
      if (searchQuery.toLowerCase().includes('dashboard') || searchQuery.toLowerCase().includes('home')) {
        mockResults.push({
          id: 'dashboard',
          title: 'Dashboard',
          description: 'View your dashboard overview',
          icon: <LayoutDashboard size={18} />,
          action: () => router.push('/dashboard'),
          category: 'Navigation',
        });
      }
      
      if (searchQuery.toLowerCase().includes('document') || searchQuery.toLowerCase().includes('file')) {
        mockResults.push({
          id: 'documents',
          title: 'Documents',
          description: 'Browse and manage documents',
          icon: <FileText size={18} />,
          action: () => router.push('/dashboard/documents'),
          category: 'Navigation',
        });
      }
      
      if (searchQuery.toLowerCase().includes('advisor') || searchQuery.toLowerCase().includes('ai')) {
        mockResults.push({
          id: 'advisor',
          title: 'AI Advisor',
          description: 'Ask questions to your AI advisor',
          icon: <Brain size={18} />,
          action: () => router.push('/dashboard/advisor'),
          category: 'Navigation',
        });
      }
      
      if (searchQuery.toLowerCase().includes('compliance') || searchQuery.toLowerCase().includes('legal')) {
        mockResults.push({
          id: 'compliance',
          title: 'Compliance',
          description: 'Check compliance status',
          icon: <Shield size={18} />,
          action: () => router.push('/dashboard/compliance'),
          category: 'Navigation',
        });
      }
      
      if (searchQuery.toLowerCase().includes('calendar') || searchQuery.toLowerCase().includes('schedule')) {
        mockResults.push({
          id: 'calendar',
          title: 'Calendar',
          description: 'View upcoming events',
          icon: <Calendar size={18} />,
          action: () => router.push('/dashboard/calendar'),
          category: 'Navigation',
        });
      }
      
      if (searchQuery.toLowerCase().includes('setting') || searchQuery.toLowerCase().includes('profile')) {
        mockResults.push({
          id: 'settings',
          title: 'Settings',
          description: 'Manage your account settings',
          icon: <Settings size={18} />,
          action: () => router.push('/dashboard/settings'),
          category: 'Navigation',
        });
      }
      
      if (searchQuery.toLowerCase().includes('notification') || searchQuery.toLowerCase().includes('alert')) {
        mockResults.push({
          id: 'notifications',
          title: 'Notifications',
          description: 'View your notifications',
          icon: <Bell size={18} />,
          action: () => router.push('/dashboard/notifications'),
          category: 'Navigation',
        });
      }
      
      if (searchQuery.toLowerCase().includes('analytics') || searchQuery.toLowerCase().includes('report')) {
        mockResults.push({
          id: 'analytics',
          title: 'Analytics',
          description: 'View analytics and reports',
          icon: <Users size={18} />,
          action: () => router.push('/dashboard/analytics'),
          category: 'Navigation',
        });
      }
      
      // Add quick actions
      mockResults.push({
        id: 'upload',
        title: 'Upload Document',
        description: 'Upload a new document',
        icon: <ArrowRight size={18} />,
        action: () => router.push('/dashboard/documents?action=upload'),
        category: 'Quick Actions',
      });
      
      setResults(mockResults);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  }, [router, setResults, setLoading]);

  // Keyboard shortcut - Cmd+K or Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        useSearchStore.getState().open();
      }
      if (e.key === 'Escape') {
        close();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [close]);

  // Search on query change
  useEffect(() => {
    const timer = setTimeout(() => {
      searchItems(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query, searchItems]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={close}
          />
          
          {/* Command Palette */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.2 }}
            className="fixed top-[20%] left-1/2 -translate-x-1/2 w-full max-w-xl z-50"
          >
            <Command 
              className="rounded-2xl border border-white/10 bg-[#0a0a0f]/95 backdrop-blur-xl shadow-2xl overflow-hidden"
              style={{ background: "linear-gradient(180deg, rgba(15,15,25,0.98) 0%, rgba(10,10,18,0.98) 100%)" }}
            >
              {/* Search Input */}
              <div className="flex items-center gap-3 px-5 py-4 border-b border-white/10">
                <Search size={20} className="text-slate-400" />
                <Command.Input
                  ref={inputRef}
                  value={query}
                  onValueChange={setQuery}
                  placeholder="Search anything..."
                  className="flex-1 bg-transparent text-white placeholder-slate-500 outline-none text-lg"
                  autoFocus
                />
                {query && (
                  <button onClick={() => setQuery("")} className="text-slate-500 hover:text-white transition-colors">
                    <X size={18} />
                  </button>
                )}
                <kbd className="hidden sm:inline-flex px-2 py-1 rounded-md bg-white/10 text-slate-400 text-xs">
                  ESC
                </kbd>
              </div>

              {/* Results */}
              <Command.List className="max-h-[400px] overflow-y-auto p-3">
                {isLoading ? (
                  <div className="py-8 text-center text-slate-500">
                    <div className="w-6 h-6 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin mx-auto mb-3" />
                    Searching...
                  </div>
                ) : results.length === 0 && query ? (
                  <div className="py-8 text-center text-slate-500">
                    <p>No results found for &quot;{query}&quot;</p>
                  </div>
                ) : results.length === 0 ? (
                  <div className="py-8 text-center text-slate-500">
                    <p className="mb-4">Type to search or try:</p>
                    <div className="flex flex-wrap justify-center gap-2">
                      {['Dashboard', 'Documents', 'AI Advisor', 'Settings'].map((term) => (
                        <button
                          key={term}
                          onClick={() => setQuery(term)}
                          className="px-3 py-1.5 rounded-full bg-white/5 text-slate-400 text-sm hover:bg-white/10 transition-colors"
                        >
                          {term}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Group by category */}
                    {Array.from(new Set(results.map(r => r.category))).map((category) => (
                      <Command.Group 
                        key={category} 
                        heading={category}
                        className="mb-3"
                      >
                        <div className="px-3 py-2 text-xs font-medium text-slate-500 uppercase tracking-wider">
                          {category}
                        </div>
                        {results.filter(r => r.category === category).map((item) => (
                          <Command.Item
                            key={item.id}
                            value={item.title}
                            onSelect={item.action}
                            className="flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer transition-all mx-1
                              data-[selected=true]:bg-violet-500/15 
                              data-[selected=true]:text-white
                              text-slate-300 hover:bg-white/5"
                          >
                            <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center text-slate-400">
                              {item.icon}
                            </div>
                            <div className="flex-1">
                              <p className="font-medium">{item.title}</p>
                              {item.description && (
                                <p className="text-sm text-slate-500">{item.description}</p>
                              )}
                            </div>
                            <ArrowRight size={16} className="text-slate-600" />
                          </Command.Item>
                        ))}
                      </Command.Group>
                    ))}
                  </>
                )}
              </Command.List>

              {/* Footer */}
              <div className="flex items-center justify-between px-5 py-3 border-t border-white/10 text-xs text-slate-500">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1.5">
                    <kbd className="px-1.5 py-0.5 rounded bg-white/10">↵</kbd> to select
                  </span>
                  <span className="flex items-center gap-1.5">
                    <kbd className="px-1.5 py-0.5 rounded bg-white/10">↑↓</kbd> to navigate
                  </span>
                </div>
                <span>Powered by AdvisorAI</span>
              </div>
            </Command>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Hook to trigger search from anywhere
export function useGlobalSearch() {
  return useSearchStore((state) => state.open);
}