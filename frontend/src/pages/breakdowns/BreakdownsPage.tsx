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
  AlertTriangle,
  CheckCircle2,
  Clock,
  UserCheck,
  Pencil,
} from 'lucide-react';
import { breakdownsApi, equipmentApi, usersApi } from '@/lib/api';
import { useToast } from '@/hooks/useToast';
import { usePermissions } from '@/hooks/usePermissions';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { Card } from '@/components/ui/Card';
import { BreakdownStatusBadge, SeverityBadge } from '@/components/ui/Badge';
import { StatCard } from '@/components/ui/StatCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonCard, SkeletonTable } from '@/components/ui/Skeleton';
import { formatDate, formatRelative, daysBetween } from '@/lib/utils';
import {
  BreakdownSeverity,
  BreakdownStatus,
  type BreakdownQueryParams,
  type Breakdown,
} from '@/types';

const createSchema = z.object({
  equipmentId: z.string().min(1, 'Equipment is required'),
  severity: z.nativeEnum(BreakdownSeverity),
  issueDescription: z.string().min(5, 'Description must be at least 5 characters'),
  reportedBy: z.string().optional(),
});

const assignSchema = z.object({
  technicianId: z.string().min(1, 'Technician is required'),
});

const updateSchema = z.object({
  status: z.nativeEnum(BreakdownStatus),
  resolutionNotes: z.string().optional(),
  rootCause: z.string().optional(),
});

const PAGE_SIZE = 10;

