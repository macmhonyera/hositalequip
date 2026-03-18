import { IsOptional, IsEnum, IsUUID, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { BreakdownStatus, BreakdownSeverity } from '../entities/breakdown.entity';

export class FilterBreakdownDto extends PaginationDto {
  @ApiPropertyOptional({ enum: BreakdownStatus })
  @IsOptional()
  @IsEnum(BreakdownStatus)
  status?: BreakdownStatus;

  @ApiPropertyOptional({ enum: BreakdownSeverity })
  @IsOptional()
  @IsEnum(BreakdownSeverity)
  severity?: BreakdownSeverity;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  equipmentId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  technicianId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reportedBy?: string;
}
