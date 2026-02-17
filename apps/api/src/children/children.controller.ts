import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ChildrenService } from './children.service';
import { CreateChildDto } from './dto/create-child.dto';
import { UpdateChildDto } from './dto/update-child.dto';

@ApiTags('Crianças')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('children')
export class ChildrenController {
  constructor(private childrenService: ChildrenService) {}

  @Post()
  create(
    @CurrentUser('tenantId') tenantId: string,
    @Body() dto: CreateChildDto,
  ) {
    return this.childrenService.create(tenantId, dto);
  }

  @Get()
  findAll(
    @CurrentUser('tenantId') tenantId: string,
    @Query('classId') classId?: string,
  ) {
    return this.childrenService.findAll(tenantId, classId);
  }

  @Get(':id')
  findOne(@CurrentUser('tenantId') tenantId: string, @Param('id') id: string) {
    return this.childrenService.findOne(tenantId, id);
  }

  @Put(':id')
  update(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateChildDto,
  ) {
    return this.childrenService.update(tenantId, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser('tenantId') tenantId: string, @Param('id') id: string) {
    return this.childrenService.remove(tenantId, id);
  }
}
