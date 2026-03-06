import * as React from 'react';
import { cn } from '@/lib/utils';
import type { ProductStatusType } from '@/types/tmf637';

const statusStyles: Record<ProductStatusType, string> = {
  created: 'bg-blue-100 text-blue-800',
  active: 'bg-green-100 text-green-800',
  suspended: 'bg-yellow-100 text-yellow-800',
  terminated: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-700',
  pendingActive: 'bg-orange-100 text-orange-800',
  pendingTerminate: 'bg-orange-100 text-orange-800',
  aborted: 'bg-red-100 text-red-800',
};

interface StatusBadgeProps {
  status?: ProductStatusType | string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const style = status && status in statusStyles
    ? statusStyles[status as ProductStatusType]
    : 'bg-gray-100 text-gray-700';

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        style,
        className
      )}
    >
      {status ?? 'unknown'}
    </span>
  );
}

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  const variantStyles = {
    default: 'bg-blue-600 text-white',
    secondary: 'bg-gray-100 text-gray-700',
    destructive: 'bg-red-500 text-white',
    outline: 'border border-gray-300 text-gray-700',
  };
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        variantStyles[variant],
        className
      )}
      {...props}
    />
  );
}
