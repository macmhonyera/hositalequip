import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Plus,
  Search,
  Filter,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Trash2,
  Eye,
  Package,
} from 'lucide-react';
import { equipmentApi, locationsApi } from '@/lib/api';
import { useToast } from '@/hooks/useToast';
import { usePermissions } from '@/hooks/usePermissions';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { Card } from '@/components/ui/Card';
import { EquipmentStatusBadge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonTable } from '@/components/ui/Skeleton';
import { formatDate } from '@/lib/utils';
import {
  EquipmentStatus,
  MaintenanceFrequency,
  type Equipment,
  type EquipmentQueryParams,
} from '@/types';

const equipmentSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  serialNumber: z.string().min(1, 'Serial number is required'),
  type: z.string().min(1, 'Type is required'),
  brand: z.string().min(1, 'Brand is required'),
  model: z.string().min(1, 'Model is required'),
  supplierName: z.string().min(1, 'Supplier name is required'),
  dateOfCommission: z.string().min(1, 'Commission date is required'),
  status: z.nativeEnum(EquipmentStatus).optional(),
  maintenanceFrequency: z.nativeEnum(MaintenanceFrequency).optional(),
  purchaseCost: z.coerce.number().optional(),
  warrantyExpiryDate: z.string().optional(),
  notes: z.string().optional(),
  hospitalId: z.string().optional(),
  departmentId: z.string().optional(),
});

type EquipmentFormData = z.infer<typeof equipmentSchema>;

const PAGE_SIZE = 10;

const statusOptions = [
  { value: '', label: 'All Statuses' },
  ...Object.values(EquipmentStatus).map((s) => ({ value: s, label: s.replace(/_/g, ' ') })),
];

const frequencyOptions = Object.values(MaintenanceFrequency).map((f) => ({
  value: f,
  label: f.replace(/_/g, ' '),
}));

