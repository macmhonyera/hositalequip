import {
  Injectable, NotFoundException, ConflictException, ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole, UserStatus } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto, ChangePasswordDto } from './dto/update-user.dto';
import { PaginationDto, PaginatedResult } from '../common/dto/pagination.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto, requestingUser: User): Promise<User> {
    if (requestingUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admins can create users');
    }

    const existing = await this.userRepository.findOne({
      where: { email: createUserDto.email.toLowerCase() },
    });

    if (existing) throw new ConflictException('Email already in use');

    const hashed = await bcrypt.hash(createUserDto.password, 12);
    const user = this.userRepository.create({
      ...createUserDto,
      email: createUserDto.email.toLowerCase(),
      password: hashed,
    });

    return this.userRepository.save(user);
  }

  async findAll(pagination: PaginationDto, requestingUser: User): Promise<PaginatedResult<User>> {
    if (requestingUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admins can list all users');
    }

    const { page = 1, limit = 20, search, sortBy = 'createdAt', sortOrder = 'DESC' } = pagination;
    const skip = (page - 1) * limit;

    const queryBuilder = this.userRepository.createQueryBuilder('user');

    if (search) {
      queryBuilder.where(
        '(user.firstName ILIKE :search OR user.lastName ILIKE :search OR user.email ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    const validSortFields = ['firstName', 'lastName', 'email', 'role', 'createdAt', 'status'];
    const safeSortBy = validSortFields.includes(sortBy) ? sortBy : 'createdAt';

    queryBuilder
      .orderBy(`user.${safeSortBy}`, sortOrder)
      .skip(skip)
      .take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data: data.map((u) => { const { password, ...rest } = u as any; return rest; }),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page < Math.ceil(total / limit),
      hasPreviousPage: page > 1,
    };
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException(`User ${id} not found`);
    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto, requestingUser: User): Promise<User> {
    if (requestingUser.role !== UserRole.ADMIN && requestingUser.id !== id) {
      throw new ForbiddenException('You can only update your own profile');
    }

    if (requestingUser.role !== UserRole.ADMIN && updateUserDto.role) {
      throw new ForbiddenException('Only admins can change roles');
    }

    const user = await this.findOne(id);

    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existing = await this.userRepository.findOne({
        where: { email: updateUserDto.email.toLowerCase() },
      });
      if (existing) throw new ConflictException('Email already in use');
    }

    Object.assign(user, updateUserDto);
    return this.userRepository.save(user);
  }

  async changePassword(id: string, dto: ChangePasswordDto, requestingUser: User): Promise<void> {
    if (requestingUser.id !== id && requestingUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException('You can only change your own password');
    }

    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    const isValid = await bcrypt.compare(dto.currentPassword, user.password);
    if (!isValid) throw new ForbiddenException('Current password is incorrect');

    user.password = await bcrypt.hash(dto.newPassword, 12);
    await this.userRepository.save(user);
  }

  async deactivate(id: string, requestingUser: User): Promise<User> {
    if (requestingUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admins can deactivate users');
    }

    if (requestingUser.id === id) {
      throw new ForbiddenException('Cannot deactivate your own account');
    }

    const user = await this.findOne(id);
    user.status = UserStatus.INACTIVE;
    return this.userRepository.save(user);
  }

  async remove(id: string, requestingUser: User): Promise<void> {
    if (requestingUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admins can delete users');
    }

    if (requestingUser.id === id) {
      throw new ForbiddenException('Cannot delete your own account');
    }

    const user = await this.findOne(id);
    await this.userRepository.remove(user);
  }

  async getTechnicianStats(technicianId: string) {
    const user = await this.userRepository.findOne({
      where: { id: technicianId },
      relations: ['maintenanceRecords', 'assignedBreakdowns'],
    });

    if (!user) throw new NotFoundException('Technician not found');

    return {
      user: this.sanitize(user),
      totalMaintenance: user.maintenanceRecords?.length ?? 0,
      totalBreakdowns: user.assignedBreakdowns?.length ?? 0,
    };
  }

  private sanitize(user: User) {
    const { password, ...rest } = user as any;
    return rest;
  }
}
