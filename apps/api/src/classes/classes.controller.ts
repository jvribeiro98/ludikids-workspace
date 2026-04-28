import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AcademicAccess } from '../auth/decorators/rbac-groups.decorator';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ClassesService } from './classes.service';

@ApiTags('Turmas')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@AcademicAccess()
@Controller('classes')
export class ClassesController {
  constructor(private classesService: ClassesService) {}

  @Post()
  create(
    @CurrentUser('tenantId') tenantId: string,
    @Body() body: { name: string; description?: string },
  ) {
    return this.classesService.create(tenantId, body.name, body.description);
  }

  @Get()
  findAll(@CurrentUser('tenantId') tenantId: string) {
    return this.classesService.findAll(tenantId);
  }

  @Get(':id')
  findOne(@CurrentUser('tenantId') tenantId: string, @Param('id') id: string) {
    return this.classesService.findOne(tenantId, id);
  }

  @Put(':id')
  update(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body() body: { name?: string; description?: string },
  ) {
    return this.classesService.update(tenantId, id, body);
  }

  @Delete(':id')
  remove(@CurrentUser('tenantId') tenantId: string, @Param('id') id: string) {
    return this.classesService.remove(tenantId, id);
  }
}
