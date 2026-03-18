import {
  Injectable, NotFoundException, ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Breakdown, BreakdownStatus, BreakdownSeverity } from './entities/breakdown.entity';
import { Equipment, EquipmentStatus } from '../equipment/entities/equipment.entity';
import { User, UserRole } from '../users/entities/user.entity';
import { CreateBreakdownDto } from './dto/create-breakdown.dto';
import { PaginationDto, PaginatedResult } from '../common/dto/pagination.dto';

@Injectable()
export class BreakdownsService {
  constructor(
    @InjectRepository(Breakdown)
    private readonly breakdownRepo: Repository<Breakdown>,
    @InjectRepository(Equipment)
    private readonly equipmentRepo: Repository<Equipment>,
  ) {}

  async create(dto: CreateBreakdownDto, requestingUser: User): Promise<Breakdown> {
    const equipment = await this.equipmentRepo.findOne({ where: { id: dto.equipmentId } });
    if (!equipment) throw new NotFoundException(`Equipment ${dto.equipmentId} not found`);

    const breakdown = this.breakdownRepo.create({
      ...dto,
      reportedBy: dto.reportedBy || requestingUser.fullName,
    });

    if (dto.assignedTechnicianId) {
      breakdown.dateAssigned = new Date();
      breakdown.status = BreakdownStatus.ASSIGNED;
    }

    const saved = await this.breakdownRepo.save(breakdown);

    // Mark equipment as faulty
    await this.equipmentRepo.update(dto.equipmentId, { status: EquipmentStatus.FAULTY });

    return this.findOne(saved.id);
  }

  async findAll(
    pagination: PaginationDto,
    equipmentId?: string,
    technicianId?: string,
    status?: BreakdownStatus,
    severity?: BreakdownSeverity,
  ): Promise<PaginatedResult<Breakdown>> {
    const { page = 1, limit = 20, sortOrder = 'DESC' } = pagination;
    const skip = (page - 1) * limit;

    const qb = this.breakdownRepo
      .createQueryBuilder('breakdown')
      .leftJoinAndSelect('breakdown.equipment', 'equipment')
      .leftJoinAndSelect('equipment.hospital', 'hospital')
      .leftJoinAndSelect('equipment.department', 'department')
      .leftJoinAndSelect('breakdown.assignedTechnician', 'technician');

    if (equipmentId) qb.andWhere('breakdown.equipmentId = :equipmentId', { equipmentId });
    if (technicianId) qb.andWhere('breakdown.assignedTechnicianId = :technicianId', { technicianId });
    if (status) qb.andWhere('breakdown.status = :status', { status });
    if (severity) qb.andWhere('breakdown.severity = :severity', { severity });

    qb.orderBy('breakdown.dateReported', sortOrder).skip(skip).take(limit);

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

  async findOne(id: string): Promise<Breakdown> {
    const breakdown = await this.breakdownRepo.findOne({
      where: { id },
      relations: [
        'equipment', 'equipment.hospital', 'equipment.department',
        'equipment.hospital.district', 'equipment.hospital.district.province',
        'assignedTechnician',
      ],
    });
    if (!breakdown) throw new NotFoundException(`Breakdown ${id} not found`);
    return breakdown;
  }

  async update(id: string, dto: Partial<CreateBreakdownDto>, requestingUser: User): Promise<Breakdown> {
    if (requestingUser.role === UserRole.GUEST) {
      throw new ForbiddenException('Guests cannot update breakdown records');
    }

    const breakdown = await this.findOne(id);
    Object.assign(breakdown, dto);

    if (dto.assignedTechnicianId && !breakdown.dateAssigned) {
      breakdown.dateAssigned = new Date();
      breakdown.status = BreakdownStatus.ASSIGNED;
    }

    if (dto.status === BreakdownStatus.RESOLVED || dto.status === BreakdownStatus.CLOSED) {
      breakdown.dateResolved = new Date();

      const equipment = await this.equipmentRepo.findOne({ where: { id: breakdown.equipmentId } });
      if (equipment?.status === EquipmentStatus.FAULTY) {
        await this.equipmentRepo.update(breakdown.equipmentId, { status: EquipmentStatus.ACTIVE });
      }
    }

    return this.breakdownRepo.save(breakdown);
  }

  async assignTechnician(id: string, technicianId: string, requestingUser: User): Promise<Breakdown> {
    if (requestingUser.role === UserRole.GUEST) {
      throw new ForbiddenException('Insufficient permissions');
    }

    const breakdown = await this.findOne(id);
    breakdown.assignedTechnicianId = technicianId;
    breakdown.dateAssigned = new Date();
    breakdown.status = BreakdownStatus.ASSIGNED;

    return this.breakdownRepo.save(breakdown);
  }

  async remove(id: string, requestingUser: User): Promise<void> {
    if (requestingUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admins can delete breakdowns');
    }
    const breakdown = await this.findOne(id);
    await this.breakdownRepo.remove(breakdown);
  }

  async getBreakdownStats() {
    const [total, open, assigned, inProgress, resolved] = await Promise.all([
      this.breakdownRepo.count(),
      this.breakdownRepo.count({ where: { status: BreakdownStatus.OPEN } }),
      this.breakdownRepo.count({ where: { status: BreakdownStatus.ASSIGNED } }),
      this.breakdownRepo.count({ where: { status: BreakdownStatus.IN_PROGRESS } }),
      this.breakdownRepo.count({ where: { status: BreakdownStatus.RESOLVED } }),
    ]);

    // Most common failure categories
    const failureCats = await this.breakdownRepo
      .createQueryBuilder('b')
      .select('UNNEST(b.issueCategories)', 'category')
      .addSelect('COUNT(*)', 'count')
      .groupBy('category')
      .orderBy('count', 'DESC')
      .limit(10)
      .getRawMany();

    return { total, open, assigned, inProgress, resolved, topFailureCategories: failureCats };
  }
}
