import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne,
  CreateDateColumn, UpdateDateColumn, Index,
} from 'typeorm';
import { Equipment } from '../../equipment/entities/equipment.entity';
import { User } from '../../users/entities/user.entity';

export enum CommentType {
  COMMENT = 'comment',
  COMPLAINT = 'complaint',
  OBSERVATION = 'observation',
  RECOMMENDATION = 'recommendation',
}

export enum CommentStatus {
  OPEN = 'open',
  ACKNOWLEDGED = 'acknowledged',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
}

@Entity('comments')
export class Comment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @ManyToOne(() => Equipment, (equip) => equip.comments, { onDelete: 'CASCADE' })
  equipment: Equipment;

  @Column()
  equipmentId: string;

  @Index()
  @ManyToOne(() => User, (user) => user.comments, { nullable: true })
  user: User;

  @Column({ nullable: true })
  userId: string;

  @Column({ nullable: true })
  authorName: string;

  @Column({ type: 'enum', enum: CommentType, default: CommentType.COMMENT })
  type: CommentType;

  @Column({ type: 'enum', enum: CommentStatus, default: CommentStatus.OPEN })
  status: CommentStatus;

  @Column({ type: 'text' })
  content: string;

  @Column({ nullable: true, type: 'text' })
  resolution: string;

  @Column({ nullable: true })
  resolvedAt: Date;

  @Column({ nullable: true })
  resolvedBy: string;

  @Column({ default: false })
  isPinned: boolean;

  @Column({ default: 0 })
  priority: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
