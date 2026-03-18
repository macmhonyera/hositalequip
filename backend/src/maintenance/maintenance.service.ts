import {
  Injectable, NotFoundException, ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MaintenanceRecord, MaintenanceStatus, MaintenanceType } from './entities/maintenance-record.entity';
import { SparePart } from './entities/spare-part.entity';
import { Equipment, EquipmentStatus } from '../equipment/entities/equipment.entity';
import { User, UserRole } from '../users/entities/user.entity';
import { CreateMaintenanceDto } from './dto/create-maintenance.dto';
import { PaginationDto, PaginatedResult } from '../common/dto/pagination.dto';
import { EquipmentService } from '../equipment/equipment.service';

@Injectable()
export class MaintenanceService {
  constructor(
    @InjectRepository(MaintenanceRecord)
    private readonly maintenanceRepo: Repository<MaintenanceRecord>,
    @InjectRepository(SparePart)
    private readonly sparePartRepo: Repository<SparePart>,
    @InjectRepository(Equipment)
    private readonly equipmentRepo: Repository<Equipment>,
    private readonly equipmentService: EquipmentService,
  ) {}

  async create(dto: CreateMaintenanceDto, requestingUser: User): Promise<MaintenanceRecord> {
    const equipment = await this.equipmentRepo.findOne({ where: { id: dto.equipmentId } });
    if (!equipment) throw new NotFoundException(`Equipment ${dto.equipmentId} not found`);

    const { spareParts, ...recordData } = dto;
    const record = this.maintenanceRepo.create(recordData);

    if (!record.technicianId && requestingUser.role === UserRole.TECHNICIAN) {
      record.technicianId = requestingUser.id;
    }

    const saved = await this.maintenanceRepo.save(record);

    // Save spare parts
    if (spareParts && spareParts.length > 0) {
      const parts = spareParts.map((p) =>
        this.sparePartRepo.create({ ...p, maintenanceRecordId: saved.id }),
      );
      await this.sparePartRepo.save(parts);
    }

    // If completed, update equipment service dates
    if (dto.status === MaintenanceStatus.COMPLETED && dto.completionDate) {
      await this.equipmentService.updateServiceDates(dto.equipmentId, new Date(dto.completionDate));

      // Restore status if was under maintenance
      if (equipment.status === EquipmentStatus.UNDER_MAINTENANCE) {
        await this.equipmentRepo.update(dto.equipmentId, { status: EquipmentStatus.ACTIVE });
      }
    } else if (dto.status === MaintenanceStatus.IN_PROGRESS) {
      await this.equipmentRepo.update(dto.equipmentId, { status: EquipmentStatus.UNDER_MAINTENANCE });
    }

    return this.findOne(saved.id);
  }

  async findAll(
    pagination: PaginationDto,
    equipmentId?: string,
    technicianId?: string,
    status?: MaintenanceStatus,
    type?: MaintenanceType,
  ): Promise<PaginatedResult<MaintenanceRecord>> {
    const { page = 1, limit = 20, sortOrder = 'DESC' } = pagination;
    const skip = (page - 1) * limit;

    const qb = this.maintenanceRepo
      .createQueryBuilder('record')
      .leftJoinAndSelect('record.equipment', 'equipment')
      .leftJoinAndSelect('record.technician', 'technician')
      .leftJoinAndSelect('record.spareParts', 'spareParts');

    if (equipmentId) qb.andWhere('record.equipmentId = :equipmentId', { equipmentId });
    if (technicianId) qb.andWhere('record.technicianId = :technicianId', { technicianId });
    if (status) qb.andWhere('record.status = :status', { status });
    if (type) qb.andWhere('record.type = :type', { type });

    qb.orderBy('record.scheduledDate', sortOrder).skip(skip).take(limit);

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

  async findOne(id: string): Promise<MaintenanceRecord> {
    const record = await this.maintenanceRepo.findOne({
      where: { id },
      relations: [
        'equipment', 'equipment.hospital', 'equipment.department',
        'technician', 'spareParts',
      ],
    });
    if (!record) throw new NotFoundException(`Maintenance record ${id} not found`);
    return record;
  }

  async update(id: string, dto: Partial<CreateMaintenanceDto>, requestingUser: User): Promise<MaintenanceRecord> {
    const record = await this.findOne(id);

    if (requestingUser.role === UserRole.GUEST) {
      throw new ForbiddenException('Guests cannot update maintenance records');
    }

    const { spareParts, ...updateData } = dto;
    Object.assign(record, updateData);

    if (dto.status === MaintenanceStatus.COMPLETED && dto.completionDate) {
      await this.equipmentService.updateServiceDates(record.equipmentId, new Date(dto.completionDate));

      const equipment = await this.equipmentRepo.findOne({ where: { id: record.equipmentId } });
      if (equipment?.status === EquipmentStatus.UNDER_MAINTENANCE) {
        await this.equipmentRepo.update(record.equipmentId, { status: EquipmentStatus.ACTIVE });
      }
    }

    const updated = await this.maintenanceRepo.save(record);

    if (spareParts) {
      await this.sparePartRepo.delete({ maintenanceRecordId: id });
      const parts = spareParts.map((p) =>
        this.sparePartRepo.create({ ...p, maintenanceRecordId: id }),
      );
      await this.sparePartRepo.save(parts);
    }

    return this.findOne(updated.id);
  }

  async remove(id: string, requestingUser: User): Promise<void> {
    if (requestingUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admins can delete maintenance records');
    }
    const record = await this.findOne(id);
    await this.maintenanceRepo.remove(record);
  }

  async getIssuePatterns(equipmentId: string) {
    const records = await this.maintenanceRepo.find({
      where: { equipmentId },
      select: ['issuePatterns', 'findings', 'scheduledDate'],
    });

    const patternCount: Record<string, number> = {};
    records.forEach((r) => {
      r.issuePatterns?.forEach((p) => {
        patternCount[p] = (patternCount[p] || 0) + 1;
      });
    });

    return Object.entries(patternCount)
      .map(([pattern, count]) => ({ pattern, count }))
      .sort((a, b) => b.count - a.count);
  }

  async getMaintenanceStats() {
    const [total, scheduled, inProgress, completed, cancelled] = await Promise.all([
      this.maintenanceRepo.count(),
      this.maintenanceRepo.count({ where: { status: MaintenanceStatus.SCHEDULED } }),
      this.maintenanceRepo.count({ where: { status: MaintenanceStatus.IN_PROGRESS } }),
      this.maintenanceRepo.count({ where: { status: MaintenanceStatus.COMPLETED } }),
      this.maintenanceRepo.count({ where: { status: MaintenanceStatus.CANCELLED } }),
    ]);

    const recentCompleted = await this.maintenanceRepo.find({
      where: { status: MaintenanceStatus.COMPLETED },
      relations: ['equipment', 'technician'],
      order: { completionDate: 'DESC' },
      take: 5,
    });

    return { total, scheduled, inProgress, completed, cancelled, recentCompleted };
  }
}
