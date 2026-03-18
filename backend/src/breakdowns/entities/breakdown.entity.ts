import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne,
  CreateDateColumn, UpdateDateColumn, Index,
} from 'typeorm';
import { Equipment } from '../../equipment/entities/equipment.entity';
import { User } from '../../users/entities/user.entity';

export enum BreakdownSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum BreakdownStatus {
  OPEN = 'open',
  ASSIGNED = 'assigned',
  IN_PROGRESS = 'in_progress',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
  ESCALATED = 'escalated',
}

@Entity('breakdowns')
export class Breakdown {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @ManyToOne(() => Equipment, (equip) => equip.breakdowns, { onDelete: 'CASCADE' })
  equipment: Equipment;

  @Column()
  equipmentId: string;

  @Column({ type: 'text' })
  issueDescription: string;

  @Column({ type: 'enum', enum: BreakdownSeverity, default: BreakdownSeverity.MEDIUM })
  severity: BreakdownSeverity;

  @Column({ type: 'enum', enum: BreakdownStatus, default: BreakdownStatus.OPEN })
  status: BreakdownStatus;

  @Column()
  dateReported: Date;

  @Column({ nullable: true })
  reportedBy: string;

  @Index()
  @ManyToOne(() => User, (user) => user.assignedBreakdowns, { nullable: true })
  assignedTechnician: User;

  @Column({ nullable: true })
  assignedTechnicianId: string;

  @Column({ nullable: true })
  dateAssigned: Date;

  @Column({ nullable: true })
  dateResolved: Date;

  @Column({ nullable: true, type: 'text' })
  resolutionNotes: string;

  @Column({ nullable: true, type: 'text' })
  rootCause: string;

  @Column({ nullable: true, type: 'decimal', precision: 10, scale: 2 })
  repairCost: number;

  @Column({ nullable: true })
  downtime: number; // in hours

  @Column({ nullable: true, type: 'text', array: true, default: '{}' })
  issueCategories: string[];

  @Column({ nullable: true })
  relatedMaintenanceId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
