import {
  Controller, Get, Post, Body, Patch, Param, Delete,
  Query, UseGuards, ParseUUIDPipe, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { CommentsService } from './comments.service';
import { CreateCommentDto, ResolveCommentDto } from './dto/create-comment.dto';
import { FilterCommentDto } from './dto/filter-comment.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User, UserRole } from '../users/entities/user.entity';

@ApiTags('comments')
@ApiBearerAuth('JWT-auth')
@UseGuards(RolesGuard)
@Controller('comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post()
  @ApiOperation({ summary: 'Add comment or complaint on equipment' })
  create(@Body() dto: CreateCommentDto, @CurrentUser() user: User) {
    return this.commentsService.create(dto, user);
  }

  @Get()
  @ApiOperation({ summary: 'List comments with filters' })
  findAll(@Query() filters: FilterCommentDto) {
    return this.commentsService.findAll(filters, filters.equipmentId, filters.type);
  }

  @Get('complaints/summary')
  @ApiOperation({ summary: 'Get complaints summary' })
  getComplaintsSummary(@Query('equipmentId') equipmentId?: string) {
    return this.commentsService.getComplaintsSummary(equipmentId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get comment details' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.commentsService.findOne(id);
  }

  @Patch(':id/resolve')
  @Roles(UserRole.ADMIN, UserRole.TECHNICIAN)
  @ApiOperation({ summary: 'Mark comment/complaint as resolved' })
  resolve(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ResolveCommentDto,
    @CurrentUser() user: User,
  ) {
    return this.commentsService.resolve(id, dto, user);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete comment (own comments or Admin)' })
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.commentsService.remove(id, user);
  }
}
