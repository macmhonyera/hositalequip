import {
  Controller, Get, Post, Body, Patch, Param, Delete,
  Query, UseGuards, ParseUUIDPipe, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { MaintenanceService } from './maintenance.service';
import { CreateMaintenanceDto } from './dto/create-maintenance.dto';
import { FilterMaintenanceDto } from './dto/filter-maintenance.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User, UserRole } from '../users/entities/user.entity';

@ApiTags('maintenance')
@ApiBearerAuth('JWT-auth')
@UseGuards(RolesGuard)
@Controller('maintenance')
export class MaintenanceController {
  constructor(private readonly maintenanceService: MaintenanceService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.TECHNICIAN)
  @ApiOperation({ summary: 'Create maintenance record' })
  create(@Body() dto: CreateMaintenanceDto, @CurrentUser() user: User) {
    return this.maintenanceService.create(dto, user);
  }

  @Get()
  @ApiOperation({ summary: 'List maintenance records' })
  findAll(@Query() filters: FilterMaintenanceDto) {
    return this.maintenanceService.findAll(filters, filters.equipmentId, filters.technicianId, filters.status, filters.type);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get maintenance statistics' })
  getStats() {
    return this.maintenanceService.getMaintenanceStats();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get maintenance record details' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.maintenanceService.findOne(id);
  }

  @Get('equipment/:equipmentId/patterns')
  @ApiOperation({ summary: 'Get recurring issue patterns for equipment' })
  getIssuePatterns(@Param('equipmentId', ParseUUIDPipe) equipmentId: string) {
    return this.maintenanceService.getIssuePatterns(equipmentId);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.TECHNICIAN)
  @ApiOperation({ summary: 'Update maintenance record' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: Partial<CreateMaintenanceDto>,
    @CurrentUser() user: User,
  ) {
    return this.maintenanceService.update(id, dto, user);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete maintenance record (Admin only)' })
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.maintenanceService.remove(id, user);
  }
}
