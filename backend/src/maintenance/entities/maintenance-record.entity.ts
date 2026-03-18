import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany,
  CreateDateColumn, UpdateDateColumn, Index,
} from 'typeorm';
import { Equipment } from '../../equipment/entities/equipment.entity';
import { User } from '../../users/entities/user.entity';
import { SparePart } from './spare-part.entity';

export enum MaintenanceType {
  PREVENTIVE = 'preventive',
  CORRECTIVE = 'corrective',
  CALIBRATION = 'calibration',
  INSPECTION = 'inspection',
  EMERGENCY = 'emergency',
}

export enum MaintenanceStatus {
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  DEFERRED = 'deferred',
}

@Entity('maintenance_records')
export class MaintenanceRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @ManyToOne(() => Equipment, (equip) => equip.maintenanceRecords, { onDelete: 'CASCADE' })
  equipment: Equipment;

  @Column()
  equipmentId: string;

  @Index()
  @ManyToOne(() => User, (user) => user.maintenanceRecords, { nullable: true })
  technician: User;

  @Column({ nullable: true })
  technicianId: string;

  @Column({ type: 'enum', enum: MaintenanceType, default: MaintenanceType.PREVENTIVE })
  type: MaintenanceType;

  @Column({ type: 'enum', enum: MaintenanceStatus, default: MaintenanceStatus.SCHEDULED })
  status: MaintenanceStatus;

  @Column({ type: 'date' })
  scheduledDate: Date;

  @Column({ type: 'date', nullable: true })
  startDate: Date;

  @Column({ type: 'date', nullable: true })
  completionDate: Date;

  @Column({ nullable: true, type: 'text' })
  workDescription: string;

  @Column({ nullable: true, type: 'text' })
  findings: string;

  @Column({ nullable: true, type: 'text' })
  recommendations: string;

  @Column({ nullable: true, type: 'decimal', precision: 10, scale: 2 })
  laborCost: number;

  @Column({ nullable: true, type: 'decimal', precision: 10, scale: 2 })
  totalCost: number;

  @Column({ nullable: true })
  externalServiceProvider: string;

  @Column({ nullable: true })
  serviceOrderNumber: string;

  // Issue pattern tracking
  @Column({ nullable: true, type: 'text', array: true, default: '{}' })
  issuePatterns: string[];

  @OneToMany(() => SparePart, (part) => part.maintenanceRecord, { cascade: true })
  spareParts: SparePart[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