export default function BreakdownsPage() {
  const qc = useQueryClient();
  const toast = useToast();
  const { canReportBreakdown, canAssignTechnician, canUpdateBreakdown } = usePermissions();
  const [filters, setFilters] = useState<BreakdownQueryParams>({ page: 1, limit: PAGE_SIZE });
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [assignTarget, setAssignTarget] = useState<Breakdown | null>(null);
  const [editTarget, setEditTarget] = useState<Breakdown | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['breakdowns', filters],
    queryFn: () => breakdownsApi.list(filters),
    staleTime: 30_000,
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['breakdown-stats'],
    queryFn: breakdownsApi.getStats,
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
    mutationFn: breakdownsApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['breakdowns'] });
      qc.invalidateQueries({ queryKey: ['breakdown-stats'] });
      toast.success('Breakdown reported');
      setCreateOpen(false);
    },
    onError: () => toast.error('Failed to report breakdown'),
  });

  const assignMutation = useMutation({
    mutationFn: ({ id, technicianId }: { id: string; technicianId: string }) =>
      breakdownsApi.assign(id, technicianId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['breakdowns'] });
      toast.success('Technician assigned');
      setAssignTarget(null);
    },
    onError: () => toast.error('Failed to assign technician'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Breakdown> }) =>
      breakdownsApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['breakdowns'] });
      qc.invalidateQueries({ queryKey: ['breakdown-stats'] });
      toast.success('Breakdown updated');
      setEditTarget(null);
    },
    onError: () => toast.error('Failed to update breakdown'),
  });

  const records = data?.data ?? [];
  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 0;
  const currentPage = filters.page ?? 1;

  const equipmentOptions = (allEquipment?.data ?? []).map((e) => ({
    value: e.id,
    label: `${e.name} (${e.serialNumber})`,
  }));

  const technicianOptions = (technicians?.data ?? []).map((u) => ({
    value: u.id,
    label: `${u.firstName} ${u.lastName}`,
  }));

  // Filter by search locally on rendered results
  const filtered = search
    ? records.filter(
        (b) =>
          b.issueDescription?.toLowerCase().includes(search.toLowerCase()) ||
          b.equipment?.name?.toLowerCase().includes(search.toLowerCase())
      )
    : records;

  return (
    <div className="space-y-6">
      {/* Stats */}
      {statsLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Breakdowns" value={stats.total} icon={<AlertTriangle />} color="indigo" />
          <StatCard label="Open" value={stats.open} icon={<Clock />} color="red" />
          <StatCard label="Critical" value={stats.critical} icon={<AlertTriangle />} color="amber" />
          <StatCard label="Resolved" value={stats.resolved} icon={<CheckCircle2 />} color="emerald" />
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Breakdown Reports</h2>
          <p className="text-sm text-slate-500 mt-0.5">{data?.total ?? 0} total reports</p>
        </div>
        {canReportBreakdown && (
          <Button leftIcon={<Plus className="w-4 h-4" />} onClick={() => setCreateOpen(true)}>
            Report Breakdown
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card>
        <div className="p-4 flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[200px]">
            <Input
              placeholder="Search breakdowns..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
            />
          </div>
          <div className="w-full sm:w-44">
            <Select
              value={filters.status ?? ''}
              onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value as BreakdownStatus | '', page: 1 }))}
              options={[
                { value: '', label: 'All Statuses' },
                ...Object.values(BreakdownStatus).map((s) => ({ value: s, label: s.replace(/_/g, ' ') })),
              ]}
            />
          </div>
          <div className="w-full sm:w-40">
            <Select
              value={filters.severity ?? ''}
              onChange={(e) => setFilters((f) => ({ ...f, severity: e.target.value as BreakdownSeverity | '', page: 1 }))}
              options={[
                { value: '', label: 'All Severities' },
                ...Object.values(BreakdownSeverity).map((s) => ({ value: s, label: s })),
              ]}
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
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<AlertTriangle />}
            title="No breakdowns found"
            description="No breakdown reports match your current filters."
            action={<Button leftIcon={<Plus className="w-4 h-4" />} onClick={() => setCreateOpen(true)}>Report Breakdown</Button>}
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/60">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Equipment</th>
                    <th className="hidden md:table-cell text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Description</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Severity</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                    <th className="hidden sm:table-cell text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Reported</th>
                    <th className="hidden lg:table-cell text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Assigned To</th>
                    <th className="hidden sm:table-cell text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Days Open</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((b) => {
                    const daysOpen = b.dateResolved
                      ? null
                      : daysBetween(b.dateReported);

                    return (
                      <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-medium text-slate-900">{b.equipment?.name ?? '—'}</p>
                          <p className="text-xs text-slate-400">{b.equipment?.serialNumber}</p>
                        </td>
                        <td className="hidden md:table-cell px-4 py-3 max-w-xs">
                          <p className="text-slate-700 truncate">{b.issueDescription}</p>
                        </td>
                        <td className="px-4 py-3"><SeverityBadge severity={b.severity} /></td>
                        <td className="px-4 py-3"><BreakdownStatusBadge status={b.status} /></td>
                        <td className="hidden sm:table-cell px-4 py-3 text-slate-500 text-xs">{formatRelative(b.dateReported)}</td>
                        <td className="hidden lg:table-cell px-4 py-3 text-slate-600">
                          {b.assignedTechnician
                            ? `${b.assignedTechnician.firstName} ${b.assignedTechnician.lastName}`
                            : <span className="text-slate-400 italic">Unassigned</span>}
                        </td>
                        <td className="hidden sm:table-cell px-4 py-3">
                          {daysOpen !== null ? (
                            <span className={daysOpen > 7 ? 'text-red-600 font-semibold' : 'text-slate-600'}>
                              {daysOpen}d
                            </span>
                          ) : (
                            <span className="text-emerald-600 text-xs">Resolved</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            {canAssignTechnician && (
                              <button
                                onClick={() => setAssignTarget(b)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                                title="Assign technician"
                              >
                                <UserCheck className="w-4 h-4" />
                              </button>
                            )}
                            {canUpdateBreakdown && (
                              <button
                                onClick={() => setEditTarget(b)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                                title="Update status"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {totalPages > 0 && (
              <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between">
                <p className="text-xs text-slate-500">Page {currentPage} of {totalPages}</p>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" leftIcon={<ChevronLeft className="w-3.5 h-3.5" />}
                    disabled={currentPage <= 1}
                    onClick={() => setFilters((f) => ({ ...f, page: (f.page ?? 1) - 1 }))}>Prev</Button>
                  <Button variant="outline" size="sm" rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
                    disabled={currentPage >= totalPages}
                    onClick={() => setFilters((f) => ({ ...f, page: (f.page ?? 1) + 1 }))}>Next</Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>

      {/* Create Breakdown Modal */}
      <CreateBreakdownModal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        equipmentOptions={equipmentOptions}
        onSubmit={(d) => createMutation.mutate(d)}
        isLoading={createMutation.isPending}
      />

      {/* Assign Technician Modal */}
      <AssignModal
        isOpen={!!assignTarget}
        breakdown={assignTarget}
        technicianOptions={technicianOptions}
        onClose={() => setAssignTarget(null)}
        onSubmit={(technicianId) => assignTarget && assignMutation.mutate({ id: assignTarget.id, technicianId })}
        isLoading={assignMutation.isPending}
      />

      {/* Update status modal */}
      <UpdateBreakdownModal
        isOpen={!!editTarget}
        breakdown={editTarget}
        onClose={() => setEditTarget(null)}
        onSubmit={(d) => editTarget && updateMutation.mutate({ id: editTarget.id, data: d })}
        isLoading={updateMutation.isPending}
      />
    </div>
  );
}

// ─── Modals ───────────────────────────────────────────────────────────────────

function CreateBreakdownModal({
  isOpen, onClose, equipmentOptions, onSubmit, isLoading,
}: {
  isOpen: boolean; onClose: () => void;
  equipmentOptions: { value: string; label: string }[];
  onSubmit: (d: Partial<Breakdown>) => void; isLoading: boolean;
}) {
  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<z.infer<typeof createSchema>>({
    resolver: zodResolver(createSchema),
    defaultValues: { severity: BreakdownSeverity.MEDIUM },
  });

  return (
    <Modal isOpen={isOpen} onClose={() => { reset(); onClose(); }} title="Report Breakdown" size="md"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => { reset(); onClose(); }}>Cancel</Button>
          <Button variant="danger" isLoading={isLoading}
            onClick={handleSubmit((data) => onSubmit({ ...data, dateReported: new Date().toISOString() } as never))}>
            Report
          </Button>
        </div>
      }
    >
      <form className="space-y-4">
        <Controller name="equipmentId" control={control}
          render={({ field }) => (
            <Select label="Equipment" options={equipmentOptions} value={field.value} onChange={field.onChange}
              error={errors.equipmentId?.message} required placeholder="Select equipment..." />
          )}
        />
        <Controller name="severity" control={control}
          render={({ field }) => (
            <Select label="Severity" value={field.value} onChange={field.onChange}
              options={Object.values(BreakdownSeverity).map((s) => ({ value: s, label: s }))} required />
          )}
        />
        <div>
          <label className="text-sm font-medium text-slate-700 block mb-1">Issue Description <span className="text-red-500">*</span></label>
          <textarea rows={4} placeholder="Describe the breakdown in detail..."
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            {...register('issueDescription')} />
          {errors.issueDescription && <p className="text-xs text-red-600 mt-1">{errors.issueDescription.message}</p>}
        </div>
        <Input label="Reported By" placeholder="Your name (optional)" {...register('reportedBy')} />
      </form>
    </Modal>
  );
}

function AssignModal({
  isOpen, breakdown, technicianOptions, onClose, onSubmit, isLoading,
}: {
  isOpen: boolean; breakdown: Breakdown | null;
  technicianOptions: { value: string; label: string }[];
  onClose: () => void; onSubmit: (technicianId: string) => void; isLoading: boolean;
}) {
  const { handleSubmit, control, reset } = useForm<z.infer<typeof assignSchema>>({
    resolver: zodResolver(assignSchema),
    defaultValues: { technicianId: breakdown?.assignedTechnicianId ?? '' },
  });

  return (
    <Modal isOpen={isOpen} onClose={() => { reset(); onClose(); }} title="Assign Technician" size="sm"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => { reset(); onClose(); }}>Cancel</Button>
          <Button isLoading={isLoading} leftIcon={<UserCheck className="w-4 h-4" />}
            onClick={handleSubmit((d) => onSubmit(d.technicianId))}>Assign</Button>
        </div>
      }
    >
      <div className="space-y-3">
        {breakdown && (
          <p className="text-sm text-slate-600 bg-slate-50 rounded-xl p-3">
            <strong>Equipment:</strong> {breakdown.equipment?.name}
          </p>
        )}
        <Controller name="technicianId" control={control}
          render={({ field }) => (
            <Select label="Technician" options={technicianOptions} value={field.value}
              onChange={field.onChange} placeholder="Select technician..." required />
          )}
        />
      </div>
    </Modal>
  );
}

function UpdateBreakdownModal({
  isOpen, breakdown, onClose, onSubmit, isLoading,
}: {
  isOpen: boolean; breakdown: Breakdown | null;
  onClose: () => void; onSubmit: (d: Partial<Breakdown>) => void; isLoading: boolean;
}) {
  const { register, handleSubmit, control, reset } = useForm<z.infer<typeof updateSchema>>({
    resolver: zodResolver(updateSchema),
    defaultValues: { status: breakdown?.status ?? BreakdownStatus.OPEN, resolutionNotes: breakdown?.resolutionNotes ?? '', rootCause: breakdown?.rootCause ?? '' },
  });

  return (
    <Modal isOpen={isOpen} onClose={() => { reset(); onClose(); }} title="Update Breakdown" size="md"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => { reset(); onClose(); }}>Cancel</Button>
          <Button isLoading={isLoading} onClick={handleSubmit(onSubmit)}>Save</Button>
        </div>
      }
    >
      <form className="space-y-4">
        <Controller name="status" control={control}
          render={({ field }) => (
            <Select label="Status"
              options={Object.values(BreakdownStatus).map((s) => ({ value: s, label: s.replace(/_/g, ' ') }))}
              value={field.value} onChange={field.onChange} required />
          )}
        />
        <div>
          <label className="text-sm font-medium text-slate-700 block mb-1">Resolution Notes</label>
          <textarea rows={3} placeholder="Describe how the breakdown was resolved..."
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            {...register('resolutionNotes')} />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700 block mb-1">Root Cause</label>
          <textarea rows={2} placeholder="What caused this breakdown? (optional)"
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            {...register('rootCause')} />
        </div>
      </form>
    </Modal>
  );
}
