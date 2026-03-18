import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany,
  CreateDateColumn, UpdateDateColumn, Index,
} from 'typeorm';
import { Hospital } from './hospital.entity';
import { Equipment } from '../../equipment/entities/equipment.entity';

export enum DepartmentType {
  ICU = 'ICU',
  THEATRE = 'Theatre',
  WARD = 'Ward',
  EMERGENCY = 'Emergency',
  RADIOLOGY = 'Radiology',
  LABORATORY = 'Laboratory',
  PHARMACY = 'Pharmacy',
  OUTPATIENT = 'Outpatient',
  OTHER = 'Other',
}

@Entity('departments')
export class Department {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'enum', enum: DepartmentType, default: DepartmentType.WARD })
  type: DepartmentType;

  @Column({ nullable: true })
  floor: string;

  @Column({ nullable: true })
  wing: string;

  @Column({ nullable: true })
  headOfDepartment: string;

  @Index()
  @ManyToOne(() => Hospital, (hospital) => hospital.departments, { onDelete: 'CASCADE' })
  hospital: Hospital;

  @Column()
  hospitalId: string;

  @OneToMany(() => Equipment, (equip) => equip.department)
  equipment: Equipment[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
