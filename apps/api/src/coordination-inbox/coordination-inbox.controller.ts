import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ManagementAccess } from '../auth/decorators/rbac-groups.decorator';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CoordinationInboxService } from './coordination-inbox.service';

@ApiTags('Inbox Coordenação')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@ManagementAccess()
@Controller('coordination-inbox')
export class CoordinationInboxController {
  constructor(private coordinationInboxService: CoordinationInboxService) {}

  @Get('pending')
  listPending(@CurrentUser('tenantId') tenantId: string) {
    return this.coordinationInboxService.listPending(tenantId);
  }

  @Patch(':id/approve')
  approve(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
    @Body() body: { notes?: string },
  ) {
    return this.coordinationInboxService.approve(tenantId, id, userId, body.notes);
  }

  @Patch(':id/reject')
  reject(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
    @Body() body: { notes?: string },
  ) {
    return this.coordinationInboxService.reject(tenantId, id, userId, body.notes);
  }

  @Patch(':id/contacted')
  markContacted(@CurrentUser('tenantId') tenantId: string, @Param('id') id: string) {
    return this.coordinationInboxService.markContacted(tenantId, id);
  }
}
