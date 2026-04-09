"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronRight, ChevronLeft, Check } from "lucide-react";

interface WalkthroughStep {
  target: string;
  title: string;
  content: string;
  position: "top" | "bottom" | "left" | "right";
}

interface WalkthroughProps {
  steps: WalkthroughStep[];
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
}

export function Walkthrough({ steps, isOpen, onClose, onComplete }: WalkthroughProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [hasSkipped, setHasSkipped] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0);
      setHasSkipped(false);
    }
  }, [isOpen]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete?.();
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    setHasSkipped(true);
    onClose();
  };

  if (!isOpen) return null;

  const step = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 z-40" />
      
      {/* Tooltip */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        className="fixed top-1/4 right-8 z-50 w-80"
      >
        <div className="bg-[#0a0a0f] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
            <span className="text-sm text-slate-400">Step {currentStep + 1} of {steps.length}</span>
            <button 
              onClick={handleSkip}
              className="text-slate-500 hover:text-white transition-colors"
            >
              <X size={16} />
            </button>
          </div>
          
          {/* Progress bar */}
          <div className="h-1 bg-white/10">
            <motion.div 
              className="h-full bg-violet-500"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          
          {/* Content */}
          <div className="p-5">
            <h3 className="text-lg font-bold text-white mb-2">{step.title}</h3>
            <p className="text-slate-400 text-sm leading-relaxed">{step.content}</p>
          </div>
          
          {/* Footer */}
          <div className="flex items-center justify-between px-5 py-4 border-t border-white/10">
            <button
              onClick={handlePrev}
              disabled={currentStep === 0}
              className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={16} />
              <span className="text-sm">Back</span>
            </button>
            
            <button
              onClick={handleNext}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 text-white font-medium text-sm hover:bg-violet-500 transition-colors"
            >
              <span>{currentStep === steps.length - 1 ? "Finish" : "Next"}</span>
              {currentStep === steps.length - 1 ? (
                <Check size={16} />
              ) : (
                <ChevronRight size={16} />
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </>
  );
}

// Default walkthrough steps
export const defaultWalkthroughSteps: WalkthroughStep[] = [
  {
    target: "sidebar",
    title: "Navigation Sidebar",
    content: "Access all your workspace areas from here. Click any section to navigate.",
    position: "right",
  },
  {
    target: "search",
    title: "Quick Search",
    content: "Press Cmd+K or Ctrl+K anywhere to quickly search documents, navigate, and more.",
    position: "bottom",
  },
  {
    target: "documents",
    title: "Document Management",
    content: "Upload, organize, and search through all your business documents in one place.",
    position: "right",
  },
  {
    target: "advisor",
    title: "AI Business Advisor",
    content: "Ask questions about your documents and get instant AI-powered answers.",
    position: "right",
  },
  {
    target: "settings",
    title: "Settings & Profile",
    content: "Manage your account, team members, company settings, and integrations.",
    position: "right",
  },
];

// Hook to manage walkthrough state
export function useWalkthrough() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [hasCompleted, setHasCompleted] = useState(false);

  const start = () => setIsOpen(true);
  const stop = () => setIsOpen(false);
  const next = () => setCurrentStep((s) => s + 1);
  const prev = () => setCurrentStep((s) => s - 1);
  const complete = () => {
    setHasCompleted(true);
    setIsOpen(false);
  };

  return {
    isOpen,
    currentStep,
    hasCompleted,
    start,
    stop,
    next,
    prev,
    complete,
  };
}