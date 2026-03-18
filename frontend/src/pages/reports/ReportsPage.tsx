import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { BarChart3, Package, Wrench, AlertTriangle, TrendingUp, DollarSign } from 'lucide-react';
import { reportsApi } from '@/lib/api';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { StatCard } from '@/components/ui/StatCard';
import { Skeleton, SkeletonCard } from '@/components/ui/Skeleton';
import { formatCurrency } from '@/lib/utils';
import { EquipmentStatus, MaintenanceType, BreakdownSeverity } from '@/types';

type TabId = 'overview' | 'equipment' | 'maintenance' | 'breakdowns';

const COLORS = {
  [EquipmentStatus.ACTIVE]: '#10B981',
  [EquipmentStatus.FAULTY]: '#EF4444',
  [EquipmentStatus.UNDER_MAINTENANCE]: '#F59E0B',
  [EquipmentStatus.AWAITING_REPAIR]: '#3B82F6',
  [EquipmentStatus.DECOMMISSIONED]: '#94A3B8',
};

const MAINTENANCE_COLORS = ['#6366F1', '#10B981', '#F59E0B', '#3B82F6', '#EF4444'];

const SEVERITY_COLORS = {
  [BreakdownSeverity.LOW]: '#94A3B8',
  [BreakdownSeverity.MEDIUM]: '#F59E0B',
  [BreakdownSeverity.HIGH]: '#F97316',
  [BreakdownSeverity.CRITICAL]: '#EF4444',
};

// Static demo charts data
const equipmentStatusData = [
  { name: 'Active', value: 196, color: '#10B981' },
  { name: 'Faulty', value: 18, color: '#EF4444' },
  { name: 'Maintenance', value: 22, color: '#F59E0B' },
  { name: 'Awaiting', value: 8, color: '#3B82F6' },
  { name: 'Decommissioned', value: 4, color: '#94A3B8' },
];

const maintenanceByType = [
  { name: 'Preventive', count: 48, cost: 2_400_000 },
  { name: 'Corrective', count: 32, cost: 1_800_000 },
  { name: 'Calibration', count: 18, cost: 540_000 },
  { name: 'Inspection', count: 24, cost: 480_000 },
  { name: 'Emergency', count: 8, cost: 960_000 },
];

const breakdownBySeverity = [
  { name: 'Critical', value: 5, color: '#EF4444' },
  { name: 'High', value: 12, color: '#F97316' },
  { name: 'Medium', value: 28, color: '#F59E0B' },
  { name: 'Low', value: 19, color: '#94A3B8' },
];

const monthlyTrend = [
  { month: 'Sep', maintenance: 12, breakdowns: 8 },
  { month: 'Oct', maintenance: 18, breakdowns: 12 },
  { month: 'Nov', maintenance: 15, breakdowns: 9 },
  { month: 'Dec', maintenance: 20, breakdowns: 14 },
  { month: 'Jan', maintenance: 16, breakdowns: 7 },
  { month: 'Feb', maintenance: 22, breakdowns: 11 },
  { month: 'Mar', maintenance: 19, breakdowns: 9 },
];

