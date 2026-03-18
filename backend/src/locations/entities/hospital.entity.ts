import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany,
  CreateDateColumn, UpdateDateColumn, Index,
} from 'typeorm';
import { District } from './district.entity';
import { Department } from './department.entity';
import { Equipment } from '../../equipment/entities/equipment.entity';

@Entity('hospitals')
export class Hospital {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  code: string;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  contactPerson: string;

  @Index()
  @ManyToOne(() => District, (district) => district.hospitals, { onDelete: 'CASCADE' })
  district: District;

  @Column()
  districtId: string;

  @OneToMany(() => Department, (dept) => dept.hospital, { cascade: true })
  departments: Department[];

  @OneToMany(() => Equipment, (equip) => equip.hospital)
  equipment: Equipment[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
