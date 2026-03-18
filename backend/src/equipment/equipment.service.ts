import {
  Injectable, NotFoundException, ConflictException, Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
// Schedule module is registered globally in AppModule
import { Equipment, EquipmentStatus, MaintenanceFrequency } from './entities/equipment.entity';
import { CreateEquipmentDto } from './dto/create-equipment.dto';
import { FilterEquipmentDto } from './dto/filter-equipment.dto';
import { PartialType } from '@nestjs/swagger';
import { PaginatedResult } from '../common/dto/pagination.dto';

@Injectable()
export class EquipmentService {
  private readonly logger = new Logger(EquipmentService.name);

  constructor(
    @InjectRepository(Equipment)
    private readonly equipmentRepo: Repository<Equipment>,
  ) {}

  async create(dto: CreateEquipmentDto): Promise<Equipment> {
    const existing = await this.equipmentRepo.findOne({ where: { serialNumber: dto.serialNumber } });
    if (existing) throw new ConflictException(`Equipment with serial number ${dto.serialNumber} already exists`);

    const equipment = this.equipmentRepo.create(dto);

    // Auto-calculate next service date
    if (dto.dateOfCommission) {
      equipment.nextServiceDate = this.calculateNextServiceDate(
        new Date(dto.dateOfCommission),
        dto.maintenanceFrequency || MaintenanceFrequency.QUARTERLY,
      );
    }

    return this.equipmentRepo.save(equipment);
  }

  async findAll(filter: FilterEquipmentDto): Promise<PaginatedResult<Equipment>> {
    const { page = 1, limit = 20, search, sortBy = 'createdAt', sortOrder = 'DESC',
      status, type, brand, hospitalId, departmentId, provinceId, districtId, maintenanceOverdue,
    } = filter;

    const skip = (page - 1) * limit;
    const qb = this.equipmentRepo
      .createQueryBuilder('equipment')
      .leftJoinAndSelect('equipment.hospital', 'hospital')
      .leftJoinAndSelect('equipment.department', 'department')
      .leftJoinAndSelect('hospital.district', 'district')
      .leftJoinAndSelect('district.province', 'province');

    if (search) {
      qb.andWhere(
        '(equipment.name ILIKE :search OR equipment.serialNumber ILIKE :search OR equipment.brand ILIKE :search OR equipment.model ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (status) qb.andWhere('equipment.status = :status', { status });
    if (type) qb.andWhere('equipment.type ILIKE :type', { type: `%${type}%` });
    if (brand) qb.andWhere('equipment.brand ILIKE :brand', { brand: `%${brand}%` });
    if (hospitalId) qb.andWhere('equipment.hospitalId = :hospitalId', { hospitalId });
    if (departmentId) qb.andWhere('equipment.departmentId = :departmentId', { departmentId });
    if (districtId) qb.andWhere('district.id = :districtId', { districtId });
    if (provinceId) qb.andWhere('province.id = :provinceId', { provinceId });
    if (maintenanceOverdue !== undefined) {
      qb.andWhere('equipment.maintenanceOverdue = :maintenanceOverdue', { maintenanceOverdue });
    }

    const validSortFields = ['name', 'type', 'brand', 'status', 'dateOfCommission', 'nextServiceDate', 'createdAt'];
    const safeSortBy = validSortFields.includes(sortBy) ? sortBy : 'createdAt';

    qb.orderBy(`equipment.${safeSortBy}`, sortOrder).skip(skip).take(limit);

    const [data, total] = await qb.getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page < Math.ceil(total / limit),
      hasPreviousPage: page > 1,
    };
  }

  async findOne(id: string): Promise<Equipment> {
    const equipment = await this.equipmentRepo.findOne({
      where: { id },
      relations: [
        'hospital', 'hospital.district', 'hospital.district.province',
        'department', 'maintenanceRecords', 'maintenanceRecords.technician',
        'maintenanceRecords.spareParts', 'breakdowns', 'breakdowns.assignedTechnician',
        'comments', 'comments.user',
      ],
    });

    if (!equipment) throw new NotFoundException(`Equipment ${id} not found`);
    return equipment;
  }

  async findBySerialNumber(serialNumber: string): Promise<Equipment> {
    const equipment = await this.equipmentRepo.findOne({
      where: { serialNumber },
      relations: ['hospital', 'department'],
    });
    if (!equipment) throw new NotFoundException(`Equipment with serial number ${serialNumber} not found`);
    return equipment;
  }

  async update(id: string, dto: Partial<CreateEquipmentDto>): Promise<Equipment> {
    const equipment = await this.findOne(id);

    if (dto.serialNumber && dto.serialNumber !== equipment.serialNumber) {
      const existing = await this.equipmentRepo.findOne({ where: { serialNumber: dto.serialNumber } });
      if (existing) throw new ConflictException(`Serial number ${dto.serialNumber} already in use`);
    }

    Object.assign(equipment, dto);

    // Recalculate next service if frequency changed
    if (dto.maintenanceFrequency && equipment.lastServiceDate) {
      equipment.nextServiceDate = this.calculateNextServiceDate(
        equipment.lastServiceDate,
        dto.maintenanceFrequency,
      );
    }

    return this.equipmentRepo.save(equipment);
  }

  async updateStatus(id: string, status: EquipmentStatus): Promise<Equipment> {
    const equipment = await this.findOne(id);
    equipment.status = status;
    if (status === EquipmentStatus.DECOMMISSIONED) {
      equipment.actualDecommissionDate = new Date();
    }
    return this.equipmentRepo.save(equipment);
  }

  async updateServiceDates(id: string, lastServiceDate: Date): Promise<Equipment> {
    const equipment = await this.findOne(id);
    equipment.lastServiceDate = lastServiceDate;
    equipment.nextServiceDate = this.calculateNextServiceDate(lastServiceDate, equipment.maintenanceFrequency);
    equipment.maintenanceOverdue = false;
    return this.equipmentRepo.save(equipment);
  }

  async remove(id: string): Promise<void> {
    const equipment = await this.findOne(id);
    await this.equipmentRepo.remove(equipment);
  }

  async getDashboardStats() {
    const [total, active, faulty, underMaintenance, decommissioned, overdue] = await Promise.all([
      this.equipmentRepo.count(),
      this.equipmentRepo.count({ where: { status: EquipmentStatus.ACTIVE } }),
      this.equipmentRepo.count({ where: { status: EquipmentStatus.FAULTY } }),
      this.equipmentRepo.count({ where: { status: EquipmentStatus.UNDER_MAINTENANCE } }),
      this.equipmentRepo.count({ where: { status: EquipmentStatus.DECOMMISSIONED } }),
      this.equipmentRepo.count({ where: { maintenanceOverdue: true } }),
    ]);

    const byType = await this.equipmentRepo
      .createQueryBuilder('equipment')
      .select('equipment.type', 'type')
      .addSelect('COUNT(*)', 'count')
      .groupBy('equipment.type')
      .getRawMany();

    return { total, active, faulty, underMaintenance, decommissioned, overdue, byType };
  }

  // Runs every day at midnight to flag overdue maintenance
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async flagOverdueMaintenance() {
    const today = new Date();
    const overdue = await this.equipmentRepo
      .createQueryBuilder('equipment')
      .where('equipment.nextServiceDate < :today', { today })
      .andWhere('equipment.maintenanceOverdue = false')
      .andWhere('equipment.status != :decommissioned', { decommissioned: EquipmentStatus.DECOMMISSIONED })
      .getMany();

    if (overdue.length > 0) {
      await this.equipmentRepo
        .createQueryBuilder()
        .update(Equipment)
        .set({ maintenanceOverdue: true })
        .where('nextServiceDate < :today AND maintenanceOverdue = false AND status != :decommissioned', {
          today,
          decommissioned: EquipmentStatus.DECOMMISSIONED,
        })
        .execute();

      this.logger.log(`Flagged ${overdue.length} equipment units as maintenance overdue`);
    }
  }

  calculateNextServiceDate(fromDate: Date, frequency: MaintenanceFrequency): Date {
    const next = new Date(fromDate);
    switch (frequency) {
      case MaintenanceFrequency.WEEKLY: next.setDate(next.getDate() + 7); break;
      case MaintenanceFrequency.MONTHLY: next.setMonth(next.getMonth() + 1); break;
      case MaintenanceFrequency.QUARTERLY: next.setMonth(next.getMonth() + 3); break;
      case MaintenanceFrequency.SEMI_ANNUAL: next.setMonth(next.getMonth() + 6); break;
      case MaintenanceFrequency.ANNUAL: next.setFullYear(next.getFullYear() + 1); break;
    }
    return next;
  }
}
