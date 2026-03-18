import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

type ColorVariant = 'indigo' | 'emerald' | 'amber' | 'red' | 'blue' | 'purple' | 'slate';
type Trend = 'up' | 'down' | 'neutral';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: Trend;
  trendValue?: string;
  color?: ColorVariant;
  subtitle?: string;
  className?: string;
}

const colorMap: Record<ColorVariant, { icon: string; bg: string }> = {
  indigo: { icon: 'text-primary-600', bg: 'bg-primary-50' },
  emerald: { icon: 'text-emerald-600', bg: 'bg-emerald-50' },
  amber: { icon: 'text-amber-600', bg: 'bg-amber-50' },
  red: { icon: 'text-red-600', bg: 'bg-red-50' },
  blue: { icon: 'text-blue-600', bg: 'bg-blue-50' },
  purple: { icon: 'text-purple-600', bg: 'bg-purple-50' },
  slate: { icon: 'text-slate-600', bg: 'bg-slate-100' },
};

const trendConfig = {
  up: { icon: TrendingUp, text: 'text-emerald-600', bg: 'bg-emerald-50' },
  down: { icon: TrendingDown, text: 'text-red-600', bg: 'bg-red-50' },
  neutral: { icon: Minus, text: 'text-slate-500', bg: 'bg-slate-100' },
};

export function StatCard({
  label,
  value,
  icon,
  trend,
  trendValue,
  color = 'indigo',
  subtitle,
  className,
}: StatCardProps) {
  const colors = colorMap[color];
  const TrendIcon = trend ? trendConfig[trend].icon : null;

  return (
    <div
      className={cn(
        'bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex items-start justify-between gap-4',
        className
      )}
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-500 truncate">{label}</p>
        <p className="mt-1 text-3xl font-bold text-slate-900 tracking-tight">
          {value}
        </p>
        {trend && trendValue && TrendIcon && (
          <div className="mt-2 flex items-center gap-1">
            <span className={cn('flex items-center gap-1 text-xs font-medium px-1.5 py-0.5 rounded-md', trendConfig[trend].bg, trendConfig[trend].text)}>
              <TrendIcon className="w-3 h-3" />
              {trendValue}
            </span>
            {subtitle && <span className="text-xs text-slate-400">{subtitle}</span>}
          </div>
        )}
        {!trend && subtitle && (
          <p className="mt-1 text-xs text-slate-400">{subtitle}</p>
        )}
      </div>
      <div className={cn('p-3 rounded-xl shrink-0', colors.bg)}>
        <div className={cn('w-6 h-6', colors.icon)}>{icon}</div>
      </div>
    </div>
  );
}
