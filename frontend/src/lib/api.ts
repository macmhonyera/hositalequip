import axios from 'axios';
import type {
  LoginRequest,
  LoginResponse,
  User,
  Equipment,
  EquipmentStats,
  EquipmentQueryParams,
  MaintenanceRecord,
  MaintenanceStats,
  MaintenanceQueryParams,
  Breakdown,
  BreakdownStats,
  BreakdownQueryParams,
  LocationTree,
  Hospital,
  Department,
  Province,
  District,
  Comment,
  CommentQueryParams,
  PaginatedResponse,
  DashboardStats,
  UserStats,
  UsersQueryParams,
  RegisterRequest,
} from '@/types';

// ─── Axios Instance ───────────────────────────────────────────────────────────

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  headers: { 'Content-Type': 'application/json' },
});

// ─── Request Interceptor: attach JWT ─────────────────────────────────────────

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── Response Interceptor: unwrap envelope + handle 401 ──────────────────────

api.interceptors.response.use(
  (response) => {
    // Backend wraps all responses in { success, data, timestamp }
    if (response.data && typeof response.data === 'object' && 'data' in response.data) {
      response.data = response.data.data;
    }
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const authApi = {
  login: (data: LoginRequest) =>
    api.post<LoginResponse>('/auth/login', data).then((r) => r.data),

  register: (data: RegisterRequest) =>
    api.post<LoginResponse>('/auth/register', data).then((r) => r.data),

  getProfile: () =>
    api.get<User>('/auth/profile').then((r) => r.data),
};

// ─── Equipment ────────────────────────────────────────────────────────────────

export const equipmentApi = {
  list: (params?: EquipmentQueryParams) =>
    api.get<PaginatedResponse<Equipment>>('/equipment', { params }).then((r) => r.data),

  getStats: () =>
    api.get<EquipmentStats>('/equipment/stats').then((r) => r.data),

  getById: (id: string) =>
    api.get<Equipment>(`/equipment/${id}`).then((r) => r.data),

  create: (data: Partial<Equipment>) =>
    api.post<Equipment>('/equipment', data).then((r) => r.data),

  update: (id: string, data: Partial<Equipment>) =>
    api.patch<Equipment>(`/equipment/${id}`, data).then((r) => r.data),

  updateStatus: (id: string, status: string) =>
    api.patch<Equipment>(`/equipment/${id}/status`, { status }).then((r) => r.data),

  delete: (id: string) =>
    api.delete(`/equipment/${id}`).then((r) => r.data),
};

// ─── Maintenance ──────────────────────────────────────────────────────────────

export const maintenanceApi = {
  list: (params?: MaintenanceQueryParams) =>
    api.get<PaginatedResponse<MaintenanceRecord>>('/maintenance', { params }).then((r) => r.data),

  getStats: () =>
    api.get<MaintenanceStats>('/maintenance/stats').then((r) => r.data),

  getById: (id: string) =>
    api.get<MaintenanceRecord>(`/maintenance/${id}`).then((r) => r.data),

  create: (data: Partial<MaintenanceRecord>) =>
    api.post<MaintenanceRecord>('/maintenance', data).then((r) => r.data),

  update: (id: string, data: Partial<MaintenanceRecord>) =>
    api.patch<MaintenanceRecord>(`/maintenance/${id}`, data).then((r) => r.data),

  delete: (id: string) =>
    api.delete(`/maintenance/${id}`).then((r) => r.data),
};

// ─── Breakdowns ───────────────────────────────────────────────────────────────

export const breakdownsApi = {
  list: (params?: BreakdownQueryParams) =>
    api.get<PaginatedResponse<Breakdown>>('/breakdowns', { params }).then((r) => r.data),

  getStats: () =>
    api.get<BreakdownStats>('/breakdowns/stats').then((r) => r.data),

  getById: (id: string) =>
    api.get<Breakdown>(`/breakdowns/${id}`).then((r) => r.data),

  create: (data: Partial<Breakdown>) =>
    api.post<Breakdown>('/breakdowns', data).then((r) => r.data),

  update: (id: string, data: Partial<Breakdown>) =>
    api.patch<Breakdown>(`/breakdowns/${id}`, data).then((r) => r.data),

  assign: (id: string, technicianId: string) =>
    api.patch<Breakdown>(`/breakdowns/${id}/assign`, { technicianId }).then((r) => r.data),

  delete: (id: string) =>
    api.delete(`/breakdowns/${id}`).then((r) => r.data),
};

// ─── Locations ────────────────────────────────────────────────────────────────

export const locationsApi = {
  getTree: () =>
    api.get<LocationTree[]>('/locations/tree').then((r) => r.data),

  getHospitals: () =>
    api.get<Hospital[]>('/locations/hospitals').then((r) => r.data),

  getDepartments: (hospitalId?: string) =>
    api
      .get<Department[]>('/locations/departments', { params: { hospitalId } })
      .then((r) => r.data),

  createProvince: (data: { name: string }) =>
    api.post<Province>('/locations/provinces', data).then((r) => r.data),

  createDistrict: (data: { name: string; provinceId: string }) =>
    api.post<District>('/locations/districts', data).then((r) => r.data),

  createHospital: (data: { name: string; districtId: string; address?: string; phone?: string }) =>
    api.post<Hospital>('/locations/hospitals', data).then((r) => r.data),

  createDepartment: (data: { name: string; type: string; hospitalId: string }) =>
    api.post<Department>('/locations/departments', data).then((r) => r.data),
};

// ─── Users ────────────────────────────────────────────────────────────────────

export const usersApi = {
  list: (params?: UsersQueryParams) =>
    api.get<PaginatedResponse<User>>('/users', { params }).then((r) => r.data),

  getById: (id: string) =>
    api.get<User>(`/users/${id}`).then((r) => r.data),

  create: (data: Partial<User> & { password?: string }) =>
    api.post<User>('/users', data).then((r) => r.data),

  update: (id: string, data: Partial<User>) =>
    api.patch<User>(`/users/${id}`, data).then((r) => r.data),

  changePassword: (id: string, data: { currentPassword?: string; newPassword: string }) =>
    api.patch(`/users/${id}/change-password`, data).then((r) => r.data),

  deactivate: (id: string) =>
    api.patch(`/users/${id}/deactivate`).then((r) => r.data),

  getStats: (id: string) =>
    api.get<UserStats>(`/users/${id}/stats`).then((r) => r.data),
};

// ─── Reports ──────────────────────────────────────────────────────────────────

export const reportsApi = {
  getDashboard: () =>
    api.get<DashboardStats>('/reports/dashboard').then((r) => r.data),

  getEquipmentReport: (params?: Record<string, string>) =>
    api.get('/reports/equipment', { params }).then((r) => r.data),

  getMaintenanceReport: (params?: Record<string, string>) =>
    api.get('/reports/maintenance', { params }).then((r) => r.data),

  getBreakdownReport: (params?: Record<string, string>) =>
    api.get('/reports/breakdowns', { params }).then((r) => r.data),

  getInventoryReport: (params?: Record<string, string>) =>
    api.get('/reports/inventory', { params }).then((r) => r.data),
};

// ─── Comments ─────────────────────────────────────────────────────────────────

export const commentsApi = {
  list: (params?: CommentQueryParams) =>
    api.get<Comment[]>('/comments', { params }).then((r) => r.data),

  create: (data: Partial<Comment>) =>
    api.post<Comment>('/comments', data).then((r) => r.data),

  resolve: (id: string) =>
    api.patch<Comment>(`/comments/${id}/resolve`).then((r) => r.data),
};

export default api;
