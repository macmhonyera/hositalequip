import {
  Controller, Get, Post, Body, Patch, Param, Delete,
  Query, UseGuards, ParseUUIDPipe, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { EquipmentService } from './equipment.service';
import { CreateEquipmentDto } from './dto/create-equipment.dto';
import { FilterEquipmentDto } from './dto/filter-equipment.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../users/entities/user.entity';
import { EquipmentStatus } from './entities/equipment.entity';
import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

class UpdateStatusDto {
  @ApiProperty({ enum: EquipmentStatus })
  @IsEnum(EquipmentStatus)
  status: EquipmentStatus;
}

@ApiTags('equipment')
@ApiBearerAuth('JWT-auth')
@UseGuards(RolesGuard)
@Controller('equipment')
export class EquipmentController {
  constructor(private readonly equipmentService: EquipmentService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.TECHNICIAN)
  @ApiOperation({ summary: 'Register new equipment' })
  create(@Body() dto: CreateEquipmentDto) {
    return this.equipmentService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all equipment with filters and pagination' })
  findAll(@Query() filter: FilterEquipmentDto) {
    return this.equipmentService.findAll(filter);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get equipment dashboard statistics' })
  getStats() {
    return this.equipmentService.getDashboardStats();
  }

  @Get('serial/:serialNumber')
  @ApiOperation({ summary: 'Find equipment by serial number' })
  findBySerialNumber(@Param('serialNumber') serialNumber: string) {
    return this.equipmentService.findBySerialNumber(serialNumber);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get equipment details with full history' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.equipmentService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.TECHNICIAN)
  @ApiOperation({ summary: 'Update equipment details' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: Partial<CreateEquipmentDto>) {
    return this.equipmentService.update(id, dto);
  }

  @Patch(':id/status')
  @Roles(UserRole.ADMIN, UserRole.TECHNICIAN)
  @ApiOperation({ summary: 'Update equipment status' })
  updateStatus(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateStatusDto) {
    return this.equipmentService.updateStatus(id, dto.status);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete equipment (Admin only)' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.equipmentService.remove(id);
  }
}
