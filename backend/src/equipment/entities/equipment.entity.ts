import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany,
  CreateDateColumn, UpdateDateColumn, Index,
} from 'typeorm';
import { Hospital } from '../../locations/entities/hospital.entity';
import { Department } from '../../locations/entities/department.entity';
import { MaintenanceRecord } from '../../maintenance/entities/maintenance-record.entity';
import { Breakdown } from '../../breakdowns/entities/breakdown.entity';
import { Comment } from '../../comments/entities/comment.entity';

export enum EquipmentStatus {
  ACTIVE = 'active',
  FAULTY = 'faulty',
  UNDER_MAINTENANCE = 'under_maintenance',
  DECOMMISSIONED = 'decommissioned',
  AWAITING_REPAIR = 'awaiting_repair',
}

export enum MaintenanceFrequency {
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  SEMI_ANNUAL = 'semi_annual',
  ANNUAL = 'annual',
}

@Entity('equipment')
export class Equipment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  type: string;

  // Manufacturer details
  @Column()
  brand: string;

  @Column()
  model: string;

  @Index({ unique: true })
  @Column({ unique: true })
  serialNumber: string;

  @Column({ nullable: true })
  assetTag: string;

  // Supplier details
  @Column()
  supplierName: string;

  @Column({ nullable: true })
  supplierContact: string;

  @Column({ nullable: true })
  supplierEmail: string;

  @Column({ nullable: true })
  supplierPhone: string;

  @Column({ nullable: true })
  purchaseOrderNumber: string;

  @Column({ nullable: true, type: 'decimal', precision: 12, scale: 2 })
  purchaseCost: number;

  // Lifecycle dates
  @Column({ type: 'date' })
  dateOfCommission: Date;

  @Column({ type: 'date', nullable: true })
  expectedDecommissionDate: Date;

  @Column({ type: 'date', nullable: true })
  actualDecommissionDate: Date;

  @Column({ type: 'date', nullable: true })
  warrantyExpiryDate: Date;

  // Status
  @Column({ type: 'enum', enum: EquipmentStatus, default: EquipmentStatus.ACTIVE })
  status: EquipmentStatus;

  // Maintenance scheduling
  @Column({ type: 'enum', enum: MaintenanceFrequency, default: MaintenanceFrequency.QUARTERLY })
  maintenanceFrequency: MaintenanceFrequency;

  @Column({ type: 'date', nullable: true })
  lastServiceDate: Date;

  @Column({ type: 'date', nullable: true })
  nextServiceDate: Date;

  @Column({ default: false })
  maintenanceOverdue: boolean;

  // Technical specs
  @Column({ nullable: true, type: 'jsonb' })
  technicalSpecs: Record<string, any>;

  @Column({ nullable: true })
  manualUrl: string;

  @Column({ nullable: true })
  imageUrl: string;

  @Column({ nullable: true, type: 'text' })
  notes: string;

  // Location relations
  @Index()
  @ManyToOne(() => Hospital, (hospital) => hospital.equipment, { nullable: true })
  hospital: Hospital;

  @Column({ nullable: true })
  hospitalId: string;

  @Index()
  @ManyToOne(() => Department, (dept) => dept.equipment, { nullable: true })
  department: Department;

  @Column({ nullable: true })
  departmentId: string;

  // Related records
  @OneToMany(() => MaintenanceRecord, (record) => record.equipment, { cascade: true })
  maintenanceRecords: MaintenanceRecord[];

  @OneToMany(() => Breakdown, (breakdown) => breakdown.equipment, { cascade: true })
  breakdowns: Breakdown[];

  @OneToMany(() => Comment, (comment) => comment.equipment, { cascade: true })
  comments: Comment[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
