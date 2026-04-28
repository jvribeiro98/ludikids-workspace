import { Controller, Get, Patch, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ManagementAccess } from '../auth/decorators/rbac-groups.decorator';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AlertsService } from './alerts.service';

@ApiTags('Alertas')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@ManagementAccess()
@Controller('alerts')
export class AlertsController {
  constructor(private alertsService: AlertsService) {}

  @Get()
  list(
    @CurrentUser('tenantId') tenantId: string,
    @Query('unreadOnly') unreadOnly?: string,
  ) {
    return this.alertsService.list(tenantId, unreadOnly === 'true');
  }

  @Patch(':id/read')
  markRead(@CurrentUser('tenantId') tenantId: string, @Param('id') id: string) {
    return this.alertsService.markRead(tenantId, id);
  }
}
