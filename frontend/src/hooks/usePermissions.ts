import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types';

export interface Permissions {
  // Role flags
  isAdmin: boolean;
  isTechnician: boolean;
  isGuest: boolean;

  // Equipment
  canCreateEquipment: boolean;   // ADMIN, TECHNICIAN
  canEditEquipment: boolean;     // ADMIN, TECHNICIAN
  canDeleteEquipment: boolean;   // ADMIN only
  canUpdateEquipmentStatus: boolean; // ADMIN, TECHNICIAN

  // Maintenance
  canCreateMaintenance: boolean; // ADMIN, TECHNICIAN
  canEditMaintenance: boolean;   // ADMIN, TECHNICIAN
  canDeleteMaintenance: boolean; // ADMIN only

  // Breakdowns
  canReportBreakdown: boolean;   // ADMIN, TECHNICIAN
  canAssignTechnician: boolean;  // ADMIN, TECHNICIAN
  canUpdateBreakdown: boolean;   // ADMIN, TECHNICIAN
  canDeleteBreakdown: boolean;   // ADMIN only

  // Locations
  canManageLocations: boolean;   // ADMIN only

  // Users
  canManageUsers: boolean;       // ADMIN only

  // Comments
  canAddComment: boolean;        // ALL roles
  canResolveComment: boolean;    // ADMIN, TECHNICIAN

  // Reports
  canViewReports: boolean;       // ALL roles
  canExportReports: boolean;     // ADMIN only
}

export function usePermissions(): Permissions {
  const { user } = useAuth();
  const role = user?.role;

  const isAdmin = role === UserRole.ADMIN;
  const isTechnician = role === UserRole.TECHNICIAN;
  const isGuest = role === UserRole.GUEST;
  const isStaff = isAdmin || isTechnician;

  return {
    isAdmin,
    isTechnician,
    isGuest,

    canCreateEquipment: isStaff,
    canEditEquipment: isStaff,
    canDeleteEquipment: isAdmin,
    canUpdateEquipmentStatus: isStaff,

    canCreateMaintenance: isStaff,
    canEditMaintenance: isStaff,
    canDeleteMaintenance: isAdmin,

    canReportBreakdown: isStaff,
    canAssignTechnician: isStaff,
    canUpdateBreakdown: isStaff,
    canDeleteBreakdown: isAdmin,

    canManageLocations: isAdmin,
    canManageUsers: isAdmin,

    canAddComment: true,
    canResolveComment: isStaff,

    canViewReports: true,
    canExportReports: isAdmin,
  };
}
