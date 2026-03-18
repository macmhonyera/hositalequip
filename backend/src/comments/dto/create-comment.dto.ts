import { IsString, IsEnum, IsOptional, IsUUID, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CommentType, CommentStatus } from '../entities/comment.entity';

export class CreateCommentDto {
  @ApiProperty()
  @IsUUID()
  equipmentId: string;

  @ApiProperty({ enum: CommentType })
  @IsEnum(CommentType)
  type: CommentType;

  @ApiProperty({ example: 'The display screen flickers intermittently during use' })
  @IsString()
  content: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isPinned?: boolean;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  priority?: number;
}

export class ResolveCommentDto {
  @ApiProperty()
  @IsString()
  resolution: string;
}
