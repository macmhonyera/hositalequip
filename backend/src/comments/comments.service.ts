import {
  Injectable, NotFoundException, ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment, CommentStatus } from './entities/comment.entity';
import { User, UserRole } from '../users/entities/user.entity';
import { CreateCommentDto, ResolveCommentDto } from './dto/create-comment.dto';
import { PaginationDto, PaginatedResult } from '../common/dto/pagination.dto';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(Comment)
    private readonly commentRepo: Repository<Comment>,
  ) {}

  async create(dto: CreateCommentDto, user: User): Promise<Comment> {
    const comment = this.commentRepo.create({
      ...dto,
      userId: user.id,
      authorName: user.fullName,
      status: CommentStatus.OPEN,
    });

    return this.commentRepo.save(comment);
  }

  async findAll(pagination: PaginationDto, equipmentId?: string, type?: string): Promise<PaginatedResult<Comment>> {
    const { page = 1, limit = 20, sortOrder = 'DESC' } = pagination;
    const skip = (page - 1) * limit;

    const qb = this.commentRepo
      .createQueryBuilder('comment')
      .leftJoinAndSelect('comment.user', 'user')
      .leftJoinAndSelect('comment.equipment', 'equipment');

    if (equipmentId) qb.andWhere('comment.equipmentId = :equipmentId', { equipmentId });
    if (type) qb.andWhere('comment.type = :type', { type });

    qb.orderBy('comment.isPinned', 'DESC')
      .addOrderBy('comment.createdAt', sortOrder)
      .skip(skip)
      .take(limit);

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

  async findOne(id: string): Promise<Comment> {
    const comment = await this.commentRepo.findOne({
      where: { id },
      relations: ['user', 'equipment'],
    });
    if (!comment) throw new NotFoundException(`Comment ${id} not found`);
    return comment;
  }

  async resolve(id: string, dto: ResolveCommentDto, user: User): Promise<Comment> {
    if (user.role === UserRole.GUEST) {
      throw new ForbiddenException('Guests cannot resolve comments');
    }

    const comment = await this.findOne(id);
    comment.resolution = dto.resolution;
    comment.status = CommentStatus.RESOLVED;
    comment.resolvedAt = new Date();
    comment.resolvedBy = user.fullName;

    return this.commentRepo.save(comment);
  }

  async remove(id: string, user: User): Promise<void> {
    const comment = await this.findOne(id);

    if (user.role !== UserRole.ADMIN && comment.userId !== user.id) {
      throw new ForbiddenException('You can only delete your own comments');
    }

    await this.commentRepo.remove(comment);
  }

  async getComplaintsSummary(equipmentId?: string) {
    const qb = this.commentRepo
      .createQueryBuilder('comment')
      .where('comment.type = :type', { type: 'complaint' });

    if (equipmentId) qb.andWhere('comment.equipmentId = :equipmentId', { equipmentId });

    const [open, resolved, total] = await Promise.all([
      this.commentRepo.count({ where: { type: 'complaint' as any, status: CommentStatus.OPEN } }),
      this.commentRepo.count({ where: { type: 'complaint' as any, status: CommentStatus.RESOLVED } }),
      this.commentRepo.count({ where: { type: 'complaint' as any } }),
    ]);

    const recent = await this.commentRepo.find({
      where: { type: 'complaint' as any },
      relations: ['equipment', 'user'],
      order: { createdAt: 'DESC' },
      take: 5,
    });

    return { total, open, resolved, recent };
  }
}
