import {
  Controller, Get, Post, Body, Patch, Param, Delete,
  Query, UseGuards, ParseUUIDPipe, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { BreakdownsService } from './breakdowns.service';
import { CreateBreakdownDto } from './dto/create-breakdown.dto';
import { FilterBreakdownDto } from './dto/filter-breakdown.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User, UserRole } from '../users/entities/user.entity';
import { BreakdownStatus } from './entities/breakdown.entity';
import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

class AssignTechnicianDto {
  @ApiProperty()
  @IsUUID()
  technicianId: string;
}

@ApiTags('breakdowns')
@ApiBearerAuth('JWT-auth')
@UseGuards(RolesGuard)
@Controller('breakdowns')
export class BreakdownsController {
  constructor(private readonly breakdownsService: BreakdownsService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.TECHNICIAN)
  @ApiOperation({ summary: 'Report a new breakdown' })
  create(@Body() dto: CreateBreakdownDto, @CurrentUser() user: User) {
    return this.breakdownsService.create(dto, user);
  }

  @Get()
  @ApiOperation({ summary: 'List all breakdowns with filters' })
  findAll(@Query() filters: FilterBreakdownDto) {
    return this.breakdownsService.findAll(
      filters,
      filters.equipmentId,
      filters.technicianId,
      filters.status,
      filters.severity,
    );
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get breakdown statistics' })
  getStats() {
    return this.breakdownsService.getBreakdownStats();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get breakdown details' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.breakdownsService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.TECHNICIAN)
  @ApiOperation({ summary: 'Update breakdown record' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: Partial<CreateBreakdownDto>,
    @CurrentUser() user: User,
  ) {
    return this.breakdownsService.update(id, dto, user);
  }

  @Patch(':id/assign')
  @Roles(UserRole.ADMIN, UserRole.TECHNICIAN)
  @ApiOperation({ summary: 'Assign technician to breakdown' })
  assign(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AssignTechnicianDto,
    @CurrentUser() user: User,
  ) {
    return this.breakdownsService.assignTechnician(id, dto.technicianId, user);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete breakdown (Admin only)' })
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.breakdownsService.remove(id, user);
  }
}
