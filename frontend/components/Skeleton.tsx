"use client";

interface SkeletonProps {
  className?: string;
  variant?: "text" | "circular" | "rectangular";
  width?: string | number;
  height?: string | number;
}

export function Skeleton({ className = "", variant = "rectangular", width, height }: SkeletonProps) {
  const variantClasses = {
    text: "rounded",
    circular: "rounded-full",
    rectangular: "rounded-xl",
  };

  return (
    <div
      className={`animate-pulse bg-white/10 ${variantClasses[variant]} ${className}`}
      style={{ width, height }}
    />
  );
}

// Pre-built skeleton components for common patterns

export function CardSkeleton() {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
      <div className="flex items-center gap-4 mb-4">
        <Skeleton variant="circular" width={48} height={48} />
        <div className="flex-1">
          <Skeleton variant="text" width="60%" height={20} className="mb-2" />
          <Skeleton variant="text" width="40%" height={14} />
        </div>
      </div>
      <Skeleton variant="text" width="100%" height={16} className="mb-2" />
      <Skeleton variant="text" width="80%" height={16} />
    </div>
  );
}

export function ListItemSkeleton() {
  return (
    <div className="flex items-center gap-4 p-4">
      <Skeleton variant="circular" width={40} height={40} />
      <div className="flex-1">
        <Skeleton variant="text" width="50%" height={18} className="mb-2" />
        <Skeleton variant="text" width="30%" height={14} />
      </div>
      <Skeleton variant="rectangular" width={80} height={32} />
    </div>
  );
}

export function TableRowSkeleton({ columns = 4 }: { columns?: number }) {
  return (
    <tr className="border-b border-white/5">
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="py-4 px-4">
          <Skeleton variant="text" width={Math.random() * 60 + 40} height={16} />
        </td>
      ))}
    </tr>
  );
}

export function DocumentCardSkeleton() {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
      <div className="flex items-start gap-3 mb-3">
        <Skeleton variant="rectangular" width={40} height={40} className="rounded-lg" />
        <div className="flex-1">
          <Skeleton variant="text" width="70%" height={18} className="mb-2" />
          <Skeleton variant="text" width="40%" height={12} />
        </div>
      </div>
      <div className="flex gap-2 mt-3">
        <Skeleton variant="rectangular" width={60} height={24} className="rounded-full" />
        <Skeleton variant="rectangular" width={60} height={24} className="rounded-full" />
      </div>
    </div>
  );
}

export function AnalyticsChartSkeleton() {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <Skeleton variant="text" width={150} height={24} />
        <div className="flex gap-2">
          <Skeleton variant="rectangular" width={60} height={32} className="rounded-lg" />
          <Skeleton variant="rectangular" width={60} height={32} className="rounded-lg" />
        </div>
      </div>
      <div className="flex items-end gap-2 h-40">
        {Array.from({ length: 12 }).map((_, i) => (
          <Skeleton 
            key={i} 
            variant="rectangular" 
            width="100%" 
            height={`${Math.random() * 60 + 20}%`} 
            className="flex-1"
          />
        ))}
      </div>
    </div>
  );
}

export function ChatMessageSkeleton({ isUser = false }: { isUser?: boolean }) {
  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
      <Skeleton variant="circular" width={32} height={32} />
      <div className={`max-w-[70%] ${isUser ? "items-end" : "items-start"}`}>
        <Skeleton 
          variant="rectangular" 
          width={Math.random() * 100 + 100} 
          height={60} 
          className="rounded-2xl"
        />
      </div>
    </div>
  );
}

export function StatsCardSkeleton() {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <Skeleton variant="circular" width={48} height={48} />
        <Skeleton variant="rectangular" width={60} height={24} className="rounded-full" />
      </div>
      <Skeleton variant="text" width="50%" height={32} className="mb-2" />
      <Skeleton variant="text" width="70%" height={14} />
    </div>
  );
}