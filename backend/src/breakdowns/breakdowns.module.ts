import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BreakdownsController } from './breakdowns.controller';
import { BreakdownsService } from './breakdowns.service';
import { Breakdown } from './entities/breakdown.entity';
import { EquipmentModule } from '../equipment/equipment.module';

@Module({
  imports: [TypeOrmModule.forFeature([Breakdown]), EquipmentModule],
  controllers: [BreakdownsController],
  providers: [BreakdownsService],
  exports: [BreakdownsService],
})
export class BreakdownsModule {}
