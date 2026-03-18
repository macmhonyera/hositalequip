// ─── Enums ───────────────────────────────────────────────────────────────────

export enum EquipmentStatus {
  ACTIVE = 'active',
  FAULTY = 'faulty',
  UNDER_MAINTENANCE = 'under_maintenance',
  DECOMMISSIONED = 'decommissioned',
  AWAITING_REPAIR = 'awaiting_repair',
}

export enum MaintenanceFrequency {
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  SEMI_ANNUAL = 'semi_annual',
  ANNUAL = 'annual',
}

export enum MaintenanceType {
  PREVENTIVE = 'preventive',
  CORRECTIVE = 'corrective',
  CALIBRATION = 'calibration',
  INSPECTION = 'inspection',
  EMERGENCY = 'emergency',
}

export enum MaintenanceStatus {
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  DEFERRED = 'deferred',
}

export enum BreakdownSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum BreakdownStatus {
  OPEN = 'open',
  ASSIGNED = 'assigned',
  IN_PROGRESS = 'in_progress',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
  ESCALATED = 'escalated',
}

export enum UserRole {
  ADMIN = 'admin',
  TECHNICIAN = 'technician',
  GUEST = 'guest',
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
}

export enum DepartmentType {
  ICU = 'ICU',
  THEATRE = 'Theatre',
  WARD = 'Ward',
  EMERGENCY = 'Emergency',
  RADIOLOGY = 'Radiology',
  LABORATORY = 'Laboratory',
  PHARMACY = 'Pharmacy',
  OUTPATIENT = 'Outpatient',
  OTHER = 'Other',
}

export enum CommentType {
  COMMENT = 'comment',
  COMPLAINT = 'complaint',
  OBSERVATION = 'observation',
  RECOMMENDATION = 'recommendation',
}

// ─── Location Interfaces ──────────────────────────────────────────────────────

export interface Department {
  id: string;
  name: string;
  type: DepartmentType;
  hospital?: Hospital;
  hospitalId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Hospital {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  district?: District;
  districtId?: string;
  departments?: Department[];
  createdAt: string;
  updatedAt: string;
}

export interface District {
  id: string;
  name: string;
  province?: Province;
  provinceId?: string;
  hospitals?: Hospital[];
  createdAt: string;
  updatedAt: string;
}

export interface Province {
  id: string;
  name: string;
  districts?: District[];
  createdAt: string;
  updatedAt: string;
}

export interface LocationTree extends Province {
  districts: (District & {
    hospitals: (Hospital & {
      departments: Department[];
    })[];
  })[];
}

// ─── User Interfaces ──────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  status: UserStatus;
  phone?: string;
  department?: Department;
  departmentId?: string;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserStats {
  totalMaintenanceRecords: number;
  completedMaintenance: number;
  openBreakdowns: number;
  resolvedBreakdowns: number;
}

// ─── Equipment Interfaces ─────────────────────────────────────────────────────

export interface SparePart {
  id: string;
  name: string;
  quantity: number;
  unitCost: number;
}

export interface Equipment {
  id: string;
  name: string;
  serialNumber: string;
  model?: string;
  brand?: string;
  type?: string;
  supplierName?: string;
  status: EquipmentStatus;
  maintenanceFrequency?: MaintenanceFrequency;
  lastServiceDate?: string;
  nextServiceDate?: string;
  dateOfCommission?: string;
  purchaseCost?: number;
  warrantyExpiryDate?: string;
  notes?: string;
  maintenanceOverdue?: boolean;
  hospital?: Hospital;
  hospitalId?: string;
  department?: Department;
  departmentId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EquipmentStats {
  total: number;
  active: number;
  faulty: number;
  underMaintenance: number;
  awaiting: number;
  decommissioned: number;
  maintenanceOverdue: number;
}

// ─── Maintenance Interfaces ───────────────────────────────────────────────────

export interface MaintenanceRecord {
  id: string;
  equipment?: Equipment;
  equipmentId: string;
  technician?: User;
  technicianId?: string;
  type: MaintenanceType;
  status: MaintenanceStatus;
  scheduledDate: string;
  startDate?: string;
  completionDate?: string;
  workDescription?: string;
  findings?: string;
  recommendations?: string;
  laborCost?: number;
  totalCost?: number;
  spareParts?: SparePart[];
  createdAt: string;
  updatedAt: string;
}

export interface MaintenanceStats {
  total: number;
  scheduled: number;
  inProgress: number;
  completed: number;
  cancelled: number;
  deferred: number;
  overdue: number;
  totalCost: number;
}

// ─── Breakdown Interfaces ─────────────────────────────────────────────────────

export interface Breakdown {
  id: string;
  equipment?: Equipment;
  equipmentId: string;
  reportedBy?: string;
  assignedTechnician?: User;
  assignedTechnicianId?: string;
  severity: BreakdownSeverity;
  status: BreakdownStatus;
  issueDescription: string;
  resolutionNotes?: string;
  rootCause?: string;
  dateReported: string;
  dateResolved?: string;
  repairCost?: number;
  downtime?: number;
  issueCategories?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface BreakdownStats {
  total: number;
  open: number;
  assigned: number;
  inProgress: number;
  resolved: number;
  closed: number;
  escalated: number;
  critical: number;
}

// ─── Comment Interfaces ───────────────────────────────────────────────────────

export interface Comment {
  id: string;
  equipment?: Equipment;
  equipmentId: string;
  author?: User;
  authorId: string;
  type: CommentType;
  content: string;
  isResolved: boolean;
  resolvedBy?: User;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Pagination ───────────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ─── Dashboard / Reports ──────────────────────────────────────────────────────

export interface RecentActivity {
  id: string;
  type: 'maintenance' | 'breakdown' | 'equipment' | 'comment';
  description: string;
  timestamp: string;
  entityId?: string;
}

export interface TopFaultyEquipment {
  id: string;
  name: string;
  serialNumber: string;
  breakdownCount: number;
  lastBreakdown?: string;
}

export interface DashboardStats {
  totalEquipment: number;
  activeEquipment: number;
  faultyEquipment: number;
  maintenanceOverdue: number;
  openBreakdowns: number;
  criticalBreakdowns: number;
  totalMaintenanceCost: number;
  thisMonthMaintenance: number;
  resolvedThisMonth: number;
  topFaultyEquipment: TopFaultyEquipment[];
  recentActivity: RecentActivity[];
}

// ─── Auth Interfaces ──────────────────────────────────────────────────────────

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: UserRole;
  departmentId?: string;
}

// ─── API Query Params ─────────────────────────────────────────────────────────

export interface EquipmentQueryParams {
  page?: number;
  limit?: number;
  status?: EquipmentStatus | '';
  hospital?: string;
  department?: string;
  search?: string;
}

export interface MaintenanceQueryParams {
  page?: number;
  limit?: number;
  equipmentId?: string;
  technicianId?: string;
  status?: MaintenanceStatus | '';
  type?: MaintenanceType | '';
}

export interface BreakdownQueryParams {
  page?: number;
  limit?: number;
  status?: BreakdownStatus | '';
  severity?: BreakdownSeverity | '';
  equipmentId?: string;
}

export interface CommentQueryParams {
  equipmentId?: string;
  type?: CommentType | '';
}

export interface UsersQueryParams {
  page?: number;
  limit?: number;
  role?: UserRole | '';
  status?: UserStatus | '';
  search?: string;
}
