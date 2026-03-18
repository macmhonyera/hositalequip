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
  Wrench,
  CheckCircle2,
  Clock,
  XCircle,
  Calendar,
  Pencil,
} from 'lucide-react';
import { maintenanceApi, equipmentApi, usersApi } from '@/lib/api';
import { useToast } from '@/hooks/useToast';
import { usePermissions } from '@/hooks/usePermissions';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { Card } from '@/components/ui/Card';
import { MaintenanceStatusBadge } from '@/components/ui/Badge';
import { StatCard } from '@/components/ui/StatCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonCard, SkeletonTable } from '@/components/ui/Skeleton';
import { formatDate, formatCurrency } from '@/lib/utils';
import {
  MaintenanceStatus,
  MaintenanceType,
  type MaintenanceQueryParams,
  type MaintenanceRecord,
} from '@/types';

const schema = z.object({
  equipmentId: z.string().min(1, 'Equipment is required'),
  technicianId: z.string().optional(),
  type: z.nativeEnum(MaintenanceType),
  status: z.nativeEnum(MaintenanceStatus).optional(),
  scheduledDate: z.string().min(1, 'Scheduled date is required'),
  startDate: z.string().optional(),
  completionDate: z.string().optional(),
  totalCost: z.coerce.number().optional(),
  workDescription: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

const PAGE_SIZE = 10;

export default function MaintenancePage() {
  const qc = useQueryClient();
  const toast = useToast();
  const { canCreateMaintenance, canEditMaintenance } = usePermissions();
  const [filters, setFilters] = useState<MaintenanceQueryParams>({ page: 1, limit: PAGE_SIZE });
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<MaintenanceRecord | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['maintenance', filters],
    queryFn: () => maintenanceApi.list(filters),
    staleTime: 30_000,
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['maintenance-stats'],
    queryFn: maintenanceApi.getStats,
    staleTime: 60_000,
  });

  const { data: allEquipment } = useQuery({
    queryKey: ['equipment-all'],
    queryFn: () => equipmentApi.list({ limit: 200 }),
    staleTime: 300_000,
  });

  const { data: technicians } = useQuery({
    queryKey: ['technicians'],
    queryFn: () => usersApi.list({ role: 'technician' as never, limit: 200 }),
    staleTime: 300_000,
  });

  const createMutation = useMutation({
    mutationFn: maintenanceApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['maintenance'] });
      qc.invalidateQueries({ queryKey: ['maintenance-stats'] });
      toast.success('Maintenance scheduled');
      setCreateOpen(false);
    },
    onError: () => toast.error('Failed to schedule maintenance'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<MaintenanceRecord> }) =>
      maintenanceApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['maintenance'] });
      qc.invalidateQueries({ queryKey: ['maintenance-stats'] });
      toast.success('Maintenance updated');
      setEditTarget(null);
    },
    onError: () => toast.error('Failed to update maintenance'),
  });

  const records = data?.data ?? [];
  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 0;
  const currentPage = filters.page ?? 1;

  const equipmentOptions = [
    { value: '', label: 'All Equipment' },
    ...(allEquipment?.data ?? []).map((e) => ({ value: e.id, label: `${e.name} (${e.serialNumber})` })),
  ];

  const technicianOptions = [
    { value: '', label: 'All Technicians' },
    ...(technicians?.data ?? []).map((u) => ({ value: u.id, label: `${u.firstName} ${u.lastName}` })),
  ];

  const technicianSelectOptions = [
    { value: '', label: 'Unassigned' },
    ...(technicians?.data ?? []).map((u) => ({ value: u.id, label: `${u.firstName} ${u.lastName}` })),
  ];

  return (
    <div className="space-y-6">
      {/* Stats row */}
      {statsLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : stats && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard label="Total" value={stats.total} icon={<Wrench />} color="indigo" />
          <StatCard label="Scheduled" value={stats.scheduled} icon={<Calendar />} color="blue" />
          <StatCard label="In Progress" value={stats.inProgress} icon={<Clock />} color="amber" />
          <StatCard label="Completed" value={stats.completed} icon={<CheckCircle2 />} color="emerald" />
          <StatCard label="Overdue" value={stats.overdue} icon={<XCircle />} color="red" />
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Maintenance Records</h2>
          <p className="text-sm text-slate-500 mt-0.5">{data?.total ?? 0} total records</p>
        </div>
        {canCreateMaintenance && (
          <Button leftIcon={<Plus className="w-4 h-4" />} onClick={() => setCreateOpen(true)}>
            Schedule Maintenance
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card>
        <div className="p-4 flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[200px]">
            <Input
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
            />
          </div>
          <div className="w-full sm:w-44">
            <Select
              value={filters.status ?? ''}
              onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value as MaintenanceStatus | '', page: 1 }))}
              options={[
                { value: '', label: 'All Statuses' },
                ...Object.values(MaintenanceStatus).map((s) => ({ value: s, label: s.replace(/_/g, ' ') })),
              ]}
            />
          </div>
          <div className="w-full sm:w-44">
            <Select
              value={filters.type ?? ''}
              onChange={(e) => setFilters((f) => ({ ...f, type: e.target.value as MaintenanceType | '', page: 1 }))}
              options={[
                { value: '', label: 'All Types' },
                ...Object.values(MaintenanceType).map((t) => ({ value: t, label: t.replace(/_/g, ' ') })),
              ]}
            />
          </div>
          <div className="w-full sm:w-48">
            <Select
              value={filters.technicianId ?? ''}
              onChange={(e) => setFilters((f) => ({ ...f, technicianId: e.target.value, page: 1 }))}
              options={technicianOptions}
            />
          </div>
          <Button
            variant="outline"
            leftIcon={<RefreshCw className="w-4 h-4" />}
            onClick={() => { setSearch(''); setFilters({ page: 1, limit: PAGE_SIZE }); }}
          >
            Reset
          </Button>
        </div>
      </Card>

      {/* Table */}
      <Card>
        {isLoading ? (
          <div className="p-4"><SkeletonTable rows={8} /></div>
        ) : records.length === 0 ? (
          <EmptyState
            icon={<Wrench />}
            title="No maintenance records"
            description="Schedule maintenance to keep equipment in top condition."
            action={<Button leftIcon={<Plus className="w-4 h-4" />} onClick={() => setCreateOpen(true)}>Schedule Maintenance</Button>}
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/60">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Equipment</th>
                    <th className="hidden sm:table-cell text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Type</th>
                    <th className="hidden sm:table-cell text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Technician</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                    <th className="hidden md:table-cell text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Scheduled</th>
                    <th className="hidden lg:table-cell text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Completed</th>
                    <th className="hidden md:table-cell text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Cost</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {records.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-900">{r.equipment?.name ?? 'Unknown'}</p>
                        <p className="text-xs text-slate-400">{r.equipment?.serialNumber}</p>
                      </td>
                      <td className="hidden sm:table-cell px-4 py-3">
                        <span className="text-sm text-slate-700">{r.type.replace(/_/g, ' ')}</span>
                      </td>
                      <td className="hidden sm:table-cell px-4 py-3 text-slate-600">
                        {r.technician ? `${r.technician.firstName} ${r.technician.lastName}` : '—'}
                      </td>
                      <td className="px-4 py-3"><MaintenanceStatusBadge status={r.status} /></td>
                      <td className="hidden md:table-cell px-4 py-3 text-slate-600">{formatDate(r.scheduledDate)}</td>
                      <td className="hidden lg:table-cell px-4 py-3 text-slate-600">{formatDate(r.completionDate)}</td>
                      <td className="hidden md:table-cell px-4 py-3 text-slate-700 font-medium">{formatCurrency(r.totalCost)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          {canEditMaintenance && (
                            <button
                              onClick={() => setEditTarget(r)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 0 && (
              <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between">
                <p className="text-xs text-slate-500">
                  Page {currentPage} of {totalPages} · {data?.total ?? 0} total
                </p>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" leftIcon={<ChevronLeft className="w-3.5 h-3.5" />}
                    disabled={currentPage <= 1}
                    onClick={() => setFilters((f) => ({ ...f, page: (f.page ?? 1) - 1 }))}>
                    Prev
                  </Button>
                  <Button variant="outline" size="sm" rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
                    disabled={currentPage >= totalPages}
                    onClick={() => setFilters((f) => ({ ...f, page: (f.page ?? 1) + 1 }))}>
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>

      {/* Create / Edit Modal */}
      <MaintenanceFormModal
        isOpen={createOpen || !!editTarget}
        onClose={() => { setCreateOpen(false); setEditTarget(null); }}
        record={editTarget}
        equipmentOptions={equipmentOptions}
        technicianOptions={technicianSelectOptions}
        onSubmit={(formData) => {
          if (editTarget) {
            updateMutation.mutate({ id: editTarget.id, data: formData });
          } else {
            createMutation.mutate(formData);
          }
        }}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  );
}

// ─── Maintenance Form Modal ───────────────────────────────────────────────────

interface FormModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: MaintenanceRecord | null;
  equipmentOptions: { value: string; label: string }[];
  technicianOptions: { value: string; label: string }[];
  onSubmit: (data: Partial<MaintenanceRecord>) => void;
  isLoading: boolean;
}

function MaintenanceFormModal({ isOpen, onClose, record, equipmentOptions, technicianOptions, onSubmit, isLoading }: FormModalProps) {
  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: record
      ? {
          equipmentId: record.equipmentId,
          technicianId: record.technicianId ?? '',
          type: record.type,
          status: record.status,
          scheduledDate: record.scheduledDate?.slice(0, 10),
          completionDate: record.completionDate?.slice(0, 10) ?? '',
          totalCost: record.totalCost ?? undefined,
          workDescription: record.workDescription ?? '',
        }
      : { type: MaintenanceType.PREVENTIVE, status: MaintenanceStatus.SCHEDULED },
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => { reset(); onClose(); }}
      title={record ? 'Edit Maintenance Record' : 'Schedule Maintenance'}
      size="lg"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => { reset(); onClose(); }}>Cancel</Button>
          <Button isLoading={isLoading} onClick={handleSubmit(onSubmit)}>
            {record ? 'Save Changes' : 'Schedule'}
          </Button>
        </div>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <Controller
          name="equipmentId"
          control={control}
          render={({ field }) => (
            <Select
              label="Equipment"
              options={equipmentOptions.filter((o) => o.value !== '')}
              value={field.value}
              onChange={field.onChange}
              error={errors.equipmentId?.message}
              required
            />
          )}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Controller
            name="type"
            control={control}
            render={({ field }) => (
              <Select
                label="Type"
                options={Object.values(MaintenanceType).map((t) => ({ value: t, label: t.replace(/_/g, ' ') }))}
                value={field.value}
                onChange={field.onChange}
                required
              />
            )}
          />
          <Controller
            name="status"
            control={control}
            render={({ field }) => (
              <Select
                label="Status"
                options={Object.values(MaintenanceStatus).map((s) => ({ value: s, label: s.replace(/_/g, ' ') }))}
                value={field.value ?? MaintenanceStatus.SCHEDULED}
                onChange={field.onChange}
              />
            )}
          />
        </div>
        <Controller
          name="technicianId"
          control={control}
          render={({ field }) => (
            <Select
              label="Assign Technician"
              options={technicianOptions}
              value={field.value ?? ''}
              onChange={field.onChange}
            />
          )}
        />
        <div className="grid grid-cols-2 gap-4">
          <Input label="Scheduled Date" type="date" error={errors.scheduledDate?.message} required {...register('scheduledDate')} />
          <Input label="Completion Date" type="date" {...register('completionDate')} />

        </div>
        <Input label="Total Cost (USD)" type="number" placeholder="0" {...register('totalCost')} />
        <div>
          <label className="text-sm font-medium text-slate-700 block mb-1">Work Description</label>
          <textarea
            rows={3}
            placeholder="Describe the maintenance work to be performed..."
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
            {...register('workDescription')}
          />
        </div>
      </form>
    </Modal>
  );
}
