import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany,
  CreateDateColumn, UpdateDateColumn, Index,
} from 'typeorm';
import { Province } from './province.entity';
import { Hospital } from './hospital.entity';

@Entity('districts')
export class District {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  code: string;

  @Index()
  @ManyToOne(() => Province, (province) => province.districts, { onDelete: 'CASCADE' })
  province: Province;

  @Column()
  provinceId: string;

  @OneToMany(() => Hospital, (hospital) => hospital.district, { cascade: true })
  hospitals: Hospital[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
