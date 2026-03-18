import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Plus,
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Users,
  Pencil,
  Lock,
  UserX,
  UserCheck,
  Eye,
} from 'lucide-react';
import { usersApi, locationsApi } from '@/lib/api';
import { useToast } from '@/hooks/useToast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { Card } from '@/components/ui/Card';
import { RoleBadge, UserStatusBadge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonTable } from '@/components/ui/Skeleton';
import { formatDate, getInitials } from '@/lib/utils';
import { UserRole, UserStatus, type User, type UsersQueryParams } from '@/types';

const createSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.nativeEnum(UserRole),
  departmentId: z.string().optional(),
});

const editSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  role: z.nativeEnum(UserRole),
  status: z.nativeEnum(UserStatus),
  phone: z.string().optional(),
  departmentId: z.string().optional(),
});

const changePasswordSchema = z.object({
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

const PAGE_SIZE = 10;

export default function UsersPage() {
  const qc = useQueryClient();
  const toast = useToast();
  const [filters, setFilters] = useState<UsersQueryParams>({ page: 1, limit: PAGE_SIZE });
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<User | null>(null);
  const [passwordTarget, setPasswordTarget] = useState<User | null>(null);
  const [viewTarget, setViewTarget] = useState<User | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['users', filters, search],
    queryFn: () => usersApi.list({ ...filters, search: search || undefined }),
    staleTime: 30_000,
  });

  const { data: departments } = useQuery({
    queryKey: ['departments'],
    queryFn: () => locationsApi.getDepartments(),
    staleTime: 300_000,
  });

  const createMutation = useMutation({
    mutationFn: usersApi.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); toast.success('User created'); setCreateOpen(false); },
    onError: () => toast.error('Failed to create user'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<User> }) => usersApi.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); toast.success('User updated'); setEditTarget(null); },
    onError: () => toast.error('Failed to update user'),
  });

  const passwordMutation = useMutation({
    mutationFn: ({ id, newPassword }: { id: string; newPassword: string }) =>
      usersApi.changePassword(id, { newPassword }),
    onSuccess: () => { toast.success('Password changed'); setPasswordTarget(null); },
    onError: () => toast.error('Failed to change password'),
  });

  const deactivateMutation = useMutation({
    mutationFn: usersApi.deactivate,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); toast.success('User deactivated'); },
    onError: () => toast.error('Failed to deactivate user'),
  });

  const users = data?.data ?? [];
  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 0;
  const currentPage = filters.page ?? 1;

  const deptOptions = [
    { value: '', label: 'No Department' },
    ...(departments ?? []).map((d) => ({ value: d.id, label: d.name })),
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-slate-900">User Management</h2>
          <p className="text-sm text-slate-500 mt-0.5">{data?.total ?? 0} total users</p>
        </div>
        <Button leftIcon={<Plus className="w-4 h-4" />} onClick={() => setCreateOpen(true)}>
          Add User
        </Button>
      </div>

      <Card>
        <div className="p-4 flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[200px]">
            <Input
              placeholder="Search users..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setFilters((f) => ({ ...f, page: 1 })); }}
              leftIcon={<Search className="w-4 h-4" />}
            />
          </div>
          <div className="w-full sm:w-40">
            <Select
              value={filters.role ?? ''}
              onChange={(e) => setFilters((f) => ({ ...f, role: e.target.value as UserRole | '', page: 1 }))}
              options={[
                { value: '', label: 'All Roles' },
                ...Object.values(UserRole).map((r) => ({ value: r, label: r })),
              ]}
            />
          </div>
          <div className="w-full sm:w-40">
            <Select
              value={filters.status ?? ''}
              onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value as UserStatus | '', page: 1 }))}
              options={[
                { value: '', label: 'All Statuses' },
                ...Object.values(UserStatus).map((s) => ({ value: s, label: s })),
              ]}
            />
          </div>
          <Button variant="outline" leftIcon={<RefreshCw className="w-4 h-4" />}
            onClick={() => { setSearch(''); setFilters({ page: 1, limit: PAGE_SIZE }); }}>
            Reset
          </Button>
        </div>
      </Card>

      <Card>
        {isLoading ? (
          <div className="p-4"><SkeletonTable rows={8} /></div>
        ) : users.length === 0 ? (
          <EmptyState icon={<Users />} title="No users found"
            action={<Button leftIcon={<Plus className="w-4 h-4" />} onClick={() => setCreateOpen(true)}>Add User</Button>}
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/60">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">User</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Role</th>
                    <th className="hidden sm:table-cell text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                    <th className="hidden md:table-cell text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Department</th>
                    <th className="hidden lg:table-cell text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Last Login</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-400 to-indigo-500 flex items-center justify-center text-xs font-bold text-white shrink-0">
                            {getInitials(u.firstName, u.lastName)}
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">{u.firstName} {u.lastName}</p>
                            <p className="text-xs text-slate-400">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3"><RoleBadge role={u.role} /></td>
                      <td className="hidden sm:table-cell px-4 py-3"><UserStatusBadge status={u.status} /></td>
                      <td className="hidden md:table-cell px-4 py-3 text-slate-600">{u.department?.name ?? '—'}</td>
                      <td className="hidden lg:table-cell px-4 py-3 text-slate-500 text-xs">{formatDate(u.lastLoginAt)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => setViewTarget(u)} className="p-1.5 rounded-lg text-slate-400 hover:text-primary-600 hover:bg-primary-50 transition-colors" title="View">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button onClick={() => setEditTarget(u)} className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors" title="Edit">
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button onClick={() => setPasswordTarget(u)} className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors" title="Change password">
                            <Lock className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => u.status === UserStatus.ACTIVE ? deactivateMutation.mutate(u.id) : toast.info('User already inactive')}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                            title={u.status === UserStatus.ACTIVE ? 'Deactivate' : 'Inactive'}
                          >
                            {u.status === UserStatus.ACTIVE ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 0 && (
              <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between">
                <p className="text-xs text-slate-500">Page {currentPage} of {totalPages}</p>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" leftIcon={<ChevronLeft className="w-3.5 h-3.5" />}
                    disabled={currentPage <= 1} onClick={() => setFilters((f) => ({ ...f, page: (f.page ?? 1) - 1 }))}>Prev</Button>
                  <Button variant="outline" size="sm" rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
                    disabled={currentPage >= totalPages} onClick={() => setFilters((f) => ({ ...f, page: (f.page ?? 1) + 1 }))}>Next</Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>

      {/* Create Modal */}
      <CreateUserModal isOpen={createOpen} onClose={() => setCreateOpen(false)}
        deptOptions={deptOptions} onSubmit={(d) => createMutation.mutate(d)} isLoading={createMutation.isPending} />

      {/* Edit Modal */}
      <EditUserModal isOpen={!!editTarget} user={editTarget} onClose={() => setEditTarget(null)}
        deptOptions={deptOptions} onSubmit={(d) => editTarget && updateMutation.mutate({ id: editTarget.id, data: d })}
        isLoading={updateMutation.isPending} />

      {/* Change Password Modal */}
      <ChangePasswordModal isOpen={!!passwordTarget} user={passwordTarget} onClose={() => setPasswordTarget(null)}
        onSubmit={(pw) => passwordTarget && passwordMutation.mutate({ id: passwordTarget.id, newPassword: pw })}
        isLoading={passwordMutation.isPending} />

      {/* View Modal */}
      {viewTarget && (
        <Modal isOpen={!!viewTarget} onClose={() => setViewTarget(null)} title="User Details" size="sm">
          <div className="space-y-3 text-sm">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-400 to-indigo-500 flex items-center justify-center text-xl font-bold text-white">
                {getInitials(viewTarget.firstName, viewTarget.lastName)}
              </div>
            </div>
            {[
              ['Full Name', `${viewTarget.firstName} ${viewTarget.lastName}`],
              ['Email', viewTarget.email],
              ['Role', <RoleBadge key="r" role={viewTarget.role} />],
              ['Status', <UserStatusBadge key="s" status={viewTarget.status} />],
              ['Department', viewTarget.department?.name ?? '—'],
              ['Phone', viewTarget.phone ?? '—'],
              ['Joined', formatDate(viewTarget.createdAt)],
              ['Last Login', formatDate(viewTarget.lastLoginAt)],
            ].map(([label, value]) => (
              <div key={label as string} className="flex justify-between items-start gap-4">
                <span className="text-slate-500 shrink-0">{label}</span>
                <span className="text-slate-900 font-medium text-right">{value}</span>
              </div>
            ))}
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── Modals ───────────────────────────────────────────────────────────────────

function CreateUserModal({ isOpen, onClose, deptOptions, onSubmit, isLoading }: {
  isOpen: boolean; onClose: () => void;
  deptOptions: { value: string; label: string }[];
  onSubmit: (d: Partial<User> & { password?: string }) => void; isLoading: boolean;
}) {
  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<z.infer<typeof createSchema>>({
    resolver: zodResolver(createSchema), defaultValues: { role: UserRole.TECHNICIAN },
  });
  return (
    <Modal isOpen={isOpen} onClose={() => { reset(); onClose(); }} title="Add User" size="md"
      footer={<div className="flex justify-end gap-2"><Button variant="outline" onClick={() => { reset(); onClose(); }}>Cancel</Button><Button isLoading={isLoading} onClick={handleSubmit(onSubmit as never)}>Create User</Button></div>}
    >
      <form className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="First Name" error={errors.firstName?.message} required {...register('firstName')} />
          <Input label="Last Name" error={errors.lastName?.message} required {...register('lastName')} />
        </div>
        <Input label="Email" type="email" error={errors.email?.message} required {...register('email')} />
        <Input label="Password" type="password" error={errors.password?.message} required {...register('password')} />
        <div className="grid grid-cols-2 gap-4">
          <Controller name="role" control={control}
            render={({ field }) => (
              <Select label="Role" required value={field.value} onChange={field.onChange}
                options={Object.values(UserRole).map((r) => ({ value: r, label: r }))} />
            )}
          />
          <Controller name="departmentId" control={control}
            render={({ field }) => (
              <Select label="Department" value={field.value ?? ''} onChange={field.onChange} options={deptOptions} />
            )}
          />
        </div>
      </form>
    </Modal>
  );
}

function EditUserModal({ isOpen, user, onClose, deptOptions, onSubmit, isLoading }: {
  isOpen: boolean; user: User | null; onClose: () => void;
  deptOptions: { value: string; label: string }[];
  onSubmit: (d: Partial<User>) => void; isLoading: boolean;
}) {
  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<z.infer<typeof editSchema>>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      firstName: user?.firstName ?? '', lastName: user?.lastName ?? '',
      role: user?.role ?? UserRole.GUEST, status: user?.status ?? UserStatus.ACTIVE,
      phone: user?.phone ?? '', departmentId: user?.departmentId ?? '',
    },
  });
  return (
    <Modal isOpen={isOpen} onClose={() => { reset(); onClose(); }} title="Edit User" size="md"
      footer={<div className="flex justify-end gap-2"><Button variant="outline" onClick={() => { reset(); onClose(); }}>Cancel</Button><Button isLoading={isLoading} onClick={handleSubmit(onSubmit as never)}>Save Changes</Button></div>}
    >
      <form className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="First Name" error={errors.firstName?.message} required {...register('firstName')} />
          <Input label="Last Name" error={errors.lastName?.message} required {...register('lastName')} />
        </div>
        <Input label="Phone" type="tel" {...register('phone')} />
        <div className="grid grid-cols-2 gap-4">
          <Controller name="role" control={control}
            render={({ field }) => (
              <Select label="Role" required value={field.value} onChange={field.onChange}
                options={Object.values(UserRole).map((r) => ({ value: r, label: r }))} />
            )}
          />
          <Controller name="status" control={control}
            render={({ field }) => (
              <Select label="Status" required value={field.value} onChange={field.onChange}
                options={Object.values(UserStatus).map((s) => ({ value: s, label: s }))} />
            )}
          />
        </div>
        <Controller name="departmentId" control={control}
          render={({ field }) => (
            <Select label="Department" value={field.value ?? ''} onChange={field.onChange} options={deptOptions} />
          )}
        />
      </form>
    </Modal>
  );
}

function ChangePasswordModal({ isOpen, user, onClose, onSubmit, isLoading }: {
  isOpen: boolean; user: User | null; onClose: () => void;
  onSubmit: (pw: string) => void; isLoading: boolean;
}) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<z.infer<typeof changePasswordSchema>>({
    resolver: zodResolver(changePasswordSchema),
  });
  return (
    <Modal isOpen={isOpen} onClose={() => { reset(); onClose(); }} title={`Change Password — ${user?.firstName}`} size="sm"
      footer={<div className="flex justify-end gap-2"><Button variant="outline" onClick={() => { reset(); onClose(); }}>Cancel</Button><Button isLoading={isLoading} onClick={handleSubmit((d) => onSubmit(d.newPassword))}>Change Password</Button></div>}
    >
      <form className="space-y-4">
        <Input label="New Password" type="password" error={errors.newPassword?.message} required {...register('newPassword')} />
        <Input label="Confirm Password" type="password" error={errors.confirmPassword?.message} required {...register('confirmPassword')} />
      </form>
    </Modal>
  );
}
