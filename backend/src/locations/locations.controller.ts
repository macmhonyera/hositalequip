import {
  Controller, Get, Post, Body, Param, Query,
  UseGuards, ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { LocationsService } from './locations.service';
import {
  CreateProvinceDto, CreateDistrictDto, CreateHospitalDto, CreateDepartmentDto,
} from './dto/create-location.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('locations')
@ApiBearerAuth('JWT-auth')
@UseGuards(RolesGuard)
@Controller('locations')
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  @Get('tree')
  @ApiOperation({ summary: 'Get full location hierarchy tree' })
  getTree() {
    return this.locationsService.getLocationTree();
  }

  // Provinces
  @Post('provinces')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create province (Admin only)' })
  createProvince(@Body() dto: CreateProvinceDto) {
    return this.locationsService.createProvince(dto);
  }

  @Get('provinces')
  @ApiOperation({ summary: 'List all provinces' })
  findAllProvinces() {
    return this.locationsService.findAllProvinces();
  }

  @Get('provinces/:id')
  @ApiOperation({ summary: 'Get province details' })
  findOneProvince(@Param('id', ParseUUIDPipe) id: string) {
    return this.locationsService.findOneProvince(id);
  }

  // Districts
  @Post('districts')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create district (Admin only)' })
  createDistrict(@Body() dto: CreateDistrictDto) {
    return this.locationsService.createDistrict(dto);
  }

  @Get('districts')
  @ApiQuery({ name: 'provinceId', required: false })
  @ApiOperation({ summary: 'List districts, optionally filtered by province' })
  findAllDistricts(@Query('provinceId') provinceId?: string) {
    return this.locationsService.findAllDistricts(provinceId);
  }

  // Hospitals
  @Post('hospitals')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create hospital (Admin only)' })
  createHospital(@Body() dto: CreateHospitalDto) {
    return this.locationsService.createHospital(dto);
  }

  @Get('hospitals')
  @ApiQuery({ name: 'districtId', required: false })
  @ApiQuery({ name: 'provinceId', required: false })
  @ApiOperation({ summary: 'List hospitals, optionally filtered by district or province' })
  findAllHospitals(
    @Query('districtId') districtId?: string,
    @Query('provinceId') provinceId?: string,
  ) {
    return this.locationsService.findAllHospitals(districtId, provinceId);
  }

  @Get('hospitals/:id')
  @ApiOperation({ summary: 'Get hospital with departments' })
  findOneHospital(@Param('id', ParseUUIDPipe) id: string) {
    return this.locationsService.findOneHospital(id);
  }

  // Departments
  @Post('departments')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create department (Admin only)' })
  createDepartment(@Body() dto: CreateDepartmentDto) {
    return this.locationsService.createDepartment(dto);
  }

  @Get('departments')
  @ApiQuery({ name: 'hospitalId', required: false })
  @ApiOperation({ summary: 'List departments, optionally filtered by hospital' })
  findAllDepartments(@Query('hospitalId') hospitalId?: string) {
    return this.locationsService.findAllDepartments(hospitalId);
  }

  @Get('departments/:id')
  @ApiOperation({ summary: 'Get department details' })
  findOneDepartment(@Param('id', ParseUUIDPipe) id: string) {
    return this.locationsService.findOneDepartment(id);
  }
}
