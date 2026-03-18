import { Controller, Get, Param, Query, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ReportsService, ReportFilters } from './reports.service';
import { RolesGuard } from '../auth/guards/roles.guard';

@ApiTags('reports')
@ApiBearerAuth('JWT-auth')
@UseGuards(RolesGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get real-time dashboard summary stats' })
  getDashboard() {
    return this.reportsService.getDashboardSummary();
  }

  @Get('equipment')
  @ApiOperation({ summary: 'Equipment report with optional location/status filters' })
  @ApiQuery({ name: 'hospitalId', required: false })
  @ApiQuery({ name: 'departmentId', required: false })
  @ApiQuery({ name: 'provinceId', required: false })
  @ApiQuery({ name: 'districtId', required: false })
  getEquipmentReport(@Query() filters: ReportFilters) {
    return this.reportsService.getEquipmentReport(filters);
  }

  @Get('inventory')
  @ApiOperation({ summary: 'Full inventory report grouped by location hierarchy' })
  getInventoryReport(@Query() filters: ReportFilters) {
    return this.reportsService.getInventoryReport(filters);
  }

  @Get('location')
  @ApiOperation({ summary: 'Equipment summary grouped by hospital and department' })
  getLocationReport(@Query() filters: ReportFilters) {
    return this.reportsService.getLocationReport(filters);
  }

  @Get('maintenance')
  @ApiOperation({ summary: 'Maintenance report with date range and technician filters' })
  @ApiQuery({ name: 'startDate', required: false, example: '2024-01-01' })
  @ApiQuery({ name: 'endDate', required: false, example: '2024-12-31' })
  @ApiQuery({ name: 'technicianId', required: false })
  getMaintenanceReport(@Query() filters: ReportFilters) {
    return this.reportsService.getMaintenanceReport(filters);
  }

  @Get('breakdowns')
  @ApiOperation({ summary: 'Breakdown report with severity analysis and resolution times' })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  getBreakdownReport(@Query() filters: ReportFilters) {
    return this.reportsService.getBreakdownReport(filters);
  }

  @Get('equipment/:id')
  @ApiOperation({ summary: 'Full lifecycle report for a specific equipment item' })
  getEquipmentSpecificReport(@Param('id', ParseUUIDPipe) id: string) {
    return this.reportsService.getEquipmentSpecificReport(id);
  }
}
