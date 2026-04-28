import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ManagementAccess } from '../auth/decorators/rbac-groups.decorator';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ServicesService } from './services.service';

@ApiTags('Serviços')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@ManagementAccess()
@Controller('services')
export class ServicesController {
  constructor(private servicesService: ServicesService) {}

  @Post()
  create(
    @CurrentUser('tenantId') tenantId: string,
    @Body() body: { name: string; basePrice: number; description?: string },
  ) {
    return this.servicesService.create(tenantId, body.name, body.basePrice, body.description);
  }

  @Get()
  findAll(@CurrentUser('tenantId') tenantId: string) {
    return this.servicesService.findAll(tenantId);
  }

  @Get(':id')
  findOne(@CurrentUser('tenantId') tenantId: string, @Param('id') id: string) {
    return this.servicesService.findOne(tenantId, id);
  }

  @Put(':id')
  update(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body() body: { name?: string; basePrice?: number; description?: string },
  ) {
    return this.servicesService.update(tenantId, id, body);
  }

  @Delete(':id')
  remove(@CurrentUser('tenantId') tenantId: string, @Param('id') id: string) {
    return this.servicesService.remove(tenantId, id);
  }
}
