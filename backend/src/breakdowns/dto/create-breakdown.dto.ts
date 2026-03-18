import {
  IsString, IsEnum, IsOptional, IsUUID, IsDateString, IsNumber,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BreakdownSeverity, BreakdownStatus } from '../entities/breakdown.entity';

export class CreateBreakdownDto {
  @ApiProperty()
  @IsUUID()
  equipmentId: string;

  @ApiProperty({ example: 'Device fails to power on after charging' })
  @IsString()
  issueDescription: string;

  @ApiProperty({ enum: BreakdownSeverity })
  @IsEnum(BreakdownSeverity)
  severity: BreakdownSeverity;

  @ApiPropertyOptional({ enum: BreakdownStatus })
  @IsOptional()
  @IsEnum(BreakdownStatus)
  status?: BreakdownStatus;

  @ApiProperty()
  @IsDateString()
  dateReported: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reportedBy?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  assignedTechnicianId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  resolutionNotes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  rootCause?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  repairCost?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  downtime?: number;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  issueCategories?: string[];
}
