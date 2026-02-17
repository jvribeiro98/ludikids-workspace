import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CoordinationInboxService } from './coordination-inbox.service';

@ApiTags('Inbox Coordenação')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('coordination-inbox')
export class CoordinationInboxController {
  constructor(private coordinationInboxService: CoordinationInboxService) {}

  @Get('pending')
  listPending(@CurrentUser('tenantId') tenantId: string) {
    return this.coordinationInboxService.listPending(tenantId);
  }

  @Patch(':id/approve')
  approve(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
    @Body() body: { notes?: string },
  ) {
    return this.coordinationInboxService.approve(id, userId, body.notes);
  }

  @Patch(':id/reject')
  reject(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
    @Body() body: { notes?: string },
  ) {
    return this.coordinationInboxService.reject(id, userId, body.notes);
  }

  @Patch(':id/contacted')
  markContacted(@Param('id') id: string) {
    return this.coordinationInboxService.markContacted(id);
  }
}