const topTechnicians = [
  { name: 'Jean-Paul Mugisha', completed: 24, avgTime: '2.3 days', cost: 480_000 },
  { name: 'Amina Uwimana', completed: 19, avgTime: '1.8 days', cost: 380_000 },
  { name: 'Eric Habimana', completed: 17, avgTime: '3.1 days', cost: 340_000 },
  { name: 'Marie Mukamana', completed: 15, avgTime: '2.7 days', cost: 300_000 },
  { name: 'Patrick Nkusi', completed: 13, avgTime: '2.0 days', cost: 260_000 },
];

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<TabId>('overview');

  const { data: dashboard, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: reportsApi.getDashboard,
    retry: 1,
    staleTime: 300_000,
  });

  const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Overview', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'equipment', label: 'Equipment', icon: <Package className="w-4 h-4" /> },
    { id: 'maintenance', label: 'Maintenance', icon: <Wrench className="w-4 h-4" /> },
    { id: 'breakdowns', label: 'Breakdowns', icon: <AlertTriangle className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Reports & Analytics</h2>
        <p className="text-sm text-slate-500 mt-0.5">System-wide performance insights</p>
      </div>

      {/* Tab nav */}
      <div className="border-b border-slate-200 overflow-x-auto">
        <div className="flex gap-1 min-w-max">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all -mb-px whitespace-nowrap ${
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

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Key metrics */}
          {isLoading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label="Total Equipment" value={dashboard?.totalEquipment ?? 248} icon={<Package />} color="indigo" />
              <StatCard label="Active Equipment" value={dashboard?.activeEquipment ?? 196} icon={<TrendingUp />} color="emerald" />
              <StatCard label="Total Maint. Cost" value={formatCurrency(dashboard?.totalMaintenanceCost ?? 4_850_000)} icon={<DollarSign />} color="purple" />
              <StatCard label="Open Breakdowns" value={dashboard?.openBreakdowns ?? 24} icon={<AlertTriangle />} color="red" />
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Equipment status pie */}
            <Card>
              <CardHeader>
                <h3 className="text-sm font-semibold text-slate-900">Equipment by Status</h3>
                <p className="text-xs text-slate-500 mt-0.5">Current distribution across all facilities</p>
              </CardHeader>
              <CardBody>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={equipmentStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {equipmentStatusData.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 12 }} />
                    <Legend iconType="circle" iconSize={8} formatter={(v) => <span className="text-xs text-slate-600">{v}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              </CardBody>
            </Card>

            {/* Monthly trend */}
            <Card>
              <CardHeader>
                <h3 className="text-sm font-semibold text-slate-900">Monthly Activity Trend</h3>
                <p className="text-xs text-slate-500 mt-0.5">Maintenance vs Breakdowns over 7 months</p>
              </CardHeader>
              <CardBody>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={monthlyTrend} barSize={20} barGap={6}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 12 }} />
                    <Legend iconType="circle" iconSize={8} formatter={(v) => <span className="text-xs text-slate-600 capitalize">{v}</span>} />
                    <Bar dataKey="maintenance" fill="#6366F1" radius={[4, 4, 0, 0]} name="Maintenance" />
                    <Bar dataKey="breakdowns" fill="#EF4444" radius={[4, 4, 0, 0]} name="Breakdowns" />
                  </BarChart>
                </ResponsiveContainer>
              </CardBody>
            </Card>
          </div>
        </div>
      )}

      {/* Equipment Tab */}
      {activeTab === 'equipment' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <h3 className="text-sm font-semibold text-slate-900">Status Distribution</h3>
              </CardHeader>
              <CardBody>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie data={equipmentStatusData} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`} labelLine={false}>
                      {equipmentStatusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <h3 className="text-sm font-semibold text-slate-900">Equipment Summary</h3>
              </CardHeader>
              <CardBody>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="text-left py-2 text-xs font-semibold text-slate-500">Status</th>
                      <th className="text-right py-2 text-xs font-semibold text-slate-500">Count</th>
                      <th className="text-right py-2 text-xs font-semibold text-slate-500">% Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {equipmentStatusData.map((item) => (
                      <tr key={item.name}>
                        <td className="py-2.5 flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                          <span className="text-slate-700">{item.name}</span>
                        </td>
                        <td className="py-2.5 text-right font-semibold text-slate-900">{item.value}</td>
                        <td className="py-2.5 text-right text-slate-500">
                          {((item.value / equipmentStatusData.reduce((a, b) => a + b.value, 0)) * 100).toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                    <tr className="border-t border-slate-200 font-semibold">
                      <td className="py-2.5 text-slate-900">Total</td>
                      <td className="py-2.5 text-right text-slate-900">{equipmentStatusData.reduce((a, b) => a + b.value, 0)}</td>
                      <td className="py-2.5 text-right text-slate-500">100%</td>
                    </tr>
                  </tbody>
                </table>
              </CardBody>
            </Card>
          </div>
        </div>
      )}

      {/* Maintenance Tab */}
      {activeTab === 'maintenance' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Maintenance by type */}
            <Card>
              <CardHeader>
                <h3 className="text-sm font-semibold text-slate-900">Maintenance by Type</h3>
                <p className="text-xs text-slate-500 mt-0.5">Count and total cost per type</p>
              </CardHeader>
              <CardBody>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={maintenanceByType} barSize={32} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} width={80} />
                    <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 12 }} />
                    <Bar dataKey="count" fill="#6366F1" radius={[0, 4, 4, 0]} name="Count">
                      {maintenanceByType.map((_, i) => <Cell key={i} fill={MAINTENANCE_COLORS[i % MAINTENANCE_COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardBody>
            </Card>

            {/* Cost breakdown */}
            <Card>
              <CardHeader>
                <h3 className="text-sm font-semibold text-slate-900">Cost by Maintenance Type</h3>
              </CardHeader>
              <CardBody>
                <div className="space-y-3">
                  {maintenanceByType.map((item, i) => {
                    const maxCost = Math.max(...maintenanceByType.map((m) => m.cost));
                    const pct = (item.cost / maxCost) * 100;
                    return (
                      <div key={item.name}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-slate-700">{item.name}</span>
                          <span className="font-medium text-slate-900">{formatCurrency(item.cost)}</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${pct}%`, backgroundColor: MAINTENANCE_COLORS[i % MAINTENANCE_COLORS.length] }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardBody>
            </Card>
          </div>

          {/* Technician performance */}
          <Card>
            <CardHeader>
              <h3 className="text-sm font-semibold text-slate-900">Technician Performance</h3>
              <p className="text-xs text-slate-500 mt-0.5">Completed maintenance records this period</p>
            </CardHeader>
            <CardBody className="p-0">
              <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/60">
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Technician</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Completed</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Avg. Resolution</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Total Cost</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {topTechnicians.map((t, i) => (
                    <tr key={t.name} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-lg bg-primary-50 flex items-center justify-center text-xs font-bold text-primary-600">
                            {i + 1}
                          </div>
                          <span className="font-medium text-slate-900">{t.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-900 font-semibold">{t.completed}</span>
                          <div className="flex-1 h-1.5 bg-slate-100 rounded-full max-w-[80px] overflow-hidden">
                            <div className="h-full bg-primary-500 rounded-full" style={{ width: `${(t.completed / 24) * 100}%` }} />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-3 text-slate-700">{t.avgTime}</td>
                      <td className="px-6 py-3 font-medium text-slate-900">{formatCurrency(t.cost)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {/* Breakdowns Tab */}
      {activeTab === 'breakdowns' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Severity pie */}
            <Card>
              <CardHeader>
                <h3 className="text-sm font-semibold text-slate-900">Breakdown by Severity</h3>
              </CardHeader>
              <CardBody>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie data={breakdownBySeverity} cx="50%" cy="50%" innerRadius={55} outerRadius={100} paddingAngle={4} dataKey="value">
                      {breakdownBySeverity.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 12 }} />
                    <Legend iconType="circle" iconSize={8} formatter={(v) => <span className="text-xs text-slate-600">{v}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              </CardBody>
            </Card>

            {/* Severity table */}
            <Card>
              <CardHeader>
                <h3 className="text-sm font-semibold text-slate-900">Breakdown Summary</h3>
              </CardHeader>
              <CardBody>
                <div className="space-y-4">
                  {breakdownBySeverity.map((item) => (
                    <div key={item.name} className="flex items-center gap-4">
                      <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                      <div className="flex-1">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-slate-700 font-medium">{item.name}</span>
                          <span className="text-slate-900 font-semibold">{item.value}</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${(item.value / breakdownBySeverity.reduce((a, b) => a + b.value, 0)) * 100}%`, backgroundColor: item.color }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className="pt-3 border-t border-slate-100 flex justify-between text-sm">
                    <span className="text-slate-600 font-medium">Total Breakdowns</span>
                    <span className="font-bold text-slate-900">{breakdownBySeverity.reduce((a, b) => a + b.value, 0)}</span>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>

          {/* Resolution time analysis */}
          <Card>
            <CardHeader>
              <h3 className="text-sm font-semibold text-slate-900">Resolution Time Analysis</h3>
              <p className="text-xs text-slate-500 mt-0.5">Average days to resolve by severity level</p>
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { severity: 'Critical', avgDays: 1.2, color: '#EF4444', target: 1 },
                  { severity: 'High', avgDays: 3.5, color: '#F97316', target: 3 },
                  { severity: 'Medium', avgDays: 7.8, color: '#F59E0B', target: 7 },
                  { severity: 'Low', avgDays: 14.2, color: '#94A3B8', target: 14 },
                ].map((item) => (
                  <div key={item.severity} className="bg-slate-50 rounded-xl p-4 text-center">
                    <div className="w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center" style={{ backgroundColor: item.color + '20' }}>
                      <span className="text-lg font-bold" style={{ color: item.color }}>{item.avgDays}</span>
                    </div>
                    <p className="text-xs font-semibold text-slate-700">{item.severity}</p>
                    <p className="text-xs text-slate-400 mt-0.5">avg. days</p>
                    <p className="text-xs mt-2" style={{ color: item.avgDays <= item.target ? '#10B981' : '#EF4444' }}>
                      {item.avgDays <= item.target ? 'Within SLA' : 'Exceeds SLA'}
                    </p>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        </div>
      )}
    </div>
  );
}
