import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Province } from './entities/province.entity';
import { District } from './entities/district.entity';
import { Hospital } from './entities/hospital.entity';
import { Department } from './entities/department.entity';
import {
  CreateProvinceDto, CreateDistrictDto, CreateHospitalDto, CreateDepartmentDto,
} from './dto/create-location.dto';

@Injectable()
export class LocationsService {
  constructor(
    @InjectRepository(Province) private provinceRepo: Repository<Province>,
    @InjectRepository(District) private districtRepo: Repository<District>,
    @InjectRepository(Hospital) private hospitalRepo: Repository<Hospital>,
    @InjectRepository(Department) private departmentRepo: Repository<Department>,
  ) {}

  // --- Provinces ---
  async createProvince(dto: CreateProvinceDto): Promise<Province> {
    const existing = await this.provinceRepo.findOne({ where: { name: dto.name } });
    if (existing) throw new ConflictException(`Province "${dto.name}" already exists`);
    return this.provinceRepo.save(this.provinceRepo.create(dto));
  }

  async findAllProvinces(): Promise<Province[]> {
    return this.provinceRepo.find({ relations: ['districts'], order: { name: 'ASC' } });
  }

  async findOneProvince(id: string): Promise<Province> {
    const p = await this.provinceRepo.findOne({
      where: { id },
      relations: ['districts', 'districts.hospitals'],
    });
    if (!p) throw new NotFoundException(`Province ${id} not found`);
    return p;
  }

  // --- Districts ---
  async createDistrict(dto: CreateDistrictDto): Promise<District> {
    const province = await this.provinceRepo.findOne({ where: { id: dto.provinceId } });
    if (!province) throw new NotFoundException(`Province ${dto.provinceId} not found`);
    return this.districtRepo.save(this.districtRepo.create(dto));
  }

  async findAllDistricts(provinceId?: string): Promise<District[]> {
    const query = this.districtRepo
      .createQueryBuilder('district')
      .leftJoinAndSelect('district.province', 'province')
      .orderBy('district.name', 'ASC');

    if (provinceId) query.where('district.provinceId = :provinceId', { provinceId });

    return query.getMany();
  }

  // --- Hospitals ---
  async createHospital(dto: CreateHospitalDto): Promise<Hospital> {
    const district = await this.districtRepo.findOne({ where: { id: dto.districtId } });
    if (!district) throw new NotFoundException(`District ${dto.districtId} not found`);
    return this.hospitalRepo.save(this.hospitalRepo.create(dto));
  }

  async findAllHospitals(districtId?: string, provinceId?: string): Promise<Hospital[]> {
    const query = this.hospitalRepo
      .createQueryBuilder('hospital')
      .leftJoinAndSelect('hospital.district', 'district')
      .leftJoinAndSelect('district.province', 'province')
      .orderBy('hospital.name', 'ASC');

    if (districtId) query.where('hospital.districtId = :districtId', { districtId });
    else if (provinceId) query.where('district.provinceId = :provinceId', { provinceId });

    return query.getMany();
  }

  async findOneHospital(id: string): Promise<Hospital> {
    const h = await this.hospitalRepo.findOne({
      where: { id },
      relations: ['district', 'district.province', 'departments'],
    });
    if (!h) throw new NotFoundException(`Hospital ${id} not found`);
    return h;
  }

  // --- Departments ---
  async createDepartment(dto: CreateDepartmentDto): Promise<Department> {
    const hospital = await this.hospitalRepo.findOne({ where: { id: dto.hospitalId } });
    if (!hospital) throw new NotFoundException(`Hospital ${dto.hospitalId} not found`);
    return this.departmentRepo.save(this.departmentRepo.create(dto));
  }

  async findAllDepartments(hospitalId?: string): Promise<Department[]> {
    const query = this.departmentRepo
      .createQueryBuilder('dept')
      .leftJoinAndSelect('dept.hospital', 'hospital')
      .orderBy('dept.name', 'ASC');

    if (hospitalId) query.where('dept.hospitalId = :hospitalId', { hospitalId });

    return query.getMany();
  }

  async findOneDepartment(id: string): Promise<Department> {
    const d = await this.departmentRepo.findOne({
      where: { id },
      relations: ['hospital', 'hospital.district', 'hospital.district.province'],
    });
    if (!d) throw new NotFoundException(`Department ${id} not found`);
    return d;
  }

  async getLocationTree(): Promise<Province[]> {
    return this.provinceRepo.find({
      relations: ['districts', 'districts.hospitals', 'districts.hospitals.departments'],
      order: { name: 'ASC' },
    });
  }
}
