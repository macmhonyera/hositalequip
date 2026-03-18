import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  MapPin,
  ChevronRight,
  ChevronDown,
  Plus,
  Building2,
  LayoutGrid,
  Globe,
} from 'lucide-react';
import { locationsApi } from '@/lib/api';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { DepartmentType, UserRole, type LocationTree, type Hospital as HospitalType, type Department } from '@/types';

type CreateType = 'province' | 'district' | 'hospital' | 'department';

interface SelectedNode {
  type: 'province' | 'district' | 'hospital' | 'department';
  id: string;
  name: string;
  parentId?: string;
  parentName?: string;
  meta?: Record<string, string>;
}

// ─── Schemas ─────────────────────────────────────────────────────────────────

const provinceSchema = z.object({ name: z.string().min(1) });
const districtSchema = z.object({ name: z.string().min(1), provinceId: z.string().min(1) });
const hospitalSchema = z.object({
  name: z.string().min(1),
  districtId: z.string().min(1),
  address: z.string().optional(),
  phone: z.string().optional(),
});
const departmentSchema = z.object({
  name: z.string().min(1),
  type: z.nativeEnum(DepartmentType),
  hospitalId: z.string().min(1),
});

export default function LocationsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const toast = useToast();
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<SelectedNode | null>(null);
  const [createType, setCreateType] = useState<CreateType | null>(null);
  const [createParentId, setCreateParentId] = useState<string>('');

  const isAdmin = user?.role === UserRole.ADMIN;

  const { data: tree, isLoading } = useQuery({
    queryKey: ['location-tree'],
    queryFn: locationsApi.getTree,
    staleTime: 60_000,
  });

  const createProvince = useMutation({
    mutationFn: locationsApi.createProvince,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['location-tree'] }); toast.success('Province created'); setCreateType(null); },
    onError: () => toast.error('Failed to create province'),
  });
  const createDistrict = useMutation({
    mutationFn: locationsApi.createDistrict,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['location-tree'] }); toast.success('District created'); setCreateType(null); },
    onError: () => toast.error('Failed to create district'),
  });
  const createHospital = useMutation({
    mutationFn: locationsApi.createHospital,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['location-tree'] }); toast.success('Hospital created'); setCreateType(null); },
    onError: () => toast.error('Failed to create hospital'),
  });
  const createDepartment = useMutation({
    mutationFn: locationsApi.createDepartment,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['location-tree'] }); toast.success('Department created'); setCreateType(null); },
    onError: () => toast.error('Failed to create department'),
  });

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const provinces = tree ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Location Management</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            {provinces.length} province{provinces.length !== 1 ? 's' : ''} registered
          </p>
        </div>
        {isAdmin && (
          <Button
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => { setCreateType('province'); setCreateParentId(''); }}
          >
            Add Province
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Tree panel */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <Globe className="w-4 h-4 text-primary-500" />
                Location Hierarchy
              </h3>
            </CardHeader>
            <CardBody className="p-0">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Spinner size="md" className="text-primary-600" />
                </div>
              ) : provinces.length === 0 ? (
                <EmptyState
                  icon={<MapPin />}
                  title="No locations yet"
                  description={isAdmin ? "Start by adding a province." : "No locations have been configured."}
                  action={isAdmin ? (
                    <Button size="sm" onClick={() => setCreateType('province')}>Add Province</Button>
                  ) : undefined}
                />
              ) : (
                <div className="py-2 space-y-0.5">
                  {provinces.map((prov) => (
                    <ProvinceNode
                      key={prov.id}
                      province={prov}
                      expanded={expanded}
                      selected={selected}
                      isAdmin={isAdmin}
                      onToggle={toggle}
                      onSelect={setSelected}
                      onAdd={(type, parentId) => { setCreateType(type); setCreateParentId(parentId); }}
                    />
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        {/* Detail panel */}
        <div className="lg:col-span-3">
          {selected ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-900">{selected.name}</h3>
                  <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-lg capitalize">{selected.type}</span>
                </div>
              </CardHeader>
              <CardBody>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Type</span>
                    <span className="font-medium text-slate-900 capitalize">{selected.type}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Name</span>
                    <span className="font-medium text-slate-900">{selected.name}</span>
                  </div>
                  {selected.parentName && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Parent</span>
                      <span className="font-medium text-slate-900">{selected.parentName}</span>
                    </div>
                  )}
                  {selected.meta && Object.entries(selected.meta).map(([k, v]) => (
                    <div key={k} className="flex justify-between text-sm">
                      <span className="text-slate-500 capitalize">{k}</span>
                      <span className="font-medium text-slate-900">{v || '—'}</span>
                    </div>
                  ))}
                </div>

                {isAdmin && (
                  <div className="mt-6 pt-4 border-t border-slate-100">
                    <p className="text-xs text-slate-500 mb-3 font-medium uppercase tracking-wide">Add child location</p>
                    <div className="flex flex-wrap gap-2">
                      {selected.type === 'province' && (
                        <Button size="sm" variant="outline" leftIcon={<Plus className="w-3.5 h-3.5" />}
                          onClick={() => { setCreateType('district'); setCreateParentId(selected.id); }}>
                          Add District
                        </Button>
                      )}
                      {selected.type === 'district' && (
                        <Button size="sm" variant="outline" leftIcon={<Plus className="w-3.5 h-3.5" />}
                          onClick={() => { setCreateType('hospital'); setCreateParentId(selected.id); }}>
                          Add Hospital
                        </Button>
                      )}
                      {selected.type === 'hospital' && (
                        <Button size="sm" variant="outline" leftIcon={<Plus className="w-3.5 h-3.5" />}
                          onClick={() => { setCreateType('department'); setCreateParentId(selected.id); }}>
                          Add Department
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </CardBody>
            </Card>
          ) : (
            <Card>
              <div className="flex items-center justify-center py-24 text-slate-400 flex-col gap-3">
                <MapPin className="w-10 h-10 opacity-30" />
                <p className="text-sm">Select a location to view details</p>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Modals */}
      {createType === 'province' && (
        <SimpleFormModal
          title="Add Province"
          isOpen={true}
          onClose={() => setCreateType(null)}
          schema={provinceSchema}
          fields={[{ name: 'name', label: 'Province Name' }]}
          onSubmit={(d) => createProvince.mutate(d as { name: string })}
          isLoading={createProvince.isPending}
        />
      )}
      {createType === 'district' && (
        <DistrictModal
          isOpen={true}
          onClose={() => setCreateType(null)}
          provinces={provinces}
          defaultProvinceId={createParentId}
          onSubmit={(d) => createDistrict.mutate(d)}
          isLoading={createDistrict.isPending}
        />
      )}
      {createType === 'hospital' && (
        <HospitalModal
          isOpen={true}
          onClose={() => setCreateType(null)}
          districts={provinces.flatMap((p) => p.districts ?? [])}
          defaultDistrictId={createParentId}
          onSubmit={(d) => createHospital.mutate(d)}
          isLoading={createHospital.isPending}
        />
      )}
      {createType === 'department' && (
        <DepartmentModal
          isOpen={true}
          onClose={() => setCreateType(null)}
          hospitals={provinces.flatMap((p) => (p.districts ?? []).flatMap((d) => d.hospitals ?? []))}
          defaultHospitalId={createParentId}
          onSubmit={(d) => createDepartment.mutate(d)}
          isLoading={createDepartment.isPending}
        />
      )}
    </div>
  );
}

// ─── Tree Node Components ─────────────────────────────────────────────────────

interface TreeNodeProps {
  province: LocationTree;
  expanded: Set<string>;
  selected: SelectedNode | null;
  isAdmin: boolean;
  onToggle: (id: string) => void;
  onSelect: (node: SelectedNode) => void;
  onAdd: (type: CreateType, parentId: string) => void;
}

function ProvinceNode({ province, expanded, selected, isAdmin, onToggle, onSelect, onAdd }: TreeNodeProps) {
  const isExpanded = expanded.has(province.id);
  const isSelected = selected?.id === province.id;

  return (
    <div>
      <div
        className={`flex items-center gap-2 px-4 py-2 cursor-pointer hover:bg-slate-50 transition-colors group ${isSelected ? 'bg-primary-50' : ''}`}
        onClick={() => { onSelect({ type: 'province', id: province.id, name: province.name }); onToggle(province.id); }}
      >
        <button
          onClick={(e) => { e.stopPropagation(); onToggle(province.id); }}
          className="text-slate-400 hover:text-slate-600 transition-colors"
        >
          {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
        </button>
        <Globe className="w-4 h-4 text-primary-500 shrink-0" />
        <span className={`text-sm flex-1 ${isSelected ? 'text-primary-700 font-medium' : 'text-slate-700'}`}>
          {province.name}
        </span>
        {isAdmin && (
          <button onClick={(e) => { e.stopPropagation(); onAdd('district', province.id); }}
            className="opacity-0 group-hover:opacity-100 p-1 rounded text-slate-400 hover:text-primary-600 transition-all">
            <Plus className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      {isExpanded && (province.districts ?? []).map((dist) => (
        <div key={dist.id} className="pl-6">
          <DistrictNode district={dist} expanded={expanded} selected={selected} isAdmin={isAdmin}
            onToggle={onToggle} onSelect={onSelect} onAdd={onAdd} parentName={province.name} />
        </div>
      ))}
    </div>
  );
}

function DistrictNode({ district, expanded, selected, isAdmin, onToggle, onSelect, onAdd, parentName }: {
  district: { id: string; name: string; hospitals?: (HospitalType & { departments?: Department[] })[] }; expanded: Set<string>; selected: SelectedNode | null;
  isAdmin: boolean; onToggle: (id: string) => void; onSelect: (n: SelectedNode) => void;
  onAdd: (t: CreateType, id: string) => void; parentName: string;
}) {
  const isExpanded = expanded.has(district.id);
  const isSelected = selected?.id === district.id;

  return (
    <div>
      <div
        className={`flex items-center gap-2 px-4 py-2 cursor-pointer hover:bg-slate-50 transition-colors group ${isSelected ? 'bg-primary-50' : ''}`}
        onClick={() => { onSelect({ type: 'district', id: district.id, name: district.name, parentName }); onToggle(district.id); }}
      >
        <button onClick={(e) => { e.stopPropagation(); onToggle(district.id); }} className="text-slate-400 hover:text-slate-600">
          {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
        </button>
        <MapPin className="w-4 h-4 text-amber-500 shrink-0" />
        <span className={`text-sm flex-1 ${isSelected ? 'text-primary-700 font-medium' : 'text-slate-600'}`}>{district.name}</span>
        {isAdmin && (
          <button onClick={(e) => { e.stopPropagation(); onAdd('hospital', district.id); }}
            className="opacity-0 group-hover:opacity-100 p-1 rounded text-slate-400 hover:text-primary-600 transition-all">
            <Plus className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      {isExpanded && (district.hospitals ?? []).map((hosp) => (
        <div key={hosp.id} className="pl-6">
          <HospitalNode hospital={hosp} expanded={expanded} selected={selected} isAdmin={isAdmin}
            onToggle={onToggle} onSelect={onSelect} onAdd={onAdd} parentName={district.name} />
        </div>
      ))}
    </div>
  );
}

function HospitalNode({ hospital, expanded, selected, isAdmin, onToggle, onSelect, onAdd, parentName }: {
  hospital: HospitalType & { departments?: Department[] }; expanded: Set<string>; selected: SelectedNode | null;
  isAdmin: boolean; onToggle: (id: string) => void; onSelect: (n: SelectedNode) => void;
  onAdd: (t: CreateType, id: string) => void; parentName: string;
}) {
  const isExpanded = expanded.has(hospital.id);
  const isSelected = selected?.id === hospital.id;

  return (
    <div>
      <div
        className={`flex items-center gap-2 px-4 py-2 cursor-pointer hover:bg-slate-50 transition-colors group ${isSelected ? 'bg-primary-50' : ''}`}
        onClick={() => {
          onSelect({ type: 'hospital', id: hospital.id, name: hospital.name, parentName,
            meta: { address: hospital.address ?? '', phone: hospital.phone ?? '' } });
          onToggle(hospital.id);
        }}
      >
        <button onClick={(e) => { e.stopPropagation(); onToggle(hospital.id); }} className="text-slate-400 hover:text-slate-600">
          {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
        </button>
        <Building2 className="w-4 h-4 text-blue-500 shrink-0" />
        <span className={`text-sm flex-1 ${isSelected ? 'text-primary-700 font-medium' : 'text-slate-600'}`}>{hospital.name}</span>
        {isAdmin && (
          <button onClick={(e) => { e.stopPropagation(); onAdd('department', hospital.id); }}
            className="opacity-0 group-hover:opacity-100 p-1 rounded text-slate-400 hover:text-primary-600 transition-all">
            <Plus className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      {isExpanded && (hospital.departments ?? []).map((dept: Department) => (
        <div key={dept.id} className="pl-6">
          <div
            className={`flex items-center gap-2 px-4 py-2 cursor-pointer hover:bg-slate-50 transition-colors ${selected?.id === dept.id ? 'bg-primary-50' : ''}`}
            onClick={() => onSelect({ type: 'department', id: dept.id, name: dept.name, parentName: hospital.name, meta: { type: dept.type } })}
          >
            <div className="w-3.5 h-3.5 shrink-0" />
            <LayoutGrid className="w-4 h-4 text-emerald-500 shrink-0" />
            <span className={`text-sm flex-1 ${selected?.id === dept.id ? 'text-primary-700 font-medium' : 'text-slate-500'}`}>
              {dept.name}
            </span>
            <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">{dept.type}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Simple Form Modal ────────────────────────────────────────────────────────

function SimpleFormModal({ title, isOpen, onClose, schema, fields, onSubmit, isLoading }: {
  title: string; isOpen: boolean; onClose: () => void;
  schema: z.ZodSchema; fields: { name: string; label: string }[];
  onSubmit: (d: Record<string, string>) => void; isLoading: boolean;
}) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  });

  return (
    <Modal isOpen={isOpen} onClose={() => { reset(); onClose(); }} title={title} size="sm"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => { reset(); onClose(); }}>Cancel</Button>
          <Button isLoading={isLoading} onClick={handleSubmit(onSubmit as never)}>Create</Button>
        </div>
      }
    >
      <form className="space-y-4">
        {fields.map((f) => (
          <Input key={f.name} label={f.label} error={(errors[f.name] as { message?: string })?.message} required
            {...register(f.name)} />
        ))}
      </form>
    </Modal>
  );
}

function DistrictModal({ isOpen, onClose, provinces, defaultProvinceId, onSubmit, isLoading }: {
  isOpen: boolean; onClose: () => void;
  provinces: LocationTree[];
  defaultProvinceId: string;
  onSubmit: (d: { name: string; provinceId: string }) => void; isLoading: boolean;
}) {
  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<z.infer<typeof districtSchema>>({
    resolver: zodResolver(districtSchema), defaultValues: { provinceId: defaultProvinceId },
  });
  return (
    <Modal isOpen={isOpen} onClose={() => { reset(); onClose(); }} title="Add District" size="sm"
      footer={<div className="flex justify-end gap-2"><Button variant="outline" onClick={() => { reset(); onClose(); }}>Cancel</Button><Button isLoading={isLoading} onClick={handleSubmit(onSubmit)}>Create</Button></div>}
    >
      <form className="space-y-4">
        <Input label="District Name" error={errors.name?.message} required {...register('name')} />
        <Controller name="provinceId" control={control}
          render={({ field }) => (
            <Select label="Province" required value={field.value} onChange={field.onChange}
              options={provinces.map((p) => ({ value: p.id, label: p.name }))}
              error={errors.provinceId?.message} placeholder="Select province..." />
          )}
        />
      </form>
    </Modal>
  );
}

function HospitalModal({ isOpen, onClose, districts, defaultDistrictId, onSubmit, isLoading }: {
  isOpen: boolean; onClose: () => void;
  districts: { id: string; name: string }[];
  defaultDistrictId: string;
  onSubmit: (d: { name: string; districtId: string; address?: string; phone?: string }) => void;
  isLoading: boolean;
}) {
  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<z.infer<typeof hospitalSchema>>({
    resolver: zodResolver(hospitalSchema), defaultValues: { districtId: defaultDistrictId },
  });
  return (
    <Modal isOpen={isOpen} onClose={() => { reset(); onClose(); }} title="Add Hospital" size="md"
      footer={<div className="flex justify-end gap-2"><Button variant="outline" onClick={() => { reset(); onClose(); }}>Cancel</Button><Button isLoading={isLoading} onClick={handleSubmit(onSubmit)}>Create</Button></div>}
    >
      <form className="space-y-4">
        <Input label="Hospital Name" error={errors.name?.message} required {...register('name')} />
        <Controller name="districtId" control={control}
          render={({ field }) => (
            <Select label="District" required value={field.value} onChange={field.onChange}
              options={districts.map((d) => ({ value: d.id, label: d.name }))}
              error={errors.districtId?.message} placeholder="Select district..." />
          )}
        />
        <Input label="Address" {...register('address')} />
        <Input label="Phone" type="tel" {...register('phone')} />
      </form>
    </Modal>
  );
}

function DepartmentModal({ isOpen, onClose, hospitals, defaultHospitalId, onSubmit, isLoading }: {
  isOpen: boolean; onClose: () => void;
  hospitals: { id: string; name: string }[];
  defaultHospitalId: string;
  onSubmit: (d: { name: string; type: string; hospitalId: string }) => void;
  isLoading: boolean;
}) {
  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<z.infer<typeof departmentSchema>>({
    resolver: zodResolver(departmentSchema), defaultValues: { hospitalId: defaultHospitalId, type: DepartmentType.OTHER },
  });
  return (
    <Modal isOpen={isOpen} onClose={() => { reset(); onClose(); }} title="Add Department" size="md"
      footer={<div className="flex justify-end gap-2"><Button variant="outline" onClick={() => { reset(); onClose(); }}>Cancel</Button><Button isLoading={isLoading} onClick={handleSubmit(onSubmit as never)}>Create</Button></div>}
    >
      <form className="space-y-4">
        <Input label="Department Name" error={errors.name?.message} required {...register('name')} />
        <Controller name="type" control={control}
          render={({ field }) => (
            <Select label="Department Type" required value={field.value} onChange={field.onChange}
              options={Object.values(DepartmentType).map((t) => ({ value: t, label: t }))} />
          )}
        />
        <Controller name="hospitalId" control={control}
          render={({ field }) => (
            <Select label="Hospital" required value={field.value} onChange={field.onChange}
              options={hospitals.map((h) => ({ value: h.id, label: h.name }))}
              error={errors.hospitalId?.message} placeholder="Select hospital..." />
          )}
        />
      </form>
    </Modal>
  );
}