export default function EquipmentPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const toast = useToast();

  const { canCreateEquipment, canEditEquipment, canDeleteEquipment } = usePermissions();
  const [filters, setFilters] = useState<EquipmentQueryParams>({ page: 1, limit: PAGE_SIZE });
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Equipment | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Equipment | null>(null);

  // Queries
  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['equipment', filters, search],
    queryFn: () => equipmentApi.list({ ...filters, search: search || undefined }),
    staleTime: 30_000,
  });

  const { data: hospitals } = useQuery({
    queryKey: ['hospitals'],
    queryFn: locationsApi.getHospitals,
    staleTime: 300_000,
  });

  const { data: departments } = useQuery({
    queryKey: ['departments'],
    queryFn: () => locationsApi.getDepartments(),
    staleTime: 300_000,
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: equipmentApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['equipment'] });
      toast.success('Equipment registered', 'The equipment has been added successfully.');
      setCreateOpen(false);
    },
    onError: () => toast.error('Failed to register equipment'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Equipment> }) =>
      equipmentApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['equipment'] });
      toast.success('Equipment updated');
      setEditTarget(null);
    },
    onError: () => toast.error('Failed to update equipment'),
  });

  const deleteMutation = useMutation({
    mutationFn: equipmentApi.delete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['equipment'] });
      toast.success('Equipment deleted');
      setDeleteTarget(null);
    },
    onError: () => toast.error('Failed to delete equipment'),
  });

  const equipment = data?.data ?? [];
  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 0;
  const currentPage = filters.page ?? 1;

  const hospitalOptions = [
    { value: '', label: 'All Hospitals' },
    ...(hospitals ?? []).map((h) => ({ value: h.id, label: h.name })),
  ];
  const departmentOptions = [
    { value: '', label: 'All Departments' },
    ...(departments ?? []).map((d) => ({ value: d.id, label: d.name })),
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Equipment Registry</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            {data?.total ?? 0} total equipment records
          </p>
        </div>
        {canCreateEquipment && (
          <Button leftIcon={<Plus className="w-4 h-4" />} onClick={() => setCreateOpen(true)}>
            Register Equipment
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card>
        <div className="p-4 flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[200px]">
            <Input
              placeholder="Search equipment..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setFilters((f) => ({ ...f, page: 1 }));
              }}
              leftIcon={<Search className="w-4 h-4" />}
            />
          </div>
          <div className="w-full sm:w-48">
            <Select
              value={filters.status ?? ''}
              onChange={(e) =>
                setFilters((f) => ({
                  ...f,
                  status: e.target.value as EquipmentStatus | '',
                  page: 1,
                }))
              }
              options={statusOptions}
            />
          </div>
          <div className="w-full sm:w-48">
            <Select
              value={filters.hospital ?? ''}
              onChange={(e) => setFilters((f) => ({ ...f, hospital: e.target.value, page: 1 }))}
              options={hospitalOptions}
            />
          </div>
          <Button
            variant="outline"
            size="md"
            leftIcon={<RefreshCw className="w-4 h-4" />}
            onClick={() => {
              setSearch('');
              setFilters({ page: 1, limit: PAGE_SIZE });
            }}
          >
            Reset
          </Button>
        </div>
      </Card>

      {/* Table */}
      <Card>
        {isLoading ? (
          <div className="p-4">
            <SkeletonTable rows={8} />
          </div>
        ) : equipment.length === 0 ? (
          <EmptyState
            icon={<Package />}
            title="No equipment found"
            description="Try adjusting your filters or register new equipment."
            action={
              <Button leftIcon={<Plus className="w-4 h-4" />} onClick={() => setCreateOpen(true)}>
                Register Equipment
              </Button>
            }
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/60">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Equipment</th>
                    <th className="hidden sm:table-cell text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Serial / Brand</th>
                    <th className="hidden md:table-cell text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Location</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                    <th className="hidden lg:table-cell text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Last Service</th>
                    <th className="hidden lg:table-cell text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Next Service</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {equipment.map((eq) => (
                    <tr
                      key={eq.id}
                      className="hover:bg-slate-50 transition-colors cursor-pointer"
                      onClick={() => navigate(`/equipment/${eq.id}`)}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center shrink-0">
                            <Package className="w-4 h-4 text-primary-600" />
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">{eq.name}</p>
                            <p className="text-xs text-slate-400">{eq.type ?? 'N/A'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="hidden sm:table-cell px-4 py-3">
                        <p className="text-slate-700 font-mono text-xs">{eq.serialNumber}</p>
                        <p className="text-xs text-slate-400">{eq.brand ?? '—'}</p>
                      </td>
                      <td className="hidden md:table-cell px-4 py-3">
                        <p className="text-slate-700">{eq.hospital?.name ?? '—'}</p>
                        <p className="text-xs text-slate-400">{eq.department?.name ?? '—'}</p>
                      </td>
                      <td className="px-4 py-3">
                        <EquipmentStatusBadge status={eq.status} />
                      </td>
                      <td className="hidden lg:table-cell px-4 py-3 text-slate-600">{formatDate(eq.lastServiceDate)}</td>
                      <td className="hidden lg:table-cell px-4 py-3">
                        <span
                          className={
                            eq.maintenanceOverdue
                              ? 'text-red-600 font-medium'
                              : 'text-slate-600'
                          }
                        >
                          {formatDate(eq.nextServiceDate)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div
                          className="flex items-center justify-end gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => navigate(`/equipment/${eq.id}`)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-primary-600 hover:bg-primary-50 transition-colors"
                            title="View details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {canEditEquipment && (
                            <button
                              onClick={() => setEditTarget(eq)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                              title="Edit"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                          )}
                          {canDeleteEquipment && (
                            <button
                              onClick={() => setDeleteTarget(eq)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 0 && (
              <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between">
                <p className="text-xs text-slate-500">
                  Showing {((currentPage - 1) * PAGE_SIZE) + 1}–{Math.min(currentPage * PAGE_SIZE, data?.total ?? 0)} of {data?.total ?? 0}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<ChevronLeft className="w-3.5 h-3.5" />}
                    disabled={currentPage <= 1 || isFetching}
                    onClick={() => setFilters((f) => ({ ...f, page: (f.page ?? 1) - 1 }))}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-slate-600 px-2">
                    {currentPage} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
                    disabled={currentPage >= totalPages || isFetching}
                    onClick={() => setFilters((f) => ({ ...f, page: (f.page ?? 1) + 1 }))}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>

      {/* Create / Edit Modal */}
      <EquipmentFormModal
        isOpen={createOpen || !!editTarget}
        onClose={() => {
          setCreateOpen(false);
          setEditTarget(null);
        }}
        equipment={editTarget}
        hospitals={hospitals ?? []}
        departments={departments ?? []}
        hospitalOptions={hospitalOptions}
        departmentOptions={departmentOptions}
        onSubmit={(formData) => {
          if (editTarget) {
            updateMutation.mutate({ id: editTarget.id, data: formData });
          } else {
            createMutation.mutate(formData);
          }
        }}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      {/* Delete confirmation */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Equipment"
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button
              variant="danger"
              isLoading={deleteMutation.isPending}
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
            >
              Delete
            </Button>
          </div>
        }
      >
        <p className="text-sm text-slate-600">
          Are you sure you want to delete <strong>{deleteTarget?.name}</strong>? This action cannot
          be undone.
        </p>
      </Modal>
    </div>
  );
}

// ─── Equipment Form Modal ─────────────────────────────────────────────────────

interface EquipmentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  equipment: Equipment | null;
  hospitals: { id: string; name: string }[];
  departments: { id: string; name: string }[];
  hospitalOptions: { value: string; label: string }[];
  departmentOptions: { value: string; label: string }[];
  onSubmit: (data: Partial<Equipment>) => void;
  isLoading: boolean;
}

function EquipmentFormModal({
  isOpen,
  onClose,
  equipment,
  hospitalOptions,
  departmentOptions,
  onSubmit,
  isLoading,
}: EquipmentFormModalProps) {
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<EquipmentFormData>({
    resolver: zodResolver(equipmentSchema),
    defaultValues: equipment
      ? {
          name: equipment.name,
          serialNumber: equipment.serialNumber,
          type: equipment.type ?? '',
          brand: equipment.brand ?? '',
          model: equipment.model ?? '',
          supplierName: equipment.supplierName ?? '',
          dateOfCommission: equipment.dateOfCommission?.slice(0, 10) ?? '',
          status: equipment.status,
          maintenanceFrequency: equipment.maintenanceFrequency,
          purchaseCost: equipment.purchaseCost ?? undefined,
          warrantyExpiryDate: equipment.warrantyExpiryDate?.slice(0, 10) ?? '',
          hospitalId: equipment.hospitalId ?? '',
          departmentId: equipment.departmentId ?? '',
          notes: equipment.notes ?? '',
        }
      : { status: EquipmentStatus.ACTIVE },
  });

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={equipment ? 'Edit Equipment' : 'Register Equipment'}
      size="lg"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={handleClose}>Cancel</Button>
          <Button
            isLoading={isLoading}
            onClick={handleSubmit(onSubmit)}
          >
            {equipment ? 'Save Changes' : 'Register'}
          </Button>
        </div>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Equipment Name"
            placeholder="e.g. Ventilator Pro 5000"
            error={errors.name?.message}
            required
            {...register('name')}
          />
          <Input
            label="Serial Number"
            placeholder="e.g. VT-2024-001"
            error={errors.serialNumber?.message}
            required
            {...register('serialNumber')}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Brand" placeholder="e.g. Philips" error={errors.brand?.message} required {...register('brand')} />
          <Input label="Model" placeholder="e.g. IntelliVue MX800" error={errors.model?.message} required {...register('model')} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Type / Category" placeholder="e.g. Patient Monitor" error={errors.type?.message} required {...register('type')} />
          <Controller
            name="status"
            control={control}
            render={({ field }) => (
              <Select
                label="Status"
                options={Object.values(EquipmentStatus).map((s) => ({ value: s, label: s.replace(/_/g, ' ') }))}
                value={field.value ?? ''}
                onChange={field.onChange}
              />
            )}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Controller
            name="hospitalId"
            control={control}
            render={({ field }) => (
              <Select
                label="Hospital"
                options={hospitalOptions}
                value={field.value ?? ''}
                onChange={field.onChange}
              />
            )}
          />
          <Controller
            name="departmentId"
            control={control}
            render={({ field }) => (
              <Select
                label="Department"
                options={departmentOptions}
                value={field.value ?? ''}
                onChange={field.onChange}
              />
            )}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Controller
            name="maintenanceFrequency"
            control={control}
            render={({ field }) => (
              <Select
                label="Maintenance Frequency"
                options={[{ value: '', label: 'Not set' }, ...frequencyOptions]}
                value={field.value ?? ''}
                onChange={field.onChange}
              />
            )}
          />
          <Input
            label="Purchase Cost (USD)"
            type="number"
            placeholder="0"
            {...register('purchaseCost')}
          />
        </div>
        <Input
          label="Supplier / Vendor Name"
          placeholder="e.g. MedSupply Zimbabwe"
          error={errors.supplierName?.message}
          required
          {...register('supplierName')}
        />
        <div className="grid grid-cols-2 gap-4">
          <Input label="Commission Date" type="date" error={errors.dateOfCommission?.message} required {...register('dateOfCommission')} />
          <Input label="Warranty Expiry Date" type="date" {...register('warrantyExpiryDate')} />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700 block mb-1">Notes</label>
          <textarea
            rows={3}
            placeholder="Optional notes about this equipment..."
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
            {...register('notes')}
          />
        </div>
      </form>
    </Modal>
  );
}
