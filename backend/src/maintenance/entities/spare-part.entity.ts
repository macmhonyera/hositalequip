import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne,
  CreateDateColumn, UpdateDateColumn, Index,
} from 'typeorm';
import { MaintenanceRecord } from './maintenance-record.entity';

export enum SparePartStatus {
  USED = 'used',
  NEEDED = 'needed',
  ORDERED = 'ordered',
  RECEIVED = 'received',
}

@Entity('spare_parts')
export class SparePart {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @ManyToOne(() => MaintenanceRecord, (record) => record.spareParts, { onDelete: 'CASCADE' })
  maintenanceRecord: MaintenanceRecord;

  @Column()
  maintenanceRecordId: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  partNumber: string;

  @Column({ nullable: true })
  manufacturer: string;

  @Column({ type: 'enum', enum: SparePartStatus, default: SparePartStatus.NEEDED })
  status: SparePartStatus;

  @Column({ type: 'int', default: 1 })
  quantity: number;

  @Column({ nullable: true, type: 'decimal', precision: 10, scale: 2 })
  unitCost: number;

  @Column({ nullable: true })
  supplier: string;

  @Column({ nullable: true })
  orderDate: Date;

  @Column({ nullable: true })
  receivedDate: Date;

  @Column({ nullable: true, type: 'text' })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
