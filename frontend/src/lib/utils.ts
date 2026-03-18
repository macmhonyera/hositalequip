import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow, isValid, parseISO } from 'date-fns';
import {
  EquipmentStatus,
  BreakdownStatus,
  BreakdownSeverity,
  MaintenanceStatus,
  UserRole,
  UserStatus,
} from '@/types';

// ─── Class Merge Utility ──────────────────────────────────────────────────────

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ─── Date Formatters ──────────────────────────────────────────────────────────

export function formatDate(date: string | Date | undefined | null, fmt = 'MMM d, yyyy'): string {
  if (!date) return '—';
  const parsed = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(parsed)) return '—';
  return format(parsed, fmt);
}

export function formatDateTime(date: string | Date | undefined | null): string {
  return formatDate(date, 'MMM d, yyyy HH:mm');
}

export function formatRelative(date: string | Date | undefined | null): string {
  if (!date) return '—';
  const parsed = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(parsed)) return '—';
  return formatDistanceToNow(parsed, { addSuffix: true });
}

// ─── Currency ─────────────────────────────────────────────────────────────────

export function formatCurrency(value: number | undefined | null, currency = 'USD'): string {
  if (value === undefined || value === null) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

// ─── Number formatter ─────────────────────────────────────────────────────────

export function formatNumber(value: number | undefined | null): string {
  if (value === undefined || value === null) return '0';
  return new Intl.NumberFormat('en').format(value);
}

// ─── Equipment Status ─────────────────────────────────────────────────────────

export interface BadgeConfig {
  label: string;
  className: string;
}

export function getEquipmentStatusBadge(status: EquipmentStatus): BadgeConfig {
  const map: Record<EquipmentStatus, BadgeConfig> = {
    [EquipmentStatus.ACTIVE]: {
      label: 'Active',
      className: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    },
    [EquipmentStatus.FAULTY]: {
      label: 'Faulty',
      className: 'bg-red-100 text-red-700 border-red-200',
    },
    [EquipmentStatus.UNDER_MAINTENANCE]: {
      label: 'Under Maintenance',
      className: 'bg-amber-100 text-amber-700 border-amber-200',
    },
    [EquipmentStatus.DECOMMISSIONED]: {
      label: 'Decommissioned',
      className: 'bg-slate-100 text-slate-600 border-slate-200',
    },
    [EquipmentStatus.AWAITING_REPAIR]: {
      label: 'Awaiting Repair',
      className: 'bg-blue-100 text-blue-700 border-blue-200',
    },
  };
  return map[status] ?? { label: status, className: 'bg-slate-100 text-slate-600' };
}

// ─── Breakdown Status ─────────────────────────────────────────────────────────

export function getBreakdownStatusBadge(status: BreakdownStatus): BadgeConfig {
  const map: Record<BreakdownStatus, BadgeConfig> = {
    [BreakdownStatus.OPEN]: {
      label: 'Open',
      className: 'bg-red-100 text-red-700 border-red-200',
    },
    [BreakdownStatus.ASSIGNED]: {
      label: 'Assigned',
      className: 'bg-blue-100 text-blue-700 border-blue-200',
    },
    [BreakdownStatus.IN_PROGRESS]: {
      label: 'In Progress',
      className: 'bg-amber-100 text-amber-700 border-amber-200',
    },
    [BreakdownStatus.RESOLVED]: {
      label: 'Resolved',
      className: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    },
    [BreakdownStatus.CLOSED]: {
      label: 'Closed',
      className: 'bg-slate-100 text-slate-600 border-slate-200',
    },
    [BreakdownStatus.ESCALATED]: {
      label: 'Escalated',
      className: 'bg-purple-100 text-purple-700 border-purple-200',
    },
  };
  return map[status] ?? { label: status, className: 'bg-slate-100 text-slate-600' };
}

// ─── Breakdown Severity ───────────────────────────────────────────────────────

export function getSeverityBadge(severity: BreakdownSeverity): BadgeConfig {
  const map: Record<BreakdownSeverity, BadgeConfig> = {
    [BreakdownSeverity.LOW]: {
      label: 'Low',
      className: 'bg-slate-100 text-slate-600 border-slate-200',
    },
    [BreakdownSeverity.MEDIUM]: {
      label: 'Medium',
      className: 'bg-amber-100 text-amber-700 border-amber-200',
    },
    [BreakdownSeverity.HIGH]: {
      label: 'High',
      className: 'bg-orange-100 text-orange-700 border-orange-200',
    },
    [BreakdownSeverity.CRITICAL]: {
      label: 'Critical',
      className: 'bg-red-100 text-red-700 border-red-200',
    },
  };
  return map[severity] ?? { label: severity, className: 'bg-slate-100 text-slate-600' };
}

// ─── Maintenance Status ───────────────────────────────────────────────────────

export function getMaintenanceStatusBadge(status: MaintenanceStatus): BadgeConfig {
  const map: Record<MaintenanceStatus, BadgeConfig> = {
    [MaintenanceStatus.SCHEDULED]: {
      label: 'Scheduled',
      className: 'bg-blue-100 text-blue-700 border-blue-200',
    },
    [MaintenanceStatus.IN_PROGRESS]: {
      label: 'In Progress',
      className: 'bg-amber-100 text-amber-700 border-amber-200',
    },
    [MaintenanceStatus.COMPLETED]: {
      label: 'Completed',
      className: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    },
    [MaintenanceStatus.CANCELLED]: {
      label: 'Cancelled',
      className: 'bg-red-100 text-red-700 border-red-200',
    },
    [MaintenanceStatus.DEFERRED]: {
      label: 'Deferred',
      className: 'bg-slate-100 text-slate-600 border-slate-200',
    },
  };
  return map[status] ?? { label: status, className: 'bg-slate-100 text-slate-600' };
}

// ─── User Role / Status ───────────────────────────────────────────────────────

export function getRoleBadge(role: UserRole): BadgeConfig {
  const map: Record<UserRole, BadgeConfig> = {
    [UserRole.ADMIN]: {
      label: 'Admin',
      className: 'bg-purple-100 text-purple-700 border-purple-200',
    },
    [UserRole.TECHNICIAN]: {
      label: 'Technician',
      className: 'bg-blue-100 text-blue-700 border-blue-200',
    },
    [UserRole.GUEST]: {
      label: 'Guest',
      className: 'bg-slate-100 text-slate-600 border-slate-200',
    },
  };
  return map[role] ?? { label: role, className: 'bg-slate-100 text-slate-600' };
}

export function getUserStatusBadge(status: UserStatus): BadgeConfig {
  const map: Record<UserStatus, BadgeConfig> = {
    [UserStatus.ACTIVE]: {
      label: 'Active',
      className: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    },
    [UserStatus.INACTIVE]: {
      label: 'Inactive',
      className: 'bg-slate-100 text-slate-600 border-slate-200',
    },
    [UserStatus.SUSPENDED]: {
      label: 'Suspended',
      className: 'bg-red-100 text-red-700 border-red-200',
    },
  };
  return map[status] ?? { label: status, className: 'bg-slate-100 text-slate-600' };
}

// ─── Miscellaneous ────────────────────────────────────────────────────────────

export function getInitials(firstName?: string, lastName?: string): string {
  const f = firstName?.[0] ?? '';
  const l = lastName?.[0] ?? '';
  return (f + l).toUpperCase() || '?';
}

export function truncate(str: string, max = 50): string {
  if (str.length <= max) return str;
  return str.slice(0, max) + '…';
}

export function daysBetween(dateA: string | Date, dateB: string | Date = new Date()): number {
  const a = typeof dateA === 'string' ? parseISO(dateA) : dateA;
  const b = typeof dateB === 'string' ? parseISO(dateB) : dateB;
  return Math.floor((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}
