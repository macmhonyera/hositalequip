import { cn } from '@/lib/utils';
import {
  getEquipmentStatusBadge,
  getBreakdownStatusBadge,
  getMaintenanceStatusBadge,
  getSeverityBadge,
  getRoleBadge,
  getUserStatusBadge,
} from '@/lib/utils';
import type {
  EquipmentStatus,
  BreakdownStatus,
  BreakdownSeverity,
  MaintenanceStatus,
  UserRole,
  UserStatus,
} from '@/types';

interface BadgeProps {
  className?: string;
  children: React.ReactNode;
}

export function Badge({ className, children }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
        className
      )}
    >
      {children}
    </span>
  );
}

export function EquipmentStatusBadge({ status }: { status: EquipmentStatus }) {
  const cfg = getEquipmentStatusBadge(status);
  return <Badge className={cfg.className}>{cfg.label}</Badge>;
}

export function BreakdownStatusBadge({ status }: { status: BreakdownStatus }) {
  const cfg = getBreakdownStatusBadge(status);
  return <Badge className={cfg.className}>{cfg.label}</Badge>;
}

export function MaintenanceStatusBadge({ status }: { status: MaintenanceStatus }) {
  const cfg = getMaintenanceStatusBadge(status);
  return <Badge className={cfg.className}>{cfg.label}</Badge>;
}

export function SeverityBadge({ severity }: { severity: BreakdownSeverity }) {
  const cfg = getSeverityBadge(severity);
  return <Badge className={cfg.className}>{cfg.label}</Badge>;
}

export function RoleBadge({ role }: { role: UserRole }) {
  const cfg = getRoleBadge(role);
  return <Badge className={cfg.className}>{cfg.label}</Badge>;
}

export function UserStatusBadge({ status }: { status: UserStatus }) {
  const cfg = getUserStatusBadge(status);
  return <Badge className={cfg.className}>{cfg.label}</Badge>;
}
