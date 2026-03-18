import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeederService } from './seeder.service';
import { Province } from '../locations/entities/province.entity';
import { District } from '../locations/entities/district.entity';
import { Hospital } from '../locations/entities/hospital.entity';
import { Department } from '../locations/entities/department.entity';
import { User } from '../users/entities/user.entity';
import { Equipment } from '../equipment/entities/equipment.entity';
import { MaintenanceRecord } from '../maintenance/entities/maintenance-record.entity';
import { Breakdown } from '../breakdowns/entities/breakdown.entity';
import { Comment } from '../comments/entities/comment.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Province, District, Hospital, Department,
      User, Equipment, MaintenanceRecord, Breakdown, Comment,
    ]),
  ],
  providers: [SeederService],
})
export class SeederModule {}
