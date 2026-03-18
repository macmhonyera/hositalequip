import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Equipment, EquipmentStatus } from '../equipment/entities/equipment.entity';
import { MaintenanceRecord, MaintenanceStatus } from '../maintenance/entities/maintenance-record.entity';
import { Breakdown, BreakdownStatus } from '../breakdowns/entities/breakdown.entity';

export interface ReportFilters {
  startDate?: string;
  endDate?: string;
  hospitalId?: string;
  departmentId?: string;
  provinceId?: string;
  districtId?: string;
  equipmentId?: string;
  technicianId?: string;
}

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Equipment)
    private readonly equipmentRepo: Repository<Equipment>,
    @InjectRepository(MaintenanceRecord)
    private readonly maintenanceRepo: Repository<MaintenanceRecord>,
    @InjectRepository(Breakdown)
    private readonly breakdownRepo: Repository<Breakdown>,
  ) {}

  // ── EQUIPMENT REPORTS ─────────────────────────────────────────────────────

  async getEquipmentReport(filters: ReportFilters) {
    const qb = this.equipmentRepo
      .createQueryBuilder('equipment')
      .leftJoinAndSelect('equipment.hospital', 'hospital')
      .leftJoinAndSelect('equipment.department', 'department')
      .leftJoinAndSelect('hospital.district', 'district')
      .leftJoinAndSelect('district.province', 'province');

    this.applyLocationFilters(qb, filters, 'equipment');

    if (filters.equipmentId) qb.andWhere('equipment.id = :equipmentId', { equipmentId: filters.equipmentId });

    const equipment = await qb.getMany();

    const summary = {
      total: equipment.length,
      byStatus: this.groupBy(equipment, 'status'),
      byType: this.groupBy(equipment, 'type'),
      byBrand: this.groupBy(equipment, 'brand'),
      maintenanceOverdue: equipment.filter((e) => e.maintenanceOverdue).length,
      decommissioningSoon: equipment.filter((e) => {
        if (!e.expectedDecommissionDate) return false;
        const daysLeft = Math.ceil((new Date(e.expectedDecommissionDate).getTime() - Date.now()) / 86400000);
        return daysLeft >= 0 && daysLeft <= 90;
      }).length,
    };

    return { summary, equipment };
  }

  async getInventoryReport(filters: ReportFilters) {
    const qb = this.equipmentRepo
      .createQueryBuilder('equipment')
      .leftJoinAndSelect('equipment.hospital', 'hospital')
      .leftJoinAndSelect('equipment.department', 'department')
      .leftJoinAndSelect('hospital.district', 'district')
      .leftJoinAndSelect('district.province', 'province')
      .orderBy('province.name')
      .addOrderBy('hospital.name')
      .addOrderBy('department.name')
      .addOrderBy('equipment.name');

    this.applyLocationFilters(qb, filters, 'equipment');

    const equipment = await qb.getMany();

    // Group by province > district > hospital > department
    const tree: Record<string, any> = {};
    equipment.forEach((e) => {
      const prov = e.hospital?.district?.province?.name || 'Unassigned';
      const dist = e.hospital?.district?.name || 'Unassigned';
      const hosp = e.hospital?.name || 'Unassigned';
      const dept = e.department?.name || 'Unassigned';

      if (!tree[prov]) tree[prov] = {};
      if (!tree[prov][dist]) tree[prov][dist] = {};
      if (!tree[prov][dist][hosp]) tree[prov][dist][hosp] = {};
      if (!tree[prov][dist][hosp][dept]) tree[prov][dist][hosp][dept] = [];
      tree[prov][dist][hosp][dept].push(e);
    });

    return {
      summary: {
        total: equipment.length,
        active: equipment.filter((e) => e.status === EquipmentStatus.ACTIVE).length,
        faulty: equipment.filter((e) => e.status === EquipmentStatus.FAULTY).length,
        underMaintenance: equipment.filter((e) => e.status === EquipmentStatus.UNDER_MAINTENANCE).length,
      },
      byLocation: tree,
      equipment,
    };
  }

  async getLocationReport(filters: ReportFilters) {
    const qb = this.equipmentRepo
      .createQueryBuilder('equipment')
      .leftJoinAndSelect('equipment.hospital', 'hospital')
      .leftJoinAndSelect('equipment.department', 'department')
      .leftJoinAndSelect('hospital.district', 'district')
      .leftJoinAndSelect('district.province', 'province');

    this.applyLocationFilters(qb, filters, 'equipment');

    const equipment = await qb.getMany();

    const byHospital = equipment.reduce((acc, e) => {
      const key = e.hospital?.name || 'Unassigned';
      if (!acc[key]) acc[key] = { total: 0, active: 0, faulty: 0, underMaintenance: 0, overdue: 0 };
      acc[key].total++;
      if (e.status === EquipmentStatus.ACTIVE) acc[key].active++;
      if (e.status === EquipmentStatus.FAULTY) acc[key].faulty++;
      if (e.status === EquipmentStatus.UNDER_MAINTENANCE) acc[key].underMaintenance++;
      if (e.maintenanceOverdue) acc[key].overdue++;
      return acc;
    }, {} as Record<string, any>);

    const byDepartment = equipment.reduce((acc, e) => {
      const key = e.department?.name || 'Unassigned';
      if (!acc[key]) acc[key] = { total: 0, active: 0, faulty: 0 };
      acc[key].total++;
      if (e.status === EquipmentStatus.ACTIVE) acc[key].active++;
      if (e.status === EquipmentStatus.FAULTY) acc[key].faulty++;
      return acc;
    }, {} as Record<string, any>);

    return { byHospital, byDepartment, total: equipment.length };
  }

  // ── MAINTENANCE REPORTS ───────────────────────────────────────────────────

  async getMaintenanceReport(filters: ReportFilters) {
    const qb = this.maintenanceRepo
      .createQueryBuilder('record')
      .leftJoinAndSelect('record.equipment', 'equipment')
      .leftJoinAndSelect('record.technician', 'technician')
      .leftJoinAndSelect('record.spareParts', 'spareParts')
      .leftJoinAndSelect('equipment.hospital', 'hospital')
      .leftJoinAndSelect('equipment.department', 'department')
      .leftJoinAndSelect('hospital.district', 'district')
      .leftJoinAndSelect('district.province', 'province');

    if (filters.startDate && filters.endDate) {
      qb.andWhere('record.scheduledDate BETWEEN :start AND :end', {
        start: filters.startDate,
        end: filters.endDate,
      });
    }

    if (filters.equipmentId) qb.andWhere('record.equipmentId = :equipmentId', { equipmentId: filters.equipmentId });
    if (filters.technicianId) qb.andWhere('record.technicianId = :technicianId', { technicianId: filters.technicianId });
    this.applyLocationFilters(qb, filters, 'equipment');

    qb.orderBy('record.scheduledDate', 'DESC');

    const records = await qb.getMany();

    const totalCost = records.reduce((sum, r) => sum + (Number(r.totalCost) || 0), 0);

    const byTechnician = records.reduce((acc, r) => {
      const key = r.technician ? `${r.technician.firstName} ${r.technician.lastName}` : 'Unassigned';
      if (!acc[key]) acc[key] = { count: 0, completed: 0 };
      acc[key].count++;
      if (r.status === MaintenanceStatus.COMPLETED) acc[key].completed++;
      return acc;
    }, {} as Record<string, any>);

    const issuePatternAgg: Record<string, number> = {};
    records.forEach((r) => {
      r.issuePatterns?.forEach((p) => {
        issuePatternAgg[p] = (issuePatternAgg[p] || 0) + 1;
      });
    });

    return {
      summary: {
        total: records.length,
        byStatus: this.groupBy(records, 'status'),
        totalCost,
        byTechnician,
        topIssuePatterns: Object.entries(issuePatternAgg)
          .map(([pattern, count]) => ({ pattern, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10),
      },
      records,
    };
  }

  // ── BREAKDOWN REPORTS ─────────────────────────────────────────────────────

  async getBreakdownReport(filters: ReportFilters) {
    const qb = this.breakdownRepo
      .createQueryBuilder('breakdown')
      .leftJoinAndSelect('breakdown.equipment', 'equipment')
      .leftJoinAndSelect('breakdown.assignedTechnician', 'technician')
      .leftJoinAndSelect('equipment.hospital', 'hospital')
      .leftJoinAndSelect('equipment.department', 'department')
      .leftJoinAndSelect('hospital.district', 'district')
      .leftJoinAndSelect('district.province', 'province');

    if (filters.startDate && filters.endDate) {
      qb.andWhere('breakdown.dateReported BETWEEN :start AND :end', {
        start: filters.startDate,
        end: filters.endDate,
      });
    }

    if (filters.equipmentId) qb.andWhere('breakdown.equipmentId = :equipmentId', { equipmentId: filters.equipmentId });
    this.applyLocationFilters(qb, filters, 'equipment');

    qb.orderBy('breakdown.dateReported', 'DESC');

    const breakdowns = await qb.getMany();

    const avgResolutionTime = breakdowns
      .filter((b) => b.dateResolved && b.dateReported)
      .reduce((sum, b) => {
        const hours = (new Date(b.dateResolved).getTime() - new Date(b.dateReported).getTime()) / 3600000;
        return sum + hours;
      }, 0) / (breakdowns.filter((b) => b.dateResolved).length || 1);

    const totalDowntime = breakdowns.reduce((sum, b) => sum + (b.downtime || 0), 0);

    const bySeverity = this.groupBy(breakdowns, 'severity');
    const byStatus = this.groupBy(breakdowns, 'status');

    return {
      summary: {
        total: breakdowns.length,
        bySeverity,
        byStatus,
        avgResolutionTimeHours: Math.round(avgResolutionTime),
        totalDowntimeHours: totalDowntime,
      },
      breakdowns,
    };
  }

  // ── EQUIPMENT-SPECIFIC REPORT ─────────────────────────────────────────────

  async getEquipmentSpecificReport(equipmentId: string) {
    const [equipment, maintenanceRecords, breakdowns] = await Promise.all([
      this.equipmentRepo.findOne({
        where: { id: equipmentId },
        relations: ['hospital', 'department', 'hospital.district', 'hospital.district.province'],
      }),
      this.maintenanceRepo.find({
        where: { equipmentId },
        relations: ['technician', 'spareParts'],
        order: { scheduledDate: 'DESC' },
      }),
      this.breakdownRepo.find({
        where: { equipmentId },
        relations: ['assignedTechnician'],
        order: { dateReported: 'DESC' },
      }),
    ]);

    const totalMaintenanceCost = maintenanceRecords.reduce((s, r) => s + (Number(r.totalCost) || 0), 0);
    const totalRepairCost = breakdowns.reduce((s, b) => s + (Number(b.repairCost) || 0), 0);
    const totalDowntime = breakdowns.reduce((s, b) => s + (b.downtime || 0), 0);

    const issuePatterns: Record<string, number> = {};
    maintenanceRecords.forEach((r) => {
      r.issuePatterns?.forEach((p) => { issuePatterns[p] = (issuePatterns[p] || 0) + 1; });
    });

    return {
      equipment,
      lifecycle: {
        age: equipment ? Math.floor((Date.now() - new Date(equipment.dateOfCommission).getTime()) / 86400000) : 0,
        totalMaintenanceCost,
        totalRepairCost,
        totalCostOfOwnership: totalMaintenanceCost + totalRepairCost + (Number(equipment?.purchaseCost) || 0),
        totalDowntimeHours: totalDowntime,
        breakdownCount: breakdowns.length,
        maintenanceCount: maintenanceRecords.length,
        topIssuePatterns: Object.entries(issuePatterns)
          .map(([pattern, count]) => ({ pattern, count }))
          .sort((a, b) => b.count - a.count),
      },
      maintenanceHistory: maintenanceRecords,
      breakdownHistory: breakdowns,
    };
  }

  // ── DASHBOARD SUMMARY ────────────────────────────────────────────────────

  async getDashboardSummary() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [equipStats, mainStats, breakdownStats, topFaultyRaw] = await Promise.all([
      this.equipmentRepo
        .createQueryBuilder('e')
        .select([
          'COUNT(*) as total',
          `SUM(CASE WHEN e.status = 'active' THEN 1 ELSE 0 END) as active`,
          `SUM(CASE WHEN e.status = 'faulty' THEN 1 ELSE 0 END) as faulty`,
          `SUM(CASE WHEN e."maintenanceOverdue" = true THEN 1 ELSE 0 END) as overdue`,
        ])
        .getRawOne(),
      this.maintenanceRepo
        .createQueryBuilder('m')
        .select([
          `COALESCE(SUM(m."totalCost"), 0) as "totalCost"`,
          `COALESCE(SUM(CASE WHEN m."completionDate" >= :startOfMonth THEN m."totalCost" ELSE 0 END), 0) as "monthCost"`,
        ])
        .setParameter('startOfMonth', startOfMonth)
        .getRawOne(),
      this.breakdownRepo
        .createQueryBuilder('b')
        .select([
          `COALESCE(SUM(CASE WHEN b.status = 'open' THEN 1 ELSE 0 END), 0) as open`,
          `COALESCE(SUM(CASE WHEN b.status = 'assigned' THEN 1 ELSE 0 END), 0) as assigned`,
          `COALESCE(SUM(CASE WHEN b.severity = 'critical' THEN 1 ELSE 0 END), 0) as critical`,
          `COALESCE(SUM(CASE WHEN b.status = 'resolved' AND b."dateResolved" >= :startOfMonth THEN 1 ELSE 0 END), 0) as "resolvedThisMonth"`,
        ])
        .setParameter('startOfMonth', startOfMonth)
        .getRawOne(),
      this.breakdownRepo
        .createQueryBuilder('b')
        .select(['b."equipmentId"', 'COUNT(*) as cnt', 'MAX(b."dateReported") as "lastBreakdown"'])
        .where('b."equipmentId" IS NOT NULL')
        .groupBy('b."equipmentId"')
        .orderBy('cnt', 'DESC')
        .limit(5)
        .getRawMany(),
    ]);

    // Enrich top faulty with equipment names
    const topFaultyEquipment = await Promise.all(
      topFaultyRaw.map(async (row) => {
        const eq = await this.equipmentRepo.findOne({ where: { id: row.equipmentId } });
        return {
          id: row.equipmentId,
          name: eq?.name ?? 'Unknown',
          serialNumber: eq?.serialNumber ?? '—',
          breakdownCount: parseInt(row.cnt) || 0,
          lastBreakdown: row.lastBreakdown,
        };
      }),
    );

    return {
      totalEquipment: parseInt(equipStats?.total) || 0,
      activeEquipment: parseInt(equipStats?.active) || 0,
      faultyEquipment: parseInt(equipStats?.faulty) || 0,
      maintenanceOverdue: parseInt(equipStats?.overdue) || 0,
      openBreakdowns: (parseInt(breakdownStats?.open) || 0) + (parseInt(breakdownStats?.assigned) || 0),
      criticalBreakdowns: parseInt(breakdownStats?.critical) || 0,
      totalMaintenanceCost: parseFloat(mainStats?.totalCost) || 0,
      thisMonthMaintenance: parseFloat(mainStats?.monthCost) || 0,
      resolvedThisMonth: parseInt(breakdownStats?.resolvedThisMonth) || 0,
      topFaultyEquipment,
      recentActivity: [],
    };
  }

  // ── HELPERS ───────────────────────────────────────────────────────────────

  private applyLocationFilters(qb: any, filters: ReportFilters, alias: string) {
    if (filters.hospitalId) qb.andWhere(`${alias}.hospitalId = :hospitalId`, { hospitalId: filters.hospitalId });
    if (filters.departmentId) qb.andWhere(`${alias}.departmentId = :departmentId`, { departmentId: filters.departmentId });
    if (filters.districtId) qb.andWhere('district.id = :districtId', { districtId: filters.districtId });
    if (filters.provinceId) qb.andWhere('province.id = :provinceId', { provinceId: filters.provinceId });
  }

  private groupBy<T>(items: T[], key: keyof T): Record<string, number> {
    return items.reduce((acc, item) => {
      const val = String(item[key]);
      acc[val] = (acc[val] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }
}
