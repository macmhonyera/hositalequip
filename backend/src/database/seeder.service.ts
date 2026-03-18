import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Province } from '../locations/entities/province.entity';
import { District } from '../locations/entities/district.entity';
import { Hospital } from '../locations/entities/hospital.entity';
import { Department, DepartmentType } from '../locations/entities/department.entity';
import { User, UserRole, UserStatus } from '../users/entities/user.entity';
import { Equipment, EquipmentStatus, MaintenanceFrequency } from '../equipment/entities/equipment.entity';
import { MaintenanceRecord, MaintenanceType, MaintenanceStatus } from '../maintenance/entities/maintenance-record.entity';
import { Breakdown, BreakdownSeverity, BreakdownStatus } from '../breakdowns/entities/breakdown.entity';
import { Comment, CommentType, CommentStatus } from '../comments/entities/comment.entity';

@Injectable()
export class SeederService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SeederService.name);

  constructor(
    @InjectRepository(Province) private provinceRepo: Repository<Province>,
    @InjectRepository(District) private districtRepo: Repository<District>,
    @InjectRepository(Hospital) private hospitalRepo: Repository<Hospital>,
    @InjectRepository(Department) private departmentRepo: Repository<Department>,
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Equipment) private equipmentRepo: Repository<Equipment>,
    @InjectRepository(MaintenanceRecord) private maintenanceRepo: Repository<MaintenanceRecord>,
    @InjectRepository(Breakdown) private breakdownRepo: Repository<Breakdown>,
    @InjectRepository(Comment) private commentRepo: Repository<Comment>,
  ) {}

  async onApplicationBootstrap() {
    const count = await this.provinceRepo.count();
    if (count > 0) {
      this.logger.log('Database already seeded — skipping.');
      return;
    }
    this.logger.log('Seeding database with Zimbabwean data...');
    await this.seed();
    this.logger.log('Database seeded successfully.');
  }

  private async seed() {
    // ── Provinces ────────────────────────────────────────────────────────────
    const harare = await this.provinceRepo.save(
      this.provinceRepo.create({ name: 'Harare Province', code: 'HAR' }),
    );
    const bulawayo = await this.provinceRepo.save(
      this.provinceRepo.create({ name: 'Bulawayo Province', code: 'BYO' }),
    );
    const manicaland = await this.provinceRepo.save(
      this.provinceRepo.create({ name: 'Manicaland Province', code: 'MAN' }),
    );
    const midlands = await this.provinceRepo.save(
      this.provinceRepo.create({ name: 'Midlands Province', code: 'MID' }),
    );

    // ── Districts ─────────────────────────────────────────────────────────────
    const harareCentral = await this.districtRepo.save(
      this.districtRepo.create({ name: 'Harare Central', code: 'HARC', provinceId: harare.id }),
    );
    const borrowdale = await this.districtRepo.save(
      this.districtRepo.create({ name: 'Borrowdale', code: 'BOR', provinceId: harare.id }),
    );
    const bulawayoCentral = await this.districtRepo.save(
      this.districtRepo.create({ name: 'Bulawayo Central', code: 'BYOC', provinceId: bulawayo.id }),
    );
    const mutare = await this.districtRepo.save(
      this.districtRepo.create({ name: 'Mutare District', code: 'MUT', provinceId: manicaland.id }),
    );
    const gweru = await this.districtRepo.save(
      this.districtRepo.create({ name: 'Gweru District', code: 'GWE', provinceId: midlands.id }),
    );

    // ── Hospitals ─────────────────────────────────────────────────────────────
    const parirenyatwa = await this.hospitalRepo.save(this.hospitalRepo.create({
      name: 'Parirenyatwa Group of Hospitals',
      code: 'PGH', address: '1 Mazowe Street, Harare', phone: '+263242701521',
      email: 'info@parirenyatwa.co.zw', contactPerson: 'Dr. Tendai Moyo', districtId: harareCentral.id,
    }));
    const harareCentralHosp = await this.hospitalRepo.save(this.hospitalRepo.create({
      name: 'Harare Central Hospital',
      code: 'HCH', address: '2nd Avenue Extension, Harare', phone: '+263242793621',
      email: 'info@hch.co.zw', contactPerson: 'Dr. Nomsa Ndlovu', districtId: harareCentral.id,
    }));
    const chitungwiza = await this.hospitalRepo.save(this.hospitalRepo.create({
      name: 'Chitungwiza Central Hospital',
      code: 'CCH', address: '1 Harare Road, Chitungwiza', phone: '+263272122420',
      email: 'info@cch.co.zw', contactPerson: 'Dr. Farai Chikwanda', districtId: borrowdale.id,
    }));
    const mpilo = await this.hospitalRepo.save(this.hospitalRepo.create({
      name: 'Mpilo Central Hospital',
      code: 'MCH', address: '2 Khami Road, Bulawayo', phone: '+263292213011',
      email: 'info@mpilo.co.zw', contactPerson: 'Dr. Blessing Mutizwa', districtId: bulawayoCentral.id,
    }));
    const mutareHosp = await this.hospitalRepo.save(this.hospitalRepo.create({
      name: 'Mutare Provincial Hospital',
      code: 'MPH', address: '1 Hospital Road, Mutare', phone: '+263202062395',
      email: 'info@mph.co.zw', contactPerson: 'Dr. Ruramai Makoni', districtId: mutare.id,
    }));
    const gwanda = await this.hospitalRepo.save(this.hospitalRepo.create({
      name: 'Gweru Provincial Hospital',
      code: 'GPH', address: '14 Robert Mugabe Way, Gweru', phone: '+263254222012',
      email: 'info@gph.co.zw', contactPerson: 'Dr. Kudakwashe Mwangi', districtId: gweru.id,
    }));

    // ── Departments ───────────────────────────────────────────────────────────
    const deptData = [
      // Parirenyatwa
      { name: 'ICU', type: DepartmentType.ICU, floor: '3', headOfDepartment: 'Dr. Tendai Moyo', hospitalId: parirenyatwa.id },
      { name: 'Emergency Department', type: DepartmentType.EMERGENCY, floor: '1', headOfDepartment: 'Dr. Chipo Sibanda', hospitalId: parirenyatwa.id },
      { name: 'Radiology', type: DepartmentType.RADIOLOGY, floor: '2', headOfDepartment: 'Dr. Farai Chikwanda', hospitalId: parirenyatwa.id },
      { name: 'Theatre', type: DepartmentType.THEATRE, floor: '4', headOfDepartment: 'Dr. Ruramai Makoni', hospitalId: parirenyatwa.id },
      { name: 'Laboratory', type: DepartmentType.LABORATORY, floor: '1', headOfDepartment: 'Dr. Nomsa Ndlovu', hospitalId: parirenyatwa.id },
      // Harare Central
      { name: 'ICU', type: DepartmentType.ICU, floor: '2', headOfDepartment: 'Dr. Blessing Mutizwa', hospitalId: harareCentralHosp.id },
      { name: 'Radiology', type: DepartmentType.RADIOLOGY, floor: '1', headOfDepartment: 'Dr. Tapiwa Gono', hospitalId: harareCentralHosp.id },
      { name: 'Ward A', type: DepartmentType.WARD, floor: '3', headOfDepartment: 'Dr. Sithulisiwe Dube', hospitalId: harareCentralHosp.id },
      // Chitungwiza
      { name: 'Emergency', type: DepartmentType.EMERGENCY, floor: '1', headOfDepartment: 'Dr. Muchaneta Zindi', hospitalId: chitungwiza.id },
      { name: 'Ward B', type: DepartmentType.WARD, floor: '2', headOfDepartment: 'Dr. Tatenda Chirau', hospitalId: chitungwiza.id },
      // Mpilo
      { name: 'ICU', type: DepartmentType.ICU, floor: '2', headOfDepartment: 'Dr. Kudakwashe Mwangi', hospitalId: mpilo.id },
      { name: 'Outpatient', type: DepartmentType.OUTPATIENT, floor: '1', headOfDepartment: 'Dr. Zanele Moyo', hospitalId: mpilo.id },
      // Mutare Provincial
      { name: 'ICU', type: DepartmentType.ICU, floor: '2', headOfDepartment: 'Dr. Ruramai Makoni', hospitalId: mutareHosp.id },
      { name: 'Laboratory', type: DepartmentType.LABORATORY, floor: '1', headOfDepartment: 'Dr. Prosper Mhara', hospitalId: mutareHosp.id },
      // Gweru Provincial
      { name: 'Pharmacy', type: DepartmentType.PHARMACY, floor: '1', headOfDepartment: 'Dr. Nothabo Ncube', hospitalId: gwanda.id },
      { name: 'Outpatient', type: DepartmentType.OUTPATIENT, floor: '1', headOfDepartment: 'Dr. Tafadzwa Mhembere', hospitalId: gwanda.id },
    ];
    const departments: Department[] = [];
    for (const d of deptData) {
      departments.push(await this.departmentRepo.save(this.departmentRepo.create(d)));
    }

    // ── Users ─────────────────────────────────────────────────────────────────
    const hash = (pw: string) => bcrypt.hash(pw, 12);

    let admin = await this.userRepo.findOne({ where: { email: 'admin@hospital.com' } });
    if (!admin) {
      admin = await this.userRepo.save(this.userRepo.create({
        email: 'admin@hospital.com', password: await hash('Admin@123456'),
        firstName: 'Tendai', lastName: 'Moyo',
        role: UserRole.ADMIN, status: UserStatus.ACTIVE,
        department: 'Administration', phone: '+263712100001',
      }));
    }

    const tech1 = await this.userRepo.save(this.userRepo.create({
      email: 'farai.chikwanda@hospital.com', password: await hash('Tech@123456'),
      firstName: 'Farai', lastName: 'Chikwanda',
      role: UserRole.TECHNICIAN, status: UserStatus.ACTIVE,
      department: 'Biomedical Engineering', specialization: 'Ventilators & ICU Equipment',
      phone: '+263712100002',
    }));
    const tech2 = await this.userRepo.save(this.userRepo.create({
      email: 'blessing.mutizwa@hospital.com', password: await hash('Tech@123456'),
      firstName: 'Blessing', lastName: 'Mutizwa',
      role: UserRole.TECHNICIAN, status: UserStatus.ACTIVE,
      department: 'Biomedical Engineering', specialization: 'Imaging & Radiology Equipment',
      phone: '+263712100003',
    }));
    const tech3 = await this.userRepo.save(this.userRepo.create({
      email: 'kudakwashe.mwangi@hospital.com', password: await hash('Tech@123456'),
      firstName: 'Kudakwashe', lastName: 'Mwangi',
      role: UserRole.TECHNICIAN, status: UserStatus.ACTIVE,
      department: 'Biomedical Engineering', specialization: 'Surgical & Laboratory Equipment',
      phone: '+263712100004',
    }));
    const guest1 = await this.userRepo.save(this.userRepo.create({
      email: 'guest@hospital.com', password: await hash('Guest@123456'),
      firstName: 'Chipo', lastName: 'Sibanda',
      role: UserRole.GUEST, status: UserStatus.ACTIVE,
      department: 'Nursing', phone: '+263712100005',
    }));
    await this.userRepo.save(this.userRepo.create({
      email: 'ruramai.makoni@hospital.com', password: await hash('Guest@123456'),
      firstName: 'Ruramai', lastName: 'Makoni',
      role: UserRole.GUEST, status: UserStatus.ACTIVE,
      department: 'ICU', phone: '+263712100006',
    }));

    // ── Equipment ─────────────────────────────────────────────────────────────
    const past = (d: number) => { const dt = new Date(); dt.setDate(dt.getDate() - d); return dt; };
    const future = (d: number) => { const dt = new Date(); dt.setDate(dt.getDate() + d); return dt; };

    const equipData = [
      // Parirenyatwa – ICU
      {
        name: 'Ventilator Hamilton G5', type: 'Ventilator', brand: 'Hamilton Medical', model: 'G5',
        serialNumber: 'HG5-2021-001', supplierName: 'MedTech Zimbabwe',
        purchaseCost: 12500,
        dateOfCommission: past(730), warrantyExpiryDate: future(365), status: EquipmentStatus.ACTIVE,
        maintenanceFrequency: MaintenanceFrequency.QUARTERLY, lastServiceDate: past(60), nextServiceDate: future(30),
        hospitalId: parirenyatwa.id, departmentId: departments[0].id,
      },
      {
        name: 'Patient Monitor Philips MX800', type: 'Patient Monitor', brand: 'Philips', model: 'IntelliVue MX800',
        serialNumber: 'PM-MX800-002', supplierName: 'Philips Healthcare Africa',
        purchaseCost: 4800,
        dateOfCommission: past(400), warrantyExpiryDate: future(200), status: EquipmentStatus.ACTIVE,
        maintenanceFrequency: MaintenanceFrequency.SEMI_ANNUAL, lastServiceDate: past(90), nextServiceDate: future(90),
        hospitalId: parirenyatwa.id, departmentId: departments[0].id,
      },
      {
        name: 'Defibrillator Zoll R Series', type: 'Defibrillator', brand: 'Zoll', model: 'R Series',
        serialNumber: 'ZRS-2022-003', supplierName: 'Zoll Medical Africa',
        purchaseCost: 3200,
        dateOfCommission: past(300), status: EquipmentStatus.FAULTY,
        maintenanceFrequency: MaintenanceFrequency.QUARTERLY, lastServiceDate: past(180),
        hospitalId: parirenyatwa.id, departmentId: departments[0].id, maintenanceOverdue: true,
      },
      // Parirenyatwa – Emergency
      {
        name: 'ECG Machine Schiller AT-102', type: 'ECG Machine', brand: 'Schiller', model: 'AT-102',
        serialNumber: 'SCH-AT102-004', supplierName: 'Schiller Africa',
        purchaseCost: 1850,
        dateOfCommission: past(500), warrantyExpiryDate: past(50), status: EquipmentStatus.ACTIVE,
        maintenanceFrequency: MaintenanceFrequency.ANNUAL, lastServiceDate: past(120), nextServiceDate: future(245),
        hospitalId: parirenyatwa.id, departmentId: departments[1].id,
      },
      {
        name: 'Portable Ultrasound GE Vscan', type: 'Ultrasound', brand: 'GE Healthcare', model: 'Vscan Air',
        serialNumber: 'GE-VSC-005', supplierName: 'GE Healthcare Southern Africa',
        purchaseCost: 2600,
        dateOfCommission: past(180), warrantyExpiryDate: future(550), status: EquipmentStatus.UNDER_MAINTENANCE,
        maintenanceFrequency: MaintenanceFrequency.SEMI_ANNUAL, lastServiceDate: past(10),
        hospitalId: parirenyatwa.id, departmentId: departments[1].id,
      },
      // Parirenyatwa – Radiology
      {
        name: 'X-Ray Machine Siemens Multix', type: 'X-Ray Machine', brand: 'Siemens', model: 'Multix Select',
        serialNumber: 'SIE-MUL-006', supplierName: 'Siemens Healthineers',
        purchaseCost: 18000,
        dateOfCommission: past(900), warrantyExpiryDate: past(200), status: EquipmentStatus.ACTIVE,
        maintenanceFrequency: MaintenanceFrequency.QUARTERLY, lastServiceDate: past(45), nextServiceDate: future(45),
        hospitalId: parirenyatwa.id, departmentId: departments[2].id,
      },
      {
        name: 'CT Scanner GE Revolution EVO', type: 'CT Scanner', brand: 'GE Healthcare', model: 'Revolution EVO',
        serialNumber: 'GE-REV-007', supplierName: 'GE Healthcare Southern Africa',
        purchaseCost: 120000,
        dateOfCommission: past(600), warrantyExpiryDate: future(180), status: EquipmentStatus.ACTIVE,
        maintenanceFrequency: MaintenanceFrequency.MONTHLY, lastServiceDate: past(20), nextServiceDate: future(10),
        hospitalId: parirenyatwa.id, departmentId: departments[2].id,
      },
      // Parirenyatwa – Theatre
      {
        name: 'Anaesthesia Machine Draeger Primus', type: 'Anaesthesia Machine', brand: 'Draeger', model: 'Primus IE',
        serialNumber: 'DRA-PRI-008', supplierName: 'Draeger Medical Zimbabwe',
        purchaseCost: 22000,
        dateOfCommission: past(1200), warrantyExpiryDate: past(300), status: EquipmentStatus.AWAITING_REPAIR,
        maintenanceFrequency: MaintenanceFrequency.MONTHLY, lastServiceDate: past(90), maintenanceOverdue: true,
        hospitalId: parirenyatwa.id, departmentId: departments[3].id,
      },
      {
        name: 'Electrosurgical Unit Bovie A1250', type: 'Electrosurgical Unit', brand: 'Bovie Medical', model: 'A1250',
        serialNumber: 'BOV-A12-009', supplierName: 'MedTech Zimbabwe',
        purchaseCost: 3500,
        dateOfCommission: past(450), warrantyExpiryDate: future(100), status: EquipmentStatus.ACTIVE,
        maintenanceFrequency: MaintenanceFrequency.QUARTERLY, lastServiceDate: past(30), nextServiceDate: future(60),
        hospitalId: parirenyatwa.id, departmentId: departments[3].id,
      },
      // Harare Central – ICU
      {
        name: 'Infusion Pump B Braun Perfusor', type: 'Infusion Pump', brand: 'B. Braun', model: 'Perfusor Space',
        serialNumber: 'BBR-PER-010', supplierName: 'B. Braun Zimbabwe',
        purchaseCost: 980,
        dateOfCommission: past(250), warrantyExpiryDate: future(480), status: EquipmentStatus.ACTIVE,
        maintenanceFrequency: MaintenanceFrequency.SEMI_ANNUAL, lastServiceDate: past(60), nextServiceDate: future(120),
        hospitalId: harareCentralHosp.id, departmentId: departments[5].id,
      },
      {
        name: 'Pulse Oximeter Nellcor PM10N', type: 'Pulse Oximeter', brand: 'Nellcor', model: 'PM10N',
        serialNumber: 'NEL-PM10-011', supplierName: 'Medline Africa',
        purchaseCost: 320,
        dateOfCommission: past(120), warrantyExpiryDate: future(760), status: EquipmentStatus.ACTIVE,
        maintenanceFrequency: MaintenanceFrequency.ANNUAL, lastServiceDate: past(60), nextServiceDate: future(305),
        hospitalId: harareCentralHosp.id, departmentId: departments[5].id,
      },
      // Harare Central – Radiology
      {
        name: 'MRI Scanner Siemens Magnetom', type: 'MRI Scanner', brand: 'Siemens', model: 'Magnetom Aera',
        serialNumber: 'SIE-MAG-012', supplierName: 'Siemens Healthineers',
        purchaseCost: 350000,
        dateOfCommission: past(1000), warrantyExpiryDate: past(100), status: EquipmentStatus.ACTIVE,
        maintenanceFrequency: MaintenanceFrequency.MONTHLY, lastServiceDate: past(25), nextServiceDate: future(5),
        hospitalId: harareCentralHosp.id, departmentId: departments[6].id,
      },
      // Chitungwiza – Emergency
      {
        name: 'Portable Ventilator Mindray SV300', type: 'Ventilator', brand: 'Mindray', model: 'SV300',
        serialNumber: 'MIN-SV3-013', supplierName: 'Mindray Southern Africa',
        purchaseCost: 6500,
        dateOfCommission: past(200), warrantyExpiryDate: future(600), status: EquipmentStatus.ACTIVE,
        maintenanceFrequency: MaintenanceFrequency.QUARTERLY, lastServiceDate: past(75), nextServiceDate: future(15),
        hospitalId: chitungwiza.id, departmentId: departments[8].id,
      },
      {
        name: 'Glucometer Roche Accu-Chek', type: 'Glucometer', brand: 'Roche', model: 'Accu-Chek Guide',
        serialNumber: 'ROC-ACG-014', supplierName: 'Roche Zimbabwe',
        purchaseCost: 150,
        dateOfCommission: past(365), warrantyExpiryDate: future(365), status: EquipmentStatus.ACTIVE,
        maintenanceFrequency: MaintenanceFrequency.ANNUAL, lastServiceDate: past(180), nextServiceDate: future(185),
        hospitalId: chitungwiza.id, departmentId: departments[8].id,
      },
      // Mutare – Laboratory
      {
        name: 'Haematology Analyzer Sysmex XP-300', type: 'Haematology Analyzer', brand: 'Sysmex', model: 'XP-300',
        serialNumber: 'SYS-XP3-015', supplierName: 'Sysmex Africa',
        purchaseCost: 5200,
        dateOfCommission: past(500), warrantyExpiryDate: past(50), status: EquipmentStatus.FAULTY,
        maintenanceFrequency: MaintenanceFrequency.MONTHLY, lastServiceDate: past(150), maintenanceOverdue: true,
        hospitalId: mutareHosp.id, departmentId: departments[13].id,
      },
      // Mpilo – ICU
      {
        name: 'Syringe Pump Alaris GP', type: 'Syringe Pump', brand: 'BD Alaris', model: 'GP',
        serialNumber: 'ALA-GP-016', supplierName: 'BD Zimbabwe',
        purchaseCost: 750,
        dateOfCommission: past(280), warrantyExpiryDate: future(450), status: EquipmentStatus.ACTIVE,
        maintenanceFrequency: MaintenanceFrequency.SEMI_ANNUAL, lastServiceDate: past(90), nextServiceDate: future(90),
        hospitalId: mpilo.id, departmentId: departments[10].id,
      },
      {
        name: 'Oxygen Concentrator Philips Everflo', type: 'Oxygen Concentrator', brand: 'Philips', model: 'Everflo',
        serialNumber: 'PHI-EVF-017', supplierName: 'Philips Healthcare Africa',
        purchaseCost: 480,
        dateOfCommission: past(400), warrantyExpiryDate: past(30), status: EquipmentStatus.DECOMMISSIONED,
        maintenanceFrequency: MaintenanceFrequency.QUARTERLY, lastServiceDate: past(365),
        actualDecommissionDate: past(30), hospitalId: mpilo.id, departmentId: departments[10].id,
      },
      {
        name: 'Blood Pressure Monitor Welch Allyn', type: 'BP Monitor', brand: 'Welch Allyn', model: '53000',
        serialNumber: 'WEL-530-018', supplierName: 'Welch Allyn Africa',
        purchaseCost: 280,
        dateOfCommission: past(150), warrantyExpiryDate: future(580), status: EquipmentStatus.ACTIVE,
        maintenanceFrequency: MaintenanceFrequency.ANNUAL, lastServiceDate: past(30), nextServiceDate: future(335),
        hospitalId: mpilo.id, departmentId: departments[10].id,
      },
      // Parirenyatwa – Laboratory
      {
        name: 'PCR Machine Bio-Rad CFX96', type: 'PCR Machine', brand: 'Bio-Rad', model: 'CFX96',
        serialNumber: 'BIO-CFX-019', supplierName: 'Bio-Rad Laboratories Africa',
        purchaseCost: 28000,
        dateOfCommission: past(350), warrantyExpiryDate: future(380), status: EquipmentStatus.ACTIVE,
        maintenanceFrequency: MaintenanceFrequency.QUARTERLY, lastServiceDate: past(70), nextServiceDate: future(20),
        hospitalId: parirenyatwa.id, departmentId: departments[4].id,
      },
      {
        name: 'Autoclave Tuttnauer 3870', type: 'Autoclave', brand: 'Tuttnauer', model: '3870EA',
        serialNumber: 'TUT-387-020', supplierName: 'MedTech Zimbabwe',
        purchaseCost: 3800,
        dateOfCommission: past(800), warrantyExpiryDate: past(200), status: EquipmentStatus.UNDER_MAINTENANCE,
        maintenanceFrequency: MaintenanceFrequency.MONTHLY, lastServiceDate: past(5),
        hospitalId: parirenyatwa.id, departmentId: departments[4].id,
      },
    ];

    const equipment: Equipment[] = [];
    for (const e of equipData) {
      equipment.push(await this.equipmentRepo.save(this.equipmentRepo.create(e)));
    }

    // ── Maintenance Records ───────────────────────────────────────────────────
    const maintenanceData = [
      {
        equipmentId: equipment[0].id, technicianId: tech1.id,
        type: MaintenanceType.PREVENTIVE, status: MaintenanceStatus.COMPLETED,
        scheduledDate: past(90), startDate: past(90), completionDate: past(88),
        workDescription: 'Full preventive maintenance. Replaced filters, calibrated pressure sensors, tested alarm systems.',
        findings: 'Minor wear on exhalation valve — replaced.', totalCost: 850, laborCost: 500,
      },
      {
        equipmentId: equipment[0].id, technicianId: tech1.id,
        type: MaintenanceType.PREVENTIVE, status: MaintenanceStatus.SCHEDULED,
        scheduledDate: future(30),
        workDescription: 'Scheduled quarterly PM: filter replacement, calibration, safety checks.',
        totalCost: 850, laborCost: 500,
      },
      {
        equipmentId: equipment[2].id, technicianId: tech1.id,
        type: MaintenanceType.CORRECTIVE, status: MaintenanceStatus.IN_PROGRESS,
        scheduledDate: past(5), startDate: past(3),
        workDescription: 'Defibrillator not charging properly. Investigating capacitor failure.',
        totalCost: 3200, laborCost: 800,
      },
      {
        equipmentId: equipment[5].id, technicianId: tech2.id,
        type: MaintenanceType.PREVENTIVE, status: MaintenanceStatus.COMPLETED,
        scheduledDate: past(45), startDate: past(45), completionDate: past(44),
        workDescription: 'X-ray tube inspection, detector calibration, collimator alignment.',
        findings: 'Tube showing normal aging. Estimated 18 months remaining life.', totalCost: 1600, laborCost: 900,
      },
      {
        equipmentId: equipment[6].id, technicianId: tech2.id,
        type: MaintenanceType.PREVENTIVE, status: MaintenanceStatus.COMPLETED,
        scheduledDate: past(20), startDate: past(20), completionDate: past(19),
        workDescription: 'Monthly CT scanner PM: tube cooling check, image quality verification, software update.',
        totalCost: 2500, laborCost: 1200,
      },
      {
        equipmentId: equipment[6].id, technicianId: tech2.id,
        type: MaintenanceType.CALIBRATION, status: MaintenanceStatus.SCHEDULED,
        scheduledDate: future(10),
        workDescription: 'Quarterly image quality calibration and dose measurement.',
        totalCost: 1800, laborCost: 1000,
      },
      {
        equipmentId: equipment[7].id, technicianId: tech1.id,
        type: MaintenanceType.CORRECTIVE, status: MaintenanceStatus.SCHEDULED,
        scheduledDate: future(3),
        workDescription: 'Anaesthesia machine O2 sensor replacement. Flow control valve inspection.',
        totalCost: 4500, laborCost: 1500,
      },
      {
        equipmentId: equipment[11].id, technicianId: tech2.id,
        type: MaintenanceType.PREVENTIVE, status: MaintenanceStatus.COMPLETED,
        scheduledDate: past(25), startDate: past(25), completionDate: past(24),
        workDescription: 'Monthly MRI PM: gradient coil check, magnet shimming, image quality tests.',
        totalCost: 3800, laborCost: 2000,
      },
      {
        equipmentId: equipment[14].id, technicianId: tech3.id,
        type: MaintenanceType.CORRECTIVE, status: MaintenanceStatus.IN_PROGRESS,
        scheduledDate: past(7), startDate: past(5),
        workDescription: 'Haematology analyzer reagent flow issue. Cleaning tubing and replacing pump.',
        totalCost: 2900, laborCost: 1200,
      },
      {
        equipmentId: equipment[4].id, technicianId: tech1.id,
        type: MaintenanceType.INSPECTION, status: MaintenanceStatus.COMPLETED,
        scheduledDate: past(10), startDate: past(10), completionDate: past(10),
        workDescription: 'Pre-maintenance inspection for ultrasound transducer wear.',
        findings: 'Transducer head showing minor wear. Recommended replacement in 6 months.', totalCost: 450, laborCost: 450,
      },
      {
        equipmentId: equipment[18].id, technicianId: tech3.id,
        type: MaintenanceType.PREVENTIVE, status: MaintenanceStatus.COMPLETED,
        scheduledDate: past(70), startDate: past(70), completionDate: past(68),
        workDescription: 'PCR machine calibration, block uniformity test, lid heating element check.',
        totalCost: 1200, laborCost: 700,
      },
      {
        equipmentId: equipment[19].id, technicianId: tech3.id,
        type: MaintenanceType.PREVENTIVE, status: MaintenanceStatus.IN_PROGRESS,
        scheduledDate: past(5), startDate: past(5),
        workDescription: 'Monthly autoclave cycle check, door gasket inspection, pressure calibration.',
        totalCost: 950, laborCost: 600,
      },
      {
        equipmentId: equipment[12].id, technicianId: tech1.id,
        type: MaintenanceType.PREVENTIVE, status: MaintenanceStatus.COMPLETED,
        scheduledDate: past(75), startDate: past(75), completionDate: past(73),
        workDescription: 'Quarterly ventilator PM: filter replacement, valve test, circuit pressure test.',
        totalCost: 780, laborCost: 450,
      },
      {
        equipmentId: equipment[9].id, technicianId: tech1.id,
        type: MaintenanceType.INSPECTION, status: MaintenanceStatus.COMPLETED,
        scheduledDate: past(60), startDate: past(60), completionDate: past(60),
        workDescription: 'Semi-annual infusion pump inspection and flow accuracy test.',
        findings: 'All pumps within acceptable flow tolerance.', totalCost: 350, laborCost: 350,
      },
      {
        equipmentId: equipment[1].id, technicianId: tech2.id,
        type: MaintenanceType.PREVENTIVE, status: MaintenanceStatus.DEFERRED,
        scheduledDate: past(30),
        workDescription: 'Semi-annual monitor PM deferred due to technician availability.', totalCost: 650, laborCost: 400,
      },
    ];

    const maintenanceRecords: MaintenanceRecord[] = [];
    for (const m of maintenanceData) {
      maintenanceRecords.push(await this.maintenanceRepo.save(this.maintenanceRepo.create(m)));
    }

    // ── Breakdowns ────────────────────────────────────────────────────────────
    const breakdownData = [
      {
        equipmentId: equipment[2].id,
        issueDescription: 'Defibrillator fails to charge beyond 200J. Capacitor suspected.',
        severity: BreakdownSeverity.CRITICAL, status: BreakdownStatus.IN_PROGRESS,
        dateReported: past(5), reportedBy: 'Dr. Chipo Sibanda',
        assignedTechnicianId: tech1.id, dateAssigned: past(4),
        issueCategories: ['electrical', 'capacitor'],
      },
      {
        equipmentId: equipment[7].id,
        issueDescription: 'Anaesthesia machine O2 flow reads 0 on display despite cylinder attached. Possible sensor failure.',
        severity: BreakdownSeverity.CRITICAL, status: BreakdownStatus.ASSIGNED,
        dateReported: past(2), reportedBy: 'Dr. Ruramai Makoni',
        assignedTechnicianId: tech1.id, dateAssigned: past(1),
        issueCategories: ['sensor', 'gas-system'],
      },
      {
        equipmentId: equipment[14].id,
        issueDescription: 'Haematology analyzer showing "reagent flow error" and stopping mid-cycle.',
        severity: BreakdownSeverity.HIGH, status: BreakdownStatus.IN_PROGRESS,
        dateReported: past(7), reportedBy: 'Dr. Prosper Mhara',
        assignedTechnicianId: tech3.id, dateAssigned: past(6),
        issueCategories: ['fluid-system', 'pump'],
      },
      {
        equipmentId: equipment[5].id,
        issueDescription: 'X-ray image has dark band across the lower third. Possible detector row failure.',
        severity: BreakdownSeverity.HIGH, status: BreakdownStatus.OPEN,
        dateReported: past(1), reportedBy: 'Dr. Farai Chikwanda',
        issueCategories: ['detector', 'image-quality'],
      },
      {
        equipmentId: equipment[4].id,
        issueDescription: 'Ultrasound transducer connector intermittently disconnects during scanning.',
        severity: BreakdownSeverity.MEDIUM, status: BreakdownStatus.ASSIGNED,
        dateReported: past(10), reportedBy: 'Nurse Tatenda Chirau',
        assignedTechnicianId: tech1.id, dateAssigned: past(8),
        issueCategories: ['connector', 'transducer'],
      },
      {
        equipmentId: equipment[0].id,
        issueDescription: 'Ventilator alarm sounding erroneously for low tidal volume despite correct settings.',
        severity: BreakdownSeverity.HIGH, status: BreakdownStatus.RESOLVED,
        dateReported: past(95), reportedBy: 'Nurse Sithulisiwe Dube',
        assignedTechnicianId: tech1.id, dateAssigned: past(94), dateResolved: past(92),
        resolutionNotes: 'Alarm threshold software bug fixed via firmware update v2.3.1. Alarm now functioning correctly.',
        rootCause: 'Software bug in v2.3.0 firmware',
        issueCategories: ['software', 'alarm'],
      },
      {
        equipmentId: equipment[6].id,
        issueDescription: 'CT scanner showing "cooling system warning". Chiller unit making unusual noise.',
        severity: BreakdownSeverity.MEDIUM, status: BreakdownStatus.CLOSED,
        dateReported: past(60), reportedBy: 'Dr. Tapiwa Gono',
        assignedTechnicianId: tech2.id, dateAssigned: past(59), dateResolved: past(55),
        resolutionNotes: 'Replaced coolant pump bearing. Recharged coolant to specified level. System running normally.',
        rootCause: 'Bearing failure in coolant pump due to wear',
        issueCategories: ['cooling', 'mechanical'],
      },
      {
        equipmentId: equipment[11].id,
        issueDescription: 'MRI scanner producing artifact bands in images. Patient scans compromised.',
        severity: BreakdownSeverity.CRITICAL, status: BreakdownStatus.RESOLVED,
        dateReported: past(30), reportedBy: 'Dr. Blessing Mutizwa',
        assignedTechnicianId: tech2.id, dateAssigned: past(29), dateResolved: past(24),
        resolutionNotes: 'RF shielding breach identified and repaired. Gradient amplifier recalibrated. Images now artifact-free.',
        rootCause: 'RF shield breach allowing external interference',
        repairCost: 8500, downtime: 144,
        issueCategories: ['RF-shielding', 'calibration'],
      },
      {
        equipmentId: equipment[19].id,
        issueDescription: 'Autoclave not reaching target sterilization temperature of 134°C. Max achieved: 128°C.',
        severity: BreakdownSeverity.HIGH, status: BreakdownStatus.OPEN,
        dateReported: past(3), reportedBy: 'Lab Technician Zanele Moyo',
        issueCategories: ['heating', 'temperature'],
      },
      {
        equipmentId: equipment[12].id,
        issueDescription: 'Portable ventilator battery not charging. Backup power unavailable.',
        severity: BreakdownSeverity.MEDIUM, status: BreakdownStatus.ESCALATED,
        dateReported: past(14), reportedBy: 'Nurse Muchaneta Zindi',
        assignedTechnicianId: tech1.id, dateAssigned: past(13),
        issueCategories: ['battery', 'power'],
      },
    ];

    const breakdowns: Breakdown[] = [];
    for (const b of breakdownData) {
      breakdowns.push(await this.breakdownRepo.save(this.breakdownRepo.create(b)));
    }

    // ── Comments ──────────────────────────────────────────────────────────────
    const commentData = [
      {
        equipmentId: equipment[0].id, userId: guest1.id, authorName: 'Chipo Sibanda',
        type: CommentType.OBSERVATION, status: CommentStatus.OPEN,
        content: 'The ventilator alarm sensitivity seems too high. It triggers frequently even when patient breathing is normal. May need parameter review.',
      },
      {
        equipmentId: equipment[6].id, userId: admin.id, authorName: 'Tendai Moyo',
        type: CommentType.RECOMMENDATION, status: CommentStatus.ACKNOWLEDGED,
        content: 'Recommend scheduling full preventive maintenance for the CT scanner before the peak season. Current usage is high.',
        isPinned: true, priority: 1,
      },
      {
        equipmentId: equipment[11].id, userId: tech2.id, authorName: 'Blessing Mutizwa',
        type: CommentType.COMMENT, status: CommentStatus.OPEN,
        content: 'MRI scanner repaired successfully. All post-repair QA tests passed. Machine back in full service.',
      },
      {
        equipmentId: equipment[7].id, userId: tech1.id, authorName: 'Farai Chikwanda',
        type: CommentType.COMPLAINT, status: CommentStatus.OPEN,
        content: 'Anaesthesia machine parts ordered from supplier are taking too long. Delivery expected 14 days ago. Affecting repair timeline.',
        priority: 2,
      },
      {
        equipmentId: equipment[14].id, userId: tech3.id, authorName: 'Kudakwashe Mwangi',
        type: CommentType.COMMENT, status: CommentStatus.OPEN,
        content: 'Haematology analyzer reagent tubing replaced. Running test cycles. Should be back online within 24 hours.',
      },
      {
        equipmentId: equipment[5].id, userId: guest1.id, authorName: 'Chipo Sibanda',
        type: CommentType.COMPLAINT, status: CommentStatus.OPEN,
        content: 'X-ray image quality has been degrading for the past week. Patients are being sent to other facilities. Urgent attention needed.',
        priority: 3,
      },
    ];

    for (const c of commentData) {
      await this.commentRepo.save(this.commentRepo.create(c));
    }
  }
}
