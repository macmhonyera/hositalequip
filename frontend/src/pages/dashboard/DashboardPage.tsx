import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Package,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Zap,
  TrendingUp,
  Activity,
  DollarSign,
  ArrowRight,
  Wrench,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { reportsApi } from '@/lib/api';
import { StatCard } from '@/components/ui/StatCard';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatCurrency, formatDate, formatRelative } from '@/lib/utils';

const STATUS_COLORS = {
  Active: '#10B981',
  Faulty: '#EF4444',
  'Under Maintenance': '#F59E0B',
  'Awaiting Repair': '#3B82F6',
  Decommissioned: '#94A3B8',
};

// Fallback demo data if API is unavailable
const DEMO_DATA = {
  totalEquipment: 248,
  activeEquipment: 196,
  faultyEquipment: 18,
  maintenanceOverdue: 12,
  openBreakdowns: 24,
  criticalBreakdowns: 5,
  totalMaintenanceCost: 4_850_000,
  thisMonthMaintenance: 890_000,
  resolvedThisMonth: 19,
  topFaultyEquipment: [
    { id: '1', name: 'Ventilator A', serialNumber: 'VT-001', breakdownCount: 7, lastBreakdown: new Date().toISOString() },
    { id: '2', name: 'X-Ray Machine', serialNumber: 'XR-002', breakdownCount: 5, lastBreakdown: new Date().toISOString() },
    { id: '3', name: 'ECG Monitor', serialNumber: 'ECG-003', breakdownCount: 4, lastBreakdown: new Date().toISOString() },
    { id: '4', name: 'Infusion Pump', serialNumber: 'IP-004', breakdownCount: 3, lastBreakdown: new Date().toISOString() },
  ],
  recentActivity: [
    { id: '1', type: 'breakdown' as const, description: 'Ventilator breakdown reported in ICU', timestamp: new Date(Date.now() - 3600000).toISOString() },
    { id: '2', type: 'maintenance' as const, description: 'Scheduled maintenance completed for CT Scanner', timestamp: new Date(Date.now() - 7200000).toISOString() },
    { id: '3', type: 'equipment' as const, description: 'New Defibrillator added to Emergency dept', timestamp: new Date(Date.now() - 10800000).toISOString() },
    { id: '4', type: 'breakdown' as const, description: 'X-Ray Machine repaired and set to Active', timestamp: new Date(Date.now() - 14400000).toISOString() },
    { id: '5', type: 'maintenance' as const, description: 'Maintenance overdue: MRI Scanner', timestamp: new Date(Date.now() - 86400000).toISOString() },
  ],
};

const equipmentStatusData = [
  { name: 'Active', value: 196 },
  { name: 'Faulty', value: 18 },
  { name: 'Under Maintenance', value: 22 },
  { name: 'Awaiting Repair', value: 8 },
  { name: 'Decommissioned', value: 4 },
];

const maintenanceTrend = [
  { month: 'Sep', count: 12, cost: 620000 },
  { month: 'Oct', count: 18, cost: 890000 },
  { month: 'Nov', count: 15, cost: 740000 },
  { month: 'Dec', count: 20, cost: 980000 },
  { month: 'Jan', count: 16, cost: 810000 },
  { month: 'Feb', count: 22, cost: 1050000 },
  { month: 'Mar', count: 19, cost: 890000 },
];

const activityIconMap = {
  maintenance: { icon: <Wrench className="w-3.5 h-3.5" />, color: 'bg-blue-100 text-blue-600' },
  breakdown: { icon: <AlertTriangle className="w-3.5 h-3.5" />, color: 'bg-red-100 text-red-600' },
  equipment: { icon: <Package className="w-3.5 h-3.5" />, color: 'bg-emerald-100 text-emerald-600' },
  comment: { icon: <Activity className="w-3.5 h-3.5" />, color: 'bg-purple-100 text-purple-600' },
};

