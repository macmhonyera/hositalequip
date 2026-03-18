import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  ArrowLeft,
  Pencil,
  Package,
  MapPin,
  Calendar,
  DollarSign,
  User,
  MessageSquare,
  Wrench,
  AlertTriangle,
  CheckCircle2,
  Send,
} from 'lucide-react';
import { equipmentApi, maintenanceApi, breakdownsApi, commentsApi } from '@/lib/api';
import { useToast } from '@/hooks/useToast';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { EquipmentStatusBadge, MaintenanceStatusBadge, BreakdownStatusBadge, SeverityBadge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatDate, formatCurrency, formatRelative, getInitials } from '@/lib/utils';
import {
  EquipmentStatus,
  CommentType,
  type Equipment,
} from '@/types';

type TabId = 'overview' | 'maintenance' | 'breakdowns' | 'comments';

const statusSchema = z.object({
  status: z.nativeEnum(EquipmentStatus),
});

const commentSchema = z.object({
  content: z.string().min(1, 'Comment cannot be empty'),
  type: z.nativeEnum(CommentType),
});

export default function EquipmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [editStatusOpen, setEditStatusOpen] = useState(false);

  const { data: equipment, isLoading } = useQuery({
    queryKey: ['equipment', id],
    queryFn: () => equipmentApi.getById(id!),
    enabled: !!id,
  });

  const { data: maintenance } = useQuery({
    queryKey: ['maintenance', { equipmentId: id }],
    queryFn: () => maintenanceApi.list({ equipmentId: id }),
    enabled: !!id && activeTab === 'maintenance',
  });

  const { data: breakdowns } = useQuery({
    queryKey: ['breakdowns', { equipmentId: id }],
    queryFn: () => breakdownsApi.list({ equipmentId: id }),
    enabled: !!id && activeTab === 'breakdowns',
  });

  const { data: comments, refetch: refetchComments } = useQuery({
    queryKey: ['comments', { equipmentId: id }],
    queryFn: () => commentsApi.list({ equipmentId: id }),
    enabled: !!id && activeTab === 'comments',
  });

  const statusForm = useForm<z.infer<typeof statusSchema>>({
    resolver: zodResolver(statusSchema),
    defaultValues: { status: equipment?.status ?? EquipmentStatus.ACTIVE },
  });

  const commentForm = useForm<z.infer<typeof commentSchema>>({
    resolver: zodResolver(commentSchema),
    defaultValues: { type: CommentType.COMMENT, content: '' },
  });

  const updateStatusMutation = useMutation({
    mutationFn: (status: EquipmentStatus) => equipmentApi.updateStatus(id!, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['equipment', id] });
      toast.success('Status updated');
      setEditStatusOpen(false);
    },
    onError: () => toast.error('Failed to update status'),
  });

  const addCommentMutation = useMutation({
    mutationFn: (data: { content: string; type: CommentType }) =>
      commentsApi.create({ ...data, equipmentId: id }),
    onSuccess: () => {
      refetchComments();
      commentForm.reset({ type: CommentType.COMMENT, content: '' });
      toast.success('Comment added');
    },
    onError: () => toast.error('Failed to add comment'),
  });

  const resolveCommentMutation = useMutation({
    mutationFn: commentsApi.resolve,
    onSuccess: () => {
      refetchComments();
      toast.success('Comment resolved');
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner size="lg" className="text-primary-600" />
      </div>
    );
  }

  if (!equipment) {
    return (
      <EmptyState
        icon={<Package />}
        title="Equipment not found"
        description="The equipment you're looking for doesn't exist."
        action={<Button onClick={() => navigate('/equipment')}>Back to Equipment</Button>}
      />
    );
  }

  const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Overview', icon: <Package className="w-4 h-4" /> },
    { id: 'maintenance', label: 'Maintenance', icon: <Wrench className="w-4 h-4" /> },
    { id: 'breakdowns', label: 'Breakdowns', icon: <AlertTriangle className="w-4 h-4" /> },
    { id: 'comments', label: 'Comments', icon: <MessageSquare className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-4 max-w-5xl">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/equipment')}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-xl font-bold text-slate-900">{equipment.name}</h2>
            <p className="text-sm text-slate-400 font-mono">{equipment.serialNumber}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <EquipmentStatusBadge status={equipment.status} />
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Pencil className="w-3.5 h-3.5" />}
            onClick={() => {
              statusForm.reset({ status: equipment.status });
              setEditStatusOpen(true);
            }}
          >
            Update Status
          </Button>
        </div>
      </div>

      {/* Summary info bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: <MapPin className="w-4 h-4" />, label: 'Location', value: `${equipment.hospital?.name ?? '—'} / ${equipment.department?.name ?? '—'}` },
          { icon: <Calendar className="w-4 h-4" />, label: 'Next Service', value: formatDate(equipment.nextServiceDate) },
          { icon: <DollarSign className="w-4 h-4" />, label: 'Purchase Cost', value: formatCurrency(equipment.purchaseCost) },
          { icon: <User className="w-4 h-4" />, label: 'Supplier', value: equipment.supplierName ?? '—' },
        ].map((item) => (
          <div key={item.label} className="bg-white rounded-xl border border-slate-200 p-4 flex items-start gap-3">
            <div className="p-1.5 rounded-lg bg-slate-100 text-slate-500 shrink-0">{item.icon}</div>
            <div className="min-w-0">
              <p className="text-xs text-slate-400">{item.label}</p>
              <p className="text-sm font-medium text-slate-900 truncate">{item.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <div className="flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all -mb-px ${
                activeTab === tab.id
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <h3 className="text-sm font-semibold text-slate-900">Equipment Details</h3>
            </CardHeader>
            <CardBody className="space-y-3">
              {[
                { label: 'Name', value: equipment.name },
                { label: 'Serial Number', value: equipment.serialNumber },
                { label: 'Model', value: equipment.model },
                { label: 'Brand', value: equipment.brand },
                { label: 'Type', value: equipment.type },
                { label: 'Status', value: <EquipmentStatusBadge status={equipment.status} /> },
                { label: 'Maintenance Frequency', value: equipment.maintenanceFrequency?.replace(/_/g, ' ') },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between items-start gap-4">
                  <span className="text-sm text-slate-500 shrink-0">{label}</span>
                  <span className="text-sm font-medium text-slate-900 text-right">
                    {value ?? '—'}
                  </span>
                </div>
              ))}
            </CardBody>
          </Card>
          <Card>
            <CardHeader>
              <h3 className="text-sm font-semibold text-slate-900">Service & Financial Info</h3>
            </CardHeader>
            <CardBody className="space-y-3">
              {[
                { label: 'Commissioned', value: formatDate(equipment.dateOfCommission) },
                { label: 'Purchase Cost', value: formatCurrency(equipment.purchaseCost) },
                { label: 'Warranty Expiry', value: formatDate(equipment.warrantyExpiryDate) },
                { label: 'Last Service', value: formatDate(equipment.lastServiceDate) },
                { label: 'Next Service', value: formatDate(equipment.nextServiceDate) },
                { label: 'Hospital', value: equipment.hospital?.name },
                { label: 'Department', value: equipment.department?.name },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between items-start gap-4">
                  <span className="text-sm text-slate-500 shrink-0">{label}</span>
                  <span className="text-sm font-medium text-slate-900 text-right">{value ?? '—'}</span>
                </div>
              ))}
            </CardBody>
          </Card>
          {equipment.notes && (
            <Card className="md:col-span-2">
              <CardHeader><h3 className="text-sm font-semibold text-slate-900">Notes</h3></CardHeader>
              <CardBody>
                <p className="text-sm text-slate-600 leading-relaxed">{equipment.notes}</p>
              </CardBody>
            </Card>
          )}
        </div>
      )}

      {activeTab === 'maintenance' && (
        <Card>
          {!maintenance?.data?.length ? (
            <EmptyState icon={<Wrench />} title="No maintenance records" description="No maintenance has been scheduled or completed for this equipment." />
          ) : (
            <div className="divide-y divide-slate-100">
              {maintenance.data.map((m) => (
                <div key={m.id} className="px-6 py-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{m.type.replace(/_/g, ' ')}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Scheduled: {formatDate(m.scheduledDate)} · Technician: {m.technician ? `${m.technician.firstName} ${m.technician.lastName}` : '—'}
                    </p>
                    {m.findings && <p className="text-xs text-slate-500 mt-1">{m.findings}</p>}
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {m.totalCost != null && (
                      <span className="text-sm font-medium text-slate-700">{formatCurrency(m.totalCost)}</span>
                    )}
                    <MaintenanceStatusBadge status={m.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {activeTab === 'breakdowns' && (
        <Card>
          {!breakdowns?.data?.length ? (
            <EmptyState icon={<AlertTriangle />} title="No breakdowns reported" description="No breakdowns have been reported for this equipment." />
          ) : (
            <div className="divide-y divide-slate-100">
              {breakdowns.data.map((b) => (
                <div key={b.id} className="px-6 py-4 flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-sm text-slate-700 leading-snug">{b.issueDescription}</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Reported: {formatRelative(b.dateReported)}
                      {b.assignedTechnician && ` · Assigned: ${b.assignedTechnician.firstName} ${b.assignedTechnician.lastName}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <SeverityBadge severity={b.severity} />
                    <BreakdownStatusBadge status={b.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {activeTab === 'comments' && (
        <div className="space-y-4">
          {/* Add comment */}
          <Card>
            <CardBody>
              <form
                onSubmit={commentForm.handleSubmit((data) => addCommentMutation.mutate(data))}
                className="space-y-3"
              >
                <div className="flex gap-3">
                  <div className="w-40 shrink-0">
                    <Controller
                      name="type"
                      control={commentForm.control}
                      render={({ field }) => (
                        <Select
                          options={Object.values(CommentType).map((t) => ({ value: t, label: t }))}
                          value={field.value}
                          onChange={field.onChange}
                        />
                      )}
                    />
                  </div>
                  <div className="flex-1">
                    <textarea
                      rows={2}
                      placeholder="Add a comment, observation, or recommendation..."
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
                      {...commentForm.register('content')}
                    />
                  </div>
                  <Button
                    type="submit"
                    size="sm"
                    isLoading={addCommentMutation.isPending}
                    leftIcon={<Send className="w-3.5 h-3.5" />}
                    className="self-end"
                  >
                    Post
                  </Button>
                </div>
              </form>
            </CardBody>
          </Card>

          {/* Comments list */}
          <Card>
            {!comments?.length ? (
              <EmptyState icon={<MessageSquare />} title="No comments yet" description="Be the first to add a comment or observation." />
            ) : (
              <div className="divide-y divide-slate-100">
                {comments.map((c) => (
                  <div key={c.id} className="px-6 py-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-xl bg-primary-50 flex items-center justify-center text-xs font-bold text-primary-600 shrink-0">
                        {getInitials(c.author?.firstName, c.author?.lastName)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium text-slate-900">
                            {c.author?.firstName} {c.author?.lastName}
                          </span>
                          <span className="text-xs text-slate-400">{formatRelative(c.createdAt)}</span>
                          <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{c.type}</span>
                          {c.isResolved && (
                            <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Resolved
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-slate-600 mt-1 leading-relaxed">{c.content}</p>
                      </div>
                      {!c.isResolved && (
                        <button
                          onClick={() => resolveCommentMutation.mutate(c.id)}
                          className="text-xs text-slate-400 hover:text-emerald-600 transition-colors shrink-0"
                        >
                          Resolve
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Update status modal */}
      <Modal
        isOpen={editStatusOpen}
        onClose={() => setEditStatusOpen(false)}
        title="Update Equipment Status"
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setEditStatusOpen(false)}>Cancel</Button>
            <Button
              isLoading={updateStatusMutation.isPending}
              onClick={statusForm.handleSubmit((d) => updateStatusMutation.mutate(d.status))}
            >
              Update Status
            </Button>
          </div>
        }
      >
        <Controller
          name="status"
          control={statusForm.control}
          render={({ field }) => (
            <Select
              label="New Status"
              options={Object.values(EquipmentStatus).map((s) => ({ value: s, label: s.replace(/_/g, ' ') }))}
              value={field.value}
              onChange={field.onChange}
            />
          )}
        />
      </Modal>
    </div>
  );
}
