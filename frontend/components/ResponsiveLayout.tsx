"use client";

import React from "react";

interface ResponsiveContainerProps {
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
}

/**
 * ResponsiveContainer - A wrapper that provides proper spacing and width constraints
 * across all device sizes. Use this as the main container for dashboard pages.
 */
export function ResponsiveContainer({ children, className = "", noPadding = false }: ResponsiveContainerProps) {
  return (
    <div 
      className={`
        w-full mx-auto
        ${noPadding ? '' : 'px-4 sm:px-6 lg:px-8'}
        ${className}
      `}
    >
      {children}
    </div>
  );
}

/**
 * PageHeader - Responsive page title section with breadcrumbs
 */
interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  breadcrumbs?: { label: string; href?: string }[];
}

export function PageHeader({ title, subtitle, actions, breadcrumbs }: PageHeaderProps) {
  return (
    <div className="mb-6 sm:mb-8">
      {/* Breadcrumbs - hidden on small mobile */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="hidden sm:flex items-center gap-2 text-sm text-slate-500 mb-3">
          {breadcrumbs.map((crumb, i) => (
            <React.Fragment key={i}>
              {i > 0 && <span>/</span>}
              {crumb.href ? (
                <a href={crumb.href} className="hover:text-violet-400 transition-colors">
                  {crumb.label}
                </a>
              ) : (
                <span>{crumb.label}</span>
              )}
            </React.Fragment>
          ))}
        </nav>
      )}
      
      {/* Title and subtitle */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-1 text-sm sm:text-base text-slate-400">
              {subtitle}
            </p>
          )}
        </div>
        
        {/* Actions - stack on mobile, inline on larger screens */}
        {actions && (
          <div className="flex flex-wrap gap-2 sm:gap-3">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Card - Responsive card component
 */
interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: "none" | "sm" | "md" | "lg";
}

export function Card({ children, className = "", padding = "md" }: CardProps) {
  const paddingClasses = {
    none: "",
    sm: "p-3 sm:p-4",
    md: "p-4 sm:p-6",
    lg: "p-6 sm:p-8",
  };
  
  return (
    <div 
      className={`
        bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl
        ${paddingClasses[padding]}
        ${className}
      `}
    >
      {children}
    </div>
  );
}

/**
 * Grid - Responsive grid layout
 */
interface GridProps {
  children: React.ReactNode;
  cols?: {
    default?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  gap?: number;
  className?: string;
}

export function Grid({ 
  children, 
  cols = { default: 1, sm: 2, lg: 3 },
  gap = 4,
  className = "" 
}: GridProps) {
  // Build responsive grid classes
  const baseCols = `grid-cols-${cols.default || 1}`;
  const smCols = cols.sm ? `sm:grid-cols-${cols.sm}` : '';
  const mdCols = cols.md ? `md:grid-cols-${cols.md}` : '';
  const lgCols = cols.lg ? `lg:grid-cols-${cols.lg}` : '';
  const xlCols = cols.xl ? `xl:grid-cols-${cols.xl}` : '';
  
  return (
    <div 
      className={`
        grid ${baseCols} ${smCols} ${mdCols} ${lgCols} ${xlCols}
        gap-${gap}
        ${className}
      `}
    >
      {children}
    </div>
  );
}

/**
 * Stack - Vertical spacing between elements
 */
interface StackProps {
  children: React.ReactNode;
  gap?: number;
  className?: string;
}

export function Stack({ children, gap = 4, className = "" }: StackProps) {
  return (
    <div className={`flex flex-col gap-${gap} ${className}`}>
      {children}
    </div>
  );
}

/**
 * InlineStack - Horizontal layout with gap
 */
interface InlineStackProps {
  children: React.ReactNode;
  gap?: number;
  align?: "center" | "start" | "end" | "stretch";
  justify?: "center" | "start" | "end" | "between" | "around";
  className?: string;
  wrap?: boolean;
}

export function InlineStack({ 
  children, 
  gap = 4, 
  align = "center", 
  justify = "start",
  className = "",
  wrap = false
}: InlineStackProps) {
  const alignClasses = {
    center: "items-center",
    start: "items-start",
    end: "items-end",
    stretch: "items-stretch",
  };
  
  const justifyClasses = {
    center: "justify-center",
    start: "justify-start",
    end: "justify-end",
    between: "justify-between",
    around: "justify-around",
  };
  
  return (
    <div 
      className={`
        flex ${wrap ? 'flex-wrap' : ''} gap-${gap}
        ${alignClasses[align]} ${justifyClasses[justify]}
        ${className}
      `}
    >
      {children}
    </div>
  );
}

/**
 * ResponsiveButton - Button that adapts to touch on mobile
 */
interface ResponsiveButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  children: React.ReactNode;
}

export function ResponsiveButton({ 
  variant = "primary", 
  size = "md",
  fullWidth = false,
  children,
  className = "",
  ...props 
}: ResponsiveButtonProps) {
  const variantClasses = {
    primary: "bg-violet-600 hover:bg-violet-500 text-white",
    secondary: "bg-white/10 hover:bg-white/20 text-white border border-white/10",
    ghost: "hover:bg-white/10 text-slate-300 hover:text-white",
    danger: "bg-red-600 hover:bg-red-500 text-white",
  };
  
  const sizeClasses = {
    sm: "px-3 py-1.5 text-sm min-h-[36px]",
    md: "px-4 py-2 text-sm sm:text-base min-h-[44px]",
    lg: "px-6 py-3 text-base min-h-[48px]",
  };
  
  return (
    <button
      className={`
        inline-flex items-center justify-center gap-2
        rounded-lg font-medium transition-all
        focus:outline-none focus:ring-2 focus:ring-violet-500/50
        disabled:opacity-50 disabled:cursor-not-allowed
        tap-target
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
}

/**
 * Input - Responsive form input
 */
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export function Input({ label, error, icon, className = "", ...props }: InputProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-slate-300 mb-2">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
            {icon}
          </div>
        )}
        <input
          className={`
            w-full px-4 py-3 rounded-xl
            bg-white/5 border border-white/10
            text-white placeholder-slate-500
            focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500
            transition-colors
            ${icon ? 'pl-10' : ''}
            ${error ? 'border-red-500' : ''}
            ${className}
          `}
          {...props}
        />
      </div>
      {error && (
        <p className="mt-1.5 text-sm text-red-400">{error}</p>
      )}
    </div>
  );
}

/**
 * Table - Simple responsive table wrapper
 */
interface TableProps {
  headers: string[];
  children: React.ReactNode;
  className?: string;
}

export function Table({ headers, children, className = "" }: TableProps) {
  return (
    <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
      <div className="min-w-full">
        <table className={`w-full ${className}`}>
          <thead>
            <tr className="border-b border-white/10">
              {headers.map((header, i) => (
                <th 
                  key={i} 
                  className="px-3 sm:px-4 py-3 text-left text-xs sm:text-sm font-medium text-slate-400 uppercase tracking-wider"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {children}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/**
 * EmptyState - Responsive empty state
 */
interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-8 sm:py-12 px-4 text-center">
      {icon && (
        <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-white/5 flex items-center justify-center text-slate-500 mb-4">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      {description && (
        <p className="text-sm sm:text-base text-slate-400 max-w-sm mb-6">{description}</p>
      )}
      {action}
    </div>
  );
}

/**
 * LoadingState - Responsive loading indicator
 */
interface LoadingStateProps {
  text?: string;
  fullScreen?: boolean;
}

export function LoadingState({ text = "Loading...", fullScreen = false }: LoadingStateProps) {
  const content = (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className="w-8 h-8 border-3 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
      <p className="text-sm text-slate-400">{text}</p>
    </div>
  );
  
  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-[var(--bg)] flex items-center justify-center z-50">
        {content}
      </div>
    );
  }
  
  return (
    <div className="flex items-center justify-center py-12">
      {content}
    </div>
  );
}