"use client";

import { useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
  alt?: boolean;
  action: () => void;
  description: string;
}

export function useKeyboardShortcuts() {
  const router = useRouter();

  const shortcuts: KeyboardShortcut[] = [
    // Global - Ctrl/Cmd + keys
    { key: "k", ctrl: true, action: () => import("@/components/GlobalSearch").then(m => m.useGlobalSearch()()), description: "Open search" },
    { key: "s", ctrl: true, action: () => router.push("/dashboard/settings"), description: "Go to Settings" },
    { key: "d", ctrl: true, action: () => router.push("/dashboard"), description: "Go to Dashboard" },
    { key: "/", ctrl: true, action: () => {}, description: "Show shortcuts" },
    
    // Navigation - single keys (when not in input)
    { key: "g", shift: true, action: () => router.push("/dashboard/documents"), description: "Go to Documents" },
    { key: "g", alt: true, action: () => router.push("/dashboard/advisor"), description: "Go to Advisor" },
  ];

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Don't trigger if typing in an input
    const target = e.target as HTMLElement;
    if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
      return;
    }

    // Check for matching shortcut
    for (const shortcut of shortcuts) {
      const keyMatch = e.key.toLowerCase() === shortcut.key.toLowerCase();
      const ctrlMatch = shortcut.ctrl ? (e.ctrlKey || e.metaKey) : true;
      const metaMatch = shortcut.meta ? e.metaKey : true;
      const shiftMatch = shortcut.shift ? e.shiftKey : !e.shiftKey;
      const altMatch = shortcut.alt ? e.altKey : !e.altKey;

      if (keyMatch && ctrlMatch && metaMatch && shiftMatch && altMatch) {
        e.preventDefault();
        shortcut.action();
        return;
      }
    }
  }, [shortcuts, router]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
}

// Component to show keyboard shortcuts help
export function KeyboardShortcutsHelp({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const shortcuts = [
    { keys: ["⌘", "K"], description: "Open global search" },
    { keys: ["⌘", "S"], description: "Go to Settings" },
    { keys: ["⌘", "D"], description: "Go to Dashboard" },
    { keys: ["⌘", "G"], description: "Go to Documents" },
    { keys: ["⌘", "Alt", "G"], description: "Go to AI Advisor" },
    { keys: ["?"], description: "Show this help" },
    { keys: ["Esc"], description: "Close dialogs" },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center" onClick={onClose}>
      <div 
        className="bg-[#0a0a0f] border border-white/10 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold text-white mb-4">Keyboard Shortcuts</h2>
        <div className="space-y-3">
          {shortcuts.map((item, i) => (
            <div key={i} className="flex items-center justify-between">
              <span className="text-slate-400">{item.description}</span>
              <div className="flex items-center gap-1">
                {item.keys.map((key, j) => (
                  <kbd 
                    key={j} 
                    className="px-2 py-1 rounded-md bg-white/10 text-slate-300 text-sm font-mono"
                  >
                    {key}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}