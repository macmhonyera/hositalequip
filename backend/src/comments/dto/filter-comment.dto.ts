import { IsOptional, IsEnum, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { CommentType } from '../entities/comment.entity';

export class FilterCommentDto extends PaginationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  equipmentId?: string;

  @ApiPropertyOptional({ enum: CommentType })
  @IsOptional()
  @IsEnum(CommentType)
  type?: CommentType;
}
