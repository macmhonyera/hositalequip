import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { Equipment } from '../equipment/entities/equipment.entity';
import { MaintenanceRecord } from '../maintenance/entities/maintenance-record.entity';
import { Breakdown } from '../breakdowns/entities/breakdown.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Equipment, MaintenanceRecord, Breakdown])],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}
