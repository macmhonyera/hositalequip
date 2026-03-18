import {
  IsString, IsEnum, IsOptional, IsUUID, IsDateString,
  IsNumber, IsPositive, IsObject,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EquipmentStatus, MaintenanceFrequency } from '../entities/equipment.entity';

export class CreateEquipmentDto {
  @ApiProperty({ example: 'Ventilator' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'Respiratory Equipment' })
  @IsString()
  type: string;

  @ApiProperty({ example: 'Philips' })
  @IsString()
  brand: string;

  @ApiProperty({ example: 'Respironics V60' })
  @IsString()
  model: string;

  @ApiProperty({ example: 'PHI-2024-001234' })
  @IsString()
  serialNumber: string;

  @ApiPropertyOptional({ example: 'ASSET-001' })
  @IsOptional()
  @IsString()
  assetTag?: string;

  @ApiProperty({ example: 'MedSupply Africa' })
  @IsString()
  supplierName: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  supplierContact?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  supplierEmail?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  supplierPhone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  purchaseOrderNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @IsPositive()
  purchaseCost?: number;

  @ApiProperty({ example: '2024-01-15' })
  @IsDateString()
  dateOfCommission: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  expectedDecommissionDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  warrantyExpiryDate?: string;

  @ApiPropertyOptional({ enum: EquipmentStatus, default: EquipmentStatus.ACTIVE })
  @IsOptional()
  @IsEnum(EquipmentStatus)
  status?: EquipmentStatus;

  @ApiPropertyOptional({ enum: MaintenanceFrequency, default: MaintenanceFrequency.QUARTERLY })
  @IsOptional()
  @IsEnum(MaintenanceFrequency)
  maintenanceFrequency?: MaintenanceFrequency;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  technicalSpecs?: Record<string, any>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  hospitalId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  departmentId?: string;
}