export default function DashboardPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: reportsApi.getDashboard,
    retry: 1,
    staleTime: 1000 * 60 * 5,
  });

  const d = {
    ...(DEMO_DATA),
    ...(stats ?? {}),
    topFaultyEquipment: stats?.topFaultyEquipment?.length ? stats.topFaultyEquipment : DEMO_DATA.topFaultyEquipment,
    recentActivity: stats?.recentActivity?.length ? stats.recentActivity : DEMO_DATA.recentActivity,
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-72 rounded-xl" />
          <Skeleton className="h-72 rounded-xl" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          label="Total Equipment"
          value={d.totalEquipment}
          icon={<Package />}
          color="indigo"
          subtitle="All registered"
        />
        <StatCard
          label="Active"
          value={d.activeEquipment}
          icon={<CheckCircle2 />}
          color="emerald"
          trend="up"
          trendValue="4.5%"
          subtitle="vs last month"
        />
        <StatCard
          label="Faulty"
          value={d.faultyEquipment}
          icon={<AlertTriangle />}
          color="red"
          trend={d.faultyEquipment > 10 ? 'up' : 'down'}
          trendValue="2 units"
          subtitle="this week"
        />
        <StatCard
          label="Maintenance Overdue"
          value={d.maintenanceOverdue}
          icon={<Clock />}
          color="amber"
          subtitle="Need attention"
        />
        <StatCard
          label="Open Breakdowns"
          value={d.openBreakdowns}
          icon={<Zap />}
          color="blue"
          subtitle={`${d.criticalBreakdowns} critical`}
        />
        <StatCard
          label="Monthly Cost"
          value={`${(d.thisMonthMaintenance / 1000).toFixed(0)}K`}
          icon={<DollarSign />}
          color="purple"
          trend="down"
          trendValue="12%"
          subtitle="vs last month"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Equipment by status */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Equipment by Status</h3>
                <p className="text-xs text-slate-500 mt-0.5">Current distribution</p>
              </div>
              <Link to="/equipment" className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-1 font-medium">
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </CardHeader>
          <CardBody className="pt-2">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={equipmentStatusData} barSize={36}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: '#94A3B8' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 12 }}
                  cursor={{ fill: '#F8FAFC' }}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {equipmentStatusData.map((entry) => (
                    <Cell
                      key={entry.name}
                      fill={STATUS_COLORS[entry.name as keyof typeof STATUS_COLORS] ?? '#818CF8'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>

        {/* Maintenance trend */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Maintenance Trend</h3>
                <p className="text-xs text-slate-500 mt-0.5">Last 7 months</p>
              </div>
              <div className="flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                <TrendingUp className="w-3 h-3" />
                <span>{d.resolvedThisMonth} resolved this month</span>
              </div>
            </div>
          </CardHeader>
          <CardBody className="pt-2">
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={maintenanceTrend}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366F1" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 12 }}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="#6366F1"
                  strokeWidth={2.5}
                  fill="url(#colorCount)"
                  dot={{ fill: '#6366F1', strokeWidth: 0, r: 4 }}
                  activeDot={{ r: 6, fill: '#4F46E5' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top faulty equipment */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Top Faulty Equipment</h3>
                <p className="text-xs text-slate-500 mt-0.5">Most breakdowns reported</p>
              </div>
              <Link to="/breakdowns" className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-1 font-medium">
                See breakdowns <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </CardHeader>
          <CardBody className="p-0">
            <div className="divide-y divide-slate-100">
              {d.topFaultyEquipment.map((eq, idx) => (
                <div key={eq.id} className="flex items-center gap-4 px-6 py-3.5 hover:bg-slate-50 transition-colors">
                  <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500 shrink-0">
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{eq.name}</p>
                    <p className="text-xs text-slate-400">{eq.serialNumber}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-red-600">{eq.breakdownCount}</p>
                    <p className="text-xs text-slate-400">breakdowns</p>
                  </div>
                  <Link
                    to={`/equipment/${eq.id}`}
                    className="shrink-0 p-1.5 rounded-lg text-slate-400 hover:text-primary-600 hover:bg-primary-50 transition-colors"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        {/* Recent activity */}
        <Card>
          <CardHeader>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Recent Activity</h3>
              <p className="text-xs text-slate-500 mt-0.5">Latest system events</p>
            </div>
          </CardHeader>
          <CardBody className="p-0">
            <div className="divide-y divide-slate-100">
              {d.recentActivity.map((item) => {
                const cfg = activityIconMap[item.type] ?? activityIconMap.comment;
                return (
                  <div key={item.id} className="flex items-start gap-3 px-6 py-3.5 hover:bg-slate-50 transition-colors">
                    <div className={`mt-0.5 p-1.5 rounded-lg shrink-0 ${cfg.color}`}>
                      {cfg.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-700 leading-snug">{item.description}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{formatRelative(item.timestamp)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Summary footer */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Maintenance Cost', value: formatCurrency(d.totalMaintenanceCost), icon: <DollarSign className="w-4 h-4" />, color: 'text-purple-600 bg-purple-50' },
          { label: 'Resolved This Month', value: `${d.resolvedThisMonth} breakdowns`, icon: <CheckCircle2 className="w-4 h-4" />, color: 'text-emerald-600 bg-emerald-50' },
          { label: 'Critical Breakdowns', value: d.criticalBreakdowns, icon: <AlertTriangle className="w-4 h-4" />, color: 'text-red-600 bg-red-50' },
          { label: 'Monthly Maintenance', value: formatCurrency(d.thisMonthMaintenance), icon: <Wrench className="w-4 h-4" />, color: 'text-blue-600 bg-blue-50' },
        ].map((item) => (
          <div key={item.label} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3">
            <div className={`p-2 rounded-lg shrink-0 ${item.color}`}>{item.icon}</div>
            <div className="min-w-0">
              <p className="text-xs text-slate-500 truncate">{item.label}</p>
              <p className="text-sm font-semibold text-slate-900 truncate">{item.value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
